import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import {
  Box, Grid, Paper, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import ReviewModal from '../components/review/ReviewModal';
import Sidebar from '../common/Sidebar'; 
import ResponsiveAppBar from '../common/ResponsiveAppBar'; 

const MyPage = () => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    // ✨ [디자인 포인트] 차트 색상을 팀 메인 컬러(파란색)로 변경
    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
        datasets: [{
          label: '수익',
          data: [300, 500, 400, 600, 700, 550],
          borderColor: '#2563eb', // 파란색 선
          borderWidth: 2,
          backgroundColor: 'rgba(37, 99, 235, 0.1)', // 옅은 파란색 배경
          borderRadius: 6, // 둥근 막대그래프
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: { color: '#64748b' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#64748b' }
          }
        },
      }
    });

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, []);

  const ownerId = 1; 

  // ✨ [디자인 포인트] 하얀색 둥근 모서리 플로팅 카드 스타일
  const cardStyle = {
    p: 3, 
    borderRadius: "20px", 
    backgroundColor: "#ffffff",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)", // 은은한 그림자
    border: "1px solid #f1f5f9"
  };

  return (
    // 전체 배경은 옅은 회색으로 둬야 하얀 카드가 예쁘게 보입니다.
    <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Sidebar ownerId={ownerId} /> 
      
      <Box sx={{ flexGrow: 1 }}>
        <Box component="main" sx={{ p: { xs: 2, md: 5 } }}>
          
          <Typography variant="h5" fontWeight="900" color="#0f172a" mb={4}>
            배송 정보 관리
          </Typography>

          {/* 4분할 탑 클래스 상태 카드 현황 */}
          <Grid container spacing={3} mb={4}>
            {[
              ['총 주문건수', '15건', '#2563eb'], // 파란색 포인트
              ['배송 중', '2건', '#3b82f6'],
              ['배송 완료', '13건', '#10b981'],
              ['취소/중단', '0건', '#64748b'],
            ].map(([label, value, colorCode], idx) => (
              <Grid item xs={6} md={3} key={idx}>
                <Paper sx={{ ...cardStyle, p: 2.5, textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight="600" color="#64748b" mb={0.5}>{label}</Typography>
                  <Typography variant="h5" fontWeight="800" sx={{ color: colorCode }}>{value}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* 그래프 & 문의 내역 플로팅 레이아웃 */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <Paper sx={cardStyle}>
                <Typography variant="subtitle1" fontWeight="bold" color="#1e293b" mb={2}>월별 수익률</Typography>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box sx={{ width: 10, height: 10, bgcolor: '#2563eb', borderRadius: '50%', mr: 1 }} />
                  <Typography variant="caption" fontWeight="600" color="#2563eb">수익 현황</Typography>
                </Box>
                <Box sx={{ pt: 1 }}><canvas ref={chartRef} height="140" /></Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={cardStyle}>
                <Typography variant="subtitle1" fontWeight="bold" color="#1e293b" mb={2}>내 문의 내역</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b', py: 1.5 }}>문의내용</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b', py: 1.5 }}>작성일</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b', py: 1.5 }}>답변여부</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        ['배송 지연 관련 문의', '2025-07-25', '답변 완료'],
                        ['결제 오류 문의', '2025-07-27', '미답변'],
                        ['운전자 위치 확인 요청', '2025-07-30', '답변 완료'],
                      ].map(([content, date, status], idx) => (
                        <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                          <TableCell align="center" sx={{ color: '#334155', py: 1.5 }}>{content}</TableCell>
                          <TableCell align="center" sx={{ color: '#64748b' }}>{date}</TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Box 
                              component="span" 
                              sx={{ 
                                px: 1.5, py: 0.5, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold',
                                bgcolor: status === '답변 완료' ? '#eff6ff' : '#fef2f2', // 파란색/빨간색 옅은 배경
                                color: status === '답변 완료' ? '#2563eb' : '#dc2626'   // 파란색/빨간색 진한 글씨
                              }}
                            >
                              {status}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* 하단 넓은 패널: 지난 배송 내역 */}
          <Paper sx={cardStyle}>
            <Typography variant="subtitle1" fontWeight="bold" color="#1e293b" mb={3}>지난 배송 내역 요약</Typography>
            <Grid container spacing={3}>
              {[
                ['충주 → 부산', '4.5M'],
                ['서울', '2.3M'],
                ['대구', '2M'],
                ['Germany', '1.7M'],
                ['Romania', '1.6M'],
                ['Japan', '1.2M'],
                ['Netherlands', '1M'],
                ['Netherlands', '1M'],
              ].map(([location, value], idx) => (
                <Grid item xs={6} sm={3} key={idx}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", p: 2, bgcolor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <Typography variant="body2" fontWeight="500" color="#475569">{location}</Typography>
                    <Typography variant="body2" fontWeight="700" color="#2563eb">{value}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
          
        </Box>
      </Box>
    </Box>
  );
};

export default MyPage;