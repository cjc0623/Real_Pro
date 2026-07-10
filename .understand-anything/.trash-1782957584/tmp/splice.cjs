const fs = require("fs");
const GRAPH = ".understand-anything/knowledge-graph.json";
const g = JSON.parse(fs.readFileSync(GRAPH, "utf8"));
const struct = JSON.parse(fs.readFileSync(".understand-anything/tmp/struct-output.json", "utf8"));

const BE = "backend/src/main/java/com/giproject/";
const FE = "front/src/";

// lineRange lookup from deterministic extractor
function range(path, kind, name) {
  const r = struct.results.find((x) => x.path === path);
  if (!r) return undefined;
  const arr = kind === "class" ? r.classes : r.functions;
  const s = (arr || []).find((x) => x.name === name);
  return s ? [s.startLine, s.endLine] : undefined;
}

const W = { contains: 1, implements: 0.9, calls: 0.8, imports: 0.7, depends_on: 0.6 };

// ---- NEW files: file node + selected symbol nodes ----
const newFiles = {
  [BE + "controller/notification/NotificationController.java"]: {
    type: "file", name: "NotificationController.java", complexity: "simple",
    summary: "헤더 프로필 아바타 알림 뱃지용 REST 컨트롤러. /fr/notifications/summary 에서 로그인 사용자의 역할별 '확인 필요' 요약(NotificationSummaryDTO)을 반환하며 SecurityConfig의 anyRequest().authenticated()로 보호된다.",
    tags: ["controller", "api-handler", "notification", "rest"],
    symbols: [
      { kind: "class", name: "NotificationController", complexity: "simple",
        summary: "알림 요약 조회 REST 엔드포인트를 제공하는 컨트롤러.", tags: ["controller", "notification"] },
      { kind: "function", name: "summary", complexity: "simple",
        summary: "로그인 사용자의 역할별 '확인 필요' 알림 요약을 조회해 반환하는 핸들러.", tags: ["api-handler", "notification"] },
    ],
  },
  [BE + "service/notification/NotificationService.java"]: {
    type: "file", name: "NotificationService.java", complexity: "simple",
    summary: "로그인 사용자의 역할별(SHIPPER/DRIVER/ADMIN) '확인 필요' 알림 요약을 제공하는 서비스 인터페이스.",
    tags: ["service", "interface", "notification"],
    symbols: [
      { kind: "class", name: "NotificationService", complexity: "simple",
        summary: "역할별 알림 요약 제공 계약을 정의하는 서비스 인터페이스.", tags: ["service", "interface", "notification"] },
    ],
  },
  [BE + "service/notification/NotificationServiceImpl.java"]: {
    type: "file", name: "NotificationServiceImpl.java", complexity: "complex",
    summary: "역할별 '확인 필요' 신호를 집계하는 알림 서비스 구현체. ADMIN(미확인 신고·미답변 문의·차량 승인대기), DRIVER(배송 시작대기·받은 직접요청·리뷰·승인차량), SHIPPER(수락 후 결제전·배송완료)를 여러 리포지토리에서 카운트해 hasAlert/total/items로 반환하고, 집계 실패 시에도 화면을 막지 않도록 안전 폴백한다.",
    tags: ["service", "notification", "aggregation", "권한관리"],
    symbols: [
      { kind: "class", name: "NotificationServiceImpl", complexity: "complex",
        summary: "역할별 확인필요 신호를 리포지토리에서 집계하는 알림 서비스 구현체.", tags: ["service", "notification", "aggregation"] },
      { kind: "function", name: "getSummary", complexity: "complex",
        summary: "인증 주체의 역할을 판별해 역할별 카운트를 집계하고 NotificationSummaryDTO로 반환하는 핵심 메서드.", tags: ["notification", "aggregation", "권한관리"] },
    ],
  },
  [BE + "dto/notification/NotificationSummaryDTO.java"]: {
    type: "file", name: "NotificationSummaryDTO.java", complexity: "simple",
    summary: "헤더 알림 뱃지용 요약 DTO. hasAlert(빨간점 여부), total(합계), role(역할), items(항목별 건수)를 담는다.",
    tags: ["dto", "notification", "serialization"],
    symbols: [
      { kind: "class", name: "NotificationSummaryDTO", complexity: "simple",
        summary: "알림 요약 응답 필드(hasAlert/total/role/items)를 담는 DTO.", tags: ["dto", "notification"] },
    ],
  },
  [BE + "entity/auth/RevokedToken.java"]: {
    type: "file", name: "RevokedToken.java", complexity: "simple",
    summary: "폐기(revoke)된 refresh 토큰의 식별자(jti)와 만료시각을 저장하는 JPA 엔티티(revoked_token 테이블). 로그아웃·토큰 회전 시 등록해 재사용을 차단한다.",
    tags: ["entity", "auth", "security", "jpa"],
    symbols: [
      { kind: "class", name: "RevokedToken", complexity: "simple",
        summary: "폐기된 refresh 토큰의 jti·만료시각을 저장하는 엔티티.", tags: ["entity", "auth", "security"] },
    ],
  },
  [BE + "repository/auth/RevokedTokenRepository.java"]: {
    type: "file", name: "RevokedTokenRepository.java", complexity: "simple",
    summary: "폐기된 refresh 토큰(jti) 저장소. 존재 여부 확인(existsById)과 만료기록 정리(deleteExpired)를 제공하는 Spring Data JPA 리포지토리.",
    tags: ["repository", "auth", "security", "jpa"],
    symbols: [
      { kind: "class", name: "RevokedTokenRepository", complexity: "simple",
        summary: "폐기 토큰 jti 저장·조회·만료정리를 담당하는 JPA 리포지토리.", tags: ["repository", "auth", "security"] },
    ],
  },
  [BE + "service/auth/TokenBlacklistService.java"]: {
    type: "file", name: "TokenBlacklistService.java", complexity: "simple",
    summary: "refresh 토큰 서버측 폐기(blacklist) 서비스. jti 기준으로 폐기 여부 확인(isRevoked)과 폐기 등록(revoke)을 담당해 토큰 회전·로그아웃 시 재사용을 차단한다.",
    tags: ["service", "auth", "security"],
    symbols: [
      { kind: "class", name: "TokenBlacklistService", complexity: "simple",
        summary: "refresh 토큰의 jti 기반 서버측 폐기(blacklist)를 관리하는 서비스.", tags: ["service", "auth", "security"] },
      { kind: "function", name: "isRevoked", complexity: "simple",
        summary: "주어진 jti가 폐기 목록에 등록되어 있는지 확인한다.", tags: ["auth", "security"] },
      { kind: "function", name: "revoke", complexity: "simple",
        summary: "jti를 만료시각과 함께 폐기 목록에 등록한다(구버전·중복은 무시).", tags: ["auth", "security"] },
    ],
  },
  [FE + "api/axiosSetup.js"]: {
    type: "file", name: "axiosSetup.js", complexity: "moderate",
    summary: "전역 HTTP 설정 모듈. 백엔드(API_BASE)로 가는 axios·fetch 요청에 sessionStorage의 JWT를 자동 부착하는 인터셉터를 설치한다(백엔드 인가 강화 대응, 외부 도메인엔 미부착으로 토큰 유출 방지).",
    tags: ["api", "http", "auth", "interceptor"],
    symbols: [],
  },
  [FE + "api/notificationApi.js"]: {
    type: "file", name: "notificationApi.js", complexity: "simple",
    summary: "알림 요약 API 클라이언트. /fr/notifications/summary 를 Authorization 헤더(JWT)로 호출해 역할별 '확인 필요' 요약을 가져온다(쿠키 미사용으로 연속 로그인 시 계정 혼선 방지).",
    tags: ["api", "notification", "http"],
    symbols: [
      { kind: "function", name: "getNotificationSummary", complexity: "simple",
        summary: "알림 요약 엔드포인트를 호출해 items 등 요약 데이터를 반환하는 API 함수.", tags: ["api", "notification"] },
    ],
  },
  [FE + "hooks/useNotificationSummary.js"]: {
    type: "file", name: "useNotificationSummary.js", complexity: "complex",
    summary: "역할별 '확인 필요' 알림 요약을 불러오는 공용 React 훅. 헤더 통합 점·사이드바 메뉴 점에서 사용하며 60초 폴링+포커스/가시성 복귀+authChanged 이벤트로 갱신하고, localStorage read-state(항목별 markSeen/hasNew)로 새로 생긴 항목만 점을 켠다.",
    tags: ["hook", "notification", "react", "polling"],
    symbols: [
      { kind: "function", name: "useNotificationSummary", complexity: "complex",
        summary: "알림 요약 조회·폴링·read-state 관리를 캡슐화한 훅 본체(hasAlert/items/hasNew/markSeen/refresh 반환).", tags: ["hook", "notification", "react"] },
      { kind: "function", name: "decodeTokenSub", complexity: "moderate",
        summary: "JWT payload에서 실제 로그인 계정 식별자(memId/cargoId/sub)를 추출한다(계정 전환 stale 방지).", tags: ["auth", "jwt"] },
    ],
  },
};

// ---- EXISTING file-node summary/tag refresh ----
const MARK = " "; // append marker guard uses substring check
const existingUpdates = {
  [BE + "repository/cargo/CargoRepository.java"]: { add: "알림 뱃지용 상태별 차량 카운트 쿼리(countByStatus, countByCargoOwner_CargoIdAndStatus)를 제공한다.", tags: ["notification"] },
  [BE + "repository/delivery/DeliveryRepository.java"]: { add: "알림 뱃지용 회원별 상태 배송 카운트 쿼리(countByMemberAndStatus)를 제공한다.", tags: ["notification"] },
  [BE + "repository/matching/DirectRequestRepository.java"]: { add: "알림 뱃지용 차주별 요청상태 카운트 쿼리(countByCargoOwner_CargoIdAndStatus)를 제공한다.", tags: ["notification"] },
  [BE + "repository/matching/MatchingRepository.java"]: { add: "알림 뱃지용 '수락 후 결제 전' 매칭 카운트 쿼리(countAcceptedAwaitingPaymentByMember)를 제공한다.", tags: ["notification"] },
  [BE + "repository/qaboard/QAPostRepository.java"]: { add: "알림 뱃지용 미답변 문의 카운트 쿼리(countUnansweredInquiries)를 제공한다.", tags: ["notification"] },
  [BE + "repository/review/ReviewRepository.java"]: { add: "알림 뱃지용 대상 차주 수신 리뷰 카운트 쿼리(countByTargetCargoId)를 제공한다.", tags: ["notification"] },
  [BE + "security/JwtService.java"]: { add: "refresh 토큰에 jti(폐기 식별자)를 부여하고 만료시각 조회(getJti/getExpiresAt)를 지원해 서버측 blacklist를 뒷받침한다.", tags: [] },
  [BE + "controller/TokenAuthController.java"]: { add: "refresh 토큰 회전 시 기존 토큰을 서버측 폐기(blacklist)하고 로그아웃 시에도 폐기해 재사용을 차단한다.", tags: [] },
  [FE + "common/ResponsiveAppBar.js"]: { add: "프로필 아바타에 알림 통합 빨간점(useNotificationSummary)을 표시한다.", tags: ["notification"] },
  [FE + "common/Sidebar.js"]: { add: "메뉴 우측에 알림 행동필요 빨간점(useNotificationSummary)을 표시한다.", tags: ["notification"] },
  [FE + "common/AdminSidebar.js"]: { add: "차량 승인대기·미답변 문의 등 알림 빨간점을 메뉴에 표시하고 진입 시 markSeen으로 끈다.", tags: ["notification"] },
  [FE + "common/BottomNav.jsx"]: { add: "알림 행동필요 항목을 빨간점 뱃지로 표시한다(Sidebar에서 props 전달).", tags: ["notification"] },
  [FE + "common/AdminBottomNav.jsx"]: { add: "탭에 알림 빨간점 뱃지를 표시한다.", tags: ["notification"] },
  [FE + "hooks/useAuth.js"]: { add: "로그인/로그아웃 시 authChanged 이벤트를 발행해 알림 요약을 갱신시킨다.", tags: ["notification"] },
};

// ---- NEW edges ----
const NC = BE + "controller/notification/NotificationController.java";
const NS = BE + "service/notification/NotificationService.java";
const NSI = BE + "service/notification/NotificationServiceImpl.java";
const NDTO = BE + "dto/notification/NotificationSummaryDTO.java";
const RT = BE + "entity/auth/RevokedToken.java";
const RTR = BE + "repository/auth/RevokedTokenRepository.java";
const TBS = BE + "service/auth/TokenBlacklistService.java";
const TAC = BE + "controller/TokenAuthController.java";
const repos = ["repository/cargo/CargoRepository.java", "repository/delivery/DeliveryRepository.java",
  "repository/matching/DirectRequestRepository.java", "repository/matching/MatchingRepository.java",
  "repository/qaboard/QAPostRepository.java", "repository/review/ReviewRepository.java"].map((p) => BE + p);
const URS = BE + "service/report/UserReportService.java";
const F = (p) => "file:" + p;
const C = (p, n) => "class:" + p + ":" + n;
const FN = (p, n) => "function:" + p + ":" + n;

const newEdges = [];
const E = (s, t, type) => newEdges.push({ source: s, target: t, type, direction: "forward", weight: W[type] });

// backend wiring
E(F(NC), F(NS), "imports"); E(F(NC), F(NS), "depends_on");
E(F(NC), F(NDTO), "imports");
E(F(NSI), F(NS), "implements");
repos.forEach((r) => { E(F(NSI), F(r), "imports"); E(F(NSI), F(r), "depends_on"); });
E(F(NSI), F(URS), "imports"); E(F(NSI), F(URS), "depends_on");
E(F(NSI), F(NDTO), "imports");
E(F(RTR), F(RT), "imports"); E(F(RTR), F(RT), "depends_on");
E(F(TBS), F(RTR), "imports"); E(F(TBS), F(RTR), "depends_on");
E(F(TBS), F(RT), "imports");
E(F(TAC), F(TBS), "imports"); E(F(TAC), F(TBS), "depends_on");
// frontend wiring
const NAPI = FE + "api/notificationApi.js";
const UNS = FE + "hooks/useNotificationSummary.js";
const SVC = FE + "api/serverConfig.js";
const CFG = FE + "config.js";
const AX = FE + "api/axiosSetup.js";
E(F(NAPI), F(SVC), "imports"); E(F(NAPI), F(SVC), "depends_on");
E(F(UNS), F(NAPI), "imports"); E(F(UNS), F(NAPI), "depends_on");
E(F(AX), F(CFG), "imports"); E(F(AX), F(CFG), "depends_on");
[FE + "common/ResponsiveAppBar.js", FE + "common/Sidebar.js", FE + "common/AdminSidebar.js"].forEach((c) => {
  E(F(c), F(UNS), "imports"); E(F(c), F(UNS), "depends_on");
});

// ================= APPLY =================
const nodeIds = new Set(g.nodes.map((n) => n.id));
let addedNodes = 0, addedEdges = 0, updated = 0;

for (const [path, spec] of Object.entries(newFiles)) {
  const fid = F(path);
  if (!nodeIds.has(fid)) {
    g.nodes.push({ id: fid, type: spec.type, name: spec.name, filePath: path, summary: spec.summary, tags: spec.tags, complexity: spec.complexity });
    nodeIds.add(fid); addedNodes++;
  }
  for (const s of spec.symbols) {
    const id = s.kind === "class" ? C(path, s.name) : FN(path, s.name);
    const lr = range(path, s.kind, s.name);
    if (!nodeIds.has(id)) {
      const node = { id, type: s.kind, name: s.name, filePath: path, summary: s.summary, tags: s.tags, complexity: s.complexity };
      if (lr) node.lineRange = lr;
      g.nodes.push(node); nodeIds.add(id); addedNodes++;
    }
    // contains edge file->symbol (class) or class->fn
    if (s.kind === "class") E(fid, id, "contains");
  }
  // class -> function contains
  const cls = spec.symbols.find((x) => x.kind === "class");
  spec.symbols.filter((x) => x.kind === "function").forEach((fn) => {
    const fnid = FN(path, fn.name);
    if (cls) E(C(path, cls.name), fnid, "contains");
    else E(fid, fnid, "contains"); // no class (JS module) -> file contains function
  });
}

// existing summary/tag updates
for (const [path, upd] of Object.entries(existingUpdates)) {
  const n = g.nodes.find((x) => x.type === "file" && x.filePath === path);
  if (!n) { console.log("WARN existing not found:", path); continue; }
  if (upd.add && !n.summary.includes(upd.add)) {
    n.summary = n.summary.trim() + " " + upd.add;
    updated++;
  }
  n.tags = n.tags || [];
  (upd.tags || []).forEach((t) => { if (!n.tags.includes(t)) n.tags.push(t); });
}

// edges: dedup by source|target|type
const edgeKey = (e) => e.source + "|" + e.target + "|" + e.type;
const existingEdgeKeys = new Set(g.edges.map(edgeKey));
for (const e of newEdges) {
  // skip edges whose endpoints don't exist
  if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) { console.log("SKIP edge (missing node):", edgeKey(e)); continue; }
  if (!existingEdgeKeys.has(edgeKey(e))) {
    g.edges.push(e); existingEdgeKeys.add(edgeKey(e)); addedEdges++;
  }
}

fs.writeFileSync(GRAPH, JSON.stringify(g, null, 2));
console.log("addedNodes:", addedNodes, "addedEdges:", addedEdges, "updatedSummaries:", updated);
console.log("totals -> nodes:", g.nodes.length, "edges:", g.edges.length);
