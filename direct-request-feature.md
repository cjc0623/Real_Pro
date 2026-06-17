# 직접요청(Direct Request) 구현 계획서 — 방법 B (DirectRequest 테이블 분리)

작성 일자: 2026-06-08 (방법 B로 재설계)
대상: `backend/` (Spring Boot) + `front/` (React)
기능 요약: 기존 "화주 견적 등록 → 차주 수락"(공개모집) 외에, **화주가 차주 프로필·평점·리뷰를 보고 특정 차주를 지정해 직접 요청**하는 경로 추가. **한 견적을 여러 차주에게 동시 요청(팬아웃)** 지원.

> 이력: 2026-06-05에 **방법 A(기존 Matching 확장)**로 1차 구현 완료(컴파일/빌드 통과). 이후 요구가
> ① 직접요청을 핵심 기능으로 확장 ② 한 견적을 여러 차주에게 동시 요청 으로 확정되면서, A의
> "1견적=1매칭" 가정이 다중요청에서 깨지는 문제(아래 §0.2)로 **방법 B로 전환**한다.
> 이 문서는 B 기준 계획이며, A 구현물의 원복/재사용 분류(§3)를 포함한다.

---

## 0. 설계 결정

### 0.1 합의된 결정

| 항목 | 결정 | 비고 |
|---|---|---|
| 데이터 모델 | **신규 `DirectRequest` 테이블 분리** | `Matching`은 "성사된 거래"만 의미하도록 원복 |
| 작업 범위 | **백엔드 + 프론트 풀스택** | `front/CLAUDE.md`의 "백엔드 수정 금지"는 이 기능 한해 예외 |
| 견적 처리 | **요청 시 견적 1개 생성 → 차주 N명에게 DirectRequest N행 팬아웃** | 견적은 차주들이 공유 |
| 수락 처리 | **수락 시 Matching 행을 새로 생성(승격)** | 이후 결제/배송/리뷰 파이프라인은 기존과 동일 |

### 0.2 핵심 통찰 — 왜 B인가 (다중요청이 A를 탈락시킴)

- 수락 이후 파이프라인(OrderSheet→Payment→Delivery→Review)의 단일 앵커는 **`Matching`**이다.
  (`OrderSheet`가 `Matching`과 `@OneToOne`)
- `MatchingRepository.findByEstimate`는 `Optional<Matching>`(견적당 ≤1 가정)이다.
- **A로 다중요청 시**: 견적 1개에 DIRECT `Matching` 행이 N개 → `findByEstimate`가 `NonUniqueResult`로 깨짐.
  견적을 차주별 복제하면 견적 테이블이 폭증한다.
- **B는 팬아웃을 `direct_request`(N행)가 흡수**하고, 한 명 수락 시에만 `Matching` 1개를 생성하므로
  **`Matching`은 끝까지 estimate와 1:1**을 유지 → `findByEstimate`/결제·배송·리뷰 **무손상**.

### 0.3 상태 전이(B)

```
[화주] 견적 1개 생성 + 차주 N명에게 DirectRequest N행
       각 DirectRequest: status=REQUESTED, estimate=공유, cargoOwner=각 차주
       (Matching 행은 아직 없음, estimate.matched=false)
        │
        ├─[차주 k 수락]
        │     ├ estimate.matched 재확인(상호배제) → 이미 매칭이면 예외
        │     ├ 승인차량/톤수 검증(validateOwnerCanAccept 재사용)
        │     ├ DirectRequest_k.status=ACCEPTED, respondedAt=now, matching 연결
        │     ├ Matching 신규 생성(estimate, cargoOwner=차주k, isAccepted=true, acceptedTime=now)
        │     ├ estimate.matched=true (락)
        │     └ 형제 DirectRequest(같은 estimate, 아직 REQUESTED) → 일괄 CANCELED
        │           → 결제 단계로
        └─[차주 거절] DirectRequest.status=REJECTED, respondedAt=now (해당 행만 종료)
```

---

## 1. 상태(status) 모델

`DirectRequest.status` — enum `RequestStatus` (A의 enum을 이사해 재사용):

| 값 | 의미 |
|---|---|
| `REQUESTED` | 요청중(차주 응답 대기) |
| `ACCEPTED` | 차주 수락됨 → Matching 승격됨 |
| `REJECTED` | 차주 거절됨(해당 행 종료) |
| `CANCELED` | 형제 수락으로 자동 취소 / 화주 취소 |

> `MatchingType` enum은 B에서 **불필요**(Matching은 다시 공개모집 전용 의미) → 삭제.
> `Matching`의 `matching_type`/`request_status`/`requested_at` 컬럼도 제거(원복).

---

## 2. 데이터 모델

### 2.1 신규 엔티티 `DirectRequest`

```
direct_request
  id            PK (IDENTITY)
  estimate_eno  FK → estimate.eno      (ManyToOne, 차주들이 공유)
  cargo_id      FK → cargo_owner       (ManyToOne, 지정 차주, NOT NULL)
  status        VARCHAR(20)            (RequestStatus, @Enumerated STRING)
  requested_at  DATETIME
  responded_at  DATETIME               (수락/거절/취소 시각)
  matching_no   FK → matching          (NULL, 수락 시 승격된 Matching 연결)
```

- **유니크 제약**: `(estimate_eno, cargo_id)` — 같은 견적을 같은 차주에게 중복 요청 방지.
- `Matching`은 **원복** → 컬럼 추가 없음, 기존 스키마 그대로.
- `ddl-auto=update` → `direct_request` 테이블 자동 생성, 기존 데이터 영향 없음. **마이그레이션 불필요.**

---

## 3. A 구현물 처리 — 원복 / 재사용 / 신규 (⭐ 구현 단계 체크리스트)

> 구현 착수 직전, 현재 워킹트리(A)를 **임시 브랜치에 WIP 커밋 또는 `git stash`로 백업**한 뒤 아래를 실행.
> master 이력은 건드리지 않는다.

### 3.1 원복(REVERT) — A 전용, B에서 제거

| 파일 | 처리 |
|---|---|
| `entity/matching/Matching.java` | `matchingType`/`requestStatus`/`requestedAt` 필드 + `changeRequestStatus()` 제거 → **원복** |
| `entity/matching/MatchingType.java` | **삭제** (B에서 불필요) |
| `repository/matching/MatchingRepository.java` | 공개모집 쿼리 2종의 `(matchingType IS NULL OR = OPEN)` 가드 제거, `findReceivedDirectRequests`/`findSentDirectRequests` 제거 → **원복** |
| `service/estimate/EstimateServiceImpl#sendEstimate` | OPEN 매칭 빌더에서 `matchingType`/`requestStatus` 세팅 제거 → 원래 빌더로 원복 |
| `service/estimate/EstimateServiceImpl#sendDirectEstimate` | **삭제**(DIRECT Matching 생성 방식) → §4.2의 팬아웃 방식으로 대체 |
| `service/estimate/matching/MatchingServiceImpl` | `getReceivedDirectRequests`/`getSentDirectRequests`/`acceptDirectRequest`/`rejectDirectRequest`/`directReqToDTO` **제거** → DirectRequestService로 이전 |
| `service/estimate/matching/MatchingService` (인터페이스) | 위 4종 시그니처 제거 |
| `service/estimate/EstimateService` (인터페이스) | `sendDirectEstimate` 시그니처 제거 → §4.2 신규 시그니처로 교체 |

### 3.2 재사용(REUSE) — 그대로 유지, A/B 무관하게 유효

| 파일 | 사유 |
|---|---|
| `EstimateServiceImpl#applyFeeCalculation()` | 요금계산 공유 헬퍼. B에서도 그대로 사용 |
| `MatchingServiceImpl#validateOwnerCanAccept()` | 승인차량/톤수 검증. 수락 승격 로직에서 재사용 |
| `dto/matching/DirectRequestDTO.java` | 표시용 DTO. `matchingType` 필드만 제거하고 `requestId`/`status` 기준으로 소폭 조정 |
| `service/review/ReviewService#getDriverCards` + Impl + `ReviewRepository#findDriverProfileCards` | 차주 탐색(평점/리뷰/승인차량 필터). B와 무관하게 유지 |
| `front/src/api/directRequestApi/directRequestApi.js` | 엔드포인트 동일. `postDirectRequest`만 단일→복수(cargoIds)로 시그니처 조정 |
| `front/src/layout/component/common/DriverSearchSelect.js` | 차주 검색·선택 UI. **단일선택→복수선택**으로 확장(§5) |
| `front/src/layout/component/mypage/DirectRequestSent.js` | 보낸함. 응답 필드명(requestId/status) 정렬만 |
| `front/src/layout/component/mypage/DirectRequestReceived.js` | 수신함. 수락/거절 호출 대상이 requestId로 바뀜 |
| `front/src/router/mypageRouter.js`, `front/src/common/Sidebar.js` | 라우트/메뉴. 그대로 유지 |
| `front/.../estimate/EstimateComponentCombined.js` | "직접 요청하기" 체크박스 흐름 유지, 제출 시 복수 차주 전송으로 분기 조정 |

### 3.3 신규(NEW) — B에서 추가

| 파일 | 역할 |
|---|---|
| `entity/matching/DirectRequest.java` | 직접요청 엔티티(§2.1) |
| `entity/matching/RequestStatus.java` | A의 것을 **유지**(이미 존재). DirectRequest가 사용 |
| `repository/matching/DirectRequestRepository.java` | 수신함/보낸함/형제조회/중복확인 쿼리(§4.1) |
| `service/directrequest/DirectRequestService.java` (+Impl) | 생성(팬아웃)/조회/수락(승격)/거절 |
| `controller/estimate/DirectRequestController.java` | **유지하되** 호출 대상을 DirectRequestService로 교체, 경로 `{matchingNo}`→`{requestId}` |

---

## 4. 백엔드 상세 (B)

### 4.1 `DirectRequestRepository`

```java
// 차주 수신함: 나에게 온 요청(상태 무관, 최신순)
@Query("SELECT r FROM DirectRequest r WHERE r.cargoOwner.cargoId = :cargoId ORDER BY r.id DESC")
List<DirectRequest> findReceived(@Param("cargoId") String cargoId);

// 화주 보낸함: 내가 보낸 요청(견적의 화주 기준, 최신순)
@Query("SELECT r FROM DirectRequest r WHERE r.estimate.member.memId = :memId ORDER BY r.id DESC")
List<DirectRequest> findSent(@Param("memId") String memId);

// 형제 요청: 같은 견적의 아직 REQUESTED 인 행(수락 시 일괄 CANCELED 대상)
@Query("SELECT r FROM DirectRequest r WHERE r.estimate.eno = :eno AND r.status = :status")
List<DirectRequest> findByEstimateAndStatus(@Param("eno") Long eno, @Param("status") RequestStatus status);

// 중복요청 방지 확인
boolean existsByEstimate_EnoAndCargoOwner_CargoId(Long eno, String cargoId);
```

### 4.2 `EstimateService.createDirectRequests` (팬아웃 생성)

A의 `sendDirectEstimate(dto, cargoId)`를 대체:

```java
// 견적 1개 생성 + 차주 N명에게 DirectRequest N행
List<Long> createDirectRequests(EstimateDTO dto, List<String> cargoIds);
```
구현 흐름:
1. `applyFeeCalculation(dto)` (재사용)
2. `Member` 조회 → `Estimate` 1개 저장(공유)
3. `cargoIds` 순회: 각 `CargoOwner` 검증 후 `DirectRequest`(REQUESTED, requestedAt=now) 저장
4. 생성된 `requestId` 리스트 반환
   - **OPEN Matching은 생성하지 않음** (직접요청 견적은 공개목록에 노출 안 됨 → §6 유출방어)

### 4.3 `DirectRequestService`

```java
List<DirectRequestDTO> getReceived(String cargoId);   // findReceived → DTO
List<DirectRequestDTO> getSent(String memId);         // findSent → DTO
Long accept(Long requestId, String cargoId);          // 승격
void reject(Long requestId, String cargoId);
```

**accept(승격) 로직** (트랜잭션):
1. `DirectRequest` 조회 → 소유권(`cargoOwner.cargoId == cargoId`)·상태(REQUESTED) 검증
2. `estimate.isMatched()` 재확인 → 이미 매칭이면 예외(상호배제)
3. `validateOwnerCanAccept(estimate, cargoOwner)` (재사용)
4. `Matching` 신규 생성: `estimate`, `cargoOwner`, `isAccepted=true`, `acceptedTime=now` 저장
5. `estimate.changeMatched(true)`
6. `request.status=ACCEPTED`, `respondedAt=now`, `matching` 연결
7. **형제 처리**: `findByEstimateAndStatus(eno, REQUESTED)` → 각 `status=CANCELED, respondedAt=now`
8. `matchingNo` 반환 → 프론트는 기존 결제 흐름으로 진입

> `validateOwnerCanAccept`는 현재 `MatchingServiceImpl`의 private 메서드 → **공유 가능한 위치**
> (예: `MatchingService`에 `public` 노출 또는 별도 헬퍼 컴포넌트)로 이동해 DirectRequestService가 호출.

### 4.4 API 엔드포인트 (경로 유지, 대상 서비스만 교체)

기준 prefix: `/g2i4/estimate` (보안: `anyRequest().authenticated()`, 소유권 검증은 서비스)

| HTTP | 경로 | 사용자 | 변경점 |
|---|---|---|---|
| GET | `/drivers?keyword=&requireVehicle=` | 화주 | 변경 없음(재사용) |
| POST | `/direct-request` (body: `{estimate, cargoIds[]}`) | 화주 | **cargoId 단수 → cargoIds 복수** |
| GET | `/direct-requests/sent` | 화주 | DirectRequestService로 |
| GET | `/direct-requests/received` | 차주 | DirectRequestService로 |
| POST | `/direct-request/{requestId}/accept` | 차주 | `matchingNo`→`requestId` |
| POST | `/direct-request/{requestId}/reject` | 차주 | `matchingNo`→`requestId` |

---

## 5. 프론트 상세 (B)

- `directRequestApi.js`: `postDirectRequest(estimateDTO, cargoIds)` — body에 `cargoIds` 배열 포함.
  accept/reject 인자 `matchingNo`→`requestId`(값 의미만 변경, 호출부 동일).
- `DriverSearchSelect.js`: 단일 선택 → **다중 선택(체크/칩)**. 선택된 차주 ID 배열을 부모로 전달.
- `EstimateComponentCombined.js`: "직접 요청하기" 체크 시 다중 차주 선택 → 제출 시 `cargoIds` 배열 전송.
  성공 다이얼로그: "N명에게 직접요청을 보냈습니다".
- `DirectRequestSent.js`: 같은 견적의 여러 요청을 차주별 상태(REQUESTED/ACCEPTED/REJECTED/CANCELED)로 표시.
- `DirectRequestReceived.js`: 수신함, 수락/거절을 `requestId`로 호출. 수락 성공 시 결제 흐름 진입.

---

## 6. 권한 / 검증 / 엣지케이스

- **생성**: 화주만. `Authentication.getName()`을 `dto.memberId`로 → 차주 호출 시 회원조회 실패로 게이트.
- **수락/거절**: `request.cargoOwner.cargoId == 로그인 차주`만(소유권). 상태 REQUESTED 검증.
- **차량 검증**: 수락 시 승인(APPROVED) 차량 + 요청 톤수 이상 보유(공개모집과 동일 로직 공유).
- **상호배제**: 수락 시 `estimate.matched` 재확인 + 형제 요청 일괄 CANCELED.
- **동시성**: 두 차주 동시 수락 경합 → `estimate.matched` 체크가 트랜잭션 내에서 보호.
  (필요 시 estimate 행 비관적 락 또는 matched 유니크/버전 컬럼 고려 — §8 후속과제)
- **중복요청**: `(estimate, cargoOwner)` 유니크로 같은 견적 같은 차주 재요청 차단.
- **정보유출 방지**: 직접요청 견적은 OPEN Matching을 만들지 않으므로 공개목록 쿼리에 **애초에 안 잡힘**
  → Matching 쪽 가드 조건 불필요(A 대비 구조적 개선).

---

## 7. 기존 기능 영향 (회귀 안전성)

- 공개모집(`sendEstimate`/`acceptMatching`)은 **A 이전 상태로 원복** → 동작 동일, 가드 제거로 단순화.
- `findByEstimate` 등 "견적당 Matching ≤1" 가정 유지(직접요청은 수락 시에만 1개 생성).
- 결제/배송/리뷰 파이프라인은 승격된 Matching을 그대로 통과.
- 스키마: `direct_request` 테이블만 신규 생성, 기존 테이블 무변경 → **마이그레이션 불필요.**

---

## 8. 구현 순서 & 검증

1. A 백업(임시 브랜치 WIP 커밋/stash) → §3.1 원복 실행
2. `DirectRequest` 엔티티 + `RequestStatus` 유지 + `DirectRequestRepository`
3. `EstimateService.createDirectRequests`(팬아웃) + `validateOwnerCanAccept` 공유화
4. `DirectRequestService`(조회/accept 승격/reject) + `DirectRequestDTO` 조정
5. `DirectRequestController` 경로/대상 교체
6. 프론트: api 복수화 → DriverSearchSelect 다중선택 → EstimateComponentCombined → 보낸/수신함
7. 검증:

| 항목 | 목표 |
|---|---|
| 백엔드 `compileJava` / `compileTestJava` | 통과 |
| 프론트 `react-scripts build` | 통과 |
| DB E2E: 견적1→차주3 팬아웃 → 1명 수락(나머지 CANCELED 확인) → 결제→배송→리뷰 | 1회 검증 |
| 동시성: 2명 동시 수락 시 1명만 성공 | 확인 |

### 8.1 후속 과제(구현 완료 후 재논의 — 사용자 합의사항)

- **다중 차주 팬아웃 UX 상세**(차주 복수 선택 UI/동시 발송 문구/보낸함 그룹핑) — 구현 완료 후 다시 논의.
- 동시 수락 경합의 락 전략(비관적 락 vs 버전 컬럼) 확정.
- 화주의 요청 취소(CANCELED) 기능 노출 여부.
