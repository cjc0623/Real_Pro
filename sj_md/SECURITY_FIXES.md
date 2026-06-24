# 보안 긴급 수정 내역 (Critical Fixes)

> 작성일: 2026-06-19
> 범위: 🔴 "즉시" 등급 보안 항목 전체 (백엔드 + 프론트엔드)
> 검증: 백엔드 `gradlew compileJava` → **BUILD SUCCESSFUL**

---

## ⚠️ 먼저 읽어주세요 — 두 가지 필수 조치 & 주의

### 1) `front/CLAUDE.md` 규칙과의 충돌
`front/CLAUDE.md`에는 *"백엔드 코드 절대 수정 금지 / API 연동 로직(fetch·axios) 건드리지 않기 / UI만"* 이라는 standing 규칙이 있습니다.
이번 작업은 **"즉시 보안 항목 전부 수정"** 이라는 직접 지시에 따라 진행되었고, 1순위 항목(백엔드 인가 복구)은 백엔드 수정 없이는 불가능하여 **백엔드 코드와 일부 API 파일을 수정**했습니다.
→ 규칙과 상충하므로, **이 변경을 유지할지 검토/승인**이 필요합니다. (되돌리기를 원하시면 알려주세요.)

### 2) 노출된 시크릿 전량 재발급(rotate) 필수
아래 키들은 **이미 git에 평문 커밋된 이력**이 있어, 파일에서 분리한 것만으로는 안전하지 않습니다. **각 콘솔에서 반드시 재발급**하고 새 값으로 교체하세요. (필요 시 git 히스토리 정리 `git filter-repo` 도 권장)
- DB 비밀번호, JWT secret(내부 — 이미 교체함), Google/Naver/Kakao OAuth client-secret, Naver SMTP 메일 비밀번호, PortOne store-id/channel-key, Gemini API key, Kakao REST API 키(지도)

---

## 백엔드 (Spring Boot)

### B-1. 인증·인가 우회 취약점 제거 (최우선) 🔴
이전: `/fr/admin/**`, `/fr/payment/**`, `/fr/user/**`, `/api/**` 등이 전부 `permitAll()` → **토큰 없이 관리자 API 호출 가능**.

- **`config/SecurityConfig.java`**
  - `/fr/admin/**` → `hasAuthority("ROLE_ADMIN")`
  - `/fr/payment/**`, `/fr/mypage/**`, `/fr/user/**`, `/fr/member/**`, `/fr/owner/**`, `/fr/subpath/order/**` → `authenticated()`
  - 공개 유지(기능 호환): 이미지/`/fr/cargo`/`/fr/main`/`/fr/qna`/`/fr/coupons` 등 (⚠️ 후속 개별 점검 권장)
- **관리자 컨트롤러 8종에 `@PreAuthorize("hasAuthority('ROLE_ADMIN')")` 추가** (defense-in-depth, URL 매처와 이중 방어)
  - `controller/admin/AdminCargoController`, `AdminDashboardController`, `AdminDeliveryController`, `AdminMemberController`, `AdminSanctionController`, `AdminMemberAliasController`
  - `controller/fees/FeesAdminController`, `controller/report/UserReportController`

### B-2. 시크릿 외부화 🔴
- 신규 **`resources/application-secret.properties`** (gitignore 처리됨) — 모든 민감값 이동
- 신규 **`resources/application-secret.properties.example`** — 커밋용 템플릿
- **`resources/application.properties`** — 시크릿 값 전부 제거, 비밀 분리 주석 추가. (`spring.config.import=optional:application-secret.properties` 로 자동 병합)
- **`config/OAuth2ClientsConfig.java`** — 하드코딩된 OAuth client-id/secret 제거 → `@Value`로 외부 주입
- **`.gitignore`** — `application-secret.properties` 등록

### B-3. JWT secret 교체 🔴
- 기존 `jwt.secret=123456789012345678901234567890817682825` (순차 숫자, 추측 가능) → **48바이트 CSPRNG 랜덤 값**으로 교체 (secret 파일에 보관)
- **`security/JwtService.java`** — `@Value`의 약한 기본값 폴백 제거 → 미설정 시 기동 실패(fail-fast)

### B-4. 민감 정보 로깅 차단
- **`application.properties`** — `org.springframework.security=TRACE`, `io.jsonwebtoken=TRACE`, Hibernate SQL/bind `DEBUG/TRACE`, `spring.jpa.show-sql=true`, `mail.debug=true` → 모두 `INFO/WARN/false`로 하향 (토큰·SQL 파라미터 평문 로그 제거)

### B-5. OAuth 실패 핸들러 오픈 리다이렉트 차단
- **`config/SecurityConfig.java`** — 리다이렉트 대상을 공격자 조작 가능한 `Origin` 헤더 대신 신뢰된 `frontend.base-url`로 고정

---

## 프론트엔드 (React)

### F-1. Kakao 키 하드코딩 제거 🔴
`src` 내 하드코딩 키 **0개**로 정리 (이전 4개 파일):
- 지도 REST 키(`KakaoAK`용) → `process.env.REACT_APP_KAKAO_REST_KEY`
  - `layout/component/common/calculateDistanceBetweenAddresses.js`
  - `layout/component/common/MapComponent2.js`
  - `layout/component/estimate/KakaoMapViewer.jsx`
- Kakao OAuth REST 키 → `process.env.REACT_APP_KAKAO_OAUTH_KEY`
  - `api/getKakaoLoginLink.js`
- **`public/index.html`** — REST 키를 maps `appkey`로 노출하던 중복 `<script>` 제거, JS 키는 `%REACT_APP_KAKAO_JS_KEY%`로 치환

### F-2. 환경변수 체계 도입
- 신규 **`front/.env`** (gitignore 처리됨): `REACT_APP_API_BASE`, `REACT_APP_KAKAO_JS_KEY`, `REACT_APP_KAKAO_REST_KEY`, `REACT_APP_KAKAO_OAUTH_KEY`
- 신규 **`front/.env.example`** — 커밋용 템플릿
- 신규 **`front/.gitignore`** (기존에 **없었음**) — `node_modules`, `.env*`, `build`, `.understand-anything/` 제외

> ⚠️ **한계 명시:** CRA의 `REACT_APP_*` 값도 빌드 결과물(JS)에 포함되어 브라우저에 노출됩니다. `.env` 분리는 *소스/깃 노출 제거 + 회전 용이성* 확보까지이며, **근본 해결은 백엔드 프록시 경유**입니다(아래 후속 과제).

---

## 결제 금액 검증 (확인 결과)
- **금액은 이미 서버에서 계산**됩니다 — `service/payment/PaymentServiceImpl.acceptedPayment()`가 `orderSheet.getTotalPrice()` + 쿠폰 할인으로 `finalPrice`를 산출하며 **클라이언트가 보낸 금액을 신뢰하지 않습니다**(DTO에 금액 필드 없음). 즉, "클라이언트 금액 위변조" 취약점은 **현재 없음**.
- 결제 엔드포인트(`/fr/payment/**`)는 이번에 **`authenticated()`로 보호**됨(B-1).
- **남은 과제:** PortOne 서버측 거래 검증(아래 후속). 이를 위해 `portone.api-secret` 자리만 secret 파일에 마련해 둠.

---

## 적용 방법 (실행 전 필수)

```bash
# 1) 백엔드 — 시크릿 파일 생성 후 실제(재발급된) 값 입력
cp backend/src/main/resources/application-secret.properties.example \
   backend/src/main/resources/application-secret.properties
#   (현재 커밋 시점엔 기존 값 + 새 JWT secret이 들어간 application-secret.properties 가 로컬에 생성되어 있음)

# 2) 프론트 — .env 확인 (이미 생성됨). 키 재발급 후 값 교체
#   front/.env

# 3) 백엔드 빌드 확인
cd backend && ./gradlew.bat compileJava   # JAVA_HOME=Zulu 21
```

---

## 후속 권장 과제 — 2차 처리 결과 (→ `SECURITY_FIXES_2.md` 참고)
- [x] PortOne **서버측 결제 검증** — `PortOneVerificationService` 추가, `acceptedPayment`에 연결 (api-secret 설정 시 활성)
- [x] Kakao 지도/길찾기 **백엔드 프록시화** — `MapProxyController(/fr/maps/**)` 추가, 프론트 3파일 프록시 호출로 전환 (브라우저 키 제거)
- [x] CORS 3중 중복 **통일** — `SecurityConfig` 단일화, `CorsConfig` 삭제, `WebConfig.addCorsMappings` 제거
- [x] `process.env.X || process.env.X` 중복 폴백 오타 **정리** (프론트 17파일)
- [x] refresh 토큰 **회전(rotation)** — 재발급 시 새 refresh 토큰 발급
- [x] `apiFetch.js` 쿼리스트링 / `jwt.js` 중복 / `kakaoApi.js` 死코드 — **死코드 정리 단계에서 파일 삭제됨** (해소)
- [ ] **노출 시크릿 전량 재발급** + git 히스토리 정리 — ⚠️ 외부 콘솔 작업, 사용자 직접 수행 필요
- [ ] refresh 토큰 **HttpOnly 쿠키 전환 + 서버측 폐기(blacklist)** — 로그인 흐름 end-to-end 변경/테스트 필요 (회전까지만 적용)
- [ ] `/api/**` 잔여 공개 경로 **엔드포인트별 인가 재점검** — 런타임 테스트 필요로 보류
- [ ] `alert()` 144개 → MUI Snackbar, 테스트 보강 — 대규모 UI 리팩터, 별도 작업 권장

---

## 변경 파일 목록
**백엔드**
- `src/main/resources/application.properties` (수정)
- `src/main/resources/application-secret.properties` (신규, gitignore)
- `src/main/resources/application-secret.properties.example` (신규)
- `src/main/java/com/giproject/config/SecurityConfig.java` (수정)
- `src/main/java/com/giproject/config/OAuth2ClientsConfig.java` (수정)
- `src/main/java/com/giproject/security/JwtService.java` (수정)
- `src/main/java/com/giproject/controller/admin/*.java` ×6, `controller/fees/FeesAdminController.java`, `controller/report/UserReportController.java` (수정)
- `.gitignore` (수정)

**프론트엔드**
- `public/index.html` (수정)
- `src/layout/component/common/calculateDistanceBetweenAddresses.js` (수정)
- `src/layout/component/common/MapComponent2.js` (수정)
- `src/layout/component/estimate/KakaoMapViewer.jsx` (수정)
- `src/api/getKakaoLoginLink.js` (수정)
- `.env` (신규, gitignore), `.env.example` (신규), `.gitignore` (신규)
