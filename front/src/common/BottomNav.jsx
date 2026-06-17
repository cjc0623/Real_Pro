// src/common/BottomNav.jsx
import React from 'react';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import RateReviewIcon from '@mui/icons-material/RateReview';
import PersonIcon from '@mui/icons-material/Person';
import BuildIcon from '@mui/icons-material/Build';
import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { label: '내 정보',     icon: <HomeIcon />,        path: '/mypage' },
  { label: '배송관리',    icon: <DescriptionIcon />, path: '/mypage/delivery' },
  { label: '리뷰',        icon: <RateReviewIcon />,  path: '/mypage/review' },
  { label: '정보수정',    icon: <PersonIcon />,      path: '/mypage/edit' },
];

export default function BottomNav({ isOwner, cargoId }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // 차주(isOwner) 계정일 경우, '리뷰' 탭의 경로를 
  // 화주용(/mypage/review)이 아닌 받은 리뷰 관리 페이지(/mypage/review/received)로 변경합니다.
  const baseTabs = tabs.map(tab => 
    (tab.label === '리뷰' && isOwner) ? { ...tab, path: '/mypage/review/received' } : tab
  );

  const allTabs = isOwner && cargoId
    ? [...baseTabs, { label: '차량관리', icon: <BuildIcon />, path: `/mypage/vehicle/${cargoId}` }]
    : baseTabs;

  // 경로 매칭 로직 개선: 가장 구체적인(긴) 경로가 우선적으로 매칭되도록 수정
  const current = allTabs.reduce((bestIdx, tab, idx) => {
    return pathname.startsWith(tab.path) && (bestIdx === -1 || tab.path.length > allTabs[bestIdx].path.length) ? idx : bestIdx;
  }, -1);

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
        onChange={(_, idx) => navigate(allTabs[idx].path)}
        showLabels
        sx={{ height: 64, backgroundColor: '#f9fafb' }}
      >
        {allTabs.map(tab => (
          <BottomNavigationAction
            key={tab.path}
            label={tab.label}
            icon={tab.icon}
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