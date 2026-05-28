import React, { useEffect, useState } from "react";
import { Box, Grid, Paper, Typography, CircularProgress, Alert } from "@mui/material";
import { ArcElement, BarElement, CategoryScale, Chart, Legend, LinearScale, Title, Tooltip } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import axios from "axios";
import { fetchDashboardData } from "../../../api/adminApi/adminDashboardApi";


Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchDashboardData();
        console.log("Axios Response:", response);
        setDashboardData(response);
      } catch (err) {
        setError("데이터를 불러오지 못했습니다. 다시 시도해 주세요.");
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#2563eb' }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: "12px" }}>{error}</Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    console.log("Dashboard Data (when no data):", dashboardData);
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ borderRadius: "12px" }}>표시할 데이터가 없습니다.</Alert>
      </Box>
    );
  }

  // 🔵 [차트 디자인 롤백] 원색 칩 무리를 시원하고 트렌디한 모던 블루 계열 크롬으로 변경
  const barData = {
    labels: dashboardData.monthlyDeliveries.map(item => item.month),
    datasets: [
      {
        label: '월 별 배송내역',
        data: dashboardData.monthlyDeliveries.map(item => item.count),
        backgroundColor: 'rgba(37, 99, 235, 0.15)', // 메인 연한 블루
        borderColor: '#2563eb', // 메인 딥 블루
        borderWidth: 2,
        borderRadius: 8, // 🟢 막대그래프 동글동글 처리
        barThickness: 24,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    scales: {
      y: { beginAtZero: true },
    },
    plugins: {
      title: { display: true, text: '월별 배송 내역', font: { size: 18, weight: 'bold' } },
      legend: { display: true, position: 'top' },
    },
  };

  // 🔵 [차트 디자인 롤백] 두 번째 회원가입 차트도 동일한 패밀리 룩(소프트 스카이 블루) 매칭
  const bar2Data = {
    labels: dashboardData.newMembersByMonth.map(item => item.month),
    datasets: [
      {
        label: '신규 회원가입',
        data: dashboardData.newMembersByMonth.map(item => item.count),
        backgroundColor: 'rgba(56, 189, 248, 0.2)', // 시원한 스카이 블루 크롬
        borderColor: '#0ea5e9',
        borderWidth: 2,
        borderRadius: 8, // 🟢 막대그래프 동글동글 처리
        barThickness: 24,
      },
    ],
  };

  const bar2Options = {
    responsive: true,
    scales: {
      y: { beginAtZero: true },
    },
    plugins: {
      title: { display: true, text: '신규 회원가입', font: { size: 18, weight: 'bold' } },
      legend: { display: true, position: 'top' },
    },
  };

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3.5, md: 5 }, // 📱 모바일 패딩 축소로 본문 가득 차게 최적화
      pl: { xs: 2, sm: 4, md: 6, lg: 10 }, 
      pr: { xs: 2, sm: 4, md: 6, lg: 10 }, 
      bgcolor: '#f8fafc', // 사이드바 본체와 조화를 이루는 초경량 화이트-그레이 배경 
      minHeight: '100vh' 
    }}>
      <Box sx={{ p: 0, maxWidth: 1400, mx: "auto" }}>
        <Typography variant="h4" fontWeight="900" color="#0f172a" letterSpacing="-0.5px" mb={2} sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }, textAlign: { xs: 'center', md: 'left' } }}>
                        이용 통계
                    </Typography>

        {/* 최상단 4분할 지표 현황 보정 - 모바일 화면 압착 대응 유연한 스케일 가공 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: { xs: 1.5, sm: 2.5 }, mb: { xs: 3.5, md: 5 } }}>
          {[
            { label: "사용자수", value: dashboardData.totalUsers, colorCode: "#2563eb" },
            { label: "이번달 매출", value: dashboardData.monthlyRevenue, colorCode: "#0ea5e9" },
            { label: "신규회원", value: dashboardData.newMembers, colorCode: "#10b981" },
            { label: "총 배송건", value: dashboardData.totalDeliveries, colorCode: "#64748b" },
          ].map((item, idx) => (
            <Paper
              key={idx}
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 }, // 📱 내부 컴포넌트 여백 다이어트
                minHeight: { xs: 90, sm: 110 }, // 📱 텍스트 짤림 완전 차단 가변 높이 수술
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#ffffff",
                border: "1px solid #f1f5f9",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                borderRadius: "20px", 
                textAlign: 'center',
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" }
              }}
            >
              <Typography variant="body2" color="#64748b" fontWeight="700" mb={0.5} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{item.label}</Typography>
              <Typography variant="h5" fontWeight="900" sx={{ color: item.colorCode, letterSpacing: "-0.5px", fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>{item.value.toLocaleString()}</Typography>
            </Paper>
          ))}
        </Box>

        {/* 하단 투 트랙 메인 그래프 프레임 라운딩 확장 - 모바일 디렉션 세로 자동 스택 가공 */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, // 📱 가로폭 압착 방지를 위해 lg 이하 기기는 강제 세로 스택
            gap: { xs: 2.5, md: 3 },
            mb: 4,
          }}
        >
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, height: { xs: 300, sm: 380, md: 460 }, width: "100%", minWidth: 0, boxSizing: "border-box", overflow: "hidden", backgroundColor: "#ffffff", border: "1px solid #f1f5f9", boxShadow: "0 8px 30px rgba(0,0,0,0.02)", borderRadius: "24px" }}>
            <Bar
              data={bar2Data}
              options={{
                ...bar2Options,
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: 4 },
                scales: {
                  x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 11 }, maxRotation: 0, minRotation: 0, autoSkip: true } },
                  y: { beginAtZero: true, grid: { color: '#f1f5f9', drawBorder: false }, ticks: { color: "#64748b", font: { size: 11 } } },
                },
                plugins: {
                  title: { display: true, text: "신규 회원가입", font: { size: 15, weight: "900" }, color: "#1e293b" },
                  legend: { display: false },
                  tooltip: { mode: "index", intersect: false },
                },
                categoryPercentage: 0.5,
                barPercentage: 0.7,
              }}
            />
          </Paper>

          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, height: { xs: 300, sm: 380, md: 460 }, width: "100%", minWidth: 0, boxSizing: "border-box", overflow: "hidden", backgroundColor: "#ffffff", border: "1px solid #f1f5f9", boxShadow: "0 8px 30px rgba(0,0,0,0.02)", borderRadius: "24px" }}>
            <Bar
              data={barData}
              options={{
                ...barOptions,
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: 4 },
                scales: {
                  x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 11 }, maxRotation: 0, minRotation: 0, autoSkip: true } },
                  y: { beginAtZero: true, grid: { color: '#f1f5f9', drawBorder: false }, ticks: { color: "#64748b", font: { size: 11 } } },
                },
                plugins: {
                  title: { display: true, text: "월별 배송 내역", font: { size: 15, weight: "900" }, color: "#1e293b" },
                  legend: { display: false },
                  tooltip: { mode: "index", intersect: false },
                },
                categoryPercentage: 0.5,
                barPercentage: 0.7,
              }}
            />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminPage;