# Cargo 생성일시(@Builder) 문제 정리

> 대상 파일: `src/main/java/com/giproject/entity/cargo/Cargo.java`
> 작성일: 2026-06-15

## 1. 문제점

`Cargo` 엔티티는 클래스에 `@Builder`가 붙어 있는데, 생성일시 필드에 초기값만 주고 `@Builder.Default`가 없었다.

```java
@Builder
public class Cargo {
    ...
    @Column(name = "cargo_created_datetime")
    private LocalDateTime cargoCreateidDateTime = LocalDateTime.now(); // ❌ @Builder.Default 없음
}
```

### 증상
- 컴파일 시 경고 발생 → VSCode/STS 탐색기 `backend` 폴더에 **빨간 배지 "1"** 표시.
  ```
  warning: @Builder will ignore the initializing expression entirely.
  If you want the initializing expression to serve as default, add @Builder.Default ...
  ```

### 왜 문제인가 (실제 동작)
`@Builder`가 붙으면 빌더로 객체를 만들 때 **필드 초기값(`= LocalDateTime.now()`)을 무시**한다. 그래서 생성 경로마다 결과가 달라졌다.

| 생성 경로 | 위치 | 수정 전 동작 |
|---|---|---|
| `Cargo.builder()...build()` | `config/DataLoader.java` (초기 시드 데이터) | 초기값 무시 → 생성일시 **null** ❌ |
| `new Cargo()` + setter | `controller/CargoController.java` (실제 차주 등록) | 일반 생성자라 초기값 실행 → 현재시각 정상 ✅ |

즉 **빌더로 만든 데이터만 생성일시가 null**이 되는 일관성 문제가 있었다.

---

## 2. 적용한 해결법 (1번: `@Builder.Default`)

필드에 `@Builder.Default`를 추가해, 빌더 경로에서도 초기값이 적용되도록 했다.

```java
@Column(name = "cargo_created_datetime")
@Builder.Default
private LocalDateTime cargoCreateidDateTime = LocalDateTime.now();
```

### 효과
- 컴파일 경고 제거 → 빨간 배지 "1" 사라짐 (`BUILD SUCCESSFUL`로 확인).
- `Cargo.builder()` 경로도 이제 현재시각이 들어가서 **두 생성 경로가 일관됨**.

### 동작 방식 / 특성
- 값이 채워지는 시점: **자바 객체를 만드는 순간**(`build()` 또는 `new Cargo()`), 즉 DB 저장 전 메모리 단계.
- 장점: 변경 최소(1줄), 기존 코드 흐름 그대로 유지.
- 한계: "객체 생성 시각"이지 "DB insert 시각"은 아니다. 객체를 만들어두고 한참 뒤에 저장하면 생성 시점 기준 시각이 찍힌다. (보통은 거의 동일해서 문제 없음)

---

## 3. 향후 변경안 (2번: DB 저장 시점에 채우기)

생성일시를 **DB insert 시점에, 생성 방법과 무관하게 한 곳에서** 채우고 싶을 때 사용한다. "등록일시" 같은 audit 컬럼의 정석 방식.

### 방법 A — `@PrePersist`
```java
@Column(name = "cargo_created_datetime", updatable = false)
private LocalDateTime cargoCreateidDateTime;   // 초기값 제거

@PrePersist
public void prePersist() {
    this.cargoCreateidDateTime = LocalDateTime.now();
}
```

### 방법 B — Hibernate `@CreationTimestamp` (어노테이션 한 줄)
```java
@org.hibernate.annotations.CreationTimestamp
@Column(name = "cargo_created_datetime", updatable = false)
private LocalDateTime cargoCreateidDateTime;   // 초기값 제거
```

### 특성
- 값이 채워지는 시점: JPA가 **DB에 insert 하기 직전**(`save()` 시점). builder/new 등 생성 방법과 **무관하게 항상** 채워짐.
- 장점: 생성일시 로직이 한 곳에만 있어 어떤 경로로 만들어도 누락 불가. 실제 저장 시각이 정확히 기록됨.
- 한계: `save()` 전에는 값이 **null**. DB를 거치지 않는 단순 메모리 객체에는 채워지지 않음.
- 2번으로 전환 시 주의: `@Builder.Default`와 초기값(`= LocalDateTime.now()`)은 제거하고, `updatable = false`로 이후 수정 방지 권장.

---

## 요약

| 구분 | 1번 `@Builder.Default` (적용됨) | 2번 `@PrePersist` / `@CreationTimestamp` (향후) |
|---|---|---|
| 채우는 시점 | 자바 객체 생성 시 | DB insert 시 |
| 적용 범위 | builder + new 모두 | 모든 저장 경로 (정석) |
| 변경량 | 1줄 | 초기값 제거 + 로직 추가 |
| 권장 상황 | 빠르게 경고/버그 제거 | 정확한 등록일시 audit 필요 시 |
