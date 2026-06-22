# 알림(Notification) 기능 — 계획 & 수정안

작성일: 2026-06-18
대상: `backend/` (Spring Boot) + `front/` (React)
요약: 역할별 "확인 필요" 알림을 **헤더 아바타 통합 빨간점 + 사이드바 메뉴별 빨간점**으로 표시. 본 문서는
**초기 계획 → 현재 구현 → 현 문제점 → 신규 명세 → 추가 예정 작업** 순으로 정리한다.

---

## 0. 목표

- 헤더 프로필 아바타에 **통합 빨간점**(행동필요형이 하나라도 있으면 ON). 아바타 클릭 = **마이페이지 직행**.
- 무슨 알림인지는 **해당 사이드바 메뉴(배송 정보 관리/직접요청 수신함/차량 승인 관리/문의사항 등)에 빨간점**으로 안내.
- **역할(화주/차주/관리자)별로 서로 다른 신호**를 본다.

> **표시 방식 변천(2026-06-18):**
> ① 개수 뱃지 → ② 빨간점 + 드롭다운 → ③ **드롭다운 폐기 → 통합 점(헤더) + 맥락 점(사이드바 메뉴).**
> **빨간점은 '행동 필요형' 신호로만 켠다**(아래 §4·§5). 행동을 처리하면 데이터에서 빠져 점이
> 자동으로 꺼지므로, 사용자별 read-state 저장이 **현재는 불필요**.
> 누적/정보형 신호(받은 리뷰·배송완료·승인된 차량)는 **점을 켜지 않음**(드롭다운도 없으므로 미표시).
> ※ read-state(확인하면 사라지는 알림)는 §9에서 **추가 예정**.

---

## 1. 초기 계획 (이번 세션에서 합의/구현한 것)

| 항목 | 결정 |
|---|---|
| 표시 위치 | **헤더 아바타 통합 점(→마이페이지 Link)** + **사이드바 메뉴별 점** (드롭다운 폐기) |
| 집계 방식 | **백엔드 카운트 API 신설** (`GET /fr/notifications/summary`) — 역할별 1회 호출 |
| 응답 형태 | `{ hasAlert, total, role, items: { key: count, ... } }` |
| 갱신 시점 | 로그인/새로고침/계정 전환 시 조회 (실시간 폴링·푸시는 미적용 → §9) |
| 권한 | SecurityConfig의 `anyRequest().authenticated()` 적용(별도 permitAll 없음) |

---

## 2. 현재 구현 상태 (AS-IS) — §4 명세 + 통합점/메뉴점까지 **구현 완료**

### 백엔드 (구현 완료)
- 신규: [NotificationController](backend/src/main/java/com/giproject/controller/notification/NotificationController.java)
  (`GET /fr/notifications/summary`), [NotificationServiceImpl](backend/src/main/java/com/giproject/service/notification/NotificationServiceImpl.java),
  [NotificationSummaryDTO](backend/src/main/java/com/giproject/dto/notification/NotificationSummaryDTO.java) (`hasAlert` 포함)
- 역할 판별: `authentication.getAuthorities()` 기준 `ROLE_ADMIN` → `ROLE_DRIVER` → `ROLE_SHIPPER` 순
  (관리자는 화주 권한도 겸하므로 ADMIN을 먼저 검사) / `loginId = auth.getName()` = 화주 memId·차주 cargoId
- 레포지토리 카운트 (전부 구현됨):
  - `DeliveryRepository.countByCargoOwner_CargoIdAndStatus(PENDING)` (차주 배송 시작 대기 🔴, 기존)
  - `DirectRequestRepository.countByCargoOwner_CargoIdAndStatus(REQUESTED)` (차주 직접요청 🔴)
  - `ReviewRepository.countByTargetCargoId` (차주 받은 리뷰 ℹ️)
  - `CargoRepository.countByCargoOwner_CargoIdAndStatus("APPROVED")` (차주 승인 차량 ℹ️)
  - `MatchingRepository.countAcceptedAwaitingPaymentByMember` (화주 수락·결제전 🔴)
  - `DeliveryRepository.countByMemberAndStatus(COMPLETED)` (화주 배송완료 ℹ️, JPQL)
  - `QAPostRepository.countUnansweredInquiries` (관리자 미답변 문의 🔴, LEFT JOIN JPQL)
  - `CargoRepository.countByStatus("PENDING")` (관리자 차량 승인 대기 🔴)
  - `UserReportService.countUnread` (관리자 미확인 신고 🔴, 기존)
- `hasAlert = 행동필요형(🔴) 합계 > 0`, `total = items 전체 합`(참고용).

### items 키 (역할별)
| 역할 | 🔴 행동필요(점) | ℹ️ 정보(점 없음) |
|---|---|---|
| ADMIN | `unreadReports`, `unansweredInquiries`, `pendingVehicleApprovals` | — |
| DRIVER | `deliveryToStart`, `pendingDirectRequests` | `receivedReviews`, `approvedVehicles` |
| SHIPPER | `acceptedAwaitingPayment` | `deliveryCompleted` |

### 프론트 (구현 완료)
- [api/notificationApi.js](front/src/api/notificationApi.js) — `getNotificationSummary()`
- [hooks/useNotificationSummary.js](front/src/hooks/useNotificationSummary.js) — **공용 훅**(헤더·사이드바 공유).
  `{ hasAlert, items, refresh }` 반환. 로그인/`memberId` 변경 시 재조회.
- [common/ResponsiveAppBar.js](front/src/common/ResponsiveAppBar.js) — 아바타 = **마이페이지 `Link`** +
  `Badge variant="dot" invisible={!hasAlert}` (통합 점). **드롭다운 제거됨.**
- [common/Sidebar.js](front/src/common/Sidebar.js) — "배송 정보 관리"(deliveryToStart/acceptedAwaitingPayment),
  "직접요청 수신함"(pendingDirectRequests)에 메뉴 점.
- [common/AdminSidebar.js](front/src/common/AdminSidebar.js) — "차량 승인 관리"(pendingVehicleApprovals),
  "문의사항"(unansweredInquiries)에 점. "신고내역"은 기존 카운트 뱃지(폴링+이벤트) 유지.

### 데이터 검증 (DB 실측, 2026-06-18)
| 계정 | 역할 | hasAlert | items |
|---|---|---|---|
| admin | ADMIN | true | 미답변 문의 30 |
| test1 / seojunwon19 | SHIPPER | true | 견적의뢰 진행 1 |
| test2 | DRIVER | **false** | 승인 차량 4(ℹ️) → 점 안 켜짐 |

→ **역할 분기·hasAlert 정상.** test2는 행동필요형 0이라 통합 점 OFF, 정보형(승인 차량 4)만 보유.

---

## 3. 현 문제점 (Issues)

1. **[수정완료] 관리자 미답변 문의 카운트 런타임 오류 위험**
   `QAPost.adminResponse`가 역방향 매핑(`mappedBy="qaPost"`)이라 파생쿼리 `countByAdminResponseIsNull()`은
   역방향 1:1에서 부정확할 수 있었음 → `LEFT JOIN p.adminResponse a WHERE a IS NULL` 명시 JPQL로 교체.
2. **[수정완료] 계정 전환 시 미갱신 위험**
   프론트 재조회 의존성에 `loginState.memberId` 추가 → 역할 전환 시 항상 재조회.
3. **[운영 주의] 백엔드 재시작 필요**
   알림 카운트는 백엔드 코드 → 새 빌드/재시작 후에만 반영됨.
4. **[해결] 누적-상태형 신호의 점 부적합성**
   "받은 리뷰 / 배송완료 / 승인된 차량"은 줄지 않는 누적 상태 → **점은 행동필요형(🔴)만 켜고
   정보형(ℹ️)은 점에서 제외**하여 해결. (read-state로 정보형도 다루는 건 §9에서 추가 예정.)
5. **[미적용] 실시간성** → §9
   현재는 로그인/새로고침/계정 전환 시 1회 조회. 세션 중 새 알림은 즉시 반영 안 됨(폴링/포커스 재조회/푸시 필요).
6. **[미적용] read-state(확인하면 사라지는 알림)** → §9
   지금 점은 "건수 > 0" 기준이라, 데이터가 처리돼야만 꺼짐. "보면 꺼지고 새 것 오면 다시 켜짐"은 미구현.
7. **[발견] 로그인 연속 전환 시 토큰/Redux 불일치** → §9
   알림이 드러낸 인증 흐름 문제. 토큰(sessionStorage)과 Redux 상태가 계정 전환 시 따로 놀 수 있음.

---

## 4. 신규 명세 (TO-BE) — 역할별 알림 항목

> 사용자 요청: 아래 항목들로 재구성.

> **점 트리거** 열: 🔴 = 빨간점을 켜는 '행동 필요형'(처리하면 자동으로 꺼짐) / ℹ️ = 드롭다운에만 표시하는 '정보형'(점 안 켬).

### 4.1 차주 (DRIVER, loginId = cargoId)
| 알림 항목 | 점 트리거 | 정의 | 데이터 소스 | 상태 |
|---|---|---|---|---|
| 배송 시작 대기(결제 후 시작 전) | 🔴 | 화주 결제 완료됐고 아직 배송 시작 전 (Delivery `PENDING`) | `deliveryRepository.countByCargoOwner_CargoIdAndStatus(cargoId, PENDING)` | ✅ 메서드 존재(기존 `deliveryToStart`) |
| 받은 리뷰 수 | ℹ️ | 나에게 작성된 리뷰 (`Review.targetCargoId = cargoId`) | `reviewRepository.countByTargetCargoId(cargoId)` | ⚠️ 메서드 추가 |
| 직접요청 수신 수 | 🔴 | 받은 직접요청 중 응답대기(`REQUESTED`) | `directRequestRepository.countByCargoOwner_CargoIdAndStatus(cargoId, REQUESTED)` | ✅ 추가완료 |
| 승인된 내 차량 수 | ℹ️ | 등록 후 관리자 승인된 차량 (`Cargo.status = "APPROVED"`) | `cargoRepository.countByCargoOwner_CargoIdAndStatus(cargoId, "APPROVED")` | ⚠️ 메서드 추가 |

> 결정(§5-2): 배송중(IN_TRANSIT)은 알림 제외. 화주 결제 직후 = `PENDING`(배송 시작 전)일 때만 차주에게 알림.
> Delivery 상태 = `PENDING`(배송전·결제후) / `IN_TRANSIT`(배송중) / `COMPLETED`(완료).

### 4.2 화주 (SHIPPER, loginId = memId)
| 알림 항목 | 점 트리거 | 정의 | 데이터 소스 | 상태 |
|---|---|---|---|---|
| 견적의뢰 진행 사항 수 | 🔴 | 견적 올리고 차주가 수락했으나 **결제 전**인 건 | `matchingRepository.countAcceptedAwaitingPaymentByMember(memId)` | ✅ 추가완료(기존 `acceptedAwaitingPayment`) |
| 배송완료된 화물 수 | ℹ️ | 내 화물 중 배송완료 (Delivery `COMPLETED`, member=나) | `DeliveryRepository` member+status count JPQL | ⚠️ 메서드 추가 |

> 결정(§5-3): "견적의뢰 진행 사항" = 수락됐고 결제 전 = 기존 `acceptedAwaitingPayment` **그대로 사용**(별도 추가 불필요).

### 4.3 관리자 (ADMIN)
| 알림 항목 | 점 트리거 | 정의 | 데이터 소스 | 상태 |
|---|---|---|---|---|
| 문의사항 미답변 수 | 🔴 | QAPost 중 관리자 답변 없음 | `qaPostRepository.countUnansweredInquiries()` | ✅ 완료 |
| 차량 승인 대기 수 | 🔴 | 승인 대기 차량 (`Cargo.status = "PENDING"`) | `cargoRepository.countByStatus("PENDING")` | ⚠️ 메서드 추가 |
| 신고내역(미확인) 수 | 🔴 | 미확인 신고 (`UserReport.admin_read = false`) | `userReportService.countUnread()` | ✅ 완료 |

> 🔴 항목 중 하나라도 1건 이상이면 아바타에 빨간점 ON. ℹ️ 항목은 점에 영향 없이 드롭다운에만 표시.
> 🔴 항목은 모두 "처리하면 자동으로 빠지는" 상태(결제/응답/처리 시 카운트 0 → 점 꺼짐)라 read-state 불필요.

---

## 5. 결정 사항

1. **[결정완료] 누적-상태 신호 처리 + 표시 방식** (2026-06-18)
   - 표시: **개수 뱃지 → 빨간점**(확인 필요 여부 불리언).
   - **빨간점은 '행동 필요형'(🔴)만 켠다** → 처리 시 자동으로 꺼짐 → **read-state 불필요**.
   - 누적/정보형(받은 리뷰·배송완료·승인된 차량)은 **점을 안 켜고 드롭다운에만**(ℹ️) 표시.
   - 효과: last-seen 저장 테이블/마이그레이션 불필요, v1 바로 구현 가능.
2. **[결정완료] 차주 "배송" 신호** (2026-06-18): 배송중(IN_TRANSIT) 제외, **결제 후 시작 전(`PENDING`)만** 🔴.
   → 기존 `deliveryToStart`(PENDING) 그대로 사용.
3. **[결정완료] 화주 "견적의뢰 진행" 정의** (2026-06-18): 견적 올리고 **수락됐으나 결제 전**만 🔴.
   → 기존 `acceptedAwaitingPayment` 그대로 사용(별도 추가 불필요).

---

## 6. 수정 계획 (구현 단계)

### 6.1 백엔드 — 레포지토리 카운트 메서드 추가
| 파일 | 추가 메서드 |
|---|---|
| `repository/review/ReviewRepository` | `long countByTargetCargoId(String cargoId)` |
| `repository/cargo/CargoRepository` | `long countByCargoOwner_CargoIdAndStatus(String cargoId, String status)`, `long countByStatus(String status)` |
| `repository/delivery/DeliveryRepository` | 화주 완료 카운트 JPQL: `countCompletedByMember(memId)` (member + `COMPLETED`) — ℹ️ |
| `repository/matching/DirectRequestRepository` | (완료) `countByCargoOwner_CargoIdAndStatus` |
| `repository/matching/MatchingRepository` | (완료) `countAcceptedAwaitingPaymentByMember` — 화주 🔴 그대로 사용 |
| `repository/qaboard/QAPostRepository` | (완료) `countUnansweredInquiries` |

> EstimateRepository 추가 불필요(화주 🔴는 기존 Matching 카운트 재사용). DeliveryRepository의
> `countByCargoOwner_CargoIdAndStatus`(PENDING)도 기존 메서드 재사용.

### 6.2 백엔드 — 응답 형태 & NotificationServiceImpl 재구성
- 응답 DTO에 **`hasAlert`(빨간점 ON 여부, boolean)** 추가. `total` 숫자는 더 이상 뱃지에 안 쓰지만,
  드롭다운 정보용으로 items의 개별 count는 유지.
  ```json
  { "hasAlert": true, "role": "DRIVER",
    "items": { "deliveryToStart": 2, "receivedReviews": 5, "pendingDirectRequests": 1, "approvedVehicles": 3 } }
  ```
- `hasAlert = (행동필요형(🔴) 항목 중 하나라도 > 0)`. 정보형(ℹ️)은 hasAlert에 **반영 안 함**.
- DRIVER 분기:
  🔴 `deliveryToStart`(Delivery PENDING, 기존) + 🔴 `pendingDirectRequests`(REQUESTED, 기존)
  + ℹ️ `receivedReviews`(countByTargetCargoId) + ℹ️ `approvedVehicles`(Cargo APPROVED)
- SHIPPER 분기:
  🔴 `acceptedAwaitingPayment`(수락·결제전, 기존) + ℹ️ `deliveryCompleted`(Delivery COMPLETED, member=나)
- ADMIN 분기:
  🔴 `unansweredInquiries`(기존) + 🔴 `pendingVehicleApprovals`(Cargo PENDING) + 🔴 `unreadReports`(기존)

### 6.3 프론트 — 통합 점 + 메뉴 점 (드롭다운 폐기, **구현 완료**)
- 공용 훅 [useNotificationSummary](front/src/hooks/useNotificationSummary.js): `{ hasAlert, items, refresh }`.
- 헤더 아바타: `Link → 마이페이지` + `Badge variant="dot" invisible={!hasAlert}` (통합 점).
- 사이드바 메뉴 점 — 🔴 행동필요형이 `items[key] > 0`일 때 해당 메뉴 우측에 빨간점:
| 메뉴 | 트리거 items 키 | 위치 |
|---|---|---|
| 배송 정보 관리 | `deliveryToStart`(차주) / `acceptedAwaitingPayment`(화주) | mypage Sidebar |
| 직접요청 수신함 | `pendingDirectRequests`(차주) | mypage Sidebar |
| 차량 승인 관리 | `pendingVehicleApprovals` | AdminSidebar |
| 문의사항 | `unansweredInquiries` | AdminSidebar |
| 신고내역 | (기존 `fetchUnreadCount` 카운트 뱃지 유지) | AdminSidebar |

> ℹ️ 정보형(`receivedReviews`/`approvedVehicles`/`deliveryCompleted`)은 점 없음. read-state 도입(§9) 시 재논의.

### 6.4 검증
| 항목 | 목표 |
|---|---|
| 백엔드 `compileJava` | 통과 |
| 프론트 `eslint` | 에러 0 |
| 역할별 응답 | admin/shipper/driver 각각 명세대로 다른 items 반환 |
| DB 실측 대조 | 각 카운트가 DB 쿼리 결과와 일치 |

---

## 7. 적용/배포 참고
- 백엔드 변경 → **재빌드·재시작** 후 반영.
- 누적-상태(B안) 채택 시 last-seen 저장 스키마 추가 → 마이그레이션 필요.
- 실시간 갱신이 필요하면 폴링(간단) 또는 SSE/WebSocket(고급)을 별도 과제로.

---

## 8. 고민사항 — "확인하면 꺼지는 알림 + 다시 보는 알림 모달" (검토 중)

> 제안: 정보형/행동형 구분을 **없애고 하나의 통합 알림 목록**으로 합치고, **"확인하면 빨간점이
> 사라지는"** read-state를 도입. 점이 꺼진 뒤에도 **알림 모달을 다시 열어 무슨 알림이 있었는지**
> 볼 수 있게 한다.

### 8.1 핵심 아이디어
- **빨간점** = "마지막으로 확인한 뒤로 **새로 생긴 알림이 있다**" (개수 아님, 신규 여부).
- **알림 모달/드롭다운 열기 = '확인함'** 처리 → 빨간점 사라짐.
- 모달은 언제든 다시 열 수 있어 **점이 꺼진 뒤에도 현재 알림 목록을 재확인** 가능.
- 예: 받은 리뷰 5→6 → 점 ON, 열어보면 OFF, 다음에 또 늘면 다시 ON.

### 8.2 이 방식의 장점 (중요)
- 기존 §3-4의 **"누적-상태 신호는 빨간점이 안 꺼진다" 문제를 해소.**
  → read-state(확인하면 꺼짐)가 생기므로 **정보형(리뷰·배송완료·승인차량)도 행동형과 동일하게**
  다룰 수 있음 → **🔴/ℹ️ 구분 폐기, 단일 목록으로 통합 가능.**
- 점 트리거 로직: "마지막 확인 시점 대비 **count가 늘어난 항목이 있으면 ON**" (누적도 자연 처리).

### 8.3 결정 필요 — "전에 무슨 알림이 있었는지"의 범위 (작업량을 가름)
- **(A) 현재 상태 다시보기 + localStorage** *(권장, v1)*
  - 모달 = "지금 시점의 알림 목록"을 표시(언제든 재열람). 점만 "새 것 여부"로 ON/OFF.
  - **마지막 확인 시각/스냅샷(항목별 count)을 브라우저 localStorage에 저장.**
  - 백엔드/DB 추가 **0** (현재 카운트 API 그대로 사용). 프론트만 수정. 바로 구현 가능.
  - 한계: 기기별(localStorage), "이력"은 과거 이벤트 로그가 아니라 "현재 상태 재열람" 개념.
- **(B) 진짜 이력 로그 (백엔드 알림 테이블 신설)**
  - 이미 처리/사라진 알림까지 시간순 보관·표시(읽음 표시 포함).
  - **알림 이벤트 테이블 신설 + 발생 지점마다 적재 + 읽음 처리 API** 필요 → 작업량 큼, 마이그레이션.
  - 기기 간 동기화 가능.

### 8.4 부수 결정
- read-state 저장: **localStorage(간단, 기기별)** vs 백엔드(동기화, 무거움).
- UI 형태: 현재 **앵커 드롭다운** 유지 vs **중앙 모달**(알림센터 느낌).
- 점 ON 기준: "count 증가분 발생"(권장, 누적 대응) vs "미확인 항목 > 0".

### 8.5 권장(안)
**(A) + localStorage + 통합 단일 목록**으로 v1. 빨간점="새 알림 있음", 열면 OFF,
모달은 언제든 현재 알림 재열람. 백엔드는 현재 카운트 API 재사용(추가 0), 프론트만 수정.
진짜 이력 로그(B)는 추후 고도화 과제로 분리.

---

## 9. 추가 예정 작업 (TODO)

### 9.1 로그인 연속 전환을 위한 Redux 초기화 (토큰/Redux 불일치 해결)
- **문제**: 화주→차주→관리자처럼 **연달아 로그인**하면, 실제 인증 토큰(sessionStorage)과 화면용
  Redux 로그인 상태가 **다른 계정을 가리키는** 일이 생김. (알림이 이걸 드러냈을 뿐, 알림 자체 버그 아님.)
- **원인 3가지**:
  1. 한 로그아웃 경로([useAuth.logout](front/src/hooks/useAuth.js#L99))가 토큰만 지우고 **Redux는 비우지 않음**.
  2. login 리듀서([loginSlice.js:100-105](front/src/slice/loginSlice.js#L100))가 새 payload에 값 없으면
     `state.roles`/`state.memberId`로 **이전 계정 값을 물려받음**.
  3. 헤더의 `silentRefresh`/토큰복원/`getUserInfoAsync` 등 **비동기 효과 race**.
- **해야 할 것**:
  - [ ] **모든 로그아웃 경로에서 Redux `logout` dispatch**(토큰+Redux 동시 초기화).
  - [ ] **로그인 '시작' 시 Redux를 먼저 initState로 리셋** 후 새 값 세팅(로그아웃 누락에도 안전).
  - [ ] login 리듀서의 **이전 값 폴백 제거**(항상 새 값으로 덮어쓰기).
  - [ ] (선택) 헤더의 토큰 복원/refresh 효과 정리로 race 축소.
- 영향 범위: `useAuth` / `loginSlice` / `ResponsiveAppBar`(인증 effect). **적용 전 변경 파일·동작 먼저 공유.**
- 참고: **하드 새로고침 시엔 Redux가 토큰에서 재생성**되어 자동 정상화 → 막으려는 건 *새로고침 없이* SPA 내 전환.

### 9.2 read-state — "확인하면 알림(점)이 사라지게"
- **목표**: 점 규칙을 **"건수 > 0" → "마지막으로 확인한 뒤 새로 생긴 게 있으면"** 으로 변경.
  해당 페이지(또는 마이페이지 대시보드)에서 **확인하면 그 항목 점이 즉시 사라짐**, 새 건 오면 다시 ON.
- **방식 (클라이언트 전용, 백엔드 0)**:
  1. `localStorage`에 사용자·항목별 **"마지막 본 건수" 스냅샷** 저장 (`notifSeen:{loginId}:{key}=count`).
  2. 점 판단: `dot = items[key] > seen[key]` (현재 > 마지막 본 건수).
  3. 확인 지점에서 `markSeen([keys])` 호출 → seen=현재값 → 점 OFF. `window` 커스텀 이벤트로 헤더·사이드바 즉시 재계산.
- **적용 방식 [결정완료] (2026-06-22): (A) 항목별** — 각 메뉴/페이지 진입 시 그 항목만 seen 처리.
  - (참고) (B) 대시보드 일괄(마이페이지 대시보드 진입 시 전체 seen) 안은 미채택.
- **해야 할 것**:
  - [ ] [useNotificationSummary](front/src/hooks/useNotificationSummary.js)에 seen 스냅샷 로직 + `markSeen` 추가.
  - [ ] 점 판단을 `> seen`으로 변경(헤더 통합점은 "새 행동필요 있음" 기준으로).
  - [ ] 확인 지점(타깃 페이지/대시보드)에서 `markSeen` 호출 + 커스텀 이벤트로 즉시 반영.
- 한계: localStorage라 **기기별**. 기기 동기화·진짜 이력은 §8-B(백엔드 알림 테이블) 필요.

### 9.3 (연관) 실시간 갱신
- 세션 중 새 알림 즉시 반영: **폴링(30~60초) + 탭 포커스 재조회**가 가성비 최선(백엔드 0).
  - 참고: 관리자 신고 뱃지는 이미 [AdminSidebar](front/src/common/AdminSidebar.js#L97)에서 60초 폴링 사용 중.
- 진짜 실시간이 필요하면 SSE/WebSocket(백엔드 신설).
