import { API_BASE } from '../../../config';
// MyInform.jsx
import React, { useEffect, useRef, useState } from 'react';
import { getMyInquiries } from '../../../api/qnaApi/qnaApi';
import { getOwnerMonthlyRevenue } from '../../../api/ownerApi/ownerMetricsApi';
import Chart from 'chart.js/auto';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import axios from 'axios';
import { attachRefreshInterceptor } from '../../../lib/tokenRefresh';
import { getMyAllEstimateList, getMyPaidEstimateList } from '../../../api/estimateApi/estimateApi';

// ===== 공통 API 베이스/인스턴스 =====

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem('accessToken') ||
    sessionStorage.getItem('accessToken') ||
    sessionStorage.getItem('ACCESS_TOKEN') ||
    sessionStorage.getItem('ACCESS_TOKEN');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
attachRefreshInterceptor(api);

// ===== 유저 타입 파서 =====
const parseUserType = (raw) => {
  const t = raw?.userType || raw?.type || raw?.role || raw?.loginType || null;
  if (t === 'MEMBER' || t === 'CARGO_OWNER') return t;
  const data = raw?.data || raw?.user || raw?.payload || raw?.profile || raw?.account || raw?.result || {};
  const guess = data?.userType || data?.type || data?.role || data?.loginType || null;
  return (guess === 'MEMBER' || guess === 'CARGO_OWNER') ? guess : null;
};

// ===== 헬퍼 =====
const asList = (data) => (Array.isArray(data) ? data : Array.isArray(data?.dtoList) ? data.dtoList : []);

// 최근 6개월 버킷 생성: [{y, m, value:0}]  // ★
const makeLast6MonthBuckets = () => {
  const now = new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ y: d.getFullYear(), m: d.getMonth() + 1, value: 0 });
  }
  return buckets;
};

// 안전한 날짜 파싱(서버 필드명이 다를 수 있어 넓게 커버) // ★
const extractEstimateDate = (it) => {
  const candidates = [
    it?.startTime, it?.start_time,          // ★ estimate 기준일
    it?.orderTime, it?.order_time,          // 혹시 주문일로 들어오는 경우
    it?.createdAt, it?.created_at, it?.regDate, it?.reg_date,
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    const norm = typeof raw === 'number' ? raw : String(raw).replace(' ', 'T');
    const d = new Date(norm);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

// ===== 차주용 API =====
const getOwnerPaidList = async () => {
  const { data } = await api.get('/fr/owner/deliveries/paid');
  return asList(data);
};
const getOwnerCompletedList = async () => {
  const { data } = await api.get('/fr/owner/deliveries/completed');
  return asList(data);
};

const MyInform = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const [userType, setUserType] = useState(null); // 'MEMBER' | 'CARGO_OWNER'
  const isMember = userType === 'MEMBER';
  const isOwner = userType === 'CARGO_OWNER';

  // 회원 카드용
  const [totalOrders, setTotalOrders] = useState(0);
  // 공통(회원/차주) 지표
  const [inTransitCount, setInTransitCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  // 차주 카드용
  const [totalDeliveries, setTotalDeliveries] = useState(0);

  // 차트용 공통 시리즈: [{year, month, value}]  // ★
  const [monthlySeries, setMonthlySeries] = useState([]);

  // 사용자 타입 조회
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/fr/user/info');
        const t = parseUserType(data) || 'MEMBER';
        if (!cancelled) setUserType(t);
      } catch {
        if (!cancelled) setUserType('MEMBER');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 데이터 로딩 (회원: 월별 요청 수 / 차주: 월별 수익)  // ★
  useEffect(() => {
    if (!userType) return;
    (async () => {
      try {
        if (isMember) {
          const all = await getMyAllEstimateList({ page: 1, size: 1000 });
          const list = asList(all);
          setTotalOrders(list.length);

          const paid = await getMyPaidEstimateList({ page: 1, size: 1000 });
          const paidList = asList(paid);
          setInTransitCount(paidList.filter(it => (it.deliveryStatus ?? it.status) === 'IN_TRANSIT').length);
          setCompletedCount(paidList.filter(it => (it.deliveryStatus ?? it.status) === 'COMPLETED').length);

          // ★ 월별 요청 수(estimate.start_time 기준)
          const buckets = makeLast6MonthBuckets();
          for (const it of list) {
            const d = extractEstimateDate(it);
            if (!d) continue;
            const y = d.getFullYear();
            const m = d.getMonth() + 1;
            const hit = buckets.find(b => b.y === y && b.m === m);
            if (hit) hit.value += 1;
          }
          setMonthlySeries(buckets.map(b => ({ year: b.y, month: b.m, value: b.value })));
        } else if (isOwner) {
          // 차주 지표
          const [paid, completed, revenue] = await Promise.all([
            getOwnerPaidList(),
            getOwnerCompletedList(),
            getOwnerMonthlyRevenue(),
          ]);

          const inTransit = paid.filter(it => (it.deliveryStatus ?? it.status) === 'IN_TRANSIT').length;
          setInTransitCount(inTransit);
          setCompletedCount(completed.length);
          setTotalDeliveries(paid.length + completed.length);

          // 월별 수익 시리즈로 맵핑
          const series = (revenue || []).map(r => ({
            year: r.year, month: r.month, value: r.revenue ?? 0,
          }));
          setMonthlySeries(series);
        }

        // 문의 내역(공통)
        const qnas = await getMyInquiries(10);
        setInquiries(qnas);
      } catch (e) {
        console.error('대시보드 로딩 실패:', e);
        setTotalOrders(0);
        setInTransitCount(0);
        setCompletedCount(0);
        setTotalDeliveries(0);
        setMonthlySeries([]);
        setInquiries([]);
      }
    })();
  }, [userType, isMember, isOwner]);

  // 차트 생성/업데이트  // ★
  useEffect(() => {
    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return;

    const chartLabel = isOwner ? '수익' : '요청 수';

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [], datasets: [{
            label: '요청 수', data: [], borderWidth: 2,
            // 🔵 보라색 테마를 선명한 메인 블루(#2563eb)와 라운딩(borderRadius)으로 변경
            backgroundColor: 'rgba(37, 99, 235, 0.1)', 
            borderColor: '#2563eb',
            borderRadius: 8,
            barThickness: 24
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: '#f1f5f9' },
              ticks: {
                stepSize: 1,                                  // ★ 정수 단위
                color: '#64748b',
                callback: (v) => isOwner ? `${Number(v).toLocaleString()}원` : `${v}건`
              }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#64748b' }
            }
          },
          plugins: { legend: { labels: { boxWidth: 10, font: { weight: 'bold' } } } }
        }
      });
    }

    // 최근 6개월 버킷 만들고 서버 데이터 덮어쓰기
    const buckets = makeLast6MonthBuckets();
    for (const row of (monthlySeries || [])) {
      const hit = buckets.find(b => b.y === row.year && b.m === row.month);
      if (hit) hit.value = row.value ?? 0;
    }

    const labels = buckets.map(b => `${b.m}월`);
    const values = buckets.map(b => b.value);

    const chart = chartInstanceRef.current;
    chart.data.labels = labels;
    chart.data.datasets[0].label = chartLabel;                  // ★ 레이블 동적
    chart.data.datasets[0].data = values;
    chart.update();

    // 컴포넌트 교체/언마운트 시 정리(선택)
    return () => { /* 필요 시 chart 파괴 */ };
  }, [monthlySeries, isOwner, isMember]); // ★ 의존성에 타입도 포함

  if (!userType) {
    return <Box sx={{ p: 4 }}><Typography color="#2563eb" fontWeight="bold">사용자 정보를 불러오는 중…</Typography></Box>;
  }

  // 카드 정의 (유형별)
  const cards = isMember
    ? [
        ['총 주문건수', `${totalOrders}건`, '#2563eb'],
        ['배송 중', `${inTransitCount}건`, '#3b82f6'],
        ['배송 완료', `${completedCount}건`, '#10b981'],
      ]
    : [
        ['총 배달 건수', `${totalDeliveries}건`, '#2563eb'],
        ['배송 중', `${inTransitCount}건`, '#3b82f6'],
        ['배송 완료', `${completedCount}건`, '#10b981'],
      ];

  // 🟢 대시보드 공통 고급 카드 패널 프레임 스타일
  const cardPanelStyle = {
    p: 3, 
    borderRadius: "24px", 
    backgroundColor: "#ffffff",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.02)",
    border: "1px solid #f1f5f9",
    display: 'flex', 
    flexDirection: 'column', 
    minWidth: 0
  };

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <Box sx={{ flexGrow: 1, px: 0 }}>
        {/* 전체 외부 스킨 화이트 융합 */}
        <Box sx={{ p: { xs: 2.5, md: 5 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
          <Typography variant="h4" fontWeight="900" color="#0f172a" letterSpacing="-0.5px" mb={4} sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }, textAlign: { xs: 'center', md: 'left' } }}>
            {isMember ? '배송 정보 관리 (회원)' : '배송 정보 관리 (차주)'}
          </Typography>

          {/* 상태 상단 3분할 대시보드 카드 */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, minmax(220px, 1fr))' },
              gap: 2.5, mb: 4, width: '100%',
            }}
          >
            {cards.map(([label, value, dotColor], idx) => (
              <Paper key={idx} elevation={0} sx={{ ...cardPanelStyle, minHeight: 96, alignItems: 'center', justifyContent: 'center', textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                <Typography variant="caption" fontWeight="700" color="#64748b" mb={0.5}>{label}</Typography>
                <Typography variant="h5" fontWeight="900" sx={{ color: dotColor, letterSpacing: '-0.5px' }}>{value}</Typography>
              </Paper>
            ))}
          </Box>

          {/* 하단 그래프 및 내 문의 내역 그리드 스택 */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) minmax(0,1fr)' },
              gap: 3, alignItems: 'stretch', width: '100%', mb: 2,
            }}
          >
            {/* 1. 그래프 카드 패널 */}
            <Paper elevation={0} sx={{ ...cardPanelStyle, height: 340 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#1e293b" mb={1.5}>
                {isOwner ? '월별 수익' : '월별 요청 수'} {/* ★ 제목 동적 */}
              </Typography>

              <Box display="flex" alignItems="center" mb={2}>
                {/* 🔵 보라색 인디케이터를 시그니처 파란색으로 변경 */}
                <Box sx={{ width: 10, height: 10, bgcolor: '#2563eb', borderRadius: '50%', mr: 1 }} />
                <Typography variant="caption" fontWeight="700" color="#2563eb">
                  {isOwner ? '수익 현황' : '요청 수 통계'}
                </Typography>
              </Box>

              <Box sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
                <canvas
                  ref={chartRef}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                />
              </Box>
            </Paper>

            {/* 2. 문의 내역 카드 패널 */}
            <Paper elevation={0} sx={{ ...cardPanelStyle, height: 340 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#1e293b" mb={2} textAlign="left">
                내 문의 내역
              </Typography>

              <TableContainer sx={{ flex: 1, overflow: 'auto', borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569', bgcolor: '#f8fafc', py: 1.5 }}>문의내용</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569', bgcolor: '#f8fafc', py: 1.5 }}>작성일</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569', bgcolor: '#f8fafc', py: 1.5 }}>답변여부</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inquiries.length === 0 ? (
                      <TableRow>
                        <TableCell align="center" colSpan={3} sx={{ color: '#94a3b8', py: 4, fontWeight: 500 }}>
                          최근 접수된 문의 내역이 존재하지 않습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      inquiries.map((row, idx) => {
                        const status = row.answered ? '답변 완료' : '미답변';
                        const date = row.createdAt?.slice(0, 10);
                        const clickable = !!row.answered;
                        return (
                          <TableRow
                            key={row.postId ?? idx}
                            hover={clickable}
                            onClick={clickable ? () => navigate('/qaboard') : undefined}
                            sx={{ cursor: clickable ? 'pointer' : 'default', '&:hover': { bgcolor: '#f8fafc' } }}
                            title={clickable ? '게시판으로 이동' : '아직 답변이 없습니다.'}
                          >
                            <TableCell align="center" sx={{ textDecoration: clickable ? 'underline' : 'none', color: '#334155', fontWeight: 500, py: 1.5 }}>
                              {row.title}
                            </TableCell>
                            <TableCell align="center" sx={{ color: '#64748b', py: 1.5 }}>{date}</TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              {/* 🟢 답변 여부를 라운딩 뱃지형 스킨으로 가공 */}
                              <Box 
                                component="span" 
                                sx={{ 
                                  px: 1.5, py: 0.5, borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                                  bgcolor: row.answered ? '#eff6ff' : '#fef2f2',
                                  color: row.answered ? '#2563eb' : '#dc2626'
                                }}
                              >
                                {status}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MyInform;