# 화주·차주 이름 클릭 → 프로필 팝업 기능 분석

분석 일자: 2026-06-18
분석 대상: 목록에서 **이름/아이디 클릭 시 공개 프로필 모달**이 뜨는 기능 (화주/차주)
분석 범위: 코드 수정 없음 (read-only 분석)

---

## 한눈에 보기

이름(또는 아이디) 텍스트를 클릭하면 그 사람의 **공개 프로필 모달(Dialog)** 이 열리고,
프로필 카드 + 리뷰 목록을 보여주는 구조다. 두 종류가 있다.

| 구분 | 클릭 대상 | 모달 컴포넌트 | 식별자 | 보여주는 것 |
|---|---|---|---|---|
| **차주 프로필** | 차주 이름/아이디 | [DriverProfileModal](front/src/layout/component/common/DriverProfileModal.js) | `cargoId` | 이름·이미지·평점·본인인증 + **받은 리뷰** |
| **화주 프로필** | 화주 아이디 | [ShipperProfileModal](front/src/layout/component/common/ShipperProfileModal.js) | `memId` | 이름·이미지·가입일 + **작성한 리뷰** |

동작 흐름은 공통적으로:

```
[목록의 이름/아이디 텍스트]  ──onClick(id)──▶  [상위 컴포넌트의 state에 id 저장]
        (cursor:pointer,                              │
         파란 밑줄 링크 스타일)                         ▼
                                          [Modal open={!!id} id={id}]
                                                       │
                                          useEffect: open && id 일 때 API 호출
                                                       ▼
                                   [프로필 카드 DTO + 리뷰 목록] 렌더
```

> 참고: [DriverProfileCard](front/src/layout/component/common/DriverProfileCard.js) 는 이름과 비슷하지만 **다른 것**이다.
> 마이페이지에서 본인 프로필/평점 통계를 보여주는 카드(클릭 팝업 아님). 혼동 주의.

---

## 1. 프론트엔드 — 클릭 트리거

이름/아이디는 `<Box component="span">` 에 `onClick` 과 파란 밑줄 링크 스타일을 입혀 만든다.
대표 스타일(여러 파일에서 반복):

```js
const linkSx = {
  cursor: 'pointer',
  color: '#2563eb',
  fontWeight: 600,
  textDecoration: 'underline',
  '&:hover': { color: '#1d4ed8' },
};
```

### 트리거가 있는 화면들

| 화면(컴포넌트) | 어떤 이름을 클릭? | 여는 모달 | 핸들러 |
|---|---|---|---|
| [EstimateListComponent](front/src/layout/component/estimate/EstimateListComponent.js#L229) | 견적 목록의 화주 아이디(`estimate.memId`) | ShipperProfileModal | `openShipperProfile(memId)` |
| [DeliveryInform](front/src/layout/component/mypage/DeliveryInform.js#L214) | 배송 목록의 화주(`item.memId`)·차주(`item.cargoId`) **양쪽** | Shipper/DriverProfileModal | `openShipperProfile` / `openDriverProfile` |
| [DirectRequestSent](front/src/layout/component/mypage/DirectRequestSent.js#L213) | 직접요청 보낸 차주 | DriverProfileModal | (cargoId 전달) |
| [DriverSearchSelect](front/src/layout/component/common/DriverSearchSelect.js#L228) | 차주 검색 결과 | DriverProfileModal | (cargoId 전달) |

### 트리거 패턴 (예: EstimateListComponent)

```js
// 1) 모달에 넘길 식별자 state
const [shipperModalMemId, setShipperModalMemId] = useState(null);

// 2) 클릭 핸들러 — id가 있을 때만 set
const openShipperProfile = (memId) => {
  if (memId) setShipperModalMemId(memId);
};

// 3) 이름/아이디 텍스트 (파란 밑줄 링크)
{estimate.memId ? (
  <Box component="span"
       onClick={() => openShipperProfile(estimate.memId)}
       sx={{ cursor:'pointer', color:'#2563eb', fontWeight:600, textDecoration:'underline' }}>
    {estimate.memId}
  </Box>
) : '-'}

// 4) 모달 — open은 id 유무로 제어, 닫으면 id를 null로
<ShipperProfileModal
  open={!!shipperModalMemId}
  memId={shipperModalMemId}
  onClose={() => setShipperModalMemId(null)}
/>
```

`open={!!id}` 와 `onClose={() => setId(null)}` 조합이 핵심.
**id 자체가 open 상태를 겸한다** (별도 boolean open state 없음).

---

## 2. 프론트엔드 — 모달 컴포넌트 내부

두 모달 모두 동일한 패턴:

1. props 로 `open`, 식별자(`cargoId`/`memId`), `onClose` 를 받음
2. `useEffect([open, id])` 안에서 `open && id` 일 때만 API 호출
3. `ignore` 플래그로 언마운트/재호출 시 race condition 방지
4. `loading → 에러(데이터 없음) → 정상` 3분기 렌더
5. 프로필 이미지 경로는 `normalizeProfileUrl` 로 정규화

### DriverProfileModal ([파일](front/src/layout/component/common/DriverProfileModal.js))

```js
const data = await getDriverDetail(cargoId);   // 1번 호출로 프로필+리뷰 동시
setProfile(data?.profile ?? null);
setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
```

- 카드: 이미지 / 이름 / **본인인증 Chip**(`isVerified`) / 아이디 / 평점·리뷰수
- 하단: **받은 리뷰** 목록(작성자명·날짜·별점·코멘트)

### ShipperProfileModal ([파일](front/src/layout/component/common/ShipperProfileModal.js))

```js
const [c, r] = await Promise.all([          // 카드와 리뷰를 병렬 호출
  getShipperProfileCard(memId),
  getShipperWrittenReviews(memId).catch(() => []),  // 리뷰 실패해도 카드는 표시
]);
```

- 카드: 이미지 / 이름 / 아이디 / **가입일**(`createdAt`)
- 하단: **작성한 리뷰** 목록(대상 기사님·날짜·별점·코멘트)

### 프로필 이미지 경로 정규화 (두 모달 공통)

```js
const normalizeProfileUrl = (v) => {
  if (!v) return null;
  if (v.startsWith("http")) return v;                       // 절대 URL 그대로
  if (v.startsWith("/fr/uploads/")) return `${API_BASE}${v}`; // 서버 웹경로
  return `${API_BASE}/fr/uploads/user_profile/${encodeURIComponent(v)}`; // 파일명만 온 경우
};
```

이미지 로드 실패 시 `onError` 로 `DEFAULT_AVATAR(/image/placeholders/avatar.svg)` 폴백.

---

## 3. 프론트엔드 — API 레이어

### 차주 ([reviewApi.js](front/src/api/reviewApi/reviewApi.js))

| 함수 | 메서드 | 경로 | 비고 |
|---|---|---|---|
| `getDriverDetail(cargoId)` | GET | `/fr/review/driver-detail/{cargoId}` | 모달이 실제 사용. 프로필+리뷰 묶음 |
| `getDriverProfileCard(cargoId)` | GET | `/fr/review/driver-profile/{cargoId}` | 카드만. (모달에선 미사용) |
| `getShipperWrittenReviews(memId)` | GET | `/fr/review/member/{memId}` | 화주가 쓴 리뷰 목록 |

### 화주 ([userInfoApi.js](front/src/api/userinfoApi/userInfoApi.js))

| 함수 | 메서드 | 경로 | 응답 |
|---|---|---|---|
| `getShipperProfileCard(memId)` | GET | `/fr/user/shipper-profile/{memId}` | `{ memberId, memberName, memberProfileImage, createdAt }` |

토큰은 `sessionStorage.accessToken` → `Authorization: Bearer` 헤더, `withCredentials: true`.

---

## 4. 백엔드 — 엔드포인트 / 서비스 / 쿼리

### 차주 프로필 ([ReviewController](backend/src/main/java/com/giproject/controller/review/ReviewController.java))

```
GET /fr/review/driver-detail/{cargoId}   → getDriverDetail(cargoId)
GET /fr/review/driver-profile/{cargoId}  → getDriverProfileCard(cargoId)
GET /fr/review/member/{memId}            → getReviewsByMemberId(memId)  // 화주가 쓴 리뷰
```

[ReviewServiceImpl.getDriverDetail](backend/src/main/java/com/giproject/service/review/ReviewServiceImpl.java#L580):

```java
DriverProfileCardDTO profile = getDriverProfileCard(cargoId);   // 카드
List<MyReviewListDTO> reviews = getReceivedReviews(cargoId);    // 받은 리뷰
return DriverDetailDTO.builder().profile(profile).reviews(reviews).build();
```

[getDriverProfileCard](backend/src/main/java/com/giproject/service/review/ReviewServiceImpl.java#L549) 는
[ReviewRepository.findDriverProfileCardByCargoId](backend/src/main/java/com/giproject/repository/review/ReviewRepository.java#L214) JPQL 호출.
`CargoOwner` 1건 + **서브쿼리로 평점평균·리뷰수**(Review→Delivery→Payment→OrderSheet→Matching 조인) + `isVerified` 를 한 번에 조회.
null 값은 서비스에서 `0 / 0 / false` 로 기본값 처리.

### 화주 프로필 ([UserInfoController](backend/src/main/java/com/giproject/controller/common/UserInfoController.java#L109))

```java
@GetMapping("/shipper-profile/{memId}")
public ResponseEntity<?> getShipperProfile(@PathVariable String memId) {
    Member m = memberRepository.findById(memId).orElse(null);
    if (m == null) return 404;
    String webPath = (파일명 없으면 null) : "/fr/uploads/user_profile/" + 파일명;
    return ShipperProfileCardDTO(memberId, memberName, memberProfileImage=webPath, createdAt);
}
```

화주 리뷰는 `GET /fr/review/member/{memId}` →
[getMyReviews(memId)](backend/src/main/java/com/giproject/service/review/ReviewServiceImpl.java#L419) 로 그 화주가 작성한 리뷰 목록 반환.

---

## 5. 데이터 흐름 요약

### 차주 프로필
```
이름 클릭(cargoId)
  → DriverProfileModal
  → getDriverDetail(cargoId)
  → GET /fr/review/driver-detail/{cargoId}
  → ReviewServiceImpl.getDriverDetail
      ├─ getDriverProfileCard  → findDriverProfileCardByCargoId (CargoOwner + 평점 서브쿼리)
      └─ getReceivedReviews    → 받은 리뷰 목록
  → DriverDetailDTO { profile, reviews }
```

### 화주 프로필
```
아이디 클릭(memId)
  → ShipperProfileModal
  → Promise.all [
       getShipperProfileCard(memId) → GET /fr/user/shipper-profile/{memId}  → Member 조회 → ShipperProfileCardDTO
       getShipperWrittenReviews(memId) → GET /fr/review/member/{memId}       → getMyReviews(memId)
     ]
```

---

## 6. 관련 DTO

| DTO | 필드 |
|---|---|
| [DriverProfileCardDTO](backend/src/main/java/com/giproject/dto/review/DriverProfileCardDTO.java) | `driverId, driverName, driverProfileImage, avgRating, reviewCount, isVerified` |
| [DriverDetailDTO](backend/src/main/java/com/giproject/dto/review/DriverDetailDTO.java) | `profile(DriverProfileCardDTO), reviews(List<MyReviewListDTO>)` |
| [ShipperProfileCardDTO](backend/src/main/java/com/giproject/dto/member/ShipperProfileCardDTO.java) | `memberId, memberName, memberProfileImage, createdAt` |
| [MyReviewListDTO](backend/src/main/java/com/giproject/dto/review/MyReviewListDTO.java) | `reviewNo, rating, comment, createdAt, writerName, driverName, images, reply …` |

---

