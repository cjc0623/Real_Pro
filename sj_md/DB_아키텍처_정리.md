# Real_Pro — DB 주요 테이블 & 아키텍처 정리

> 참조 자료: `ERD.png`(테이블 ERD) · `db구조.sql`(MariaDB DDL 덤프) · `.understand-anything`(지식그래프 16 레이어 / 28 투어)
> DB: `bootex` / MariaDB 12.2 / InnoDB / utf8mb4

---

## 1. 시스템 아키텍처 개요

**화물 운송 중개 플랫폼** — React SPA ↔ Spring Boot REST API ↔ MariaDB 3계층

```
React 19 SPA        ──REST(axios)──▶   Spring Boot 3.5 API      ──JPA──▶   MariaDB
Redux Toolkit / MUI                    Security(JWT + OAuth2)               + 파일 업로드 저장소
PortOne 결제                            AOP 권한검증(@RequirePermission)      + 외부 API(메일/OAuth/본인인증)
```

- **백엔드**: Spring Boot 3.5 / Java 21 / Spring Data JPA / Spring Security / JJWT / MariaDB
- **프론트**: React 19 / Redux Toolkit / React Router / MUI / axios / PortOne
- **인증**: JWT 세션 + OAuth2 소셜(GOOGLE/KAKAO/NAVER) + 토큰 블랙리스트(`revoked_token`)

### 아키텍처 레이어 16개 (understand layers)

| 구분 | 레이어 | 노드 | 역할 |
|------|--------|:---:|------|
| BE | API 컨트롤러 | 38 | REST 엔드포인트, 요청 수신·응답 변환 |
| BE | **서비스** | 64 | 핵심 비즈니스 로직·트랜잭션 (최대 레이어) |
| BE | 데이터 접근(Repository) | 29 | Spring Data JPA, 영속화 추상화 |
| BE | 도메인/엔티티 | 34 | JPA 엔티티·enum·시드 SQL |
| BE | DTO/타입 | 58 | 요청/응답 전송 객체 |
| BE | 보안/공통 횡단관심사 | 13 | JWT 필터, OAuth2, 권한검증 AOP |
| BE | 설정/빌드 | 14 | Security·CORS·OAuth2·Web·AOP 설정 |
| FE | UI 컴포넌트 | 73 | 화면 컴포넌트 (프론트 최대 레이어) |
| FE | API 통신 | 27 | axios 호출 모듈, 토큰 인터셉터 |
| FE | 페이지 | 18 | 라우트 대상 페이지 |
| FE | 설정/진입점 | 16 | index.js·App.js·package.json |
| FE | Hook | 7 | useAuth·useCustomLogin 등 |
| FE | 라우팅 | 5 | createBrowserRouter, 인증가드 |
| FE | 유틸리티 | 5 | jwtUtils·tokenStore |
| FE | 상태관리 | 2 | Redux store, loginSlice |
| BE | 테스트 | 2 | 컨텍스트 로드 스모크 테스트 |

---

## 2. 핵심 거래 흐름 (understand 투어의 중심 스파인) ⭐

플랫폼의 핵심 도메인 로직 = **화물 운송 라이프사이클**. 각 단계가 DB 테이블과 1:1로 대응됩니다.

```
견적          매칭          주문서          결제          배송          리뷰
Estimate  ▶  Matching  ▶  OrderSheet  ▶  Payment  ▶  Delivery  ▶  Review
(화주 요청)   (차주 수락)    (발주 확정)     (PortOne)    (운송 수행)    (신뢰점수)
```

| 단계 | 컨트롤러 → 서비스 | 핵심 로직 |
|------|------|------|
| ① 견적 | EstimateController → EstimateServiceImpl | 거리·화물 기반 요금 계산, 매칭 생성 |
| ② 매칭 | MatchingServiceImpl | 차주 노출·수락/거절·거절이력 기록 |
| ③ 주문 | OrderServiceImpl | 매칭 기반 주문서 생성, 쿠폰 적용 |
| ④ 결제 | PaymentController → PaymentServiceImpl | 결제 생성·완료, 쿠폰 사용, 메일 발송 |
| ⑤ 배송 | DeliveryServiceImpl | 운송중/완료 상태 전환, 배송완료 메일 |
| ⑥ 리뷰 | ReviewServiceImpl | 리뷰·이미지·답글 CRUD + **감성분석 기반 기사 신뢰점수 산출** |

> **횡단 관심사**: `@RequirePermission` + `PermissionAspect`(AOP)로 "본인 또는 관리자만" 인가를 선언적으로 처리

---

## 3. DB 주요 테이블 26개 (ERD.png 기준)

### ① 사용자·인증 (7)

| 테이블 | PK | 핵심 컬럼 / 관계 |
|--------|----|----|
| `user_index` | login_id | **전역 사용자 인덱스**. role enum(ADMIN/DRIVER/SHIPPER), suspended, 정지기간 |
| `member` | mem_id | 화주. mem_email(UNIQUE), social |
| `cargo_owner` | cargo_id | 차주. is_verified, verified_phone(본인인증), social |
| `member_roles` | — | FK mem_id → member (권한 다중) |
| `social_account` | id | FK user_id → user_index. provider enum, signup_ticket |
| `revoked_token` | jti | JWT 블랙리스트. expires_at |
| `cargo` | cargo_no | FK cargo_id → cargo_owner (차주 차량, cargo_status 승인상태) |

### ② 거래 흐름 (7) — 라이프사이클과 1:1 매핑

| 테이블 | PK | FK 관계 |
|--------|----|----|
| `estimate` | eno | FK mem_id → member |
| `matching` | matching_no | FK eno → estimate, cargo_id → cargo_owner |
| `direct_request` | id | 차주 지정요청. FK eno·cargo_id·matching_no |
| `rejected_matching` | rmno | 거절 이력. FK estimate_no·cargo_owner_id |
| `order_sheet` | order_no | FK matching_no → matching **(UNIQUE, 1:1)** |
| `payment` | payment_no | FK order_sheet_no(1:1)·mcno → member_coupon |
| `delivery` | delivery_no | FK payment_no → payment **(1:1)**·cargo_owner_id |

### ③ 리뷰 (3)

| 테이블 | PK | 관계 |
|--------|----|----|
| `review` | review_no | ⚠️ target_cargo_id·writer_member_id는 **FK 아님(varchar soft 참조)**, delivery_no 보유 |
| `review_image` | review_image_no | FK review_no → review |
| `review_reply` | reply_no | FK review_no → review **(UNIQUE, 1:1)** |

### ④ 요금·쿠폰 (4)

| 테이블 | PK | 비고 |
|--------|----|----|
| `fees_basic` | tno | 무게별 기본운임(initial_charge, rate_per_km), weight UNIQUE |
| `fees_extra` | exno | 추가 옵션 요금(상하차 등), 제목 UNIQUE |
| `coupon` | cno | 할인율·최대할인·유효기간 |
| `member_coupon` | mcno | FK cno·mem_id. status enum(ACTIVE/USED/EXPIRED) |

### ⑤ 게시판·운영 (5)

| 테이블 | PK | 관계 |
|--------|----|----|
| `notice` | notice_id | 공지. category enum(GENERAL/SERVICE/SYSTEM/UPDATE) |
| `qa_post` | post_id | Q&A. author_type·category enum, is_private |
| `admin_response` | response_id | FK post_id → qa_post **(UNIQUE, 1:1 답변)** |
| `chat_message` | id | ⚠️ 독립 테이블(FK 없음) |
| `user_report` | id | ⚠️ reporter_id·target_id **FK 아님(varchar soft 참조)** |

---

## 4. 관계 설계 특징 (발표 포인트)

**핵심 FK 체인 — 운송 라이프사이클**
```
member ─< estimate ─< matching ─1:1─ order_sheet ─1:1─ payment ─1:1─ delivery
                         │                                              │
              cargo_owner┘                                   cargo_owner┘
```

- **1:1 무결성 보장**: order_sheet↔matching, payment↔order_sheet, delivery↔payment, admin_response↔qa_post, review_reply↔review → 모두 UNIQUE FK로 중복 발주/결제/답변 방지
- **물리 FK vs 논리 참조**: `review`, `user_report`, `chat_message`는 DB 레벨 FK 없이 varchar ID로 참조(soft reference) → 결합도↓, 무결성은 애플리케이션 레이어에서 보장
- **enum 컬럼**: 상태값을 DB enum으로 관리 — delivery.status, payment_status, member_coupon.status, user_index.role, social_account.provider, qa_post.author_type/category, notice.category
- **사용자 모델 이원화**: `user_index`(전역 인증/권한/정지) + `member`(화주 프로필)·`cargo_owner`(차주 프로필) 분리 → 인증 관심사와 도메인 프로필 분리
