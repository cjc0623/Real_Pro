# 보안 후속 처리 내역 (3차) — 비밀번호 재설정 흐름 하드닝

> 작성일: 2026-07-02
> 범위: 비밀번호 재설정(`/api/auth/password-reset/**`) 흐름의 보안 결함 4건
> 검증: 백엔드 `gradlew compileJava` → **BUILD SUCCESSFUL** (경고만, JAVA_HOME=Zulu 21)

---

## 배경

코드 리뷰에서 비밀번호 재설정 흐름(이번 브랜치 신규)에 실질적 보안 결함 4건을 확인하여 처리했다.
모두 `service/auth/PasswordResetService.java` + `controller/PasswordResetController.java` 2파일 범위의 surgical 수정이며, **프론트(`FindPasswordComponent.js`)는 변경 없음**(응답을 `data?.message`로만 표시하고 옛 에러코드를 하드코딩하지 않아 호환됨).

---

## ✅ 처리 완료

### 1. 인증코드·이메일 평문 로깅 제거 🔴
이전: 챌린지 발급 시 **인증코드와 이메일을 INFO 레벨로 평문 로깅** → 운영 로그 접근만으로 임의 계정 비밀번호 재설정 가능(2차에서 로깅을 INFO로 하향했기에 실제 출력됨).
```java
// before
log.info("[PWD_RESET] issue challenge id={}, loginId={}, email={}, code={}", id, loginId, email, code);
// after — 식별용 id/loginId만
log.info("[PWD_RESET] challenge issued id={}, loginId={}", id, loginId);
```
> `sendCodeEmail()`의 `JavaMailSender 미구성`(개발) 경로 로그는 **메일이 없을 때 코드를 확인할 유일한 수단**이라 유지. 운영은 mailSender가 구성되어 이 경로가 실행되지 않음.

### 2. 사용자 열거(enumeration) 차단 — **동일 문구 + 동일 시간** 🔴
이전: `NO_SUCH_USER`(회원 없음) vs `EMAIL_NOT_MATCH`(이메일 불일치)를 **구분 응답** → 아이디 존재 여부 식별 가능. 또한 일치 시에만 메일을 **동기 발송**해 응답 시간(SMTP 지연)으로도 존재 여부 추정 가능.

- **문구 통일**: 존재/일치 여부와 무관하게 항상 `200 OK` + `{ challengeId, maskedEmail, ttlSeconds }` 반환.
  - 불일치·미존재 시에도 **디코이 챌린지를 저장**(응답 형태 동일), 단 코드는 미발송 → `verify` 단계에서 동일하게 실패.
  - `maskedEmail`은 **입력 이메일** 기준 마스킹 → 서버가 저장된 이메일을 확인해 주지 않음.
  - 컨트롤러의 `NO_SUCH_USER`/`EMAIL_NOT_MATCH` 분기 **제거**.
- **시간 통일**: 실제 메일 발송을 **비동기(`CompletableFuture.runAsync`)** 로 전환 → SMTP 왕복이 응답 시간에 반영되지 않음. 유효/무효 경로 모두 `findById` + 챌린지 저장 + 반환으로 동일.
```java
// 예외 없이 판정(조기 return 금지 → 타이밍 균일)
boolean valid = memberRepository.findById(loginId)
        .map(m -> m.getMemEmail() != null && m.getMemEmail().equalsIgnoreCase(email))
        .orElse(false);
Challenge ch = issueChallenge(loginId, email);          // 항상 발급(디코이 포함)
final boolean send = valid; final String code = ch.code();
CompletableFuture.runAsync(() -> { if (send) sendCodeEmail(email, code); }); // 일치 시에만, 비동기
return new IssueResult(ch.id(), maskEmail(email), ch.getTtlSeconds());
```
> ⚠️ **동작(UX) 변화**: 존재하지 않는 아이디/오타 이메일도 "인증코드 전송" 화면으로 진행되고 코드가 오지 않는다. 이는 열거 방지를 위한 **의도된 동작**이다.

### 3. 무차별 대입 / 이메일 폭탄 방지 🔴
이전: `verify`에 **시도 횟수 제한이 없어** 6자리 코드(100만 조합)를 TTL(180초) 내 반복 대입 가능. `request`도 **스로틀이 없어** 이메일 폭탄 가능.

- **코드 검증 시도 제한**: 챌린지당 `attempts`(AtomicInteger) **5회 초과 시 챌린지 폐기** → 이후 시도는 모두 동일 실패(`INVALID_OR_EXPIRED_CODE`).
- **재요청 쿨다운**: 동일 `loginId` **60초 이내 재요청 시 `429 TOO_MANY_REQUESTS`**. **입력 아이디 기준**이라 계정 존재 여부를 드러내지 않음(열거와 직교).
- **상수시간 비교**: 코드 대조를 `Objects.equals` → `MessageDigest.isEqual`(constant-time)로 교체(타이밍 완화, defense-in-depth).
```java
if (ch.attempts().incrementAndGet() > MAX_VERIFY_ATTEMPTS) { store.remove(challengeId); return Optional.empty(); }
if (!constantTimeEquals(ch.code(), code)) { return Optional.empty(); }
```
> 조합: 쿨다운(60초/재요청) × 시도 5회 → 계정당 실질 대입 속도가 **~5회/60초**로 제한됨.

### 4. 서버측 비밀번호 정책 검증 🔴
이전: 백엔드 `complete`는 `newPassword`의 **blank 여부만** 확인 → 정책(8~20자, 영문+숫자+특수)이 **React 폼에만** 존재해 직접 API 호출로 우회 가능(약한 비밀번호 저장).

- `completeReset()`에서 **프론트(`usePasswordForm`)와 동일한 정규식**으로 서버측 재검증, 위반 시 `WEAK_PASSWORD`(400).
```java
private static final Pattern PW_POLICY = Pattern.compile(
        "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@*_#$%^&?])[A-Za-z\\d!@*_#$%^&?]{8,20}$");
```
- 컨트롤러 `complete`에서 `WEAK_PASSWORD`와 `INVALID_RESET_TOKEN`을 구분 안내(둘 다 계정 존재 여부는 미노출).

---

## 검증
- 백엔드 `gradlew compileJava` → **BUILD SUCCESSFUL** (deprecation/unchecked 경고는 기존 코드베이스 것, 이번 변경 무관)
- 참조 정합성: 옛 에러코드 `NO_SUCH_USER`/`EMAIL_NOT_MATCH`가 프론트·백 어디서도 미참조 확인 → 프론트 무변경 호환
- ⚠️ 런타임 E2E(정상 재설정 / 5회 초과 잠금 / 60초 쿨다운 / 미존재 계정 동일응답)는 실제 메일·계정 필요 → **브라우저 테스트 권장**

---

## ⏸️ 보류 / 후속 (사유)

| 항목 | 사유 / 권장 |
|---|---|
| **per-IP 스로틀** | 현재 쿨다운은 per-`loginId`만 → 다수 계정을 순회하는 공격 완화엔 IP 기준 추가 필요. `HttpServletRequest` 배선 필요 → 별도 처리 |
| **인메모리 → Redis** | `store`/`lastRequestAt`/시도 카운트가 인메모리라 **다중 인스턴스·재기동 시 미지속**(기존 문서에도 명시된 한계). 만료 디코이 챌린지는 접근 시 lazy 제거만 되고 주기적 eviction 미구현 → 운영은 Redis + TTL 권장 |
| **프론트 문구 매핑** | `WEAK_PASSWORD`/`TOO_MANY_REQUESTS` raw 코드가 `alert`로 노출될 수 있음. 다만 정상 흐름에선 프론트 검증(버튼 비활성)·재전송 60초 쿨다운으로 거의 도달하지 않음 → 사용자 친화 메시지 매핑은 **선택적 후속** |

---

## 변경 파일
**백엔드 (수정)**: `service/auth/PasswordResetService.java`, `controller/PasswordResetController.java`
