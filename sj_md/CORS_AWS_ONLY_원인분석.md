# 왜 지도 CORS 버그가 AWS에서만 터졌나 — 원인 분석

> 작성일: 2026-07-14
> 대상: `FIXES_0622.md` #1 (지도 클릭/거리계산 CORS 차단)
> 질문: 동일 코드가 Vercel / Render / Local 에서는 멀쩡했는데 왜 **AWS 배포에서만** CORS 에러가 났나?
> 조사 방법: 커밋 히스토리(`git log`/`git show`) + 프론트/백엔드 소스 대조

---

## 결론 (한 줄)

**AWS 인프라가 특별해서가 아니라, 버그를 유발하는 코드(백엔드 지도 프록시 `/fr/maps/**`)가 이전 세대(Vercel/Render/Local)에는 아예 없었기 때문.**
즉 "AWS에서만 발생"이 아니라 **"새 프록시 코드가 실제 브라우저에서 처음 돌아간 환경이 AWS"** 였던 것.

---

## 1. 버그의 실제 메커니즘 — ACAO 헤더 2개

에러:
```
Access-Control-Allow-Origin header contains multiple values
'http://localhost:3000, *', but only one is allowed.  → Failed to fetch
```

응답에 `Access-Control-Allow-Origin`(ACAO) 이 **두 개** 들어감:

| 값 | 출처 |
|---|---|
| `<프론트 오리진>` | 우리 **Spring Security CORS 필터**가 붙임 (`SecurityConfig.corsConfigurationSource`) |
| `*` | **Kakao API 응답 헤더**를 프록시가 그대로 전달 |

`MapProxyController.proxyGet()` 이 `restTemplate.exchange(...)` 의 `ResponseEntity` 를 **헤더까지 그대로 반환** → Kakao 의 `ACAO: *` 가 우리 필터 값과 겹침 → 브라우저가 "multiple values" 로 차단.
(응답 본문/상태는 `200 OK` 인데 **브라우저 레벨에서만** 막혀 `Failed to fetch`.)

---

## 2. 왜 예전엔(Vercel/Render/Local) 없었나 — 커밋 증거

### 결정적 커밋: `53274a2 "sj_md 참조"` (2026-06-24)

`front/src/layout/component/common/calculateDistanceBetweenAddresses.js` diff:

```diff
-const REST_API_KEY = "d381d00137ba5677a3ee0355c4c95abf";
+import { API_BASE } from '../../../config';
   ...
-  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=...`;
-  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } });
+  const url = `${API_BASE}/fr/maps/geocode?query=...`;
+  const res = await fetch(url);
```

- **프록시 도입 전**: 브라우저가 **Kakao(`dapi.kakao.com`)를 직접 호출**.
  이 경로엔 우리 Spring 백엔드가 끼지 않음 → ACAO 는 Kakao 가 준 `*` **딱 하나** → 충돌 없음
  → 어느 프론트 호스트(Vercel/Render/Local)에서든 정상.
- **프록시 도입 후**: 브라우저 → 우리 백엔드(`${API_BASE}/fr/maps/**`) → Kakao.
  Spring CORS 필터의 ACAO + (미수정 프록시가 흘려보낸) Kakao 의 `ACAO: *` → 값 2개 → 차단.

### 프록시는 신규 파일

- `MapProxyController.java` 의 git 히스토리 = **`53274a2` 단 하나** → 이 커밋에서 처음 생성.
- `FIXES_0622.md` #4 에도 "신규 추가: MapProxyController" 로 기록.

➡ **Vercel/Render 는 "직접-Kakao 호출" 세대라, 이 버그 코드를 실행한 적이 자체가 없음.**

---

## 3. 왜 하필 AWS에서 터졌나

- 메모리/README 근거: README(55행)는 아직 `first-road.vercel.app`(구주소), 실제 운영은 **전부 AWS 로 마이그레이션**됨.
- **Kakao REST 키 은닉을 위한 보안 리팩터링(프록시 도입)** 과 **Vercel→AWS 마이그레이션**이 같은 시기에 진행.
- 따라서 프록시 방식 코드가 **실사용 브라우저 환경에서 처음 노출된 게 AWS 배포**.
- AWS 에서는 **프론트 오리진 ≠ 백엔드 오리진(크로스 오리진)** → 브라우저가 CORS 를 실제 강제 → ACAO 2개가 즉시 표면화.

---

## 4. Local / curl 에서 안 걸린 이유 (중요)

- `FIXES_0622.md` 의 검증은 **`curl -D -`** 로 수행.
- **CORS 는 브라우저만 강제하고 `curl` 은 ACAO 헤더를 무시**한다.
- 그래서 서버측/curl 검증에서는 200 이 잘 떨어져 "정상"으로 보이고,
  헤더가 2개인 문제는 **실제 브라우저(= 배포된 AWS)에서만** 드러남.
- 로컬에서 curl·백엔드 직접 테스트로만 확인하는 관행이 이 회귀를 사전에 놓친 지점.

> 참고: 로컬 dev 프록시(`front/src/setupProxy.js`)는 `/api` 만 프록시하고 `/fr` 은 프록시하지 않음.
> 지도 호출은 `API_BASE`(기본 `http://localhost:8080`)로 직접 감 → 로컬도 원리상 크로스 오리진이나,
> 브라우저가 아닌 curl 로 검증했기에 표면화되지 않았음.

---

## 5. 조치 (참고)

`MapProxyController.proxyGet()` 이 업스트림(Kakao) 응답 헤더를 **버리고**,
**상태코드 + `application/json` Content-Type + 본문만** 새로 담아 반환하도록 수정
(성공 / HTTP 오류 / 예외 3개 경로 전부). → ACAO 는 우리 CORS 필터 값 하나만 남음.

```java
return ResponseEntity.status(resp.getStatusCode())
        .contentType(MediaType.APPLICATION_JSON)
        .body(resp.getBody());   // ← 업스트림 헤더 미전달
```

---

## 타임라인 요약

| 시점 | 배포 | 지도 호출 방식 | CORS 결과 |
|---|---|---|---|
| ~2026-06-24 이전 | Vercel/Render/Local | 브라우저 → **Kakao 직접** | ACAO 1개(`*`) → 정상 |
| 2026-06-24 (`53274a2`) | AWS 마이그레이션 + 보안 리팩터링 | 브라우저 → **백엔드 프록시** → Kakao | ACAO 2개 → **브라우저 차단** |
| 수정 후 | AWS | 프록시가 업스트림 헤더 폐기 | ACAO 1개 → 정상 |

**핵심**: 인프라 차이가 아니라 **코드 세대 차이**. 프록시(버그 원인)가 AWS 세대에서 처음 실행됐고, 이전 검증이 CORS 를 강제하지 않는 curl 이라 사전에 못 잡았다.
