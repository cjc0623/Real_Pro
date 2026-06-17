import { useEffect, useState } from 'react';
import './App.css';
import { RouterProvider } from 'react-router-dom';
import root from './router/root';
import AiChatBot from './layout/component/AiChatBot';
import CounselorChat from './layout/component/CounselorChat';
import FloatingButtons from './components/FloatingButtons';
import { useDispatch } from 'react-redux';
import { getUserInfoAsync } from './slice/loginSlice';
import { Box, Fab, Zoom, Tooltip, Fade, useMediaQuery, useTheme, useScrollTrigger, Slide, GlobalStyles } from '@mui/material';
import { Close as CloseIcon, SupportAgent as SupportAgentIcon } from '@mui/icons-material';

function App() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const trigger = useScrollTrigger({
    threshold: 10, 
  }); 

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null); // 'ai', 'counselor', 또는 null

  // 메뉴가 닫힐 때 채팅창도 같이 닫기
  const handleMenuToggle = () => {
    if (isMenuOpen) {
      setActiveChat(null);
    }
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      dispatch(getUserInfoAsync());
    }
  }, [dispatch]);

  return (
    <>
      {/* 전역 스크롤바 숨김 스타일: 기능은 유지하되 시각적으로 제거 */}
      <GlobalStyles styles={{
        '*::-webkit-scrollbar': {
          display: 'none',
        },
        '*': {
          msOverflowStyle: 'none', // IE 및 Edge용
          scrollbarWidth: 'none',   // Firefox용
        },
      }} />
      <RouterProvider router={root} />

      {/* 채팅창 활성화 시 배경 블러 처리 (UX 개선) */}
      <Fade in={Boolean(activeChat)}>
        <Box
          onClick={() => setActiveChat(null)}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            bgcolor: 'rgba(15, 23, 42, 0.1)', // 아주 연한 남색 톤
            backdropFilter: 'blur(8px)', // 세련된 블러 강도
            zIndex: 9998, // 메뉴 버튼(9999)보다는 아래에 위치
          }}
        />
      </Fade>

      {/* 스크롤 시 숨기기 애니메이션 추가 (메뉴가 닫혀있고 아래로 스크롤할 때만 숨김) */}
      <Slide appear={false} direction="up" in={!trigger || isMenuOpen}>
        <Box
          className="no-print"
          sx={{
            position: 'fixed',
            bottom: { xs: '76px', md: '24px' },  // ← 모바일: 탭바(60)+여백(16)
            right: { xs: '20px', md: '32px' },
            width: isMobile ? '52px' : '60px',
            height: isMobile ? '52px' : '60px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          {/* 상담 및 가이드 버튼 그룹 (애니메이션 적용) */}
          <Zoom in={isMenuOpen} unmountOnExit>
            <Box
              sx={{
                position: 'absolute',
                bottom: isMobile ? '62px' : '72px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: isMobile ? '8px' : '12px',
                width: isMobile ? '52px' : '64px'
              }}
            >
              <Box sx={{ width: isMobile ? '52px' : '64px', height: isMobile ? '52px' : '64px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <AiChatBot
                  isOpen={activeChat === 'ai'}
                  onToggle={() => setActiveChat(activeChat === 'ai' ? null : 'ai')}
                />
              </Box>
              <Box sx={{ width: isMobile ? '52px' : '64px', height: isMobile ? '52px' : '64px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CounselorChat
                  isOpen={activeChat === 'counselor'}
                  onToggle={() => setActiveChat(activeChat === 'counselor' ? null : 'counselor')}
                />
              </Box>
              <Box sx={{ width: isMobile ? '52px' : '64px', height: isMobile ? '52px' : '64px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <FloatingButtons />
              </Box>
            </Box>
          </Zoom>

          {/* 메인 토글 버튼 (위치 고정) */}
          <Zoom in={!activeChat}>
            <Tooltip title={isMenuOpen ? "닫기" : "고객지원 메뉴"} placement="left">
              <Fab
                onClick={handleMenuToggle}
                sx={{
                  width: isMobile ? 52 : 60,
                  height: isMobile ? 52 : 60,
                  background: isMenuOpen ? '#334155' : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  color: 'white',
                  boxShadow: '0 8px 25px rgba(15, 23, 42, 0.35)',
                  flexShrink: 0,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { transform: 'scale(1.1) rotate(5deg)', background: '#334155' }
                }}
              >
                <div style={{ display: 'flex', transform: isMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease', alignItems: 'center', justifyContent: 'center' }}>
                  {isMenuOpen ? <CloseIcon sx={{ fontSize: isMobile ? 24 : 28 }} /> : <SupportAgentIcon sx={{ fontSize: isMobile ? 24 : 28 }} />}
                </div>
              </Fab>
            </Tooltip>
          </Zoom>
        </Box>
      </Slide>
    </>
  );
}

export default App;