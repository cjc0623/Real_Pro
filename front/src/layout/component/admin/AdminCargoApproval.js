import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button, Chip, Divider, Paper, Stack, Pagination, TextField, InputAdornment } from '@mui/material';
import SearchIcon from "@mui/icons-material/Search";
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken') || sessionStorage.getItem('ACCESS_TOKEN');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const toPreviewUrl = (p) => {
  if (!p) return '/image/placeholders/truck.svg';
  const s = String(p).replace(/\\/g, "/");
  if (s.startsWith('http')) return s;
  if (s.startsWith('/g2i4/uploads/')) return `${API_BASE}${s}`;
  if (s.startsWith('/uploads/')) return `${API_BASE}/g2i4${s}`;
  return `${API_BASE}/g2i4/uploads/cargo/${encodeURIComponent(s.replace(/^\/+/, ""))}`;
};

const AdminCargoApproval = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 🟢 EditVehicleInform.js와 동일한 카드 치수 정의
  const CARD_WIDTH = { xs: '100%', sm: 300 };
  const CARD_HEIGHT = { xs: 400, sm: 420 };
  const THUMB_HEIGHT = { xs: 160, sm: 190 };

  const [pendingList, setPendingList] = useState([]);

  // 🔍 검색 상태 추가
  const [searchKeyword, setSearchKeyword] = useState("");

  // � 페이지네이션 상태 추가 (EditVehicleInform.js와 동일한 8개 기준)
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // 차량 번호 또는 차주 ID 기준 필터링 로직
  const filteredList = pendingList.filter(cargo => 
    (cargo.cargoNumber || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (cargo.ownerId || '').toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const pagedList = filteredList.slice((page - 1) * pageSize, page * pageSize);

  const fetchPendingCargos = async () => {
    try {
      const res = await api.get('/g2i4/admin/cargo/pending');
      setPendingList(res.data || []);
    } catch (error) {
      console.error('대기 목록을 불러오는 데 실패했습니다.', error);
    }
  };

  useEffect(() => {
    fetchPendingCargos();
  }, []);

  const handleApprove = async (cargoNo) => {
    if (!window.confirm('이 차량을 승인하시겠습니까?')) return;
    try {
      await api.put(`/g2i4/admin/cargo/approve/${cargoNo}`);
      alert('승인 완료되었습니다.');
      fetchPendingCargos();
    } catch (error) {
      alert('승인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleReject = async (cargoNo) => {
    if (!window.confirm('이 차량 등록을 거절하시겠습니까?')) return;
    try {
      await api.put(`/g2i4/admin/cargo/reject/${cargoNo}`);
      alert('거절 처리되었습니다.');
      fetchPendingCargos();
    } catch (error) {
      alert('거절 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    /* 🟢 [가려짐 버그 원천 차단] 모바일에서 하단 탭바 위로 페이지네이션이 보일 수 있게 pb(100px) 추가 */
    <Box sx={{
      p: { xs: 2, sm: 3.5, md: 5 }, 
      pb: { xs: "100px", md: 5 },
      pl: { xs: 2, sm: 4, md: 6, lg: 10 }, 
      pr: { xs: 2, sm: 4, md: 6, lg: 10 }, 
      bgcolor: '#f8fafc', 
      minHeight: '100vh',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* 상단 타이틀 및 검색바 영역 (다른 관리자 페이지와 규격 통일) */}
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', md: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', md: 'center' }} 
        gap={2} 
        mb={2}
      >
        <Typography variant="h4" fontWeight="900" color="#0f172a" letterSpacing="-0.5px"
          sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }, textAlign: { xs: 'center', md: 'left' } }} 
        >
          차량 등록 승인 관리
        </Typography>

        <TextField
          variant="outlined"
          placeholder="차량 번호 또는 차주 ID 검색"
          size="small"
          value={searchKeyword}
          onChange={(e) => {
            setSearchKeyword(e.target.value);
            setPage(1); // 검색 시 1페이지로 강제 이동
          }}
          sx={{ 
            width: { xs: '100%', md: 280 }, 
            flexShrink: 0,
            "& .MuiOutlinedInput-root": {
              borderRadius: "14px",
              backgroundColor: "#ffffff",
              fontSize: "0.85rem",
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

      <Divider sx={{ mb: 4, borderColor: '#e2e8f0' }} />

      {filteredList.length === 0 ? (
        <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 8px 30px rgba(0,0,0,0.02)", backgroundColor: '#ffffff' }}>
          <Typography variant="h6" color="#94a3b8" fontWeight="600" sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
            {searchKeyword ? "검색 결과와 일치하는 차량이 없습니다." : "현재 승인 대기 중인 차량이 없습니다."}
          </Typography>
        </Paper>
      ) : (
        /* 🟢 Grid 대신 flexWrap을 사용하여 EditVehicleInform과 동일한 정렬 방식 적용 */
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: { xs: 3, md: 4 },
          justifyContent: { xs: 'center', sm: 'flex-start' },
        }}>
          {pagedList.map((cargo) => (
            <Paper key={cargo.cargoNo} elevation={0} sx={{
              width: CARD_WIDTH,
              maxWidth: { xs: 420, sm: 'none' },
              height: CARD_HEIGHT,
              flexShrink: 0,
              p: 3,
              borderRadius: "20px",
              backgroundColor: "#ffffff",
              border: '1px solid #f1f5f9',
              boxShadow: "0 4px 25px rgba(0, 0, 0, 0.02)",
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              overflow: 'hidden',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-3px)' }
            }}>
              {/* 썸네일 영역 */}
              <Box sx={{
                width: '100%',
                height: THUMB_HEIGHT,
                bgcolor: '#f8fafc',
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                overflow: 'hidden',
                flexShrink: 0
              }}>
                <img
                  src={toPreviewUrl(cargo.cargoImage)}
                  alt={cargo.cargoName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Box>

              {/* 콘텐츠 영역 */}
              <Box sx={{ textAlign: 'center', mt: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                <Box sx={{ width: '100%', minWidth: 0 }}>
                  <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={1} flexWrap="nowrap" sx={{ width: '100%', minWidth: 0 }}>
                    <Typography
                      fontWeight="800"
                      variant="h6"
                      color="#334155"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flexShrink: 1
                      }}
                    >
                      {cargo.cargoName}
                    </Typography>
                    <Chip label="대기" size="small" sx={{ fontWeight: 'bold', borderRadius: '8px', bgcolor: '#fff7ed', color: '#ea580c', flexShrink: 0 }} />
                  </Box>
                  <Typography color="textSecondary" fontSize="0.9rem" fontWeight="500" noWrap>{cargo.cargoCapacity}</Typography>
                  <Typography
                    variant="body2"
                    color="#2563eb"
                    fontWeight="700"
                    mt={0.8}
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    번호: {cargo.cargoNumber || '미기재'}
                  </Typography>
                  <Typography variant="caption" display="block" color="#64748b" mt={0.5}>
                    차주 ID: <b>{cargo.ownerId}</b>
                  </Typography>
                </Box>
              </Box>

              {/* 하단 버튼 영역 고정 */}
              <Box sx={{ mt: 'auto', pt: 3 }} display="flex" gap={1.2}>
                <Button fullWidth variant="contained" disableElevation onClick={() => handleApprove(cargo.cargoNo)} sx={{ borderRadius: "12px", py: 1.2, fontWeight: 'bold', fontSize: { xs: '0.85rem', sm: '1rem' }, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>
                  승인
                </Button>
                <Button fullWidth variant="outlined" color="error" onClick={() => handleReject(cargo.cargoNo)} sx={{ borderRadius: "12px", py: 1.2, fontWeight: 'bold', fontSize: { xs: '0.85rem', sm: '1rem' }, borderColor: "#fee2e2", bgcolor: "#fff5f5", "&:hover": { bgcolor: "#ffe4e4" } }}>
                  거절
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* 하단 페이지네이션 (다른 관리자 메뉴와 디자인 통일) */}
      <Box display="flex" justifyContent="center" mt={6}>
        <Pagination 
          count={totalPages} 
          page={page}
          onChange={(_, value) => {
            setPage(value);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          color="primary"
          size={isMobile ? "small" : "medium"}
          sx={{
            "& .MuiPaginationItem-root": { fontWeight: "bold", color: "#475569", borderRadius: "8px" },
            "& .MuiPaginationItem-root.Mui-selected": { bgcolor: "#2563eb", color: "#ffffff", "&:hover": { bgcolor: "#1d4ed8" } }
          }}
        />
      </Box>
    </Box>
  );
};

export default AdminCargoApproval;