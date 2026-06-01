import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Pagination,
  CircularProgress,
  Button,
  TableContainer,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import {
  fetchReports,
  fetchUnreadCount,
  markReportRead,
  suspendUser,
  unsuspendUser,
} from "../../../api/adminApi/adminReportsApi";
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const MemberReport = () => {
  const [activeTab, setActiveTab] = useState(3);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (location.pathname.includes("/admin/memberOwner")) setActiveTab(1);
    else if (location.pathname.includes("/admin/memberCowner")) setActiveTab(2);
    else if (location.pathname.includes("/admin/memberReport")) setActiveTab(3);
    else if (location.pathname.includes("/admin/memberAdmin")) setActiveTab(4);
    else setActiveTab(0);
  }, [location.pathname]);

  const handleTabChange = (e, newValue) => {
    if (newValue === 0) navigate("/admin/memberAll");
    else if (newValue === 1) navigate("/admin/memberOwner");
    else if (newValue === 2) navigate("/admin/memberCowner");
    else if (newValue === 3) navigate("/admin/memberReport");
    else if (newValue === 4) navigate("/admin/memberAdmin");
  };

  const fmtDate = (dt) =>
    dt ? dt.toString().replace("T", " ").slice(0, 16) : "";

  const loadUnreadCount = async () => {
    try {
      const n = await fetchUnreadCount();
      setUnreadCount(n || 0);
    } catch (e) {
      console.warn("unread-count fetch failed", e);
    }
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchReports({
        unreadOnly,
        keyword,
        searchType: "name",
        page: page - 1,
        size,
        sort: "createdAt,desc",
      });
      setRows(data.content ?? []);
      setTotalPages(Math.max(data.totalPages || 1, 1));
    } catch (e) {
      console.error(e);
      setError("신고 목록을 불러오지 못했습니다.");
      setRows([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnreadCount();
  }, []);

  useEffect(() => {
    load();
  }, [page, size, keyword, unreadOnly]);

  const handleView = async (report) => {
    setSelectedReport(report);
    setDialogOpen(true);

    if (!report.adminRead) {
      try {
        await markReportRead(report.id, true);
        loadUnreadCount();
        load();

        setSelectedReport((prev) =>
          prev ? { ...prev, adminRead: true } : prev
        );
      } catch (e) {
        console.error("Failed to mark report as read:", e);
      }
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedReport(null);
  };

  const handleSuspend = async (period) => {
    if (!selectedReport?.targetId) {
      alert("대상 사용자 ID가 없습니다.");
      return;
    }

    const labelMap = {
      WEEK: "7일 정지",
      MONTH: "30일 정지",
      YEAR: "1년 정지",
      PERMANENT: "영구정지",
    };

    const reason = window.prompt(
      `${selectedReport.targetId} 계정에 대한 ${labelMap[period]} 사유를 입력하세요.`
    );

    if (reason === null) return;
    if (!reason.trim()) {
      alert("정지 사유를 입력해주세요.");
      return;
    }

    try {
      const result = await suspendUser(selectedReport.targetId, period, reason.trim());
      alert(result?.message || `${labelMap[period]} 처리가 완료되었습니다.`);
      handleClose();
      loadUnreadCount();
      load();
    } catch (e) {
      console.error("정지 처리 실패:", e);
      alert(e?.response?.data?.message || "정지 처리 중 오류가 발생했습니다.");
    }
  };

  const handleUnsuspend = async () => {
    if (!selectedReport?.targetId) {
      alert("대상 사용자 ID가 없습니다.");
      return;
    }

    const ok = window.confirm(`${selectedReport.targetId} 계정의 정지를 해제하시겠습니까?`);
    if (!ok) return;

    try {
      const result = await unsuspendUser(selectedReport.targetId);
      alert(result?.message || "정지 해제가 완료되었습니다.");
      handleClose();
      loadUnreadCount();
      load();
    } catch (e) {
      console.error("정지 해제 실패:", e);
      alert(e?.response?.data?.message || "정지 해제 중 오류가 발생했습니다.");
    }
  };

  const tableCardStyle = {
    p: 0,
    borderRadius: "20px",
    backgroundColor: "#ffffff",
    border: "1px solid #f1f5f9",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.02)",
    overflow: "hidden"
  };

  return (
    /* 🟢 [가려짐 버그 원천 차단] 모바일에서 하단 탭바 위로 페이지네이션이 보일 수 있게 pb(100px) 추가 */
    <Box flexGrow={1} p={{ xs: 2.5, md: 5 }} pb={{ xs: "100px", md: 5 }} sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>
          {/* 📱 MemberOwner 뼈대 규격과 100% 일치화시킨 가변 인클로저 프레임 */}
          <Box
            display="flex"
            flexDirection={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
            gap={2}
            mb={4}
          >
            <Box minWidth={0} sx={{ width: '100%' }}>
              <Box
                display="flex"
                flexDirection={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                mb={1.5}
              >
                <Typography variant="h4" fontWeight="900" color="#0f172a" letterSpacing="-0.5px" sx={{ textAlign: { xs: 'center', md: 'left' }, width: '100%' }}>
                  신고 내역 관리
                </Typography>
    
                <Button
                              variant="contained"
                              disableElevation
                              color="secondary"
                              component={NavLink}
                              to="/admin/AdminCargoApproval"
                              sx={{ 
                                mt: { xs: 1.5, sm: 0 }, 
                                display: { xs: "flex", md: "none" },
                                borderRadius: "12px",
                                fontWeight: "bold",
                                alignSelf: 'center' 
                              }}
                            >
                              차량승인관리
                            </Button>
              </Box>
    
     <Tabs
      value={activeTab}
      onChange={handleTabChange}
      textColor="primary"
      indicatorColor="primary"
      // 🟢 [핵심] variant를 삭제하고 대신 아래와 같이 배치하면 
      // 쏠림 없이 전체 영역을 균등하게 차지합니다.
      variant="fullWidth" 
      sx={{ 
        maxWidth: '100%',
        "& .MuiTabs-indicator": { bgcolor: "#2563eb", height: "3px", borderRadius: "3px" }, 
        "& .MuiTab-root": { 
          fontWeight: "bold", 
          color: "#64748b", 
          fontSize: { xs: "0.75rem", sm: "0.95rem" }, // 모바일에서는 폰트 크기를 살짝 줄여서 한 줄 유지
          minWidth: 0, 
          px: { xs: 0, sm: 2 },
          whiteSpace: "nowrap" // 👈 [중요] 글자가 무조건 한 줄로 나오게 강제
        },
        "& .MuiTab-root.Mui-selected": { color: "#2563eb" }
      }}
    >
      <Tab label="전체 회원" component={NavLink} to="/admin/memberAll" />
      <Tab label="물주" component={NavLink} to="/admin/memberOwner" />
      <Tab label="차주" component={NavLink} to="/admin/memberCowner" />
      <Tab label="신고내역" component={NavLink} to="/admin/memberReport" />
      <Tab label="관리자" component={NavLink} to="/admin/memberAdmin" />
    </Tabs>
            </Box>
        
        {/* 📱 핏 보정 완료: Stack을 걷어내고 MemberOwner 규격 수식을 다이렉트 매싱 */}
        <TextField
          variant="outlined"
          placeholder="신고대상 이름 검색"
          size="small"
          value={keyword}
          onChange={(e) => {
            setPage(1);
            setKeyword(e.target.value);
          }}
          sx={{ 
            width: { xs: '100%', md: 240 }, 
            flexShrink: 0,
            "& .MuiOutlinedInput-root": {
              borderRadius: "14px",
              backgroundColor: "#ffffff",
              "& fieldset": { borderColor: "#e2e8f0" },
              "&:hover fieldset": { borderColor: "#cbd5e1" },
              "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "2px" },
            }
          }}
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: "#2563eb" }} />, 
          }}
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={300} sx={{ color: "#2563eb" }}>
          <CircularProgress color="inherit" />
        </Box>
      ) : error ? (
        <Typography color="error" fontWeight="bold">{error}</Typography>
      ) : (
        <>
          {/* 📱 1. 모바일 전용 가변 리스트 구역 */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {rows.length > 0 ? (
              rows.map((r, i) => (
                <Paper
                  key={r.id ?? i}
                  elevation={0}
                  onClick={() => handleView(r)}
                  sx={{
                    p: 2.5,
                    mb: 2,
                    borderRadius: "20px",
                    border: "1px solid #f1f5f9",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.01)",
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    minWidth: 0,
                    '&:hover': { bgcolor: '#f8fafc' }
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1.5} gap={1}>
                    <Typography variant="subtitle1" fontWeight="800" color="#2563eb" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      대상 ID: {r.targetId ?? "-"}
                    </Typography>
                    <Typography variant="caption" color="#94a3b8" fontWeight="600" sx={{ flexShrink: 0 }}>
                      {fmtDate(r.createdAt)}
                    </Typography>
                  </Box>
                  <Box display="flex" flexDirection="column" gap={0.8} minWidth={0} mb={1.5}>
                    <Typography variant="body2" color="#334155" fontWeight="500">
                      <span style={{ color: '#94a3b8', marginRight: '6px', fontWeight: 'bold' }}>이름</span>
                      {r.targetName ?? "-"}
                    </Typography>
                    <Typography variant="body2" color="#475569" fontWeight="500">
                      <span style={{ color: '#94a3b8', marginRight: '6px', fontWeight: 'bold' }}>신고자</span>
                      {r.reporterId ?? "-"}
                    </Typography>
                  </Box>
                  <Box pt={1.5} sx={{ borderTop: "1px dashed #f1f5f9" }}>
                    <Typography variant="caption" display="block" color="#94a3b8" mb={0.5}>신고 사유 요약</Typography>
                    <Typography variant="body2" color="#475569" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>
                      {r.content ?? "-"}
                    </Typography>
                  </Box>
                </Paper>
              ))
            ) : (
              <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: "20px", border: "1px solid #f1f5f9" }}>
                <Typography color="#94a3b8" fontWeight="500">접수된 신고 내역 데이터가 존재하지 않습니다.</Typography>
              </Paper>
            )}
          </Box>

          {/* 💻 2. 데스크톱 전용 와이드 테이블 구역 */}
          <TableContainer component={Paper} elevation={0} sx={{ ...tableCardStyle, display: { xs: 'none', md: 'block' } }}>
            <Table sx={{ minWidth: 650, '& .MuiTableCell-root': { height: 54 } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>신고대상ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>신고대상 이름</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>신고자</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>신고일</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>사유</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow
                    key={r.id ?? i}
                    onClick={() => handleView(r)}
                    sx={{ cursor: "pointer", '&:hover': { bgcolor: '#f8fafc' } }}
                  >
                    <TableCell sx={{ color: '#2563eb', fontWeight: 700 }}>{r.targetId ?? "-"}</TableCell>
                    <TableCell sx={{ color: '#334155', fontWeight: 600 }}>{r.targetName ?? "-"}</TableCell>
                    <TableCell sx={{ color: '#475569' }}>{r.reporterId ?? "-"}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{fmtDate(r.createdAt)}</TableCell>
                    <TableCell sx={{ color: '#475569' }}>{r.content ? `${r.content.substring(0, 40)}...` : "-"}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#94a3b8', fontWeight: 500 }}>
                      접수된 신고 내역 데이터가 존재하지 않습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Box display="flex" justifyContent="center" mt={4}>
        <Pagination
          count={Math.max(totalPages, 1)}
          page={page}
          onChange={(_, v) => setPage(v)}
          color="primary"
          size={isMobile ? "small" : "medium"}
          sx={{
            "& .MuiPaginationItem-root": { fontWeight: "bold", color: "#475569" },
            "& .MuiPaginationItem-root.Mui-selected": { bgcolor: "#2563eb", color: "#ffffff", "&:hover": { bgcolor: "#1d4ed8" } }
          }}
        />
      </Box>

      {selectedReport && (
        <Dialog
          open={dialogOpen}
          onClose={handleClose}
          fullWidth
          maxWidth="sm"
          fullScreen={isMobile}
          PaperProps={{ sx: { borderRadius: "24px", p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.2rem" }}>📋 신고 상세 정보</DialogTitle>
          <DialogContent dividers sx={{ borderColor: "#f1f5f9" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, bgcolor: "#f8fafc", p: 2, borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <Typography variant="body2" color="#475569"><b>신고대상 :</b> <span style={{ color: "#2563eb", fontWeight: "bold" }}>{selectedReport.targetId ?? "-"}</span></Typography>
              <Typography variant="body2" color="#475569"><b>신고대상 이름 :</b> {selectedReport.targetName ?? "-"}</Typography>
              <Typography variant="body2" color="#475569"><b>신고자 :</b> {selectedReport.reporterId ?? "-"}</Typography>
              <Typography variant="body2" color="#475569"><b>신고일 :</b> {fmtDate(selectedReport.createdAt)}</Typography>
              <Typography variant="body2" color="#475569">
                <b>처리 상태 :</b>&nbsp;
                <Box component="span" sx={{ px: 1.2, py: 0.3, borderRadius: "6px", fontSize: "0.75rem", fontWeight: "bold", bgcolor: selectedReport.adminRead ? "#eff6ff" : "#fff7ed", color: selectedReport.adminRead ? "#2563eb" : "#ea580c" }}>
                  {selectedReport.adminRead ? "처리됨" : "미확인"}
                </Box>
              </Typography>
            </Box>
            
            <Typography variant="subtitle2" sx={{ mt: 3, fontWeight: "bold", color: "#1e293b" }}>신고 사유 내용</Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: "12px", borderColor: "#cbd5e1", whiteSpace: "pre-wrap", minHeight: "100px", bgcolor: "#ffffff", fontSize: "0.95rem", color: "#334155", lineHeight: 1.5 }}>
              {selectedReport.content ?? "-"}
            </Paper>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              py: 2.5,
              display: "flex",
              flexWrap: "wrap",
              gap: 1.2,
              justifyContent: { xs: 'center', md: 'flex-end' },
            }}
          >
            <Button onClick={handleClose} sx={{ color: "#64748b", fontWeight: "bold" }}>닫기</Button>
            <Button onClick={() => handleSuspend("WEEK")} color="warning" variant="outlined" sx={{ borderRadius: "10px", fontWeight: "bold" }}>
              7일 정지
            </Button>
            <Button onClick={() => handleSuspend("MONTH")} color="warning" variant="outlined" sx={{ borderRadius: "10px", fontWeight: "bold" }}>
              30일 정지
            </Button>
            <Button onClick={() => handleSuspend("YEAR")} color="warning" variant="outlined" sx={{ borderRadius: "10px", fontWeight: "bold" }}>
              1년 정지
            </Button>
            <Button onClick={() => handleSuspend("PERMANENT")} color="error" variant="contained" disableElevation sx={{ borderRadius: "10px", fontWeight: "bold" }}>
              영구정지
            </Button>
            <Button onClick={handleUnsuspend} color="success" variant="text" sx={{ fontWeight: "bold" }}>
              정지 해제
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default MemberReport;