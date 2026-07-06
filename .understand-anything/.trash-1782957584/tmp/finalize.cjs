const fs = require("fs");
const GRAPH = ".understand-anything/knowledge-graph.json";
const g = JSON.parse(fs.readFileSync(GRAPH, "utf8"));
const BE = "backend/src/main/java/com/giproject/";
const FE = "front/src/";
const F = (p) => "file:" + p;

// explicit layer assignment for the 10 new file nodes
const assign = {
  [F(BE + "controller/notification/NotificationController.java")]: "layer:backend-api",
  [F(BE + "service/notification/NotificationService.java")]: "layer:backend-service",
  [F(BE + "service/notification/NotificationServiceImpl.java")]: "layer:backend-service",
  [F(BE + "dto/notification/NotificationSummaryDTO.java")]: "layer:backend-dto",
  [F(BE + "entity/auth/RevokedToken.java")]: "layer:backend-domain",
  [F(BE + "repository/auth/RevokedTokenRepository.java")]: "layer:backend-repository",
  [F(BE + "service/auth/TokenBlacklistService.java")]: "layer:backend-service",
  [F(FE + "api/axiosSetup.js")]: "layer:front-api",
  [F(FE + "api/notificationApi.js")]: "layer:front-api",
  [F(FE + "hooks/useNotificationSummary.js")]: "layer:front-hooks",
};
const nodeIds = new Set(g.nodes.map((n) => n.id));
const already = new Set(); g.layers.forEach((L) => L.nodeIds.forEach((id) => already.add(id)));
let assigned = 0;
for (const [id, layerId] of Object.entries(assign)) {
  if (!nodeIds.has(id)) { console.log("WARN node missing:", id); continue; }
  if (already.has(id)) continue;
  const L = g.layers.find((x) => x.id === layerId);
  if (!L) { console.log("WARN layer missing:", layerId); continue; }
  L.nodeIds.push(id); already.add(id); assigned++;
}

// add one tour step for the notification feature (append at end)
g.tour = g.tour || [];
const maxOrder = g.tour.reduce((m, s) => Math.max(m, s.order || 0), 0);
const notifStepNodes = [
  F(FE + "hooks/useNotificationSummary.js"),
  F(FE + "api/notificationApi.js"),
  F(BE + "controller/notification/NotificationController.java"),
  F(BE + "service/notification/NotificationServiceImpl.java"),
].filter((id) => nodeIds.has(id));
const hasNotifStep = g.tour.some((s) => (s.title || "").includes("알림"));
if (!hasNotifStep) {
  g.tour.push({
    order: maxOrder + 1,
    title: "역할별 알림 요약 기능",
    description: "헤더 아바타·사이드바의 '확인 필요' 빨간점 흐름을 따라간다. 프론트 useNotificationSummary 훅이 notificationApi로 /fr/notifications/summary를 폴링하면, 백엔드 NotificationController→NotificationServiceImpl이 역할별(SHIPPER/DRIVER/ADMIN)로 여러 리포지토리를 집계해 hasAlert/items를 돌려준다.",
    nodeIds: notifStepNodes,
  });
}

fs.writeFileSync(GRAPH, JSON.stringify(g, null, 2));
console.log("assignedLayers:", assigned, "tourSteps:", g.tour.length, "layers:", g.layers.length);
