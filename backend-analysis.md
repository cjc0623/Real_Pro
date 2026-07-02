# Backend 분석 보고서

분석 일자: 2026-05-29 (최초) → **재분석 2026-06-22**
분석 대상: `backend/` (Spring Boot) ↔ `front/` (React) 비교 및 backend 단독 점검
분석 범위: 코드 수정 없음 (read-only 분석/제안만)

---

## 재분석 변경 요약 (2026-06-22)

> 최초 분석(2026-05-29) 이후 코드가 크게 바뀌어 핵심 사항을 재검증했다.

### ★ 가장 큰 변화 — API prefix 전면 마이그레이션 `/g2i4/*` → `/fr/*`
- 비즈니스 도메인 경로가 전부 `/g2i4/...` 에서 **`/fr/...`** 로 바뀜 (인증/공지/QA/이메일은 `/api/*` 유지).
- **프론트도 동일하게 마이그레이션 완료** — front 코드에 `/g2i4/` 호출은 이미지(`/g2i4/uploads`) 하위호환 외 **잔존 0**.
- 따라서 최초 보고서의 `/g2i4/...` 경로 문자열은 모두 `/fr/...` 로 읽어야 한다.

### 신규 컨트롤러/엔드포인트 (최초 보고서에 없던 것)
| 경로 | 컨트롤러 | 비고 |
|---|---|---|
| `GET /fr/notifications/summary` | [NotificationController](backend/src/main/java/com/giproject/controller/notification/NotificationController.java) | 역할별 알림 요약(신규 기능). **permitAll 목록에 없어 인증 필요 — 올바름** |
| `/fr/estimate/direct-request*`, `/drivers`, `/direct-requests/{sent,received}`, accept/reject/cancel | [DirectRequestController](backend/src/main/java/com/giproject/controller/estimate/DirectRequestController.java) | 직접요청 도메인(신규) |
| `/fr/admin/cargo/{pending,approve,reject}` | [AdminCargoController](backend/src/main/java/com/giproject/controller/admin/AdminCargoController.java) | 차량 승인 관리 |
| `/fr/admin/dashboard`, `/fr/admin/delivery/*`, `/fr/admin/sanctions/*` | AdminDashboard/Delivery/Sanction | 관리자 기능 확장 |
| `GET /fr/admin/reports/unread-count` | [UserReportController](backend/src/main/java/com/giproject/controller/report/UserReportController.java#L22) | 사이드바 신고 뱃지(알림 연계) |
| `POST /fr/coupons/issue` | [MemberCouponController](backend/src/main/java/com/giproject/controller/member/MemberCouponController.java#L26) | **정식 발급 엔드포인트가 생김**(과거 issue-test만 있던 문제 일부 해소) |
| `/fr/verification/*`, `/fr/qna/my`, `/fr/address/*`, `/api/ai/ask` | Verification/MyInquiry/Address/Ai | 신규 도메인 |

### 최초 "가장 시급한 4가지" 현재 상태
1. **SecurityConfig 광범위 permitAll — 여전히 위험(높음).** `/fr/admin/**`, `/fr/payment/**`, `/fr/delivery/**`, `/fr/user/**`, `/fr/member/**`, `/api/**` 등이 permitAll. 즉 **익명도 관리자/결제/배송 API 호출 가능.** ([SecurityConfig.java:99-113](backend/src/main/java/com/giproject/config/SecurityConfig.java#L99-L113))
2. **MemberController path mapping 버그 — 여전히 존재(높음).** prefix `{"/api/signup","/fr/member"}` + 메서드 절대경로 `/api/member/kakao` 결합 문제 그대로.
3. **EstimateController — 부분 개선.** `accepted`는 `orElseThrow`+try/catch로 **수정됨**. 그러나 하드코딩 `"user"`, `paidlist` 중복 DB 호출, `reject`의 `.get()`, `System.out.println`은 **여전히 존재**.
4. **front↔backend 불일치 — 일부 해소/일부 잔존** (아래 §B 갱신).

---

## 미사용 API

### A. Backend에는 있는데 front에서 호출 흔적이 없는 엔드포인트 (재검증, /fr 반영)

| HTTP | 전체 경로 | 컨트롤러.메서드 | 비고 |
|---|---|---|---|
| GET | `/api/test` | [CorsTestController](backend/src/main/java/com/giproject/controller/CorsTestController.java#L10) | CORS 테스트용. 운영 아님 |
| GET | `/api/oauth/{pending-info,signup-context}` | [OAuthSignupController](backend/src/main/java/com/giproject/api/oauth/OAuthSignupController.java#L36) | TokenAuthController `/api/auth/social/signup-context`로 대체 |
| GET | `/api/auth/signup-context` | [AuthController.signupContext](backend/src/main/java/com/giproject/controller/AuthController.java#L74) | front는 `/api/auth/social/signup-context`만 호출 |
| POST | `/api/auth/complete-signup` | [AuthController.completeSignup](backend/src/main/java/com/giproject/controller/AuthController.java#L96) | front는 `/api/auth/social/complete-signup`만 호출 |
| GET | `/api/chat/history` | [ChatController](backend/src/main/java/com/giproject/controller/ChatController.java#L28) | send만 호출 |
| POST | `/fr/admin/reports/{id}/read` (POST) | [UserReportController:46](backend/src/main/java/com/giproject/controller/report/UserReportController.java#L46) | PUT 버전만 사용, POST 중복 |
| PATCH | `/fr/admin/reports/read-all` | [UserReportController:60](backend/src/main/java/com/giproject/controller/report/UserReportController.java#L60) | 호출 없음 |
| GET | `/fr/admin/users` | [AdminMemberAliasController](backend/src/main/java/com/giproject/controller/admin/AdminMemberAliasController.java#L25) | 명시적 alias인데 호출 없음(추정) |
| GET | `/fr/admin/members/{owners,cowners,admin}` | [AdminMemberController](backend/src/main/java/com/giproject/controller/admin/AdminMemberController.java#L45) | BASE만 호출되는지 재확인 필요(확신 낮음) |
| GET | `/fr/owner/revenue/monthly-debug` | [OwnerMetricsController:48](backend/src/main/java/com/giproject/controller/owner/OwnerMetricsController.java#L48) | 디버그용 |
| GET | `/fr/estimate/subpath/{savelist,export}` | [EstimateController:104,115](backend/src/main/java/com/giproject/controller/estimate/EstimateController.java#L104) | 인증 무시(`"user"` 하드코딩) + 미사용 |
| GET | `/fr/review/{list,summary/{cargoId},driver/{cargoId}}` | [ReviewController](backend/src/main/java/com/giproject/controller/review/ReviewController.java#L70) | `/summary/my`, `/driver-profile`, `/driver-detail`로 대체된 듯 |
| GET | `/api/signup/info`, `/fr/member/info` | [MemberController.getMemberInfo](backend/src/main/java/com/giproject/controller/member/MemberController.java#L34) | front는 `/fr/user/info`(UserInfoController) 호출 |
| GET | `/api/signup/check-id`, `/fr/member/check-id` | [MemberController.checkId](backend/src/main/java/com/giproject/controller/member/MemberController.java#L92) | front는 `/api/auth/check-id`(AuthController) 호출. 중복 구현 |
| GET | `/api/signup/api/member/kakao` 등 | [MemberController:51,70,77](backend/src/main/java/com/giproject/controller/member/MemberController.java#L51) | **경로 버그**로 의도된 path 아닌 곳에 매핑. 실질적 dead code |
| GET | `/api/member/{kakao,naver}` | [SNSController](backend/src/main/java/com/giproject/controller/SNSController.java#L17) | "deprecated" 응답만 반환 |

> 확신 낮음: `/api/notices/categories`, `/api/qaboard/categories` 등 일부는 동적 URL을 통해 호출될 수 있어 호출부까지 검증 못 함.

### B. Front에서 호출하는데 backend에 매핑이 없는 경로 (재검증, /fr 반영)

| 상태 | HTTP | 호출 경로 | 호출 위치 | 비고 |
|---|---|---|---|---|
| **잔존** | POST | `/fr/main/getfeeslist` | [mainImageAPI.js:16](front/src/api/common/mainImageAPI.js#L16) | `/fr/main/**`는 permitAll돼 있으나 **컨트롤러 없음 → 404** |
| **잔존** | GET | `/api/report/details/{deliveryNumber}` | [reportApi.js:15](front/src/api/reportApi.js#L15) | 컨트롤러 없음. 주석에도 "endpoint should be confirmed" |
| **잔존** | POST | `/fr/owner/deliveries/{matchingNo}/start` | [DeliveryInform.js:74](front/src/layout/component/mypage/DeliveryInform.js#L74) | OwnerDeliveryController엔 `/complete`,`/in_transit`만 — **`/start` 없음** |
| **잔존** | GET | `/api/auth/refresh?refreshToken=...` | [lib/apiFetch.js:21](front/src/lib/apiFetch.js#L21) | TokenAuthController.refresh는 **POST+body** — method/payload 불일치 (단, [ResponsiveAppBar:99](front/src/common/ResponsiveAppBar.js#L99)는 올바르게 POST 사용) |
| **잔존** | POST | `/api/member/google` | [getGoogleLoginLink.js:46](front/src/api/getGoogleLoginLink.js#L46) | base가 `http://localhost:3000`(프론트 자신) → 백엔드로 안 감. 죽은/깨진 호출 |
| **잔존(죽은코드)** | — | `API_SERVER_HOST="http://localhost:3000"` | [memberApi.js:3](front/src/api/memberApi.js#L3) | 프론트 포트를 API base로 선언. import 충돌 위험, 삭제 후보 |
| **해소** | POST | ~~`/g2i4/admin/reports/{id}/resolve|reject`~~ | — | front에서 더 이상 호출 안 함 |
| **해소** | GET | ~~`/g2i4/delivery/my`~~ | — | 이제 `/fr/owner/deliveries/{unpaid,paid,completed}` 사용(모두 매핑 존재) |

---

## 수정 필요 (재검증)

| 심각도 | 상태 | 파일:위치 | 문제 요약 |
|---|---|---|---|
| **높음** | 잔존 | [SecurityConfig.java:99-113](backend/src/main/java/com/giproject/config/SecurityConfig.java#L99-L113) | `/fr/admin/**`,`/fr/payment/**`,`/fr/delivery/**`,`/fr/user/**`,`/fr/member/**`,`/api/**` 등 거의 모든 비즈니스/관리자 엔드포인트가 `permitAll()`. 익명 호출 가능. 도메인별 `hasAuthority/hasRole` 적용 필요 |
| **높음** | 잔존 | [MemberController.java:24,51,70,77](backend/src/main/java/com/giproject/controller/member/MemberController.java#L24) | 클래스 prefix + 메서드 절대경로(`/api/member/kakao`) 결합으로 의도하지 않은 경로 등록. 콜백 메서드 dead code |
| **높음** | 잔존 | [EstimateController.java:108,119,126](backend/src/main/java/com/giproject/controller/estimate/EstimateController.java#L108) | `getSaveEstimat`/`exportEs`/`saveEstimate`가 `"user"` 하드코딩 → 누가 호출해도 "user" 계정으로 동작. JWT memId 사용 필요 |
| **높음** | 잔존 | [EstimateController.java:173-175](backend/src/main/java/com/giproject/controller/estimate/EstimateController.java#L173) | `getMyPaidList`: `findMyPaidEstimates(memId)`를 두 번 호출, 첫 결과(`dtoList`) 미사용. `ResponseEntity.ok(dtoList)`로 수정 |
| **높음** | 잔존 | [EstimateController.java:69](backend/src/main/java/com/giproject/controller/estimate/EstimateController.java#L69) | `reject`: `cargoOwnerRepository.findById(cargoId).get()` 직접 호출 → 잘못된 id면 500. `accepted`처럼 `orElseThrow` 적용 |
| **높음** | **수정됨** | [EstimateController.accepted:88-101](backend/src/main/java/com/giproject/controller/estimate/EstimateController.java#L88) | `orElseThrow` + try/catch로 NPE/예외 처리 완료 ✅ |
| **높음** | 잔존 | EstimateController 전반 (45,57,64,...) | 모든 메서드 `authHeader.replace("Bearer ","")` — `@RequestHeader` 필수라 누락 시 400으로 막히긴 하나, "Bearer " 접두사/토큰 검증 없음. `Authentication` 객체 사용으로 일원화 권장 |
| **중간** | 잔존 | [EstimateController.java:49,156,179](backend/src/main/java/com/giproject/controller/estimate/EstimateController.java#L49) | `System.out.println` 다수 → log4j로 통일 |
| **중간** | 잔존 | [UserReportController.java:38-60](backend/src/main/java/com/giproject/controller/report/UserReportController.java#L38) | `/{id}/read`에 PUT+POST 중복(front는 PUT만), `read-all`(PATCH) 미사용 |
| **중간** | 부분해소 | [MemberCouponController](backend/src/main/java/com/giproject/controller/member/MemberCouponController.java#L26) | 정식 `/issue` 생김. 단 `/issue-test`도 여전히 존재하고 운영 흐름이 이걸 쓰는지 재확인 필요 |
| **중간** | 잔존(확신낮음) | [PasswordResetController](backend/src/main/java/com/giproject/controller/PasswordResetController.java) | `/api/auth/password-reset/*`가 permitAll, rate limit/캡차 없음 |
| **중간** | 잔존 | [SecurityConfig.java:108](backend/src/main/java/com/giproject/config/SecurityConfig.java#L108) | `/api/**` 전체 permitAll → 새 `/api/*` 컨트롤러가 자동 공개됨 |
| **중간** | 잔존 | [SecurityConfig.java:125](backend/src/main/java/com/giproject/config/SecurityConfig.java#L125) | CORS allowed origins 하드코딩(localhost:3000/3002, 10.0.2.2:3000), `allowCredentials=true`. profile 분리 권장. (※ front의 알림 API `withCredentials` 충돌 이슈는 front에서 해결됨 — `notification-feature-plan.md` §10.3) |
| **낮음 (6~8건)** | 잔존 | — | `produces/consumes` 누락, `Map<...>` 그대로 반환, 조회를 POST로(`OrderController` viewOrder 등) |

---

## 개선 제안 (재검증)

| 심각도 | 파일:위치 | 제안 |
|---|---|---|
| **높음** | AuthController vs TokenAuthController | 둘 다 `/api/auth/**`. 회원가입이 `signup-context`(Auth)/`social/signup-context`(Token)로 갈라져 한쪽 dead. TokenAuthController로 일원화 |
| **높음** | OAuth 관련 컨트롤러 분산 (MemberController/SNSController/OAuthSignupController/TokenAuthController) | OAuth 진입은 Spring Security `/oauth2/**`만, 우리 컨트롤러는 success handler + social signup-context/complete-signup만 남기고 정리. front 죽은 코드(getGoogleLoginLink의 localhost:3000 POST 등)도 정리 |
| **높음** | [EstimateController](backend/src/main/java/com/giproject/controller/estimate/EstimateController.java) 전반 | (a) `authHeader.replace` 반복 → `@AuthenticationPrincipal`/ArgumentResolver (b) Repository 직접 사용(69) → Service로 (c) `Map<...>` RequestBody → DTO (d) try/catch 중복 → `@RestControllerAdvice` |
| **중간** | [MemberMutationController](backend/src/main/java/com/giproject/controller/member/MemberMutationController.java) vs [CargoOwnerMutationController](backend/src/main/java/com/giproject/controller/cargo/CargoOwnerMutationController.java) | 둘 다 `PUT /{id}/{address,password}` 동일 시그너처. 공통 추상화 |
| **중간** | RequestBody `Map<String,...>` 다수 (Order/Payment/Estimate 등) | 도메인별 Request DTO 정의 |
| **중간** | prefix 혼재 `/fr/*` vs `/api/*` | 비즈니스=`/fr`, 인증/공지/QA/이메일=`/api`. 일관성 위해 `/api/v1/<domain>` 정리 권장(단 breaking change, 신중) |
| **중간** | [memberApi.js:3](front/src/api/memberApi.js#L3) | `API_SERVER_HOST=localhost:3000` 죽은 코드 — 삭제 후보 |
| **낮음 (8~10건)** | — | `@Controller`만 쓴 컨트롤러([DeliveryController:16](backend/src/main/java/com/giproject/controller/delivery/DeliveryController.java#L16))를 `@RestController`로 / 메서드명 오타(`getSaveEstimat`) / Coupon·ChatMessage 엔티티 도메인 폴더 정리 등 |

---

## 재분석 한계 (정직 고지)
- backend 매핑·SecurityConfig·EstimateController·MemberController·주요 front 호출부는 **현재 코드로 직접 재검증**함.
- 섹션 A의 "호출 흔적 없음" 일부(AdminMember owners/cowners/admin, review 일부)는 동적 URL/간접 호출 가능성이 있어 **확신 낮음**으로 표시.
- 본 보고서는 read-only 분석이며 코드 수정은 없음.
