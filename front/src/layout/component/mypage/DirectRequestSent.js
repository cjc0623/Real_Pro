import React, { useEffect, useState } from "react";
import {
  Box, Button, Chip, Paper, Typography, CircularProgress, Divider,
  Dialog, DialogContent, DialogActions,
} from "@mui/material";
import { InboxOutlined } from "@mui/icons-material";
import DriverProfileModal from "../common/DriverProfileModal";
import {
  getSentDirectRequests, cancelDirectRequest, cancelDirectRequestGroup,
} from "../../../api/directRequestApi/directRequestApi";

const statusChip = (status) => {
  const map = {
    REQUESTED: { label: "응답 대기", color: "warning" },
    ACCEPTED: { label: "수락됨", color: "success" },
    REJECTED: { label: "거절됨", color: "error" },
    CANCELED: { label: "취소됨", color: "default" },
  };
  const s = map[status] || { label: status, color: "default" };
  return <Chip label={s.label} color={s.color} size="small" variant="outlined" />;
};

// 한 견적(배송) 그룹의 종합 상태 칩
const groupStatusChip = (drivers) => {
  if (drivers.some((d) => d.status === "ACCEPTED")) {
    return <Chip label="수락됨" color="success" size="small" />;
  }
  if (drivers.some((d) => d.status === "REQUESTED")) {
    return <Chip label="응답 대기" color="warning" size="small" variant="outlined" />;
  }
  return <Chip label="종료" color="default" size="small" variant="outlined" />;
};

// 평면 요청 목록을 견적(eno) 기준으로 그룹핑 (입력 순서 = 최신순 유지)
const groupByEstimate = (list) => {
  const map = new Map();
  list.forEach((r) => {
    if (!map.has(r.eno)) {
      map.set(r.eno, {
        eno: r.eno,
        route: r.route,
        cargoWeight: r.cargoWeight,
        startTime: r.startTime,
        totalCost: r.totalCost,
        drivers: [],
      });
    }
    map.get(r.eno).drivers.push({
      requestId: r.requestId,
      driverId: r.driverId,
      driverName: r.driverName,
      status: r.status,
      matchingNo: r.matchingNo,
    });
  });
  return Array.from(map.values());
};

const DirectRequestSent = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type:'one'|'group', requestId?, eno?, count?, label? }
  const [driverModalCargoId, setDriverModalCargoId] = useState(null);

  const load = async () => {
    try {
      const data = await getSentDirectRequests();
      setGroups(groupByEstimate(Array.isArray(data) ? data : []));
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const runConfirm = async () => {
    if (!confirm || busy) return;
    setBusy(true);
    try {
      if (confirm.type === "one") {
        await cancelDirectRequest(confirm.requestId);
      } else {
        await cancelDirectRequestGroup(confirm.eno);
      }
      setConfirm(null);
      await load();
    } catch (e) {
      const msg = (e?.response && typeof e.response.data === "string") ? e.response.data : "취소 처리 중 오류가 발생했습니다.";
      alert(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>보낸 직접요청</Typography>
      <Typography variant="body2" color="#9ca3af" sx={{ mb: 3 }}>
        배송 1건을 여러 차주에게 보낸 경우 함께 묶어서 보여줍니다. 한 명이 수락하면 나머지는 자동 취소되며, 수락된 건의 결제는 <b>배송 정보 관리</b>에서 진행합니다.
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : groups.length === 0 ? (
        <Box sx={{ py: 8, textAlign: "center", border: "1px solid #f3f4f6", borderRadius: "12px" }}>
          <InboxOutlined sx={{ fontSize: 40, color: "#d1d5db" }} />
          <Typography sx={{ fontSize: "14px", color: "#9ca3af", mt: 1 }}>보낸 직접요청이 없습니다</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {groups.map((g) => {
            const pendingCount = g.drivers.filter((d) => d.status === "REQUESTED").length;
            return (
              <Paper key={g.eno} elevation={0} sx={{ border: "1px solid #f3f4f6", borderRadius: "12px", p: 2 }}>
                {/* 배송(견적) 헤더 */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={700} color="#111827" noWrap>{g.route}</Typography>
                    <Typography fontSize="13px" color="#6b7280" sx={{ mt: 0.3 }}>
                      {g.cargoWeight} · {g.startTime} · 요청 {g.drivers.length}명
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                    {groupStatusChip(g.drivers)}
                    <Typography fontWeight={700} color="#111827" sx={{ mt: 0.5 }}>{g.totalCost}</Typography>
                    {pendingCount >= 2 && (
                      <Button
                        size="small" variant="text" disabled={busy}
                        onClick={() => setConfirm({ type: "group", eno: g.eno, count: pendingCount })}
                        sx={{ mt: 0.3, textTransform: "none", fontSize: "12px", color: "#DC2626" }}
                      >
                        대기 {pendingCount}건 전체 취소
                      </Button>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* 차주별 상태 */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {g.drivers.map((d) => (
                    <Box key={d.requestId} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                      {d.driverId ? (
                        <Box
                          component="span"
                          onClick={() => setDriverModalCargoId(d.driverId)}
                          sx={{ fontSize: "14px", cursor: "pointer", color: "#2563eb", fontWeight: 600, textDecoration: "underline", "&:hover": { color: "#1d4ed8" } }}
                        >
                          {d.driverName || d.driverId}
                        </Box>
                      ) : (
                        <Typography fontSize="14px" color="#374151" noWrap>
                          {d.driverName || "-"}
                        </Typography>
                      )}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                        {statusChip(d.status)}
                        {d.status === "REQUESTED" && (
                          <Button
                            variant="outlined" size="small" disabled={busy}
                            onClick={() => setConfirm({ type: "one", requestId: d.requestId, label: d.driverName || d.driverId })}
                            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600,
                                  borderColor: "#fca5a5", color: "#DC2626", "&:hover": { borderColor: "#DC2626", backgroundColor: "#fff1f1" } }}
                          >
                            취소
                          </Button>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* 취소 확인 다이얼로그 */}
      <Dialog
        open={!!confirm}
        onClose={() => !busy && setConfirm(null)}
        PaperProps={{ sx: { width: 380, borderRadius: "16px", p: 1 } }}
      >
        <DialogContent>
          <p className="text-lg font-bold text-gray-900 mb-1">
            {confirm?.type === "group"
              ? `대기 중인 요청 ${confirm?.count}건을 모두 취소하시겠습니까?`
              : `${confirm?.label || "이 차주"}님께 보낸 요청을 취소하시겠습니까?`}
          </p>
          <p className="text-sm text-gray-400">취소한 요청은 되돌릴 수 없습니다.</p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setConfirm(null)} variant="outlined" disabled={busy}
            sx={{ borderRadius: "8px", borderColor: "#d1d5db", color: "#374151", textTransform: "none", fontWeight: 600 }}
          >
            닫기
          </Button>
          <Button
            onClick={runConfirm} variant="contained" disabled={busy}
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, boxShadow: "none",
                  backgroundColor: "#DC2626", "&:hover": { backgroundColor: "#b91c1c" } }}
          >
            취소하기
          </Button>
        </DialogActions>
      </Dialog>

      <DriverProfileModal
        open={!!driverModalCargoId}
        cargoId={driverModalCargoId}
        onClose={() => setDriverModalCargoId(null)}
      />
    </Box>
  );
};

export default DirectRequestSent;
