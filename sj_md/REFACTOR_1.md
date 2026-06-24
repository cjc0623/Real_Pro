# 리팩토링 1차 — 추천 우선 항목 (버그 수정 + config 통합)

> 작성일: 2026-06-19
> 검증: 프론트 `npm run build` → **Compiled (warnings only, no error)**

---

## 1. 명확한 버그 수정

### `src/lib/tokenStore.js`
- **`save()`** — `persist` 분기 if/else가 완전히 동일하던 死코드 제거. `sessionStorage` 단일 저장으로 정리(파라미터 제거).
- **`clear()`** — 동일 키(`accessToken`/`refreshToken`)를 2번씩 지우던 중복 제거.

### `src/pages/QuotationRequestPage.js`
- 토큰 탐색 폴백에서 **`localStorage.getItem('accessToken')` 제거** — 토큰은 `sessionStorage`에만 저장되므로 항상 `null`인 잘못된(오해 유발) 폴백이었음.

---

## 2. 프론트 `API_BASE` 중복 정의 통합

이전: 30여 개 파일이 각자 `const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080'` 를 **중복 정의**.

- 신규 **`src/config.js`** — `export const API_BASE = ...` 단일 소스
- 표준 패턴을 쓰던 **29개 파일**을 `import { API_BASE } from '.../config'` 로 자동 치환(동일 값이라 동작 변화 없음)
- 비표준(복합식 `Sidebar.js`, 별도 상수명 `API_SERVER_HOST` 류 `couponApi.js`/`qaboardApi.js`/`serverConfig.js`)은 안전상 제외 — 후속 통합 후보

---

## 검증
- `npm run build` → **에러 0** (경고만)

## 남은 리팩토링 후보 (다음 순위)
- `API_SERVER_HOST` 계열도 `config.js`로 통합, **중앙 axios 인스턴스 + 인터셉터**(토큰 부착·401 처리) 도입
- 백엔드 예외 표준화(`RuntimeException` 37곳 → 도메인 예외), `Map` 응답 → DTO
- 거대 컴포넌트/서비스 분할(`ReceivedReviewInform` 1156줄, `ReviewServiceImpl` 850줄 등)
- 데이터 패칭 표준화(TanStack Query), `alert()` 141개 → Snackbar
- `RequireAuth` 마운트마다 네트워크 호출/미재검증 개선
