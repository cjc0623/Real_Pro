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
  TableContainer,
  Paper,
  Button
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { API_SERVER_HOST } from "../../../api/serverConfig";

const PREFIX = `${API_SERVER_HOST}/g2i4/admin/members`;

const MemberAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(4);
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const sort = useMemo(() => "memCreateidDateTime,desc", []);

  useEffect(() => {
    if (location.pathname.includes("/admin/memberOwner")) setActiveTab(1);
    else if (location.pathname.includes("/admin/memberCowner")) setActiveTab(2);
    else if (location.pathname.includes("/admin/memberReport")) setActiveTab(3);
    else if (location.pathname.includes("/admin/memberAdmin")) setActiveTab(4);
    else setActiveTab(0); 
  }, [location.pathname]);

  const handleTabChange = (_e, newValue) => {
    setCurrentPage(1);
    if (newValue === 0) navigate("/admin/memberAll");
    else if (newValue === 1) navigate("/admin/memberOwner");
    else if (newValue === 2) navigate("/admin/memberCowner");
    else if (newValue === 3) navigate("/admin/memberReport");
    else if (newValue === 4) navigate("/admin/memberAdmin");
  };

  const handlePageChange = (_e, value) => setCurrentPage(value);
  const handleSearchChange = (e) => setSearchKeyword(e.target.value);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const params = {
          type: "ADMIN",
          page: currentPage - 1,
          size: 10,
          sort,
        };
        if (searchKeyword && searchKeyword.trim()) {
          params.keyword = searchKeyword.trim();
        }

        const res = await axios.get(PREFIX, { params });
        const { content = [], totalPages = 1 } = res.data ?? {};
        setUsers(
          content.map((u) => ({
            name: u.memName ?? "",
            adminId: u.memId ?? "",
            phone: u.memPhone ?? "",
            createdAt: (u.memCreateidDateTime ?? "").toString().replace("T", " ").slice(0, 16),
          }))
        );
        setTotalPages(Math.max(totalPages, 1));
      } catch (err) {
        console.error("[ADMIN LIST] load failed", err?.response?.status, err?.response?.data || err.message);
        setUsers([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [currentPage, searchKeyword, sort]);

  const tableCardStyle = {
    p: 0,
    borderRadius: "20px",
    backgroundColor: "#ffffff",
    border: "1px solid #f1f5f9",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.02)",
    overflow: "hidden"
  };

  return (
    <Box flexGrow={1} p={{ xs: 2.5, md: 5 }} sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>
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
                  관리자 회원 관리
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
        
        {/* 📱 핏 보정 완료: MemberOwner와 소수점 오프셋까지 통일 */}
        <TextField
          variant="outlined"
          placeholder="이름 / 아이디 검색"
          size="small"
          value={searchKeyword}
          onChange={handleSearchChange}
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
            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: '#2563eb' }} />, 
          }}
        />
      </Box>

      {/* 테이블 영역 */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="300px" sx={{ color: "#2563eb" }}>
          <CircularProgress color="inherit" />
        </Box>
      ) : (
        <>
          {/* 📱 1. 모바일 전용 간이 리스트 구역 */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {users.length > 0 ? (
              users.map((user, idx) => (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    mb: 2,
                    borderRadius: "20px",
                    border: "1px solid #f1f5f9",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.01)",
                    minWidth: 0,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1.5}>
                    <Typography variant="subtitle1" fontWeight="800" color="#334155">{user.name}</Typography>
                    <Typography variant="caption" color="#94a3b8" fontWeight="600">{user.createdAt}</Typography>
                  </Box>
                  <Box display="flex" flexDirection="column" gap={0.8}>
                    <Typography variant="body2" color="#2563eb" fontWeight="700" sx={{ wordBreak: 'break-all' }}>
                      ID: {user.adminId}
                    </Typography>
                    <Typography variant="body2" color="#475569" fontWeight="500">
                      <span style={{ color: '#94a3b8', marginRight: '6px', fontWeight: 'bold' }}>연락처</span>
                      {user.phone || '-'}
                    </Typography>
                  </Box>
                </Paper>
              ))
            ) : (
              <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: "20px", border: "1px solid #f1f5f9" }}>
                <Typography color="#94a3b8" fontWeight="500">가입된 관리자 계정 데이터가 존재하지 않습니다.</Typography>
              </Paper>
            )}
          </Box>

          {/* 💻 2. 데스크톱 전용 와이드 테이블 구역 */}
          <TableContainer component={Paper} elevation={0} sx={{ ...tableCardStyle, display: { xs: 'none', md: 'block' } }}>
            <Table sx={{ minWidth: 600, '& .MuiTableCell-root': { height: 54 } }}> 
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>이름</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>관리자ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>전화번호</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>등록일</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, idx) => (
                  <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ color: '#334155', fontWeight: 600 }}>{user.name}</TableCell>
                    <TableCell sx={{ color: '#2563eb', fontWeight: 700 }}>{user.adminId}</TableCell> 
                    <TableCell sx={{ color: '#475569' }}>{user.phone}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{user.createdAt}</TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8', fontWeight: 500 }}>
                      가입된 관리자 계정 데이터가 존재하지 않습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* 페이지네이션 구역 */}
      <Box display="flex" justifyContent="center" mt={4}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
          size="medium"
          sx={{
            "& .MuiPaginationItem-root": { fontWeight: "bold", color: "#475569" },
            "& .MuiPaginationItem-root.Mui-selected": { bgcolor: "#2563eb", color: "#ffffff", "&:hover": { bgcolor: "#1d4ed8" } }
          }}
        />
      </Box>
    </Box>
  );
};

export default MemberAdmin;