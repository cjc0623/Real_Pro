# 리팩토링 2차 — 남은 항목 (안전 범위 처리)

> 작성일: 2026-06-19
> 검증: 백엔드 `gradlew compileJava` → **BUILD SUCCESSFUL** / 프론트 `npm run build` → **Compiled (no error)**

---

## ✅ 처리 완료

### 1. 백엔드 예외 표준화 (잘못된 500 → 올바른 4xx)
`throw new RuntimeException("...")` 중 **인증/권한/비즈니스 규칙 위반**(현재 전부 500으로 떨어지던 것)을 의미에 맞는 상태코드로 교정. 총 **23건**.
- "로그인이 필요합니다" → `401 UNAUTHORIZED`
- "관리자 권한이 필요합니다" → `403 FORBIDDEN`
- 비즈니스 규칙("이미 처리된", "본인만", "최대 5명", "승인된 차량 없음" 등) → `400 BAD_REQUEST`
- 대상 파일: `NoticeController`(3), `QABoardController`(6), `DirectRequestServiceImpl`(8), `EstimateServiceImpl`(2), `MatchingServiceImpl`(3)
- `GlobalExceptionHandler`에 `ResponseStatusException` 핸들러가 이미 있어 **응답 형태(`{status,error,message}`)·메시지 그대로 유지** → 프론트 호환
- **내부 오류성**(`"…실패", e` / 메일·이미지 저장 / 토큰 NULL 등)은 500이 올바르므로 **그대로 유지**

### 2. 프론트 `API_SERVER_HOST` 중복 통합
- `api/serverConfig.js` → `config.js`의 `API_BASE`에서 파생(단일 소스화)
- `couponApi.js`·`qaboardApi.js`의 로컬 재정의 제거 → `serverConfig`에서 import
- (1차의 `API_BASE` 통합과 합쳐 프론트 베이스 URL 정의가 **`config.js` 한 곳**으로 수렴)

### 3. `RequireAuth.js` 개선
- `pickToken` 중복 폴백(accessToken×2, ACCESS_TOKEN×2) 정리
- 인증 확인 중 `return null`(빈 화면 깜빡임) → **MUI `CircularProgress` 로딩 표시**

---

## ⏸️ 보류 — 무테스트 적용 시 회귀 위험 (단계별 권장)

| 항목 | 사유 | 권장 방식 |
|---|---|---|
| **중앙 axios 인스턴스 + 인터셉터** 전면 적용 | 60+ 호출처가 직접 axios/fetch·수동 헤더 사용. 일괄 전환 시 토큰 중복부착/요청 동작 변화 | 신규 코드부터 인스턴스 사용, 기존은 점진 이관 |
| **`Map` 응답 → DTO** (25곳) | 프론트가 정확한 JSON 키에 의존 → 동시 변경+테스트 필요 | 엔드포인트 단위로 짝지어 변경 |
| **거대 컴포넌트/서비스 분할** (1000줄+) | 동작 보존 리팩터라 화면별 회귀 테스트 필수 | 파일 1개씩 추출+수동 확인 |
| **데이터 패칭 → TanStack Query** | 신규 의존성 + 63파일 재작성 + 테스트 | 신규/핫 화면부터 도입 |
| **`alert()` 141개 → Snackbar** | 전역 Provider + 141개 호출처 UX 변경 | 화면 그룹 단위로 점진 교체 |

이들은 "한 번에 일괄"보다 **모듈/화면 단위로 나눠 각 단계 후 실제 동작 확인**이 안전합니다. 원하시는 모듈을 지정해 주시면 그 단위로 테스트와 함께 진행하겠습니다.

---

## 검증
- 백엔드 `gradlew compileJava` → **BUILD SUCCESSFUL**
- 프론트 `npm run build` → **에러 0** (경고만)

## 변경 파일
**백엔드**: `controller/noboard/NoticeController.java`, `controller/qaboard/QABoardController.java`, `service/directrequest/DirectRequestServiceImpl.java`, `service/estimate/EstimateServiceImpl.java`, `service/estimate/matching/MatchingServiceImpl.java`
**프론트**: `api/serverConfig.js`, `api/couponApi/couponApi.js`, `api/qaboardApi.js`, `layout/component/auth/RequireAuth.js`
