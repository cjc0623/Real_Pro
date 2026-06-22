// src/common/BottomNav.jsx
import React from 'react';
import { Paper, BottomNavigation, BottomNavigationAction, Badge } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import RateReviewIcon from '@mui/icons-material/RateReview';
import PersonIcon from '@mui/icons-material/Person';
import BuildIcon from '@mui/icons-material/Build';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import SendIcon from '@mui/icons-material/Send';
import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { label: '내 정보',     icon: <HomeIcon />,        path: '/mypage' },
  { label: '배송관리',    icon: <DescriptionIcon />, path: '/mypage/delivery' },
  { label: '리뷰',        icon: <RateReviewIcon />,  path: '/mypage/review' },
  { label: '정보수정',    icon: <PersonIcon />,      path: '/mypage/edit' },
];

// 알림 점(빨간 dot)으로 아이콘을 감싼다 — 데스크탑 사이드바 점과 동일 의미
const withDot = (icon, show) =>
  show
    ? (
      <Badge
        variant="dot"
        color="error"
        overlap="circular"
        sx={{ '& .MuiBadge-badge': { bgcolor: '#DC2626', boxShadow: '0 0 0 2px #f9fafb' } }}
      >
        {icon}
      </Badge>
    )
    : icon;

/**
 * 모바일 하단 탭바.
 * 알림 점/read-state는 Sidebar(useNotificationSummary 보유)에서 계산해 props로 전달받는다.
 *  - deliveryDot: 배송관리 탭 점 (deliveryToStart/acceptedAwaitingPayment)
 *  - directReqDot: 직접요청 탭 점 (pendingDirectRequests, 차주 전용)
 *  - markSeen(keys): 탭 진입 시 해당 항목 확인 처리 → 점 OFF
 */
export default function BottomNav({ isOwner, cargoId, deliveryDot = false, directReqDot = false, markSeen }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // 차주(isOwner)는 '리뷰' 경로를 받은 리뷰 관리로 변경
  const baseTabs = tabs.map(tab =>
    (tab.label === '리뷰' && isOwner) ? { ...tab, path: '/mypage/review/received' } : tab
  );

  // 배송관리 탭에 점 + 확인 키 부여
  const withDelivery = baseTabs.map(tab =>
    tab.path === '/mypage/delivery'
      ? { ...tab, dot: deliveryDot, seenKeys: ['deliveryToStart', 'acceptedAwaitingPayment'] }
      : tab
  );

  // '직접요청' 탭 추가('리뷰' 뒤). 차주=받은 직접요청(점/확인 처리), 화주=보낸 직접요청(점 없음)
  const directTab = isOwner
    ? {
        label: '직접요청',
        icon: <MoveToInboxIcon />,
        path: '/mypage/direct-requests/received',
        dot: directReqDot,
        seenKeys: ['pendingDirectRequests'],
      }
    : {
        label: '직접요청',
        icon: <SendIcon />,
        path: '/mypage/direct-requests/sent',
      };
  const withDirectReq = withDelivery.flatMap(tab =>
    tab.label === '리뷰' ? [directTab, tab] : [tab]
  );

  const allTabs = isOwner && cargoId
    ? [...withDirectReq, { label: '차량관리', icon: <BuildIcon />, path: `/mypage/vehicle/${cargoId}` }]
    : withDirectReq;

  // 경로 매칭: 가장 구체적인(긴) 경로 우선
  const current = allTabs.reduce((bestIdx, tab, idx) => {
    return pathname.startsWith(tab.path) && (bestIdx === -1 || tab.path.length > allTabs[bestIdx].path.length) ? idx : bestIdx;
  }, -1);

  const handleChange = (_, idx) => {
    const tab = allTabs[idx];
    if (tab?.seenKeys && typeof markSeen === 'function') markSeen(tab.seenKeys);
    navigate(tab.path);
  };

  return (
    <Paper
      sx={{
        display: { xs: 'block', md: 'none' }, // 모바일만 표시
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
      elevation={0}
    >
      <BottomNavigation
        value={current}
        onChange={handleChange}
        showLabels
        sx={{ height: 64, backgroundColor: '#f9fafb' }}
      >
        {allTabs.map(tab => (
          <BottomNavigationAction
            key={tab.path}
            label={tab.label}
            icon={withDot(tab.icon, tab.dot)}
            sx={{
              '&.Mui-selected': {
                color: '#c0392b',
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }
              },
              minWidth: 0,
              px: 0,
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: '-0.5px'
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
