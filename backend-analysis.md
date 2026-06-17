# Backend 분석 보고서

분석 일자: 2026-05-29
분석 대상: `backend/` (Spring Boot) ↔ `front/` (React) 비교 및 backend 단독 점검
분석 범위: 코드 수정 없음 (read-only 분석/제안만)

---

## 한눈에 보기

| 섹션 | 높음 | 중간 | 낮음 | 합계 |
|---|---|---|---|---|
| 미사용 API — Backend에 있는데 front 호출 없음 | — | — | — | **25 행** |
| 미사용 API — Front 호출, backend에 매핑 없음 | — | — | — | **10 행** |
| 수정 필요 (실제 문제/위험) | 8 | 6 | 6~8 (개수만) | **14 행 + 낮음군** |
| 개선 제안 | 3 | 6 | 8~10 (개수만) | **9 행 + 낮음군** |

가장 시급한 4가지:
1. **SecurityConfig의 광범위한 `permitAll()`** — 관리자/결제/배송 API가 사실상 무방비.
2. **MemberController의 path mapping 버그** — 카카오/네이버/구글 콜백이 의도된 URL로 등록되지 않음 (클래스 prefix + 절대경로 결합).
3. **EstimateController의 인증 우회 / 중복 DB 호출 / NPE 가능** — 견적 도메인 컨트롤러 거의 전면 재정비 필요.
4. **front↔backend 10개 endpoint 불일치** — 쿠폰 정식 발급, 신고 resolve/reject, 토큰 refresh, 차주 배송 start 등이 호출은 가는데 매핑이 없어 실제 동작 안 함.

---

## 미사용 API

### A. Backend에는 있는데 front에서 호출 흔적이 없는 엔드포인트

| HTTP | 전체 경로 | 컨트롤러.메서드 | 비고 |
|---|---|---|---|
| GET | `/api/test` | [CorsTestController.corsTest](backend/src/main/java/com/giproject/controller/CorsTestController.java#L11) | CORS 테스트용. 운영용 아님 |
| GET | `/api/oauth/pending-info`, `/api/oauth/signup-context` | [OAuthSignupController.getPendingInfo](backend/src/main/java/com/giproject/api/oauth/OAuthSignupController.java#L37) | TokenAuthController의 `/api/auth/social/signup-context`로 대체된 듯 |
| GET | `/api/auth/signup-context` | [AuthController.signupContext](backend/src/main/java/com/giproject/controller/AuthController.java#L75) | front는 `/api/auth/social/signup-context`만 호출 |
| POST | `/api/auth/complete-signup` | [AuthController.completeSignup](backend/src/main/java/com/giproject/controller/AuthController.java#L97) | front는 `/api/auth/social/complete-signup`만 호출 |
| GET | `/api/chat/history` | [ChatController.getHistory](backend/src/main/java/com/giproject/controller/ChatController.java#L29) | CounselorChat은 send만 호출 |
| POST | `/g2i4/coupons/issue` | [MemberCouponController.issueCoupon](backend/src/main/java/com/giproject/controller/member/MemberCouponController.java#L27) | front는 `/issue-test`만 호출 — 정식 발급 흐름이 막혀있음 |
| GET | `/g2i4/admin/users` | [AdminMemberAliasController.aliasList](backend/src/main/java/com/giproject/controller/admin/AdminMemberAliasController.java#L26) | 명시적 alias인데 호출 없음 |
| GET | `/g2i4/admin/members/owners` | AdminMemberController.owners | adminMembersApi는 BASE만 호출 |
| GET | `/g2i4/admin/members/cowners` | AdminMemberController.cowners | 동상 |
| GET | `/g2i4/admin/members/admin` | AdminMemberController.admins | 동상 |
| POST | `/g2i4/admin/reports/{id}/read` | UserReportController.markReadPost | PUT 버전만 호출됨 |
| PATCH | `/g2i4/admin/reports/read-all` | UserReportController | 호출 없음 |
| GET | `/g2i4/owner/revenue/monthly-debug` | OwnerMetricsController | 디버그용 |
| GET | `/g2i4/estimate/subpath/savelist` | [EstimateController.getSaveEstimat](backend/src/main/java/com/giproject/controller/estimate/EstimateController.java#L105) | 인증 무시 + 미사용 |
| GET | `/g2i4/estimate/subpath/export` | EstimateController.exportEs | 인증 무시 + 미사용 |
| POST | `/g2i4/estimate/subpath/myestimate` | EstimateController.getMyEs | front는 `/my-all-list` GET만 사용 (확신 낮음) |
| GET | `/g2i4/review/list` | ReviewController.getList | 호출 없음 |
| GET | `/g2i4/review/summary/{cargoId}` | ReviewController.getSummary | front는 `/summary/my`만 사용 |
| GET | `/g2i4/review/driver/{cargoId}` | ReviewController.getReviewsByCargoId | `/driver-profile`, `/driver-detail`로 대체된 듯 |
| GET | `/api/signup/api/member/kakao`, `/g2i4/member/api/member/kakao` | [MemberController.getMemberFromKakao](backend/src/main/java/com/giproject/controller/member/MemberController.java#L51) | **경로 버그** — 의도된 `/api/member/kakao`가 아니라 prefix+절대경로가 합쳐진 이상한 경로로 등록됨. 실질적 미사용 |
| GET | `/api/signup/naver/callback`, `/g2i4/member/naver/callback` | MemberController.naverCallback | 동상 |
| GET | `/api/signup/google/callback`, `/g2i4/member/google/callback` | MemberController.googleCallback | 동상 |
| GET | `/api/signup/check-id`, `/g2i4/member/check-id` | MemberController.checkId | front는 `/api/auth/check-id`(AuthController) 호출. 중복 구현 |
| GET | `/api/signup/info`, `/g2i4/member/info` | MemberController.getMemberInfo | front는 `/g2i4/user/info`(UserInfoController) 호출 |
| GET | `/api/member/kakao`, `/api/member/naver` | [SNSController.deprecated](backend/src/main/java/com/giproject/controller/SNSController.java#L17) | "deprecated" 응답만 반환. front 코드에는 호출 흔적 남아 있음(아래 B 참조) |

> qaboard의 `/posts/my`, `/categories`는 qaboardApi.js의 동적 URL 변수를 통해 호출되는 것으로 보이나 **확신 낮음** — 호출 위치까지는 검증 못 함.

### B. Front에서 호출하는데 backend에 매핑이 없는 경로 (반대 불일치)

| HTTP | 호출 경로 | 호출 위치 | 비고 |
|---|---|---|---|
| POST | `/g2i4/main/getfeeslist` | [mainImageAPI.js:16](front/src/api/common/mainImageAPI.js#L16) | 컨트롤러 없음 → 404 |
| GET | `/api/report/details/{deliveryNumber}` | [reportApi.js:15](front/src/api/reportApi.js#L15) | 컨트롤러 없음. 파일 자체 주석에도 "endpoint should be confirmed" |
| POST | `/api/users/login` | [memberApi.js:13](front/src/api/memberApi.js#L13) | 컨트롤러 없음 + base가 `http://localhost:3000`(프론트 자기 자신). 죽은 코드 |
| POST | `/g2i4/admin/reports/{id}/resolve` | [adminReportsApi.js:27](front/src/api/adminApi/adminReportsApi.js#L27) | UserReportController에 매핑 없음 |
| POST | `/g2i4/admin/reports/{id}/reject` | [adminReportsApi.js:31](front/src/api/adminApi/adminReportsApi.js#L31) | 동상 |
| GET | `/g2i4/delivery/my` | [deliveryApi.js:25](front/src/api/deliveryApi/deliveryApi.js#L25) | DeliveryController엔 create/changeintransit/changecomplete만 |
| POST | `/g2i4/owner/deliveries/{matchingNo}/start` | [DeliveryInform.js:72](front/src/layout/component/mypage/DeliveryInform.js#L72) | OwnerDeliveryController엔 `/complete`, `/in_transit`만. `/start` 없음 |
| GET | `/api/auth/refresh?refreshToken=...` | [lib/apiFetch.js:21](front/src/lib/apiFetch.js#L21) | TokenAuthController.refresh는 **POST + body** — method/payload 불일치 |
| GET | `/api/member/kakao`, `/api/member/naver` | kakaoApi.js, getKakaoLoginLink.js, getNaverLoginLink.js | SNSController가 deprecation 응답만 반환. 실제 OAuth 흐름은 `/oauth2/authorization/*` 사용. 죽은 호출 |
| POST | `/api/member/google` | [getGoogleLoginLink.js:46](front/src/api/getGoogleLoginLink.js#L46) | 매핑 없음 (MemberController의 `/google/callback`은 GET이고 prefix 버그로 사실상 호출 불가) |

---

## 수정 필요

| 심각도 | 파일:위치 | 문제 요약 | 제안 방향 |
|---|---|---|---|
| **높음** | [SecurityConfig.java:104-108](backend/src/main/java/com/giproject/config/SecurityConfig.java#L104-L108) | `/g2i4/admin/**`, `/g2i4/cargo/**`, `/g2i4/payment/**`, `/g2i4/delivery/**`, `/g2i4/user/**`, `/api/**` 등 거의 모든 비즈니스/관리자 엔드포인트가 `permitAll()`. JWT 필터가 토큰을 파싱하긴 하지만 토큰이 없거나 잘못돼도 통과. `@PreAuthorize`로 막힌 곳도 거의 없음. 실질적으로 **익명 사용자도 회원/결제/배송/관리자 API 호출 가능** | 도메인별 hasAuthority/hasRole 적용. 관리자는 `ROLE_ADMIN` 필수로. 토큰 없는 익명 호출은 401로 거절 |
| **높음** | [MemberController.java:24,51,70,77,92](backend/src/main/java/com/giproject/controller/member/MemberController.java#L24) | 클래스 prefix `{"/api/signup", "/g2i4/member"}` + 메서드 절대경로 `"/api/member/kakao"`, `"/naver/callback"` 등이 결합되어 실제 등록 경로가 `"/api/signup/api/member/kakao"`처럼 됨. **의도한 경로로 매핑된 적이 없음** — 카카오/네이버/구글 콜백 5개 메서드가 dead code | prefix를 클래스에서 제거하거나, 메서드를 단순 상대 경로로 바꿔서 의도한 path로 매핑 |
| **높음** | [EstimateController.java:105-122](backend/src/main/java/com/giproject/controller/estimate/EstimateController.java#L105-L122) | `getSaveEstimat`, `exportEs`, `saveEstimate`가 `String user = "user"` 또는 `dto.setMemberId("user")` 하드코딩. 즉 누가 호출해도 "user" 계정으로 동작 → 다른 계정의 임시저장/내보내기 접근 가능 | JWT에서 추출한 memId를 사용. 그 외 메서드와 동일한 패턴으로 통일 |
| **높음** | [EstimateController.java:175](backend/src/main/java/com/giproject/controller/estimate/EstimateController.java#L175) | `getMyPaidList`: `estimateService.findMyPaidEstimates(memId)`를 두 번 호출하고 두 번째 결과를 반환. DB 조회 중복 + 변수 `dtoList` 미사용. 명백한 버그 | `ResponseEntity.ok(dtoList)`로 수정 |
| **높음** | [EstimateController.java:69](backend/src/main/java/com/giproject/controller/estimate/EstimateController.java#L69) | `reject`: `cargoOwnerRepository.findById(cargoId).get()` — Optional.get() 직접 호출. cargoId가 잘못되면 `NoSuchElementException`이 그대로 500 응답 | `orElseThrow(...)`로 400/404 처리. `accepted` 메서드의 패턴과 통일 |
| **높음** | EstimateController 전반 ([line 45, 57, 64, 77, 145, 153, 162, 170](backend/src/main/java/com/giproject/controller/estimate/EstimateController.java#L45)) | 모든 메서드가 `authHeader.replace("Bearer ","")` — **authHeader가 null이면 NPE 발생**, "Bearer " 접두사가 없어도 검증 안 됨, 토큰 만료/위조 검증 없이 username 추출 | `Authentication` 객체(Security context) 사용으로 일원화. 또는 ArgumentResolver로 추출 |
| **높음** | [MemberController.java:37](backend/src/main/java/com/giproject/controller/member/MemberController.java#L37) | `memberRepository.findById(memId).orElseThrow(() -> new RuntimeException("회원 정보 없음"))` — 그냥 `RuntimeException` 던지면 500. 또한 session 기반 인증 사용해서 SecurityConfig의 JWT 흐름과 불일치 (`HttpSession.getAttribute("loginId")`) | JWT 기반으로 통일. 적절한 401/404 응답 |
| **높음** | [OrderController.java:24](backend/src/main/java/com/giproject/controller/order/OrderController.java#L24) | `requestNo.get("mcNo")` — 키 누락 시 null이 service로 전달. 또한 `viewOrder` 메서드가 조회인데 POST임. 호출자 contract 검증 없음 | null 검증, 또는 DTO로 받기 |
| **중간** | [PasswordResetController.java](backend/src/main/java/com/giproject/controller/PasswordResetController.java) | request/verify/complete가 `/api/auth/**` 아래에 있고 SecurityConfig가 permitAll. rate limit/캡차 없음 — 이메일 발송 무한 트리거 + 토큰 탈취 시도 가능. **확신 낮음** (본문은 부분 확인) | rate limiting, 캡차, 토큰 만료 짧게 |
| **중간** | [SecurityConfig.java:108](backend/src/main/java/com/giproject/config/SecurityConfig.java#L108) | `/api/**` 전체 permitAll → 추후 어떤 컨트롤러를 만들든 자동으로 공개됨. 화이트리스트 의도와 반대 동작 | 명시적 prefix만 허용하도록 좁히기 |
| **중간** | [MemberCouponController.issueTest](backend/src/main/java/com/giproject/controller/member/MemberCouponController.java#L73) | `/g2i4/coupons/issue-test`가 운영 코드에서 활발히 호출됨 (EditMyInform, CouponCenter). 이름 그대로 테스트 엔드포인트인데 운영 흐름이 의존 | 정식 `/issue` 흐름으로 이전하거나, issue-test의 권한/검증을 운영 수준으로 강화 |
| **중간** | [MemberController.java:51](backend/src/main/java/com/giproject/controller/member/MemberController.java#L51) | JWT 토큰을 그대로 응답 body로 반환(`accessToken`, `refreshToken`을 Map에 넣어 리턴). XSS 환경에서 token 노출 위험. 일관성 측면에서도 TokenAuthController는 쿠키/헤더 사용 추정 | HttpOnly 쿠키 또는 헤더로 일관 |
| **중간** | [EstimateController.java:46,58,86,...](backend/src/main/java/com/giproject/controller/estimate/EstimateController.java#L46) | `System.out.println` 다수 — 운영 로그 누설 + 표준 로깅 미적용 | log4j로 통일 |
| **중간** | [EstimateController.accepted:92-93](backend/src/main/java/com/giproject/controller/estimate/EstimateController.java#L92-L93) | `matchingService.acceptMatching` 후 `mailService.acceptedMail(mcno)`을 컨트롤러에서 직접 호출. 트랜잭션 분리(컨트롤러 메서드에는 `@Transactional` 없음). 메일 실패 시 매칭은 커밋된 채 남고, 메일 성공 후 응답 도중 오류 시 일관성 깨짐. **확신 낮음** — 서비스 구현 미확인 | 서비스 계층에서 트랜잭션 묶기. 또는 메일은 이벤트/비동기로 분리 |
| **낮음 (6~8건)** | — | `produces`/`consumes` 누락, ResponseEntity 미사용 메서드(`Map<...>` 그대로 반환), 잘못된 HTTP 메서드(조회를 POST로) 등 | 개수만 보고 |

---

## 개선 제안

| 심각도 | 파일:위치 | 문제 요약 | 제안 방향 |
|---|---|---|---|
| **높음** | AuthController vs TokenAuthController ([Auth](backend/src/main/java/com/giproject/controller/AuthController.java), [Token](backend/src/main/java/com/giproject/controller/TokenAuthController.java)) | 둘 다 `/api/auth/**` 사용. 회원가입 흐름이 `signup-context`(Auth) / `social/signup-context`(Token), `complete-signup`(Auth) / `social/complete-signup`(Token)로 갈라져 한쪽이 죽은 코드. 어디로 갈지 혼란 | 회원가입은 TokenAuthController로 일원화하고 AuthController의 signup 외 메서드는 제거 |
| **높음** | MemberController vs SNSController vs api/oauth/OAuthSignupController vs TokenAuthController | OAuth/소셜 로그인 관련 컨트롤러가 4개로 분산. MemberController는 prefix 버그로 죽었고, SNSController는 deprecated 응답만, 실제 흐름은 Spring Security `/oauth2/**` + TokenAuthController. front 쪽에도 죽은 코드(kakaoApi.js 등) 잔존 | OAuth 진입은 Spring Security만 사용, 우리 컨트롤러는 callback 후처리(CustomOAuth2SuccessHandler)와 social signup-context/complete-signup만 남기고 나머지 제거 |
| **높음** | [EstimateController](backend/src/main/java/com/giproject/controller/estimate/EstimateController.java) 전반 | (a) 매 메서드에서 동일한 `authHeader.replace("Bearer ", "")` → `jwtService.getUsername(token)` 반복 (b) Repository를 컨트롤러에서 직접 사용(line 69, 89) (c) `Map<String, Long/Object>` 같은 raw map을 RequestBody로 받음 — DTO 미정의 (d) try/catch 블록이 메서드마다 중복 | (a) `@AuthenticationPrincipal` 또는 ArgumentResolver로 추출 (b) Service 계층으로 이동 (c) 각 요청별 DTO 정의 (d) `@RestControllerAdvice`로 글로벌 예외 매핑 |
| **중간** | [MemberMutationController](backend/src/main/java/com/giproject/controller/member/MemberMutationController.java) vs [CargoOwnerMutationController](backend/src/main/java/com/giproject/controller/cargo/CargoOwnerMutationController.java) | 두 컨트롤러가 동일한 메서드 시그너처(`PUT /{id}/address`, `PUT /{id}/password`)를 두 번 정의. 회원 타입만 다르고 로직 흐름 동일 | 공통 추상화: `UserMutationFacade` 또는 단일 `/users/{userType}/{id}/...` 형태로 통합 |
| **중간** | [UserReportController.java:38-58](backend/src/main/java/com/giproject/controller/report/UserReportController.java#L38) | 같은 `/{id}/read` 경로에 PUT과 POST 두 메서드 — front는 PUT만 사용. PATCH `read-all`도 미사용 | 중복 제거 (PUT 1개만) |
| **중간** | front [serverConfig.js](front/src/api/serverConfig.js) vs [memberApi.js:3](front/src/api/memberApi.js#L3) | memberApi.js가 `API_SERVER_HOST`를 `http://localhost:3000`(프론트 포트)로 자체 선언. 죽은 코드 + 향후 동일 이름 import 충돌 위험 | 별도 분석 영역이긴 한데 보고: 파일 자체 삭제 후보 |
| **중간** | RequestBody에 `Map<String, ...>` 사용 다수 (Order, Payment, Estimate, Cargo의 reportUser 등) | 명세 불투명, swagger 자동 생성 시에도 도움 안 됨, null/타입 검증 어려움 | 도메인별 Request DTO 정의 |
| **중간** | `@RequestMapping("/g2i4/...")` vs `@RequestMapping("/api/...")` prefix 혼재 | 비즈니스 도메인은 `/g2i4/*`, 인증/공지/QA는 `/api/*` — 일관성 없음 | 전체적으로 `/api/v1/<domain>` 형태로 정리 권장 (단, breaking change라 신중) |
| **중간** | [SecurityConfig.java:124](backend/src/main/java/com/giproject/config/SecurityConfig.java#L124) | CORS allowed origins 하드코딩 (localhost:3000, 3002, 10.0.2.2:3000) | profile별 설정으로 분리 |
| **낮음 (8~10건)** | — | 일부 컨트롤러가 `@Controller`만 사용([DeliveryController.java:15](backend/src/main/java/com/giproject/controller/delivery/DeliveryController.java#L15)) — `@RestController`로 통일 / `produces` 일관성 / 메서드명 오타(`getSaveEstimat`) / `@RequestBody Long deNo`(`UserReportController.reportUser`)는 JSON body가 단순 number라 일반적 패턴과 다름 / Coupon 엔티티가 entity 루트에 두 개([Coupon.java](backend/src/main/java/com/giproject/entity/Coupon.java), [ChatMessage.java](backend/src/main/java/com/giproject/entity/ChatMessage.java)) — 도메인 폴더로 정리 등 | 개수만 보고 |
