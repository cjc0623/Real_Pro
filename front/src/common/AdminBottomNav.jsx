// src/common/AdminBottomNav.jsx
import React from 'react';
import { Paper, BottomNavigation, BottomNavigationAction, Badge } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AdminBottomNav({ tabs, unread = 0 }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    // 🟢 팀장님의 정교한 라우팅 경로 탐색 매칭 알고리즘 100% 동결
    const current = tabs.findIndex((t) =>
        t.path === '/admin' ? pathname === '/admin' : pathname.startsWith(t.path)
    );

    return (
        <Paper
            sx={{
                display: { xs: 'block', md: 'none' },
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                zIndex: 1200,
                borderTop: '1px solid',
                borderColor: 'divider',
            }}
            elevation={0}
        >
            <BottomNavigation
                value={current}
                onChange={(_, idx) => navigate(tabs[idx].path)}
                showLabels
                sx={{ height: 64, backgroundColor: '#f9fafb' }}
            >
                {tabs.map((tab) => (
                    <BottomNavigationAction
                        key={tab.path}
                        label={tab.label}
                        icon={tab.icon}
                        // 🟢 오직 sx 내부의 CSS 수식만 추가하여 한 화면에 단단하게 홀딩 완료
                        sx={{
                            '&.Mui-selected': { 
                                color: '#c0392b',
                                // 활성화 시 폰트가 뻥튀기되면서 옆 글자를 밀어내 줄바꿈 시키는 현상 방어
                                '& .MuiBottomNavigationAction-label': {
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold'
                                }
                            },
                            minWidth: 0,
                            px: 0, // 👈 [핏 보정 1] 메뉴 단추 양옆의 불필요한 기본 패딩 여백 박멸
                            '& .MuiBottomNavigationAction-label': { 
                                fontSize: '0.7rem', // 👈 [핏 보정 2] 4글자가 딱 맞게 안착하는 최적의 폰트 스케일 세팅
                                whiteSpace: 'nowrap', // 👈 [핏 보정 3] 글자가 절대로 아래 줄로 쪼개져 내려가지 않게 강제 락!!
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                letterSpacing: '-0.5px' // 자간 압축으로 시각적 밸런스 최적화
                            },
                        }}
                    />
                ))}
            </BottomNavigation>
        </Paper>
    );
}