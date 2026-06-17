import React, { useEffect, useState } from "react";
import {
  Box, Button, Chip, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, CircularProgress,
  Dialog, DialogContent, DialogActions,
} from "@mui/material";
import { InboxOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  getReceivedDirectRequests, acceptDirectRequest, rejectDirectRequest,
} from "../../../api/directRequestApi/directRequestApi";

const statusChip = (status) => {
  const map = {
    REQUESTED: { label: "요청중", color: "warning" },
    ACCEPTED: { label: "수락됨", color: "success" },
    REJECTED: { label: "거절됨", color: "default" },
    CANCELED: { label: "취소됨", color: "default" },
  };
  const s = map[status] || { label: status, color: "default" };
  return <Chip label={s.label} color={s.color} size="small" variant="outlined" />;
};

const headCellSx = {
  fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase",
  letterSpacing: "0.05em", py: 1.5, px: 2, whiteSpace: "nowrap",
  borderBottom: "1px solid #e5e7eb", bgcolor: "#f9fafb",
};
const bodyCellSx = {
  fontSize: "13px", color: "#374151", py: 2, px: 2, whiteSpace: "nowrap",
  borderBottom: "1px solid #f3f4f6",
};

const DirectRequestReceived = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyNo, setBusyNo] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'accept'|'reject', requestId }
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getReceivedDirectRequests();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAccept = async (requestId) => {
    if (busyNo) return;
    setBusyNo(requestId);
    try {
      await acceptDirectRequest(requestId);
      alert("직접요청을 수락했습니다. 배송 정보 관리에서 확인하세요.");
      navigate("/mypage/delivery");
    } catch (e) {
      const msg = (e?.response && typeof e.response.data === "string") ? e.response.data : "수락 처리 중 오류가 발생했습니다.";
      alert(msg);
    } finally {
      setBusyNo(null);
    }
  };

  const handleReject = async (requestId) => {
    if (busyNo) return;
    setBusyNo(requestId);
    try {
      await rejectDirectRequest(requestId);
      alert("직접요청을 거절했습니다.");
      await load();
    } catch (e) {
      const msg = (e?.response && typeof e.response.data === "string") ? e.response.data : "거절 처리 중 오류가 발생했습니다.";
      alert(msg);
    } finally {
      setBusyNo(null);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const { type, requestId } = confirm;
    setConfirm(null);
    if (type === "accept") await handleAccept(requestId);
    else await handleReject(requestId);
  };

  const renderActions = (r) => {
    if (r.status !== "REQUESTED") return statusChip(r.status);
    return (
      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
        <Button
          variant="contained" size="small" disabled={busyNo === r.requestId}
          onClick={() => setConfirm({ type: "accept", requestId: r.requestId })}
          sx={{ borderRadius: "8px", backgroundColor: "#16a34a", textTransform: "none", fontWeight: 600, boxShadow: "none", "&:hover": { backgroundColor: "#15803d" } }}
        >
          수락
        </Button>
        <Button
          variant="outlined" size="small" disabled={busyNo === r.requestId}
          onClick={() => setConfirm({ type: "reject", requestId: r.requestId })}
          sx={{ borderRadius: "8px", borderColor: "#fca5a5", color: "#DC2626", textTransform: "none", fontWeight: 600, "&:hover": { borderColor: "#DC2626", backgroundColor: "#fff1f1" } }}
        >
          거절
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>직접요청 수신함</Typography>
      <Typography variant="body2" color="#9ca3af" sx={{ mb: 3 }}>
        화주가 나를 지정해 보낸 운송 요청입니다.
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* 데스크탑 표 */}
          <TableContainer component={Paper} elevation={0} sx={{ display: { xs: "none", md: "block" }, border: "1px solid #f3f4f6", borderRadius: "12px", overflowX: "auto" }}>
            <Table sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={headCellSx}>요청번호</TableCell>
                  <TableCell align="center" sx={headCellSx}>화주</TableCell>
                  <TableCell align="center" sx={headCellSx}>출발 - 도착</TableCell>
                  <TableCell align="center" sx={headCellSx}>무게</TableCell>
                  <TableCell align="center" sx={headCellSx}>출발일</TableCell>
                  <TableCell align="center" sx={headCellSx}>금액</TableCell>
                  <TableCell align="center" sx={headCellSx}>처리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ border: 0, py: 10 }}>
                      <InboxOutlined sx={{ fontSize: 40, color: "#d1d5db" }} />
                      <Typography sx={{ fontSize: "14px", color: "#9ca3af", mt: 1 }}>받은 직접요청이 없습니다</Typography>
                    </TableCell>
                  </TableRow>
                ) : list.map((r) => (
                  <TableRow key={r.requestId} sx={{ "&:hover": { bgcolor: "#f9fafb" } }}>
                    <TableCell align="center" sx={bodyCellSx}>No.{r.requestId}</TableCell>
                    <TableCell align="center" sx={bodyCellSx}>{r.memId}</TableCell>
                    <TableCell align="center" sx={bodyCellSx}>{r.route}</TableCell>
                    <TableCell align="center" sx={bodyCellSx}>{r.cargoWeight}</TableCell>
                    <TableCell align="center" sx={bodyCellSx}>{r.startTime}</TableCell>
                    <TableCell align="center" sx={bodyCellSx}>{r.totalCost}</TableCell>
                    <TableCell align="center" sx={bodyCellSx}>{renderActions(r)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 모바일 카드 */}
          <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 1.5 }}>
            {list.length === 0 ? (
              <Box sx={{ py: 8, textAlign: "center", border: "1px solid #f3f4f6", borderRadius: "12px" }}>
                <InboxOutlined sx={{ fontSize: 40, color: "#d1d5db" }} />
                <Typography sx={{ fontSize: "14px", color: "#9ca3af", mt: 1 }}>받은 직접요청이 없습니다</Typography>
              </Box>
            ) : list.map((r) => (
              <Box key={r.requestId} sx={{ border: "1px solid #f3f4f6", borderRadius: "12px", p: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography fontSize="12px" color="#9ca3af">No.{r.requestId}</Typography>
                  {r.status !== "REQUESTED" && statusChip(r.status)}
                </Box>
                <Typography fontWeight={700} color="#111827">{r.route}</Typography>
                <Typography fontSize="13px" color="#6b7280" sx={{ mt: 0.5 }}>
                  화주 {r.memId} · {r.cargoWeight} · {r.startTime}
                </Typography>
                <Typography fontWeight={700} color="#111827" sx={{ mt: 0.5 }}>{r.totalCost}</Typography>
                {r.status === "REQUESTED" && (
                  <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                    <Button fullWidth variant="contained" disabled={busyNo === r.requestId} onClick={() => setConfirm({ type: "accept", requestId: r.requestId })}
                      sx={{ borderRadius: "8px", backgroundColor: "#16a34a", textTransform: "none", fontWeight: 600, boxShadow: "none" }}>수락</Button>
                    <Button fullWidth variant="outlined" disabled={busyNo === r.requestId} onClick={() => setConfirm({ type: "reject", requestId: r.requestId })}
                      sx={{ borderRadius: "8px", borderColor: "#fca5a5", color: "#DC2626", textTransform: "none", fontWeight: 600 }}>거절</Button>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* 수락/거절 확인 다이얼로그 */}
      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        PaperProps={{ sx: { width: 380, borderRadius: "16px", p: 1 } }}
      >
        <DialogContent>
          <p className="text-lg font-bold text-gray-900 mb-1">
            {confirm?.type === "accept" ? "직접요청을 수락하시겠습니까?" : "직접요청을 거절하시겠습니까?"}
          </p>
          <p className="text-sm text-gray-400">
            {confirm?.type === "accept"
              ? "수락하면 매칭이 확정되고 결제 단계로 진행됩니다. 같은 화주의 다른 차주 요청은 자동 취소됩니다."
              : "거절한 요청은 되돌릴 수 없습니다."}
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setConfirm(null)}
            variant="outlined"
            sx={{ borderRadius: "8px", borderColor: "#d1d5db", color: "#374151", textTransform: "none", fontWeight: 600 }}
          >
            취소
          </Button>
          <Button
            onClick={runConfirm}
            variant="contained"
            sx={{
              borderRadius: "8px", textTransform: "none", fontWeight: 700, boxShadow: "none",
              backgroundColor: confirm?.type === "accept" ? "#16a34a" : "#DC2626",
              "&:hover": { backgroundColor: confirm?.type === "accept" ? "#15803d" : "#b91c1c" },
            }}
          >
            {confirm?.type === "accept" ? "수락" : "거절"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DirectRequestReceived;
