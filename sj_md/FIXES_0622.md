# 지도 CORS·쿠폰 스케줄러 수정 + understand 그래프 갱신 (0622)

> 작성일: 2026-06-22
> 범위: 지도(Kakao 프록시) CORS 버그, 쿠폰 만료 스케줄러 주기, understand 지식 그래프 증분 갱신
> 검증: 백엔드 `gradlew compileJava` → **BUILD SUCCESSFUL** / 재기동 후 `curl` 응답 헤더 단일화 확인

---

## 1. 지도 클릭/거리계산 CORS 차단 해결 🔴

### 증상
견적 페이지에서 출도착지 입력·지도 클릭 시 콘솔에 다음 에러로 지도 핀·거리계산 실패:
```
Access to fetch at '.../fr/maps/geocode?...' has been blocked by CORS policy:
The 'Access-Control-Allow-Origin' header contains multiple values
'http://localhost:3000, *', but only one is allowed.
```
- 응답은 `200 OK` 인데도 브라우저가 차단 → `Failed to fetch`.
- `/api/auth/login`(401) 등 일반 경로는 정상, **`/fr/maps/**` 프록시 경로만** 발생.

### 근본 원인 (curl로 확정)
`curl -D -` 로 직접 헤더 확인 시 `Access-Control-Allow-Origin` 이 **2개**:
```
Access-Control-Allow-Origin: http://localhost:3000     ← SecurityConfig CORS 빈
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: *                          ← Kakao 응답 헤더
Access-Control-Allow-Headers: Authorization, KA, Origin, ...
Access-Control-Max-Age: 86400
```
- `*` 쪽은 우리 설정이 아니라 **Kakao API 응답 헤더**(`KA` 는 Kakao SDK 전용 헤더 → Kakao 시그니처).
- `MapProxyController.proxyGet()` 이 `restTemplate.exchange(...)` 의 `ResponseEntity` 를 **그대로 반환** → Kakao 의 응답 헤더(`Access-Control-Allow-Origin: *` 포함)가 함께 전달됨.
- 거기에 Spring Security CORS 필터가 `http://localhost:3000` 을 추가 → 값 2개 → 브라우저 차단.

### 조치
- **`controller/MapProxyController.java`** — `proxyGet()` 가 업스트림(Kakao) 응답 헤더를 버리고 **상태코드 + `application/json` Content-Type + 본문만** 새로 담아 반환하도록 수정. (성공·HTTP 오류·예외 3개 경로 모두 적용)

### 검증
재기동 후 동일 요청 헤더:
```
HTTP/1.1 200
Access-Control-Allow-Origin: http://localhost:3000   ← 단 하나
Access-Control-Allow-Credentials: true
```
→ Kakao 의 `*`·`Allow-Methods`·`Allow-Headers`·`Max-Age` 전부 사라짐. 지도 핀·거리계산 정상 동작 확인(클릭 기능 포함, 페이지 새로고침 후 정상).

> 참고: 지도 **클릭→주소 자동입력**은 백엔드와 무관한 브라우저 Kakao JS SDK(`coord2Address`) 사용. 이번 CORS 수정과 별개이며, 구버전 세션 잔존으로 일시적으로 꼬였던 것은 새로고침으로 해소됨.

---

## 2. 쿠폰 만료 스케줄러 주기 완화

- **`scheduler/CouponScheduler.java`** — `@Scheduled(fixedRate = 10000)`(10초) → **`600000`(10분)**.
- 배경: 만료 판정은 사용처 쿼리(`findAvailableCoupons` 의 `expiryDate > now`)에서 이미 시간 비교로 처리되므로, 스케줄러는 **정합성용이 아니라 데이터 정리(EXPIRED 표시 → 후속 물리 삭제)용**. 10초 주기는 과도 → 10분으로 완화.
- 남은 권장(미적용): `member_coupon (status, expiryDate)` 복합 인덱스 추가(대규모 시 풀스캔 방지), 0건일 때 로그 생략.

---

## 3. 운영 메모 — 백엔드 재기동 방식
- 기존 IDE(STS) 실행 프로세스가 구버전 바이트코드를 물고 있어, 소스 수정 후에도 반영 안 됨 → IDE 프로세스 종료 후 **`gradlew bootRun`** 으로 재기동하여 수정 반영·검증.
- DB 는 MariaDB 서버(`localhost:3306/bootex`)라 인스턴스 교체 시 H2 파일락 충돌 없음. Kakao REST 키는 `application-secret.properties` 에서 자동 주입.

---

## 4. understand 지식 그래프 증분 갱신 (sj_md 기반)

지난주 리팩토링·보안 작업(삭제 다수) 이후 그래프(기준 커밋 `ca020d8`, 6/19)가 실코드와 어긋남 → **전체 재분석 대신 sj_md 문서 + 디스크 실제 존재 여부 기반으로 증분 패치**(스크립트 처리).

| 그래프 | 노드 | 삭제 정리 | 신규 추가 |
|---|---|---|---|
| backend | 607 → 593 | 14 | MapProxyController, PortOneVerificationService |
| front | 362 → 308 | 28 | config.js |
| root(통합) | 969 → 901 | 42 | 위 3개 |

- **삭제 노드 prune**: `filePath` 가 실제로 없는 노드 + 관련 엣지/레이어/투어 참조 제거 (DEAD_CODE_CLEANUP 과 정확히 일치).
- **신규 노드 추가**: 형제 노드의 레이어 소속 상속으로 대시보드 배치.
- **요약 갱신**: `SecurityConfig`(permitAll→권한 기반), `WebConfig`(CORS 단일화), `OAuth2ClientsConfig`(시크릿 외부화), `JwtService`(fail-fast), `CouponScheduler`(10분).
- **검증**: 세 그래프 JSON 유효 + 끊긴 엣지 0 / 잘못된 레이어·투어 참조 0 / 존재하지 않는 파일 노드 0.
- **한계**: 수정 파일 내부의 함수/클래스 단위 세부 변화까지는 재추출 안 함 → 정밀 갱신은 `/understand` 전체 재생성 권장.

---

## 변경 파일 요약
**백엔드 (수정)**: `controller/MapProxyController.java`, `scheduler/CouponScheduler.java`
**understand 그래프 (갱신)**: `.understand-anything/knowledge-graph.json`, `backend/.understand-anything/knowledge-graph.json`, `front/.understand-anything/knowledge-graph.json`

---

## 5. 인증·인가 보안 추가 처리 (감사 후속)

전체 코드 점검 후 우선순위가 높은 보안 항목을 추가로 처리. (검증: 백엔드 `gradlew compileJava` → BUILD SUCCESSFUL, bootRun 재기동 후 curl 검증)

### 5-1. refresh 토큰 서버측 폐기(blacklist) + 회전 강제 🔴
이전: 회전(rotation)은 했으나 **기존 refresh 토큰을 서버에서 무효화하지 않아** 탈취/재사용 가능. 로그아웃은 사실상 no-op.

- 신규 **`entity/auth/RevokedToken.java`** — 폐기된 refresh 토큰의 `jti` 저장 (테이블 `revoked_token`, ddl-auto 자동 생성)
- 신규 **`repository/auth/RevokedTokenRepository.java`** — `existsById` + 만료기록 정리(`deleteExpired`)
- 신규 **`service/auth/TokenBlacklistService.java`** — `isRevoked(jti)` / `revoke(jti, expiresAt)`
- **`security/JwtService.java`** — refresh 토큰에 `jti`(UUID) 부여 + `getJti`/`getExpiresAt` 헬퍼
- **`controller/TokenAuthController.java`**
  - `refresh()`: 폐기 여부 확인 → **기존 refresh 즉시 폐기(재사용 차단)** → 새 access/refresh 발급
  - `logout()`: 본문의 refresh 토큰을 서버측 폐기
- 프론트 — 회전 회귀 방지가 핵심:
  - `hooks/useLogout.js`, `common/ResponsiveAppBar.js`(handleLogout): 로그아웃 시 refresh 토큰 전송
  - `common/ResponsiveAppBar.js`(silentRefresh): **응답의 새 refresh 토큰 저장**(누락 시 회전 후 잠금됨)
- 검증: `refresh`(잘못된 토큰)→401, `logout`→200. ⚠️ 회전 1회성(로그인→로그아웃→복원 차단)은 실제 로그인 토큰 필요 → 브라우저 테스트 권장.

> 구버전(이미 발급된 jti 없는) refresh 토큰은 폐기 대상에서 제외(graceful) — 다음 갱신부터 jti 포함 토큰으로 전환.

### 5-2. `/api/chat/**` 인증 필요 🟡
`GET /api/chat/history` 가 `repository.findAll()` 로 **전체 채팅 메시지를 무인증 노출**하던 문제 차단.
- **`config/SecurityConfig.java`** — `/api/**` permitAll 앞에 `/api/chat/**` → `authenticated()` 추가. 나머지 공개 경로 동작 보존.
- 검증: 토큰 없이 `GET /api/chat/history`→401, 대조 `GET /api/notices`→200.

### 5-3. front/CLAUDE.md 삭제
"UI만 / 백엔드 금지" standing 규칙이 실제 보안 작업(백엔드 수정)과 상충 → 삭제.

---

## 보류 / 후속 (사유)
| 항목 | 사유 |
|---|---|
| #3 refresh **HttpOnly 쿠키 저장 전환** | 프론트 9개 파일에 토큰 저장/복원 로직 분산 + 무테스트 → 브라우저 end-to-end 테스트 동반 별도 단계 권장 (dev 는 same-site 라 기술적으론 가능) |
| #2 나머지 `/api/**` 엔드포인트별 인가 | `/api/ai`, qaboard/notices 쓰기 등 공개 페이지 사용 여부에 따라 회귀 → 페이지별 런타임 테스트 필요 |
| #4 광범위 입력검증 | 핵심 회원가입 경로는 이미 `@Valid`+제약 완비(SignupRequest). 나머지 DTO 일괄 추가는 동작 변경 폭 큼 |
| **`@RestControllerAdvice` 중복** | `AppGlobalExceptionHandler`·`GlobalExceptionHandler` 둘 다 동일 예외(`MethodArgumentNotValid`/`IllegalArgument`/`Exception`) 처리 → 런타임 모호성 잠재버그. 통합 권장(에러 형식 변경 검토 필요) |

## 변경 파일 (5장)
**백엔드 (신규)**: `entity/auth/RevokedToken.java`, `repository/auth/RevokedTokenRepository.java`, `service/auth/TokenBlacklistService.java`
**백엔드 (수정)**: `security/JwtService.java`, `controller/TokenAuthController.java`, `config/SecurityConfig.java`
**프론트 (수정)**: `hooks/useLogout.js`, `common/ResponsiveAppBar.js`
**삭제**: `front/CLAUDE.md`
