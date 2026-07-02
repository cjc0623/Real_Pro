# Java 패키지명 변경 계획 (com.giproject → com.firstroad)

작성일: 2026-06-17
관련 문서: [team-name-rename.md](team-name-rename.md) — 이전 팀명 치환 작업에서 **보류**했던 Java 패키지 변경을 본 문서에서 진행.

## 목적
이전 작업(`team-name-rename.md`)에서 "순수 내부 식별자, 기능 영향 없음"으로 보류했던 Java 베이스 패키지 `com.giproject`를 새 팀명(First Road) 기준 `com.firstroad`로 변경.

## 현재 상태 요약
| 항목 | 값 |
|---|---|
| 베이스 패키지 | `com.giproject` (Main: `backend/src/main/java/com/giproject/BackendApplication.java`) |
| `com.giproject` 참조 java 파일 | **250개** |
| `com.giproject` 총 등장 횟수 | **886회** |
| 설정/리소스(properties·yml·xml·gradle) 내 패키지 참조 | **0건** (순수 내부 식별자) |
| 프론트엔드 내 패키지 참조 | **0건** |
| Gradle `group` | `com.example` (패키지와 무관, 영향 없음) |

> 패키지명이 자바 소스 안에서만 쓰이고 properties/yml/gradle/프론트엔드에는 전혀 노출돼 있지 않아, 변경 범위가 **백엔드 `.java` 파일로 한정**됨.

## ⚠️ 가장 주의할 지점: JPQL 문자열 내 FQN
IDE의 "Rename Package"는 package/import 선언은 잡지만 **문자열 리터럴 안에 박힌 패키지 경로**(`@Query`의 JPQL)는 도구에 따라 놓칠 수 있음. 컴파일은 통과하고 **런타임 쿼리 파싱 시점에야 깨지는** 유형이라 특히 위험.

해당 파일:
- `backend/src/main/java/com/giproject/repository/review/ReviewRepository.java`
  - `select new com.giproject.dto.review.ReviewSummaryDTO(...)` 등 JPQL constructor expression 다수
- `backend/src/main/java/com/giproject/repository/delivery/OwnerDeliveryQueryRepository.java`
  - `from com.giproject.entity.matching.Matching`, `com.giproject.entity.delivery.DeliveryStatus.COMPLETED` 등

→ 반드시 텍스트 치환에 포함하고, 변경 후 리뷰/배송 조회 API를 실제 호출해 검증.

## 변경에 따른 고려사항 / 문제점
1. **디렉토리 이동 필수** — 자바는 패키지명 = 디렉토리 경로. 텍스트만 바꾸면 컴파일 불가. `com/giproject/` → `com/firstroad/` 디렉토리째 `git mv`로 이동해야 git 히스토리 보존.
2. **컴포넌트 스캔 자동 추종** — 명시적 `basePackages`/`@EntityScan`/`@EnableJpaRepositories` 설정 없음. `@SpringBootApplication`이 메인 클래스 하위 패키지를 자동 스캔하므로, 메인 클래스 포함 전체가 같은 새 루트로 함께 이동하면 스캔은 자동 추종 (별도 수정 불필요).
3. **머지 충돌 리스크** — 250개 파일 전부 변경. 현재 브랜치(`jw0616`)의 미커밋 변경분 및 타 팀원 브랜치와 대규모 충돌 가능. → 다른 변경을 먼저 커밋/머지하고 깨끗한 상태에서 **단독 커밋**으로 진행 권장.
4. **파일 상단 주석 경로** — 일부 DTO 파일 1번 줄에 `// src/main/java/com/giproject/...` 경로 주석 존재. 기능 영향 없으나 일관성 위해 같이 치환 권장.
5. **JWT/DB 무관** — 이전 작업의 재로그인 이슈는 `jwt.issuer` 변경 때문. 패키지 변경은 토큰/DB에 영향 없는 **순수 코드 리팩터링**. DB 마이그레이션·재로그인 불필요.
6. **빌드 산출물/IDE 캐시** — 변경 후 `build/`·IDE 인덱스에 옛 패키지 클래스 잔존 가능. clean 빌드 권장.

## 수정 불필요 확인 완료
- `application.properties` / `application.yml` — 참조 없음
- `build.gradle` (`group=com.example`로 무관)
- 프론트엔드 전체
- SQL/XML 매핑 파일

## 실행 계획
1. **사전 정리**: 현재 미커밋 변경 + 진행 브랜치를 모두 커밋/머지해 워킹트리 정리 (충돌 최소화)
2. **일괄 치환**: 250개 `.java` 내 `com.giproject` → `com.firstroad` (주석 경로 포함, **JPQL 문자열 FQN 2곳 반드시 포함**)
3. **디렉토리 이동**: `git mv backend/src/main/java/com/giproject backend/src/main/java/com/firstroad`
4. **clean 빌드**: `./gradlew clean compileJava` → BUILD SUCCESSFUL 확인
5. **런타임 검증**: 앱 기동 + 리뷰/배송 조회 등 JPQL 의존 기능 실제 호출
6. **잔여 확인**: `grep -rn "giproject" backend/src` → 0건
7. **단독 커밋**: 다른 변경과 섞지 않고 "패키지 rename" 단일 커밋
