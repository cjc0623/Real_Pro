# 보안 후속 처리 내역 (2차)

> 작성일: 2026-06-19
> 범위: `SECURITY_FIXES.md` 후속 권장 과제 전체 처리
> 검증: 백엔드 `gradlew compileJava` → **BUILD SUCCESSFUL** / 프론트 `npm run build` → **Compiled (warnings only, no error)**

---

## ✅ 처리 완료 (코드)

### 1. CORS 3중 중복 → 단일화
이전: `SecurityConfig.corsConfigurationSource` + `CorsConfig.corsFilter` + `WebConfig.addCorsMappings` 3곳, 허용 오리진도 제각각.
- `SecurityConfig` 한 곳으로 일원화. 허용 오리진을 `application.properties` 의 **`cors.allowed-origins`** 프로퍼티로 분리(`http://localhost:3000,http://localhost:3002,http://10.0.2.2:3000`)
- **`config/CorsConfig.java` 삭제**
- **`WebConfig.addCorsMappings()` 제거** (리소스 핸들러는 유지), 미사용 `CorsRegistry` import 정리

### 2. Kakao 지도/길찾기 백엔드 프록시화 (REST 키 브라우저 비노출)
- 신규 **`controller/MapProxyController.java`** — `/fr/maps/geocode`, `/fr/maps/directions` 가 서버측 키(`kakao.rest-api-key`)로 Kakao 대리 호출, 원본 JSON 그대로 반환
- `SecurityConfig` 에 `/fr/maps/**` 공개 허용 추가
- `application-secret.properties` 에 `kakao.rest-api-key` 추가(외부화)
- 프론트 3개 파일이 키 없이 프록시 호출로 전환:
  - `layout/component/common/calculateDistanceBetweenAddresses.js`
  - `layout/component/common/MapComponent2.js`
  - `layout/component/estimate/KakaoMapViewer.jsx`
- 결과: **Kakao REST 키가 프론트 번들/네트워크에서 완전히 사라짐.** `front/.env` 에서도 `REACT_APP_KAKAO_REST_KEY`/`OAUTH_KEY` 제거(지도 SDK 표시용 JS 키만 유지)

### 3. PortOne 서버측 결제 검증
- 신규 **`service/payment/PortOneVerificationService.java`** — `paymentId` 로 PortOne V2 API 조회 → `status==PAID` 및 `amount.total == 서버 산출 finalPrice` 대조, 불일치 시 예외
- `PaymentServiceImpl.acceptedPayment()` 에서 결제 저장 **직전 검증 호출**
- `portone.api-secret` **미설정 시**: 경고 로그 후 검증 skip(데모 보존). ⚠️ **운영에서는 반드시 `portone.api-secret` 설정 필요**

### 4. refresh 토큰 회전(rotation)
- `TokenAuthController.refresh()` — 재발급 때마다 **새 refresh 토큰 발급**(기존엔 동일 토큰 재사용)
- (서버측 폐기/blacklist 는 별도 저장소 필요 → 아래 보류 항목)

### 5. env 중복 폴백 오타 정리
- `process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_BASE` 중복 → 단일화 (**프론트 17개 파일**)

### 6. 死코드 정리로 자동 해소된 항목
- `lib/apiFetch.js`(refresh 쿼리스트링 버그), `utils/jwt.js`(중복), `api/kakaoApi.js`(미정의 변수 死코드) → **死코드 정리 단계에서 이미 삭제됨**

---

## ⚠️ 보류 / 사용자 조치 필요 (사유)

| 항목 | 사유 / 필요 조치 |
|---|---|
| **노출 시크릿 전량 재발급** | 외부 콘솔(Google/Naver/Kakao/PortOne/Gemini/메일/DB) 작업이라 코드로 불가. 각 콘솔에서 재발급 후 `application-secret.properties`/`.env` 교체. 이미 git 노출 이력 → `git filter-repo` 등으로 히스토리 정리 권장 |
| **refresh 토큰 HttpOnly 쿠키 전환 + 서버측 폐기** | 로그인·재발급·로그아웃 흐름을 프론트/백 동시 변경 + 런타임 테스트 필요. 무테스트 적용 시 로그인 깨질 위험 → 회전(rotation)까지만 적용 |
| **`/api/**` 잔여 공개 경로 인가 재점검** | 현재 `permitAll`. 엔드포인트별로 인증 요구 시 공개 브라우징/로그인 흐름 깨질 수 있어 런타임 테스트 필수 → 보류 |
| **`alert()` 144개 → Snackbar** | 144개 호출처 UI 리팩터. 화면별 동작 검증 없이 일괄 변경 시 회귀 위험 → 별도 UI 작업으로 권장 |

---

## 적용 시 주의
- 백엔드 기동 전 `application-secret.properties` 에 `kakao.rest-api-key`(지도용), 운영이라면 `portone.api-secret`(결제검증용)이 채워져 있어야 합니다.
- `kakao.rest-api-key` 미설정 시 지도/거리 기능이 502 를 받을 수 있습니다(프록시가 키 없이 호출). 데모에서도 지도 기능을 쓰면 이 값은 채워야 합니다.

---

## 변경 파일 요약
**백엔드 (신규)**: `controller/MapProxyController.java`, `service/payment/PortOneVerificationService.java`
**백엔드 (수정)**: `config/SecurityConfig.java`, `config/WebConfig.java`, `controller/TokenAuthController.java`, `service/payment/PaymentServiceImpl.java`, `resources/application.properties`, `resources/application-secret.properties(.example)`
**백엔드 (삭제)**: `config/CorsConfig.java`
**프론트 (수정)**: `calculateDistanceBetweenAddresses.js`, `MapComponent2.js`, `KakaoMapViewer.jsx`, `.env`, `.env.example`, env 중복폴백 17개 파일
