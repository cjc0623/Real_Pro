# 백엔드 테이블 구조 (흐름 정리)

작성일: 2026-06-08
대상: `backend/` (Spring Boot + MariaDB `bootex`)
정리 기준: **계정 → 견적 → 매칭 → 주문/결제 → 배송 → 리뷰** 비즈니스 흐름.
`*` 표시 = 직접요청(Direct Request) 기능에서 추가/변경된 부분.

---

## 전체 흐름도

```
[UserIndex] 통합 로그인(login_id)
   ├── Member (화주)  ─┐
   └── CargoOwner (차주) ── Cargo (보유 차량 N대)
                         │
   ┌─────────────────────┘
   ▼
[Estimate] 견적  ──(요금참조)── FeesBasic(무게별) / FeesExtra(옵션)
   │  (화주가 작성)
   │
   ├─ 공개모집 ── [Matching] (cargo_id NULL→수락 시 차주 지정)
   │                 └ 차주 거절 이력 → [RejectedMatching]
   │
   └─ 직접요청* ── [DirectRequest] (차주 지정, N건 팬아웃)
                      └ 수락 시 [Matching] 1건 생성(승격) + matching_no 링크*
   ▼
[Matching] (성사된 거래의 단일 앵커)
   ▼ 1:1
[OrderSheet] 주문서
   ▼ 1:1
[Payment] 결제 ──(쿠폰)── MemberCoupon ── Coupon
   ▼ 1:1
[Delivery] 배송 (PENDING→IN_TRANSIT→COMPLETED)
   ▼ 완료 후
[Review] 리뷰 ── ReviewImage(N) / ReviewReply(차주 답글 1:1)
```

---

## 단계별 테이블

### 1) 계정 / 인증
| 테이블 | PK | 핵심 컬럼 · 관계 |
|---|---|---|
| `user_index` | login_id | 화주·차주 통합 로그인 인덱스 |
| `member` (화주) | mem_id | userIndex→login_id, 이메일/이름/전화/주소, `member_roles`(권한 컬렉션) |
| `cargo_owner` (차주) | cargo_id | userIndex→login_id, isVerified(본인인증), 이름/전화/주소 |
| `cargo` (차량) | cargo_no | cargo_id→cargo_owner, cargoNumber, status(APPROVED 등), capacity |
| `social_account` | — | 소셜 로그인 연동 |

### 2) 견적 + 요금
| 테이블 | PK | 핵심 컬럼 · 관계 |
|---|---|---|
| `estimate` | eno | **mem_id→member**, 출발/도착·거리·무게·종류, 비용(base/distance/total), 플래그: `matched`·`isOrdered`·`isTemp` |
| `fees_basic` | tno | weight(unique), ratePerKm, initialCharge |
| `fees_extra` | exno | extra_charge_title(unique), 옵션 요금 |

### 3) 매칭 (두 경로)
| 테이블 | PK | 핵심 컬럼 · 관계 |
|---|---|---|
| `matching` | matching_no | **eno→estimate**, **cargo_id→cargo_owner**(공개모집은 수락 전 NULL), isAccepted, acceptedTime · OrderSheet와 1:1 |
| `rejected_matching` | id | cargo_owner_id, estimate_no, rejectedTime (공개모집 차주 거절 이력) |
| `direct_request` * | id | **eno→estimate**, **cargo_id→cargo_owner**, `status`(REQUESTED/ACCEPTED/REJECTED/CANCELED), requestedAt, respondedAt, **matching_no→matching**(수락 시 링크), unique(eno, cargo_id) |

> 핵심: 직접요청은 견적 1개를 차주 N명에게 보내 `direct_request` N행을 만들고, **한 명 수락 시에만 `matching` 1건 생성**.
> 그래서 `matching`은 견적과 항상 1:1 유지 → 이후 파이프라인 무손상.

### 4) 주문 / 결제
| 테이블 | PK | 핵심 컬럼 · 관계 |
|---|---|---|
| `order_sheet` | order_no | **matching→matching**(1:1), orderUuid, 수령인/주소/연락처 |
| `payment` | payment_no | **order_sheet_no→order_sheet**(1:1, unique), **mcno→member_coupon**(사용 쿠폰), paymentStatus, paidAt, method |
| `coupon` | cno | 쿠폰 정의(할인값/한도) |
| `member_coupon` | mcno | **mem_id→member**, **cno→coupon**, status |

### 5) 배송
| 테이블 | PK | 핵심 컬럼 · 관계 |
|---|---|---|
| `delivery` | delivery_no | **payment_no→payment**(1:1), **cargo_owner_id→cargo_owner**, status(PENDING/IN_TRANSIT/COMPLETED), completTime |

### 6) 리뷰
| 테이블 | PK | 핵심 컬럼 · 관계 |
|---|---|---|
| `review` | review_no | deliveryNo(배송 연결), rating, comment, **writerMemberId**(화주), **targetCargoId**(차주) |
| `review_image` | review_image_no | review_no→review (N장) |
| `review_reply` | reply_no | review_no→review (1:1 unique), cargoOwnerId(차주 답글) |

### 7) 기타 (흐름 외 부가)
`notice`(공지), `qa_post` + `admin_response`(문의/답변), `user_report`(신고), `chat_message`(채팅), `member_roles`(권한).

---

## 직접요청이 바꾼 부분 요약
- **신규 테이블 `direct_request` 1개만 추가** (기존 `matching`은 원복, 컬럼 변경 없음)
- 결제·배송·리뷰 파이프라인은 `matching` 앵커를 공유하므로 **무변경**
- 공개/직접 상호배제는 `estimate.matched` 플래그로 공유
- 수락 시 `direct_request.status=ACCEPTED` + `matching` 승격 생성 + 형제 요청 일괄 `CANCELED`

---

## 상태 enum 참고
- `RequestStatus` (direct_request): REQUESTED / ACCEPTED / REJECTED / CANCELED
- `DeliveryStatus` (delivery): PENDING / IN_TRANSIT / COMPLETED
- `PaymentStatus` (payment): 결제 상태
- `CouponStatus` (member_coupon): ACTIVE 등
