# 팀명 치환 작업 정리 (g2i / GiProject → fr / FR)

작업일: 2026-06-16

## 목적
backend/front 소스에 박혀 있던 팀명(`g2i4`, `giproject`, `GiProject`)을 새 팀명(First Road → `fr` / `FR`)으로 변경.

## 변경 범위 결정
| 항목 | 변경 여부 | 비고 |
|---|---|---|
| `/g2i4` URL 접두사 | ✅ `/fr`로 변경 | 프론트+백엔드 API 계약, 동시 변경 |
| `jwt.issuer=giproject` | ✅ `fr`로 변경 | 변경 시 기존 발급 JWT 무효화 → **재로그인 1회 필요** (재회원가입 아님) |
| 메일 제목 `[GiProject]` | ✅ `[FR]`로 변경 | 표시용 텍스트 |
| Java 패키지 `com.giproject` | ❌ 유지 | 순수 내부 식별자, 기능 영향 없어 그대로 둠 |

## 1. URL 접두사 `/g2i4` → `/fr`
backend/src + front/src 합쳐 **69개 파일** 일괄 치환.
- 백엔드: 컨트롤러 `@RequestMapping("/g2i4/...")`, 신규 업로드 저장 경로(`webPath`) 등
- 프론트: axios 호출 경로, 이미지 URL 빌더(`${API_BASE}/g2i4/...`), `MemberAdmin.js`의 `PREFIX` 등

## 2. 하위호환 처리 (기존 DB 이미지 보존)
기존 업로드 이미지는 DB 컬럼에 `/g2i4/uploads/...` 문자열로 저장되어 있어, 구경로를 **읽기용으로 유지**.
- `backend/.../config/ResourceConfig.java` — `/g2i4/uploads/**` 정적 핸들러 3개 추가
- `backend/.../config/WebConfig.java` — `/g2i4/uploads/**` 핸들러 추가
- `backend/.../config/SecurityConfig.java` — `/g2i4/uploads/**` permitAll 추가
- `backend/.../security/JwtAuthenticationFilter.java` — `/g2i4/uploads/**` JWT 검사 제외 추가

> 신규 업로드 → `/fr/uploads/...` 저장·서빙, 과거 데이터 → `/g2i4/uploads/...`로 계속 서빙.
> (추후 DB의 기존 경로를 `/g2i4/`→`/fr/`로 UPDATE 마이그레이션하면 이 하위호환 4곳을 제거하고 완전 통일 가능)

## 3. jwt.issuer 변경
- `backend/src/main/resources/application.properties` — `jwt.issuer=fr`
- `backend/.../security/JwtService.java` — `@Value("${jwt.issuer:fr}")` 기본값

## 4. 메일 태그 변경
- `backend/.../email/EmailVerificationService.java` — `"[FR] 이메일 인증코드"`

## 검증 결과
- 잔여 `/g2i4`: 의도한 하위호환 항목(이미지 경로)만 남음
- `GiProject` / `issuer giproject`: 0건
- 백엔드 `compileJava` BUILD SUCCESSFUL
- 프론트: 로그인·주요 API 모두 200, Network 요청 `/fr/...` 정상
- git diff 정밀 검사: 순수 치환 + 의도한 하위호환 편집만 존재 (찌꺼기 없음)

## 배포 시 참고
- issuer 변경으로 기존 로그인 사용자는 **재로그인 1회 필요**. 계정 데이터(아이디/비번/프로필)는 그대로 유지됨.
- 브라우저에 남은 옛 토큰이 401을 유발하면 Local Storage/쿠키의 토큰 삭제 후 재로그인.
