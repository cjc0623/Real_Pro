# 액세스 토큰 자동 재발급 연결 — 설계

작성일: 2026-07-15

## 배경

- 백엔드 `TokenAuthController`에 `/api/auth/refresh`(리프레시 토큰 회전 + 기존 토큰 폐기)가 구현돼 있으나, 프론트엔드 어디에서도 호출하지 않는다.
- 결과: 액세스 토큰(30분) 만료 시 자동 재발급이 없어 사용자가 사실상 재로그인해야 한다.
- 리프레시 토큰은 `sessionStorage`에 저장되며 현재는 로그아웃 시 서버측 폐기 용도로만 쓰인다.

## 목표

401(Unauthorized) 응답이 나면 리프레시 토큰으로 새 액세스 토큰을 자동 발급받아 원 요청을 재시도한다. 앱의 모든 인증 요청 경로를 커버한다.

## 프론트 HTTP 호출 3갈래 (커버 대상)

1. 전역 `axios`(bare 호출) — `api/axiosSetup.js`의 전역 인터셉터가 커버
2. 패치된 `window.fetch` — `api/axiosSetup.js`가 monkey-patch로 커버
3. `axios.create()` 인스턴스 8개 — 각 파일이 자체 request 인터셉터로 토큰을 부착 (전역 인터셉터 미상속)

선택한 방식: **전체 커버 + 기존 구조 유지.** 공용 코어 하나를 만들고, 전역 axios·fetch에 연결, 8개 create 인스턴스에는 응답 인터셉터를 한 줄씩 등록한다.

## 구성 요소

### ① `front/src/lib/tokenRefresh.js` (신규) — 공용 코어

- `refreshAccessToken()`: `sessionStorage`의 refreshToken으로 `POST /api/auth/refresh` 호출 → 응답의 `accessToken`·`refreshToken`을 둘 다 저장(회전 반영) → 새 access 반환.
  - **인터셉터가 없는 전용 axios 인스턴스**(`refreshClient`)로 호출해 무한루프 차단.
  - **single-flight**: 동시에 여러 요청이 401을 맞아도 `inflight` 프로미스 하나를 공유해 재발급은 한 번만.
  - 재발급 실패(리프레시 만료·폐기) 시 토큰 전부 삭제 후 `/login?error=session_expired`로 이동(이미 로그인 페이지면 이동 안 함).
- `attachRefreshInterceptor(instance)`: 주어진 axios 인스턴스에 응답 인터셉터를 등록. 401이면 `refreshAccessToken()` 호출 후 원 요청을 새 토큰으로 1회 재시도.
- `isAuthEndpoint(url)`: `/api/auth/login`·`/api/auth/refresh`·`/api/auth/logout`은 재시도 대상에서 제외(자기 자신 재시도 방지).

### ② `front/src/api/axiosSetup.js` (수정) — 전역 axios + fetch 연결

- 전역 `axios`에 `attachRefreshInterceptor(axios)` 적용.
- 패치된 `fetch`: 응답이 401이면 `refreshAccessToken()` 호출 후 새 토큰으로 fetch 1회 재시도(`__retried` 가드).

### ③ 8개 create 인스턴스 (수정) — 한 줄씩 등록

각 파일의 `api.interceptors.request.use(...)` 아래에 `attachRefreshInterceptor(api);` 추가.

대상:
- `front/src/common/Sidebar.js`
- `front/src/api/ownerApi/ownerMetricsApi.js`
- `front/src/api/qnaApi/qnaApi.js`
- `front/src/layout/component/mypage/DeliveryInform.js`
- `front/src/layout/component/mypage/EditMyInform.js`
- `front/src/layout/component/mypage/EditVehicleInform.js`
- `front/src/layout/component/mypage/MyInform.js`
- `front/src/layout/component/admin/AdminCargoApproval.js`

## 동작 규칙

- **401에서만** 재발급 (403은 권한 문제라 제외).
- **제외 경로**: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`.
- 요청당 **재시도 1회**(`_retried` / `__retried` 플래그) → 무한루프 방지.
- refreshToken 없으면 재발급 시도 없이 로그인 이동.
- 동시 401은 single-flight로 재발급 1회 공유.
- 회전(rotation): 응답의 새 accessToken·refreshToken을 모두 저장.
- 재발급 실패 시 토큰 정리 후 `/login` 이동.

## 검증

- `front`에서 `npm run build`로 컴파일·문법 확인.
- 로직 트레이스: 401→refresh→재시도 / single-flight 동시성 / 회전 저장 / 실패 리다이렉트 경로.
- (가능 시) 백엔드 기동 후 액세스 토큰 만료 재현 e2e.

## 비목표 (YAGNI)

- 레거시 `JWTUtil`/`JwtTokenUtils`(하드코딩 키) 시스템 통합 — 이번 범위 밖.
- 액세스 토큰 만료를 미리 예측해 선제 갱신 — 반응형(401 기반)으로 충분.
