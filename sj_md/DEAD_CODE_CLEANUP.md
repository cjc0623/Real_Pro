# 미사용 코드 정리 내역 (Dead Code Cleanup)

> 작성일: 2026-06-19
> 범위: 프론트엔드 미사용 파일 + 백엔드 미사용 클래스/필드 + DB(엔티티) 점검
> 검증: 백엔드 `gradlew compileJava` → **BUILD SUCCESSFUL** / 프론트 import 그래프 재스캔 → **고아 0, 깨진 import 0**

---

## 0. DB(테이블) 점검 결과 — **미사용 테이블 없음** ✅

`spring.jpa.hibernate.ddl-auto=update` 라 첫 실행 시 `@Entity` 들이 테이블로 생성됩니다.
엔티티 **24개** 전부 리포지토리/서비스/엔티티 관계에서 참조되어 **사용 중**으로 확인되었습니다. (참조 0인 테이블 없음)

점검한 엔티티(테이블): `UserIndex, Cargo, CargoOwner, ChatMessage, Coupon, Delivery, Estimate, FeesBasic, FeesExtra, DirectRequest, Matching, RejectedMatching, Member, MemberCoupon, Notice, SocialAccount, OrderSheet, Payment, AdminResponse, QAPost, UserReport, Review, ReviewImage, ReviewReply`

> 참고: `ChatMessage`(채팅), `RejectedMatching`(매칭 반려) 등 참조 수가 적은 테이블도 활성 컨트롤러/서비스에 연결되어 있어 삭제하지 않았습니다.
> 단, `chat`(ChatController) 기능은 **프론트엔드 연동 여부 확인**을 권장합니다(백엔드 엔드포인트는 살아있음).

---

## 1. 프론트엔드 — 삭제한 파일 **28개**

### ① Git 머지 충돌 잔재 (4)
- `src/hooks/useCustomLogin_BACKUP_1776.js`
- `src/hooks/useCustomLogin_BASE_1776.js`
- `src/hooks/useCustomLogin_LOCAL_1776.js`
- `src/hooks/useCustomLogin_REMOTE_1776.js`

### ② 중복·깨진 구버전 (4)
- `src/api/kakaoApi.js` — 미정의 변수 참조(깨진 코드), `getKakaoLoginLink`의 복제본
- `src/utils/jwt.js` — `jwtUtils.js`와 중복
- `src/lib/apiFetch.js` — 미사용(refresh 토큰 쿼리스트링 버그 보유)
- `src/pages/AuthCallback.js` — `OAuthCallbackPage.js`와 중복

### ③ 미사용 API 모듈 (5)
- `src/api/deliveryApi/ownerDeliveryApi.js`
- `src/api/getGoogleLoginLink.js`
- `src/api/getNaverLoginLink.js`
- `src/api/getOAuthStartUrl.js`
- `src/api/reportApi.js` (루트 — 실제론 `userinfoApi/reportApi` 사용)

### ④ 미사용 컴포넌트/페이지/훅/라우터 (12)
- `src/components/Header.js`, `src/components/SiteFooter.js`
- `src/hooks/use-mobile.js`, `src/hooks/useAddressSearch.js`
- `src/layout/component/CouponCenter.js`, `src/layout/component/auth/LogoutButton.js`
- `src/layout/component/mypage/MyPage.js`, `src/layout/component/users/LogoutComponent.js`
- `src/pages/MyPage.js`, `src/pages/qaboard/NotFound.js`
- `src/router/servicecenterRouter.js`, `src/router/userRouter.js`

### ⑤ 연쇄 고아 — ①~④ 삭제 후 참조가 모두 사라진 파일 (3)
- `src/api/axios.js` — 전역 axios 설정이었으나 어디서도 import되지 않음(설정 미적용 상태였음)
- `src/api/getKakaoLoginLink.js` — 유일 사용처(삭제된 파일)가 사라져 고아화
- `src/api/memberApi.js`

> 재스캔 결과 **추가 고아 0개**, 살아있는 파일이 삭제 파일을 import하는 **깨진 참조 0개**.

---

## 2. 백엔드 — 삭제한 파일 **13개** + 死 필드 정리

### ① 미사용 DTO/유틸 클래스 (7)
- `common/error/ErrorResponse.java`
- `dto/auth/AccessTokenResponse.java`, `dto/auth/LoginRequest.java`, `dto/auth/TokenResponse.java`
- `dto/common/UpdateUserDTO.java`
- `dto/review/DriverReviewItemDTO.java`
- `dto/user/DtoConverters.java`

### ② 미사용 Admin 리포지토리 (5)
만들었으나 admin 서비스가 다른 리포지토리를 사용 → 어디에도 주입되지 않음
- `repository/admin/AdminCargoOwnerRepository.java`
- `repository/admin/AdminDashboardRepository.java`
- `repository/admin/AdminMemberRepository.java`
- `repository/admin/AdminOrderRepository.java`
- `repository/admin/AdminPaymentRepository.java`

### ③ Leftover 디버그 엔드포인트 (1)
- `controller/CorsTestController.java` — `GET /api/test` ("🎉 CORS 요청 성공!") 디버그용 제거

### ④ 死 필드/임포트 제거
- `security/JwtAuthenticationFilter.java`
  - 미사용 필드 `MATCHER`(AntPathMatcher), `EXCLUDES`(List) 제거
  - 그로 인해 불필요해진 import 정리: `HttpMethod`, `AntPathMatcher`, `java.util.List`
  - (실제 JWT 제외 경로 로직은 `shouldNotFilter()`가 그대로 담당 — 동작 변화 없음)

---

## 3. 검토했으나 **보존**한 항목 (삭제 안 함)

| 대상 | 이유 |
|---|---|
| `config/CorsConfig.java` | "미사용"이 아니라 **활성 `@Bean`**(CorsFilter 등록). `SecurityConfig`/`WebConfig`와 중복이긴 하나 삭제 시 CORS 동작이 바뀌므로 별도 검토 필요 (보안 리포트의 "CORS 3중 통일" 후속 과제) |
| `*ServiceImpl`, 컨트롤러, 엔티티 등 | 이름 직접참조가 없어도 Spring/JPA가 와이어링하는 **활성 코드** |

---

## 4. 결과 요약

| 구분 | 삭제 |
|---|---|
| 프론트 소스 파일 | **28개** (163 → 135) |
| 백엔드 Java 파일 | **13개** (248 → 235) |
| 백엔드 死 필드 | `MATCHER`, `EXCLUDES` + 미사용 import 3 |
| 미사용 DB 테이블 | **0개** (전부 사용 중) |

**검증**
- 백엔드: `gradlew compileJava` → **BUILD SUCCESSFUL**
- 프론트: import 그래프 재스캔 → 고아 0, 삭제 파일을 참조하는 깨진 import 0

---

## 5. 참고 / 후속
- 기존 DB에 이미 생성된 테이블은 `ddl-auto=update`가 **자동 삭제하지 않습니다**(update는 drop 안 함). 불필요 테이블 정리는 수동 `DROP` 필요 — 다만 이번 점검상 미사용 테이블은 없었습니다.
- 프론트 빌드 최종 확인은 `npm run build`로 한 번 더 권장(이번엔 import 그래프 기준 무결성까지만 검증).
- 보안 관련 후속 과제는 `SECURITY_FIXES.md` 참고.
