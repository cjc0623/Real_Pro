import React, { useState, useEffect, useMemo } from "react";
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
  TableContainer,
  Paper,
  Chip, 
  Button,
  Stack
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { fetchMembers } from "../../../api/adminApi/adminMembersApi";
import DeliveryDetailsModal from "./DeliveryDetailsModal"; 
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const MemberAll = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleOpenModal = (user) => {
    setSelectedUserForModal(user);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedUserForModal(null);
  };

  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/admin/memberOwner")) setActiveTab(1);
    else if (path.includes("/admin/memberCowner")) setActiveTab(2);
    else if (path.includes("/admin/memberReport")) setActiveTab(3);
    else if (path.includes("/admin/memberAdmin")) setActiveTab(4);
    else setActiveTab(0);
  }, [location.pathname]);

  const handleTabChange = (e, newValue) => {
    if (newValue === 0) navigate("/admin/memberAll");
    else if (newValue === 1) navigate("/admin/memberOwner");
    else if (newValue === 2) navigate("/admin/memberCowner");
    else if (newValue === 3) navigate("/admin/memberReport");
    else if (newValue === 4) navigate("/admin/memberAdmin");
  };

  const fmtDate = (dt) => (dt ? dt.toString().replace("T", " ").slice(0, 16) : "");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchMembers({
          type: "ALL",
          page: page - 1,
          size,
          keyword,
          searchType: "name",
        });
        setRows(data.content ?? []);
        setTotalPages(data.totalPages || 1);
      } catch (e) {
        console.error(e);
        setError("회원 목록을 불러오지 못했습니다.");
        setRows([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, size, keyword]);

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
              회원 관리
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
        
        {/* 📱 구조 수술 완료: 불필요한 마진 요소를 정제하고 직계 노출로 오버플로우 봉쇄 */}
        <TextField
          variant="outlined"
          placeholder="회원 이름 검색"
          size="small"
          value={keyword}
          onChange={(e) => { setPage(1); setKeyword(e.target.value); }}
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
          {/* 📱 1. 모바일용 하이브리드 리스트 구역 */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {rows.length > 0 ? (
              rows.map((r, i) => (
                <Paper
                  key={r.memId ?? i}
                  elevation={0}
                  onClick={() => handleOpenModal(r)}
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
                  <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1.5}>
                    <Typography variant="subtitle1" fontWeight="800" color="#334155">{r.memName}</Typography>
                    <Typography variant="caption" color="#94a3b8" fontWeight="600">{fmtDate(r.memCreateidDateTime)}</Typography>
                  </Box>
                  <Stack spacing={0.8}>
                    <Typography variant="body2" color="#2563eb" fontWeight="700" sx={{ wordBreak: 'break-all' }}>
                      {r.memEmail}
                    </Typography>
                    <Typography variant="body2" color="#475569" fontWeight="500">
                      <span style={{ color: '#94a3b8', marginRight: '6px', fontWeight: 'bold' }}>연락처</span>
                      {r.memPhone || '-'}
                    </Typography>
                  </Stack>
                </Paper>
              ))
            ) : (
              <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: "20px", border: "1px solid #f1f5f9" }}>
                <Typography color="#94a3b8" fontWeight="500">등록된 회원 데이터가 존재하지 않습니다.</Typography>
              </Paper>
            )}
          </Box>

          {/* 💻 2. 데스크톱용 와이드 테이블 구역 */}
          <TableContainer component={Paper} elevation={0} sx={{ ...tableCardStyle, display: { xs: 'none', md: 'block' } }}> 
            <Table sx={{ minWidth: 600, '& .MuiTableCell-root': { height: 54 } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>이름</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>이메일</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>전화번호</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>등록일</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={r.memId ?? i} onClick={() => handleOpenModal(r)} style={{ cursor: 'pointer' }} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ color: '#334155', fontWeight: 600 }}>{r.memName}</TableCell>
                    <TableCell sx={{ color: '#2563eb', fontWeight: 700 }}>{r.memEmail}</TableCell> 
                    <TableCell sx={{ color: '#475569' }}>{r.memPhone || '-'}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{fmtDate(r.memCreateidDateTime)}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8', fontWeight: 500 }}>등록된 회원 데이터가 존재하지 않습니다.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* 하단 페이지네이션 */}
      <Box display="flex" justifyContent="center" mt={4}>
        <Pagination 
          count={totalPages} 
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

      <DeliveryDetailsModal open={openModal}     onClose={handleCloseModal} selectedUser={selectedUserForModal} />
    </Box>
  );
};

export default MemberAll;