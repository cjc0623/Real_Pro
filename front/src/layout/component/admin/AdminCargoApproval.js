import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Card, CardContent, CardMedia, Button, Grid, Chip, Divider, Paper, Stack, Pagination } from '@mui/material';
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

  const [pendingList, setPendingList] = useState([]);

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
      {/* 타이틀과 디바이더는 데스크톱에서 예쁘게 항상 왼쪽 정렬 상태 유지 */}
      <Typography variant="h4" fontWeight="900" mb={2} color="#0f172a" letterSpacing="-0.5px"
        sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }, textAlign: { xs: 'center', md: 'left' } }} 
      >
        차량 등록 승인 관리
      </Typography>

      <Divider sx={{ mb: 4, borderColor: '#e2e8f0' }} />

      {pendingList.length === 0 ? (
        <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 8px 30px rgba(0,0,0,0.02)", backgroundColor: '#ffffff' }}>
          <Typography variant="h6" color="#94a3b8" fontWeight="600" sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
            현재 승인 대기 중인 차량이 없습니다.
          </Typography>
        </Paper>
      ) : (
        /* 🚨 [반응형 분기 정렬 핵심] 모바일(xs) 환경에서 1열일 때는 center(중앙), 태블릿(sm) 이상부터는 flex-start(왼쪽 정렬) */
        <Grid container spacing={{ xs: 2.5, sm: 3, md: 4 }} justifyContent={{ xs: 'center', sm: 'flex-start' }}>
          {pendingList.map((cargo) => (
            <Grid item xs={12} sm={6} lg={4} key={cargo.cargoNo} display="flex" sx={{ maxWidth: { xs: '450px', sm: '100%' } }}> 
              <Card sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column', 
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.02)',
                border: "1px solid #f1f5f9",
                borderRadius: "20px", 
                backgroundColor: "#ffffff",
                overflow: 'hidden',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 35px rgba(0, 0, 0, 0.05)' }
              }}>
                <CardMedia
                  component="img"
                  image={toPreviewUrl(cargo.cargoImage)}
                  alt={cargo.cargoName}
                  sx={{ 
                    height: 200, 
                    width: '100%',
                    objectFit: 'cover', 
                    bgcolor: '#f8fafc', 
                    borderBottom: "1px solid #f1f5f9" 
                  }}
                />
                
                <CardContent sx={{ 
                  p: { xs: 2.5, sm: 3 }, 
                  flexGrow: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between' 
                }}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5} gap={1}>
                      <Typography variant="h6" fontWeight="800" color="#334155" sx={{ fontSize: { xs: '1rem', md: '1.15rem' }, wordBreak: 'break-word', letterSpacing: "-0.3px" }}>
                        {cargo.cargoName}
                      </Typography>
                      <Chip label="승인 대기" size="small" sx={{ fontWeight: 'bold', fontSize: "0.75rem", borderRadius: '8px', bgcolor: '#fff7ed', color: '#ea580c', flexShrink: 0 }} />
                    </Box>

                    <Stack spacing={1.2} mb={3.5}>
                      <Typography variant="body2" color="#64748b">
                        <strong style={{ color: "#334155" }}>차량 번호:</strong> {cargo.cargoNumber || '미기재'}
                      </Typography>
                      <Typography variant="body2" color="#64748b">
                        <strong style={{ color: "#334155" }}>적재 무게:</strong> {cargo.cargoCapacity}
                      </Typography>
                      <Typography variant="body2" color="#64748b">
                        <strong style={{ color: "#334155" }}>차주 ID:</strong> <span style={{ color: "#2563eb", fontWeight: 600 }}>{cargo.ownerId}</span>
                      </Typography>
                    </Stack>
                  </Box>

                  <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={1.5} mt="auto">
                    <Button variant="contained" disableElevation fullWidth sx={{ borderRadius: "12px", py: 1.2, fontWeight: 'bold', bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }} onClick={() => handleApprove(cargo.cargoNo)}>
                      승인
                    </Button>
                    <Button variant="outlined" fullWidth sx={{ borderRadius: "12px", py: 1.2, fontWeight: 'bold', borderColor: "#fee2e2", color: "#ef4444", bgcolor: "#fff5f5", "&:hover": { bgcolor: "#ffe4e4", borderColor: "#fca5a5" } }} onClick={() => handleReject(cargo.cargoNo)}>
                      거절
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 하단 페이지네이션 (다른 관리자 메뉴와 디자인 통일) */}
      <Box display="flex" justifyContent="center" mt={6}>
        <Pagination 
          count={1} 
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