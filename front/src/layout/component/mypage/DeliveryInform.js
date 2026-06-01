// DeliveryInfoPage.jsx (full)
// 완료된 배송: 신고버튼 추가 (deliveryNo 전달)
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Divider, Container, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Modal, Rating
} from '@mui/material';
import PageComponent from '../common/PageComponent';
import { useNavigate } from "react-router-dom";
import { getMyUnpaidEstimateList, getMyPaidEstimateList } from '../../../api/estimateApi/estimateApi';
import { simplifyBatch } from "../../../api/addressApi/addressApi";
import axios from 'axios';
import ReportComponent from './ReportComponent';
import { createReview, getReviewExistsByDeliveryNo } from '../../../api/reviewApi/reviewApi';


// ===== 공통 API 베이스/인스턴스 =====
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_API_BASE ||
  'http://localhost:8080';

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

// ===== 유저 타입 파서 =====
const parseUserType = (raw) => {
  const t = raw?.userType || raw?.type || raw?.role || raw?.loginType || null;
  if (t === 'MEMBER' || t === 'CARGO_OWNER') return t;
  const data = raw?.data || raw?.user || raw?.payload || raw?.profile || raw?.account || raw?.result || {};
  const guess = data?.userType || data?.type || data?.role || data?.loginType || null;
  return (guess === 'MEMBER' || guess === 'CARGO_OWNER') ? guess : null;
};

// ===== 리스트 형태 통일 =====
const asList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.dtoList)) return data.dtoList;
  return [];
};

// ===== 차주용 API =====
const getOwnerUnpaidList = async ({ page, size }) => {
  const { data } = await api.get('/g2i4/owner/deliveries/unpaid', { params: { page, size } });
  return data ?? [];
};
const getOwnerPaidList = async ({ page, size }) => {
  const { data } = await api.get('/g2i4/owner/deliveries/paid', { params: { page, size } });
  return data ?? [];
};
const getOwnerCompletedList = async ({ page, size }) => {
  const { data } = await api.get('/g2i4/owner/deliveries/completed', { params: { page, size } });
  return data ?? [];
};
const startDelivery = async (matchingNo) => {
  try {
    const { data } = await api.post(`/g2i4/owner/deliveries/${matchingNo}/in_transit`);
    return data;
  } catch (e) {
    const status = e?.response?.status;
    if (status === 404 || status === 405) {
      const { data } = await api.post(`/g2i4/owner/deliveries/${matchingNo}/start`);
      return data;
    }
    throw e;
  }
};
const completeDelivery = async (matchingNo) => {
  const { data } = await api.post(`/g2i4/owner/deliveries/${matchingNo}/complete`);
  return data;
};

// ===== 유틸 =====
const initState = {
  dtoList: [], pageNumList: [],
  prev: false, next: false, totalCount: 0,
  prevPage: 0, nextPage: 0, totalPage: 0, current: 1,
};
const isAfterDay = (a, b) => {
  if (!a || !b) return false;
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return A.getTime() > B.getTime();
};
const parseDateSmart = (v) => {
  if (v == null) return null;
  if (typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === 'string') {
    const raw = v.trim();
    if (!raw) return null;
    const ymdDash = /^(\d{4})-(\d{2})-(\d{2})$/;
    const ymdDot = /^(\d{4})\.(\d{2})\.(\d{2})$/;
    const ymdSlash = /^(\d{4})\/(\d{2})\/(\d{2})$/;
    let m;
    if ((m = raw.match(ymdDash)) || (m = raw.match(ymdDot)) || (m = raw.match(ymdSlash))) {
      const year = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) - 1;
      const day = parseInt(m[3], 10);
      const d = new Date(year, month, day, 23, 59, 59, 999);
      return isNaN(d.getTime()) ? null : d;
    }
    const isoLike = raw.includes(' ') ? raw.replace(' ', 'T') : raw;
    const d = new Date(isoLike);
    return isNaN(d.getTime()) ? null : d;
  }
  try {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
};
const DUE_KEYS = [
  'startTime', 'deliveryDueDate', 'deliveryDate', 'expectedDeliveryDate',
  'expectedEndDate', 'deliveryEndTime', 'endTime', 'endDate',
  'dueDate', 'paymentDueDate', 'paymentDeadline'
];
const pickFirst = (obj, keys) => {
  for (const k of keys) if (obj && obj[k] != null && obj[k] !== '') return obj[k];
  return null;
};
const normalizeBoolean = (v) => {
  if (v === true) return true;
  if (v === false) return false;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'y' || s === 'yes' || s === 'true' || s === '1';
};
const paginate = (data, { page, size }) => {
  const totalCount = data.length;
  const totalPage = Math.ceil(totalCount / size || 1);
  const current = Math.min(Math.max(1, page), totalPage);
  const startIdx = (current - 1) * size;
  const endIdx = startIdx + size;
  const pageData = data.slice(startIdx, endIdx);
  const startPage = Math.max(1, current - 2);
  const endPage = Math.min(totalPage, startPage + 4);
  const pageNumList = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  return { dtoList: pageData, pageNumList, prev: current > 1, next: current < totalPage, totalCount, totalPage, prevPage: current > 1 ? current - 1 : 1, nextPage: current < totalPage ? current + 1 : totalPage, current };
};
const formatDateHour = (v) => {
  const d = parseDateSmart(v);
  return d
    ? d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false })
    : '-';
};
const statusKo = (s) => s === 'IN_TRANSIT' ? '배송 중' : s === 'COMPLETED' ? '배송 완료' : '대기';

// ===== 메인 컴포넌트 =====
const DeliveryInfoPage = () => {
  const getRequesterId = (item) =>
    item?.requesterId ??
    item?.memberId ??
    item?.memId ??
    item?.member_id ??
    item?.member ??
    null;
  const navigate = useNavigate();

  const handleViewOrderSummary = (matchingNo) => {
    if (!matchingNo) return;
    navigate('/mypage/order-summary', { state: { matchingNo } });
  };
  const [userType, setUserType] = useState(null); // 'MEMBER' | 'CARGO_OWNER'
  const isMember = userType === 'MEMBER';
  const isOwner = userType === 'CARGO_OWNER';

  // 공용 상태
  const [serverData, setServerData] = useState(initState);
  const [pageParams, setPageParams] = useState({ page: 1, size: 5 });
  const [paidData, setPaidData] = useState(initState);
  const [paidPage, setPaidPage] = useState({ page: 1, size: 5 });
  const [completedData, setCompletedData] = useState(initState);
  const [completedPage, setCompletedPage] = useState({ page: 1, size: 5 });

  // 완료 모달
  const [openCompleteModal, setOpenCompleteModal] = useState(false);
  const [selectedMatchingNo, setSelectedMatchingNo] = useState(null);
  const [confirmText, setConfirmText] = useState("");

  // 배송 시작 모달
  const [openStartModal, setOpenStartModal] = useState(false);
  const [selectedStartMatchingNo, setSelectedStartMatchingNo] = useState(null);

  //Review Modal State
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [selectedDeliveryNoForReview, setselectedDeliveryNoForReview] = useState(null);
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewScore, setReviewScore] = useState(0);
  const [reviewedMap, setReviewedMap] = useState({});
  const [reviewImages, setReviewImages] = useState([]);

  //모달 열기 함수 추가
  const handleReviewClick = (item) => {
    setselectedDeliveryNoForReview(item.deliveryNo);
    setSelectedReviewItem(item);
    setOpenReviewModal(true);
  };
  //모달 닫기 함수 추가
  const handleCloseReviewModal = () => {
    setOpenReviewModal(false);
    setselectedDeliveryNoForReview(null);
    setSelectedReviewItem(null);
    setReviewContent('');
    setReviewScore(0);
    setReviewImages([]);
  };
  const validateImageFiles = (files) => {
    if (files.length > 3) {
      alert("이미지는 최대 3장까지 선택할 수 있습니다.");
      return false;
    }

    const invalidFile = files.find((file) => {
      const lower = file.name.toLowerCase();

      const validExt =
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp");

      const validSize = file.size <= 10 * 1024 * 1024;

      return !validExt || !validSize;
    });

    if (invalidFile) {
      alert("jpg, jpeg, png, webp 파일만 가능하며, 1개당 최대 10MB까지 업로드 가능합니다.");
      return false;
    }

    return true;
  };
  const handleReviewImageChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (!validateImageFiles(files)) {
      e.target.value = "";
      setReviewImages([]);
      return;
    }

    setReviewImages(files);
  };

  //deliveryNo가 있으면 리뷰 조회 API 호출 함수
  const loadReviewedMap = async (completedList) => {
    const map = {};

    for (const item of completedList) {
      if (!item.deliveryNo) {
        map[item.deliveryNo] = false;
        continue;
      }

      try {
        const exists = await getReviewExistsByDeliveryNo(item.deliveryNo);
        map[item.deliveryNo] = exists;
      } catch (error) {
        map[item.deliveryNo] = false;
      }
    }
    setReviewedMap(map);
  };

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedMatchingNoForReport, setSelectedMatchingNoForReport] = useState(null);

  const handleOpenReportModal = (matchingNo) => {
    setSelectedMatchingNoForReport(matchingNo);
    setShowReportModal(true);
  };

  const handleConfirmClick = (matchingNo) => {
    navigate("/order", { state: { matchingNo } });
  };

  // ===== 완료 모달 제어 =====
  const handleOpenCompleteModal = (matchingNo) => {
    setSelectedMatchingNo(matchingNo);
    setConfirmText("");
    setOpenCompleteModal(true);
  };
  const handleCloseCompleteModal = () => {
    setOpenCompleteModal(false);
    setSelectedMatchingNo(null);
    setConfirmText("");
  };
  const handleConfirmComplete = async () => {
    if (confirmText !== "배송완료") return;
    try {
      await completeDelivery(selectedMatchingNo);
      setPaidPage((p) => ({ ...p }));      // 새로고침 트리거
      setCompletedPage((p) => ({ ...p })); // 새로고침 트리거
      handleCloseCompleteModal();
    } catch (e) {
      alert('완료 처리에 실패했습니다.');
    }
  };

  // ===== 배송 시작 모달 제어 =====
  const handleOpenStartModal = (matchingNo) => {
    setSelectedStartMatchingNo(matchingNo);
    setOpenStartModal(true);
  };
  const handleCloseStartModal = () => {
    setOpenStartModal(false);
    setSelectedStartMatchingNo(null);
  };
  const handleConfirmStart = async () => {
    try {
      await startDelivery(selectedStartMatchingNo);
      setPaidPage((p) => ({ ...p })); // 갱신
      handleCloseStartModal();
    } catch (e) {
      alert('배송 시작 처리에 실패했습니다.');
    }
  };

  // 사용자 타입 조회
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/g2i4/user/info');
        const t = parseUserType(data);
        if (!cancelled) setUserType(t || 'MEMBER');
      } catch {
        if (!cancelled) setUserType('MEMBER');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 미결제(회원/차주 공용)
  useEffect(() => {
    if (!userType) return;
    (async () => {
      try {
        const raw = userType === 'MEMBER'
          ? await getMyUnpaidEstimateList(pageParams)
          : await getOwnerUnpaidList(pageParams);

        const base = asList(raw);
        const sorted = [...base].sort((a, b) => {
          const A = typeof a.eno === "string" ? parseInt(a.eno, 10) : a.eno ?? 0;
          const B = typeof b.eno === "string" ? parseInt(b.eno, 10) : b.eno ?? 0;
          return B - A;
        });

        const addresses = [];
        for (const it of sorted) {
          addresses.push(it.startAddress || "");
          addresses.push(it.endAddress || "");
        }
        const results = await simplifyBatch(addresses);

        const withShort = sorted.map((it, idx) => ({
          ...it,
          startAddressShort: results[idx * 2] ?? "",
          endAddressShort: results[idx * 2 + 1] ?? "",
        }));

        setServerData(paginate(withShort, pageParams));
      } catch (err) {
        console.error("미결제 목록 로딩 실패:", err);
        setServerData(paginate([], pageParams));
      }
    })();
  }, [userType, pageParams]);

  // 결제됨/완료(회원/차주 분기)
  useEffect(() => {
    if (!userType) return;
    (async () => {
      try {
        if (userType === 'MEMBER') {
          const raw = await getMyPaidEstimateList(paidPage);
          const base = asList(raw);

          const sorted = [...base].sort((a, b) => {
            const A = typeof a.eno === "string" ? parseInt(a.eno, 10) : a.eno ?? 0;
            const B = typeof b.eno === "string" ? parseInt(b.eno, 10) : b.eno ?? 0;
            return B - A;
          });

          const completed = sorted.filter((it) => it.deliveryStatus === 'COMPLETED');
          const inProgressOrWaiting = sorted.filter((it) => it.deliveryStatus !== 'COMPLETED');

          setPaidData(paginate(inProgressOrWaiting, paidPage));
          setCompletedData(paginate(completed, completedPage));
          await loadReviewedMap(completed);
        } else {
          const paid = asList(await getOwnerPaidList(paidPage));
          const completed = asList(await getOwnerCompletedList(completedPage));

          setPaidData(paginate(paid, paidPage));
          setCompletedData(paginate(completed, completedPage));
        }
      } catch (err) {
        console.error("결제/완료 로딩 실패:", err);
        setPaidData(paginate([], paidPage));
        setCompletedData(paginate([], completedPage));
      }
    })();
  }, [userType, paidPage, completedPage]);

  // 페이지 이동 핸들러
  const movePage = (pageObj) => setPageParams((prev) => ({ ...prev, ...pageObj }));
  const movePaidPage = (pageObj) => setPaidPage((prev) => ({ ...prev, ...pageObj }));
  const moveCompletedPage = (pageObj) => setCompletedPage((prev) => ({ ...prev, ...pageObj }));
  const unpaidColCount = isOwner ? 6 : 7;
  
  // 공용 colgroup (미결제/결제됨)
  const tableColgroup = useMemo(() => (
    <colgroup>
      <col style={{ width: '12%' }} /> {/* 화물명 */}
      <col style={{ width: '8%' }} />  {/* 무게 */}
      <col style={{ width: '20%' }} /> {/* 출발지 */}
      <col style={{ width: '20%' }} /> {/* 도착지 */}
      <col style={{ width: '15%' }} /> {/* 배송 시작일 */}
      {!isOwner && <col style={{ width: '12%' }} />} {/* 운전 기사 */}
      <col style={{ width: '13%' }} /> {/* 상태/승인 */}
    </colgroup>
  ), [isOwner]);

  const paidColgroup = useMemo(() => (
    <colgroup>
      <col style={{ width: '10%' }} />
      <col style={{ width: '8%' }} />
      <col style={{ width: '18%' }} />
      <col style={{ width: '18%' }} />
      <col style={{ width: '14%' }} />
      <col style={{ width: '10%' }} />
      <col style={{ width: '11%' }} />
      <col style={{ width: '11%' }} />
    </colgroup>
  ), []);

  const completedColgroup = useMemo(() => (
    <colgroup>
      <col style={{ width: '10%' }} />
      <col style={{ width: '8%' }} />
      <col style={{ width: '16%' }} />
      <col style={{ width: '16%' }} />
      <col style={{ width: '14%' }} />
      <col style={{ width: '10%' }} />
      {isMember && <col style={{ width: '8%' }} />}
      {isMember && <col style={{ width: '8%' }} />}
      <col style={{ width: '10%' }} />
    </colgroup>
  ), [isMember]);

  // 🟢 [공통 세련된 카드 & 라운딩 테이블 스킨 정의]
  const cardPanelStyle = {
    p: { xs: 2.5, md: 4 },
    borderRadius: "24px",
    backgroundColor: "#ffffff",
    border: "1px solid #f1f5f9",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.02)",
    mb: 6
  };

  // 📱 모바일 전용 카드 렌더러 (기존 로직 유지하며 UI만 카드화)
  const renderMobileCards = (list, type) => {
    if (!list || list.length === 0) {
      return (
        <Typography sx={{ py: 4, textAlign: 'center', color: '#94a3b8' }}>
          내역이 존재하지 않습니다.
        </Typography>
      );
    }
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {list.map((item) => {
          const mNo = item.matchingNo ?? item.mno ?? item.matching_no ?? null;
          const s = item.deliveryStatus ?? null;
          const doneAt = item.deliveryCompletedAt ?? item.endTime ?? null;
          const isAccepted = normalizeBoolean(item.isAccepted);

          return (
            <Paper key={item.eno} variant="outlined" sx={{ p: 2, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography fontWeight="bold" color="#2563eb">{item.cargoType}</Typography>
                <Typography variant="body2" color="#64748b">{item.cargoWeight}</Typography>
              </Box>
              
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="body2" sx={{ color: '#475569' }}><strong>출발:</strong> {item.startAddress}</Typography>
                <Typography variant="body2" sx={{ color: '#475569' }}><strong>도착:</strong> {item.endAddress}</Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                  <strong>{type === 'completed' ? '완료일' : '시작일'}:</strong> {formatDateHour(type === 'completed' ? doneAt : item.startTime)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155' }}>
                  <strong>{isOwner ? '의뢰자' : '기사님'}:</strong> {isOwner ? (item.memName || '-') : (item.driverName ?? '-')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {mNo && (
                  <Button variant="outlined" size="small" fullWidth onClick={() => handleViewOrderSummary(mNo)} sx={{ borderRadius: "8px" }}>
                    주문서 상세보기
                  </Button>
                )}

                {type === 'unpaid' && !isOwner && isAccepted && (
                  <Button variant="contained" fullWidth onClick={() => handleConfirmClick(item.matchingNo)} sx={{ borderRadius: "8px", bgcolor: "#2563eb" }}>
                    승인 확인
                  </Button>
                )}

                {type === 'paid' && isOwner && (
                  <>
                    {(s === 'PENDING' || !s) && (
                      <Button variant="outlined" fullWidth onClick={() => handleOpenStartModal(mNo)} sx={{ borderRadius: "8px" }}>배송 시작</Button>
                    )}
                    {s === 'IN_TRANSIT' && (
                      <Button variant="contained" fullWidth color="success" onClick={() => handleOpenCompleteModal(mNo)} sx={{ borderRadius: "8px" }}>배송 완료</Button>
                    )}
                  </>
                )}
                
                {type === 'paid' && !isOwner && (
                   <Box sx={{ width: '100%', textAlign: 'center', py: 0.5, bgcolor: '#f1f5f9', borderRadius: '8px' }}>
                     <Typography variant="body2" fontWeight="bold" color="#64748b">{statusKo(s)}</Typography>
                   </Box>
                )}

                {type === 'completed' && isMember && (
                  <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    <Button 
                      variant="contained" 
                      size="small" 
                      fullWidth 
                      disabled={reviewedMap[item.deliveryNo]}
                      onClick={() => handleReviewClick(item)}
                      sx={{ borderRadius: "8px" }}
                    >
                      {reviewedMap[item.deliveryNo] ? '작성완료' : '리뷰'}
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      size="small" 
                      fullWidth 
                      onClick={() => handleOpenReportModal(mNo)}
                      sx={{ borderRadius: "8px" }}
                    >
                      신고
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>
    );
  };

  const tableContainerStyle = {
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    display: { xs: 'none', md: 'block' } // 🖥️ 데스크톱에서만 테이블 표시
  };

  // 렌더러: 미결제
  const renderUnpaidRows = (list) => {
    const now = new Date();
    if (!list || list.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={unpaidColCount} align="center" sx={{ py: 4, color: '#94a3b8' }}>진행 중인 의뢰 내역이 존재하지 않습니다.</TableCell>
        </TableRow>
      );
    }
    return list.map((item) => {
      const start = parseDateSmart(item.startTime);
      const due = parseDateSmart(pickFirst(item, DUE_KEYS));
      const isAccepted = normalizeBoolean(item.isAccepted);
      let rightCell = null;

      if (isOwner) {
        if (due && isAfterDay(now, due)) {
          rightCell = <Box component="span" sx={{ px: 1.5, py: 0.5, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', bgcolor: '#fef2f2', color: '#dc2626' }}>결제 기한 경과</Box>;
        } else {
          rightCell = <Box component="span" sx={{ px: 1.5, py: 0.5, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', bgcolor: '#f8fafc', color: '#64748b' }}>결제 대기</Box>;
        }
      } else {
        if (due && isAfterDay(now, due) && isAccepted) {
          rightCell = <Box component="span" sx={{ px: 1.5, py: 0.5, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', bgcolor: '#fff7ed', color: '#ea580c' }}>결제일 초과</Box>;
        } else if (start && isAfterDay(now, start) && !isAccepted) {
          rightCell = <Box component="span" sx={{ px: 1.5, py: 0.5, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', bgcolor: '#fef2f2', color: '#dc2626' }}>매칭 취소</Box>;
        } else if (isAccepted) {
          rightCell = (
            <Button
              variant="contained"
              disableElevation
              size="small"
              onClick={() => handleConfirmClick(item.matchingNo)}
              sx={{ borderRadius: "10px", bgcolor: "#2563eb", fontWeight: "bold", "&:hover": { bgcolor: "#1d4ed8" } }}
            >
              승인 확인
            </Button>
          );
        } else {
          rightCell = <Box component="span" sx={{ px: 1.5, py: 0.5, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', bgcolor: '#fef2f2', color: '#dc2626' }}>미승인</Box>;
        }
      }

      return (
        <TableRow key={item.eno} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
          <TableCell align="center" sx={{ fontWeight: 600, color: '#334155' }}>{item.cargoType}</TableCell>
          <TableCell align="center" sx={{ color: '#475569' }}>{item.cargoWeight}</TableCell>
          <TableCell align="center" sx={{ color: '#475569' }}>{item.startAddressShort ?? ""}</TableCell>
          <TableCell align="center" sx={{ color: '#475569' }}>{item.endAddressShort ?? ""}</TableCell>
          <TableCell align="center" sx={{ color: '#475569' }}>
            <span style={{ whiteSpace: 'nowrap' }}>{formatDateHour(item.startTime)}</span>
          </TableCell>
          {!isOwner && (
            <TableCell align="center" sx={{ color: '#334155', fontWeight: 500 }}>{item.driverName ?? '-'}</TableCell>
          )}
          <TableCell align="center">{rightCell}</TableCell>
        </TableRow>
      );
    });
  };

  // 렌더러: 결제됨
  const renderPaidRows = (list) => {
    if (!list || list.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#94a3b8' }}>운송 진행 사항이 없습니다.</TableCell>
        </TableRow>
      );
    }
    return list.map((item) => {
      const s = item.deliveryStatus ?? null;
      const mNo = item.matchingNo ?? item.mno ?? item.matching_no ?? null;
      let ownerAction = (
        <Box component="span" sx={{ 
          px: 1.5, py: 0.5, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold',
          bgcolor: s === 'IN_TRANSIT' ? '#eff6ff' : '#f8fafc', 
          color: s === 'IN_TRANSIT' ? '#2563eb' : '#64748b' 
        }}>
          {statusKo(s)}
        </Box>
      );

      if (isOwner) {
        if (s === 'PENDING' || !s) {
          ownerAction = (
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleOpenStartModal(item.matchingNo ?? item.mno ?? item.matching_no)}
              sx={{ borderRadius: "10px", fontWeight: "bold", color: "#2563eb", borderColor: "#2563eb", "&:hover": { bgcolor: "#eff6ff" } }}
            >
              배송 시작
            </Button>
          );
        } else if (s === 'IN_TRANSIT') {
          ownerAction = (
            <Button
              variant="contained"
              disableElevation
              size="small"
              onClick={() => handleOpenCompleteModal(item.matchingNo ?? item.mno ?? item.matching_no)}
              sx={{ borderRadius: "10px", fontWeight: "bold", whiteSpace: "nowrap", bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
            >
              배송 완료
            </Button>
          );
        }
      }

      return (
        <TableRow key={item.eno} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
          <TableCell align="center" sx={{ fontWeight: 600, color: '#334155' }}>{item.cargoType}</TableCell>
          <TableCell align="center" sx={{ color: '#475569' }}>{item.cargoWeight}</TableCell>
          <TableCell align="center" sx={{ color: '#475569' }}>{item.startAddress}</TableCell>
          <TableCell align="center" sx={{ color: '#475569' }}>{item.endAddress}</TableCell>
          <TableCell align="center" sx={{ color: '#475569' }}>
            <span style={{ whiteSpace: 'nowrap' }}>{formatDateHour(item.startTime)}</span>
          </TableCell>
          <TableCell align="center" sx={{ color: '#334155', fontWeight: 500 }}> {isOwner ? (item.memName || '-') : (item.driverName ?? '-')}</TableCell>
          <TableCell align="center">
            {mNo ? (
              <Button variant="outlined" size="small" onClick={() => handleViewOrderSummary(mNo)} sx={{ borderRadius: "10px", whiteSpace: "nowrap", color: "#64748b", borderColor: "#cbd5e1", "&:hover": { bgcolor: "#f1f5f9" } }}>
                주문서 보기
              </Button>
            ) : (
              <Typography variant="body2" color="#94a3b8">-</Typography>
            )}
          </TableCell>
          <TableCell align="center">
            {isOwner ? ownerAction : (
              <Box component="span" sx={{ 
                px: 1.5, py: 0.5, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold',
                bgcolor: s === 'IN_TRANSIT' ? '#eff6ff' : '#f8fafc', 
                color: s === 'IN_TRANSIT' ? '#2563eb' : '#64748b' 
              }}>
                {statusKo(s)}
              </Box>
            )}
          </TableCell>
        </TableRow>
      );
    });
  };

  // 렌더러: 완료
  const renderCompletedRows = (list) => {
    if (!list || list.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={isMember ? 9 : 7} align="center" sx={{ py: 4, color: '#94a3b8' }}>완료된 운송 내역이 존재하지 않습니다.</TableCell>
        </TableRow>
      );
    }
    return list.map((item) => {
      const doneAt = item.deliveryCompletedAt ?? item.endTime ?? null;
      const matchingNo = item?.matchingNo ?? item?.mno ?? item?.matching_no ?? null;

      return (
        <TableRow key={item.eno} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
          <TableCell align="center" sx={{ fontWeight: 600, color: '#334155' }}>{item.cargoType}</TableCell>
          <TableCell align="center" sx={{ color: '#475569' }}>{item.cargoWeight}</TableCell>
          <TableCell align="center" sx={{ color: '#475569' }}>{item.startAddress}</TableCell>
          <TableCell align="center" sx={{ color: '#475569' }}>{item.endAddress}</TableCell>
          <TableCell align="center" sx={{ color: '#475569' }} style={{ whiteSpace: 'nowrap' }}>{formatDateHour(doneAt)}</TableCell>
          <TableCell align="center" sx={{ color: '#334155', fontWeight: 500 }}>{isOwner ? (item.memName || '-') : (item.driverName ?? '-')}</TableCell>

          {/* 리뷰 (회원 전용) */}
          {isMember && (
            <TableCell align="center">
              <Button
                variant="contained"
                disableElevation
                size="small"
                disabled={reviewedMap[item.deliveryNo]}
                onClick={() => handleReviewClick(item)}
                sx={{ 
                  minWidth: 80, borderRadius: "10px", fontWeight: "bold",
                  bgcolor: reviewedMap[item.deliveryNo] ? "#f1f5f9" : "#2563eb",
                  "&:hover": { bgcolor: "#1d4ed8" }
                }}
              >
                {reviewedMap[item.deliveryNo] ? '작성완료' : '리뷰'}
              </Button>
            </TableCell>
          )}

          {/* 신고 (회원 전용) */}
          {isMember && (
            <TableCell align="center">
              {matchingNo ? (
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  onClick={() => handleOpenReportModal(matchingNo)}
                  sx={{ borderRadius: "10px", fontWeight: "bold", borderColor: "#fee2e2", bgcolor: "#fff5f5", "&:hover": { bgcolor: "#ffe4e4" } }}
                >
                  신고
                </Button>
              ) : (
                <Typography variant="body2" color="#94a3b8">-</Typography>
              )}
            </TableCell>
          )}

          {/* 주문서 보기 */}
          <TableCell align="center">
            {matchingNo ? (
              <Button variant="outlined" size="small" onClick={() => handleViewOrderSummary(matchingNo)} sx={{ borderRadius: "10px", whiteSpace: "nowrap", color: "#64748b", borderColor: "#cbd5e1", "&:hover": { bgcolor: "#f1f5f9" } }}>
                주문서 보기
              </Button>
            ) : (
              <Typography variant="body2" color="#94a3b8">-</Typography>
            )}
          </TableCell>
        </TableRow>
      );
    });
  };

  if (!userType) return <Box sx={{ p: 6, color: '#2563eb', fontWeight: 'bold' }}>사용자 타입 확인 중…</Box>;

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 6, pb: { xs: '80px', md: 6 }, overflow: 'hidden' }}>
      <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, sm: 3, md: 4 }, maxWidth: '100vw', boxSizing: 'border-box' }}>
        
        <Typography variant="h4" fontWeight="900" color="#0f172a" mb={6} textAlign="left" sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
          {isMember ? '배송 정보 관리' : '차주 배송 관리'}
        </Typography>

        {/* 1. 미결제 섹션 폼 */}
        <Paper elevation={0} sx={cardPanelStyle}>
          <Typography variant="h6" fontWeight="800" color="#1e293b" mb={2.5}>
            {isMember ? '견적 의뢰 진행 상황 (미결제)' : '미결제 배송 요청'}
          </Typography>
          
          <TableContainer sx={tableContainerStyle}>
            <Table sx={{ '& .MuiTableCell-root': { height: 56 } }}>
              {tableColgroup}
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>화물명</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>무게</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>출발지</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>도착지</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>배송 시작일</TableCell>
                  {!isOwner && (<TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>운전 기사</TableCell>)}
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>{isOwner ? '상태' : '승인 여부'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{renderUnpaidRows(serverData.dtoList)}</TableBody>
            </Table>
          </TableContainer>

          {/* 📱 모바일 전용 뷰 (한눈에 보기) */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 2 }}>
            {renderMobileCards(serverData.dtoList, 'unpaid')}
          </Box>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <PageComponent serverData={serverData} movePage={movePage} />
          </Box>
        </Paper>

        {/* 2. 결제됨 섹션 폼 */}
        <Paper elevation={0} sx={cardPanelStyle}>
          <Typography variant="h6" fontWeight="800" color="#1e293b" mb={2.5}>
            {isMember ? '견적 의뢰 진행 상황 (결제됨)' : '진행 중 배송 (결제됨)'}
          </Typography>

          {/* 📱 모바일 전용 뷰 (한눈에 보기) */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 2 }}>
            {renderMobileCards(paidData.dtoList, 'paid')}
          </Box>

          <TableContainer sx={tableContainerStyle}>
            <Table sx={{ '& .MuiTableCell-root': { height: 56 } }}>
              {paidColgroup}
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>화물명</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>무게</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>출발지</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>도착지</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>배송 시작일</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>{isOwner ? '의뢰자 이름' : '운전 기사'}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>주문서</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>상태 관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{renderPaidRows(paidData.dtoList)}</TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <PageComponent serverData={paidData} movePage={movePaidPage} />
          </Box>
        </Paper>

        {/* 3. 배송 완료 섹션 폼 */}
        <Paper elevation={0} sx={cardPanelStyle}>
          <Typography variant="h6" fontWeight="800" color="#1e293b" mb={2.5}>
            {isMember ? '배송 완료 된 화물' : '완료된 배송'}
          </Typography>

          {/* 📱 모바일 전용 뷰 (한눈에 보기) */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 2 }}>
            {renderMobileCards(completedData.dtoList, 'completed')}
          </Box>

          <TableContainer sx={tableContainerStyle}>
            <Table sx={{ '& .MuiTableCell-root': { height: 56 } }}>
              {completedColgroup}
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>화물명</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>무게</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>출발지</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>도착지</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>{isMember ? '배송 완료일' : '완료일'}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>{isOwner ? '의뢰자 이름' : '운전 기사'}</TableCell>
                  {isMember && <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>리뷰</TableCell>}
                  {isMember && <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>신고</TableCell>}
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>주문서</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{renderCompletedRows(completedData.dtoList)}</TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <PageComponent serverData={completedData} movePage={moveCompletedPage} />
          </Box>
        </Paper>
      </Container>

      {/* 배송 완료 확인 모달 다듬기 */}
      <Dialog open={openCompleteModal} onClose={handleCloseCompleteModal} PaperProps={{ sx: { borderRadius: "16px", p: 1, width: { xs: '95%', sm: 'auto' } } }}>
        <DialogTitle sx={{ fontWeight: "bold" }}>배송 완료 처리</DialogTitle>
        <DialogContent>
          <Typography gutterBottom color="#475569">
            정말 완료 처리 하시겠습니까? <br />
            확인을 위해 아래 입력란에 <b>배송완료</b>라고 입력해주세요.
          </Typography>
          <TextField
            fullWidth
            margin="dense"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="배송완료"
            autoFocus
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                "& fieldset": { borderColor: "#cbd5e1" },
                "&.Mui-focused fieldset": { borderColor: "#2563eb" }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseCompleteModal} sx={{ color: "#64748b", fontWeight: "bold" }}>취소</Button>
          <Button
            onClick={handleConfirmComplete}
            color="success"
            variant="contained"
            disableElevation
            disabled={confirmText !== "배송완료"}
            sx={{ borderRadius: "10px", fontWeight: "bold" }}
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* 배송 시작 확인 모달 다듬기 */}
      <Dialog open={openStartModal} onClose={handleCloseStartModal} PaperProps={{ sx: { borderRadius: "16px", p: 1, width: { xs: '95%', sm: 'auto' } } }}>
        <DialogTitle sx={{ fontWeight: "bold" }}>배송 시작</DialogTitle>
        <DialogContent>
          <Typography gutterBottom color="#475569">
            해당 건을 <b>배송 중</b>으로 변경합니다. 진행하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseStartModal} sx={{ color: "#64748b", fontWeight: "bold" }}>취소</Button>
          <Button onClick={handleConfirmStart} variant="contained" disableElevation sx={{ borderRadius: "10px", bgcolor: "#2563eb", fontWeight: "bold", "&:hover": { bgcolor: "#1d4ed8" } }}>
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Modal 다듬기 */}
      <Modal open={showReportModal} onClose={() => setShowReportModal(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: 550 }, bgcolor: 'background.paper', borderRadius: "20px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.15)", p: 4, overflow: 'hidden'
        }}>
          <Typography variant="h6" component="h2" fontWeight="bold" mb={2}>
            🚨 신고 사유 작성
          </Typography>
          <ReportComponent
            matchingNo={selectedMatchingNoForReport}
            onClose={() => setShowReportModal(false)}
          />
        </Box>
      </Modal>

      {/* Review Modal 다듬기 */}
      <Dialog open={openReviewModal} onClose={handleCloseReviewModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: "bold" }}>✍️ 리뷰 작성</DialogTitle>
        <DialogContent>
          <Box sx={{ bgcolor: "#f8fafc", p: 2, borderRadius: "12px", mb: 2, display: 'flex', flexDirection: 'column', gap: 0.5, border: "1px solid #e2e8f0" }}>
            <Typography variant="body2" color="#475569"><strong>화물명 :</strong> {selectedReviewItem?.cargoType || '-'}</Typography>
            <Typography variant="body2" color="#475569"><strong>배송 완료일 :</strong> {formatDateHour(selectedReviewItem?.deliveryCompletedAt)}</Typography>
            <Typography variant="body2" color="#475569"><strong>운전 기사 :</strong> {selectedReviewItem?.driverName || '-'}</Typography>
          </Box>

          <Typography gutterBottom fontWeight="bold" color="#1e293b" sx={{ mt: 1 }}>별점 선택</Typography>
          <Rating value={reviewScore} precision={0.5} onChange={(event, newValue) => setReviewScore(newValue || 0)} sx={{ color: "#ffb700" }} />

          <TextField
            fullWidth multiline rows={4} label="기사님과 운송 서비스는 어떠셨나요? 솔직한 리뷰를 남겨주세요."
            value={reviewContent} onChange={(e) => setReviewContent(e.target.value)}
            sx={{
              mt: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: "14px",
                "& fieldset": { borderColor: "#cbd5e1" },
                "&.Mui-focused fieldset": { borderColor: "#2563eb" }
              }
            }}
          />
          
          <Box sx={{ mt: 3, p: 2, border: "1px dashed #cbd5e1", borderRadius: "14px", bgcolor: "#fafafa" }}>
            <Typography gutterBottom fontSize="0.95rem" fontWeight="bold">📸 리뷰 사진 첨부</Typography>
            <input type="file" accept="image/*" multiple onChange={handleReviewImageChange} style={{ marginTop: '4px' }} />
            <Typography variant="caption" color="#94a3b8" display="block" sx={{ mt: 1 }}>
              최대 3장까지 업로드 가능 (각 이미지 10MB 이하 규칙 엄수)
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseReviewModal} sx={{ color: "#64748b", fontWeight: "bold" }}>닫기</Button>
          <Button
            onClick={async () => {
              if (reviewScore === 0) { alert("별점을 선택해야 합니다."); return; }
              if (!reviewContent.trim()) { alert("리뷰 내용을 입력해야 합니다."); return; }

              const formData = new FormData();
              formData.append("deliveryNo", selectedDeliveryNoForReview);
              formData.append("rating", reviewScore);
              formData.append("comment", reviewContent.trim());
              reviewImages.forEach((file) => { formData.append("images", file); });

              try {
                await createReview(formData);
                setReviewedMap(prev => ({ ...prev, [selectedDeliveryNoForReview]: true }));
                alert("리뷰가 등록되었습니다.");
                handleCloseReviewModal();
              } catch (error) {
                alert("리뷰 등록에 실패했습니다.");
              }
            }}
            variant="contained"
            disableElevation
            sx={{ borderRadius: "12px", px: 3, fontWeight: "bold", bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
          >
            등록하기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeliveryInfoPage;