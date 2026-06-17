import React, { useEffect, useMemo, useState } from 'react';
import {
  Drawer, List, ListItemIcon, ListItemText, ListItemButton,
  Typography, Avatar, Divider, Box
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import RateReviewIcon from '@mui/icons-material/RateReview';
import PersonIcon from '@mui/icons-material/Person';
import BuildIcon from '@mui/icons-material/Build';
import SendIcon from '@mui/icons-material/Send';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { useMediaQuery, useTheme } from '@mui/material';
import BottomNav from './BottomNav';

const drawerWidth = 240;
const APPBAR_HEIGHT_MOBILE = 56;
const APPBAR_HEIGHT_DESKTOP = 100;
const DEFAULT_AVATAR = '/image/placeholders/avatar.svg';

const pickCargoId = (obj) => {
  if (!obj || typeof obj !== 'object') return null;
  return (
    obj.cargoId ??
    obj.cargo_id ??
    obj.ownerId ??
    obj.cargoOwnerId ??
    obj.loginId ??
    obj?.user?.cargoId ??
    null
  );
};

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE) ||
  'http://localhost:8080';

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken') || sessionStorage.getItem('ACCESS_TOKEN');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const pickToken = () => sessionStorage.getItem('accessToken') || sessionStorage.getItem('ACCESS_TOKEN') || null;

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function normalizeRoles(raw) {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .flatMap((r) => {
      if (!r) return [];
      if (typeof r === 'string') return [r];
      if (r.authority) return [r.authority];
      if (r.roleName) return [r.roleName];
      return [String(r)];
    })
    .map((s) => s.toUpperCase());
}

const Sidebar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const loginState = useSelector((state) => state?.login) || {};
  const token = typeof window !== 'undefined' ? pickToken() : null;
  const payload = token ? decodeJwt(token) : null;

  const [fetchedUserType, setFetchedUserType] = useState(null);
  const [fetchedCargoId, setFetchedCargoId] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/fr/user/info');
        const t = data?.userType || data?.data?.userType || data?.type || null;
        let cid = pickCargoId(data) || pickCargoId(data?.data) || pickCargoId(data?.user) || null;

        if (!cid && (t === 'CARGO_OWNER')) {
          cid = data?.loginId || data?.data?.loginId || payload?.loginId || null;
        }

        if (!cancelled) {
          if (t) setFetchedUserType(t);
          if (cid) setFetchedCargoId(cid);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [payload]);

  const avatarUrl = loginState?.profileImage || DEFAULT_AVATAR;

  const roles = useMemo(() => {
    const fromRedux = normalizeRoles(loginState?.roles || loginState?.rolenames);
    const fromToken = normalizeRoles(payload?.roles || payload?.rolenames || payload?.authorities);
    return [...fromRedux, ...fromToken];
  }, [loginState, payload]);

  const isOwner = roles.some((r) => r.endsWith('CARGO_OWNER')) || fetchedUserType === 'CARGO_OWNER';

  const cargoId = loginState?.cargoId ?? loginState?.user?.cargoId ?? payload?.cargoId ?? fetchedCargoId ?? payload?.loginId ?? null;

  const navStyle = { textDecoration: 'none', color: 'inherit' };
  
  // 🟢 [변경] 기존 12px에서 메뉴 버튼들을 더 둥글글하게 필(Pill) 형태로 가공 (16px)
  const listItemStyle = {
    borderRadius: "16px",
    mx: 2,
    mb: 0.8,
    py: 1.3,
    transition: "all 0.2s ease",
    "&:hover": { backgroundColor: "#f1f5f9" }
  };

  const activeStyle = {
    ...listItemStyle,
    backgroundColor: '#eff6ff',
    "& .MuiListItemIcon-root": { color: '#2563eb' },
    "& .MuiListItemText-primary": { color: '#2563eb', fontWeight: '700' },
    "&:hover": { backgroundColor: '#e0f2fe' }
  };

  return (
    <>
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
              position: 'sticky',
              top: APPBAR_HEIGHT_DESKTOP,
              alignSelf: 'flex-start',
              backgroundColor: '#ffffff', 
              borderRight: "1px solid #e2e8f0",
              height: `calc(100vh - ${APPBAR_HEIGHT_DESKTOP}px)`,
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, pb: 3 }}>
            <Typography variant="h6" fontWeight="900" color="#1e293b" gutterBottom>
              마이페이지
            </Typography>
            {/* 프로필 이미지 박스 섀도우 경계면 곡률 최적화 */}
            <Avatar
              sx={{ 
                width: 64, height: 64, bgcolor: '#eff6ff', mt: 1,
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.12)" 
              }}
              src={avatarUrl}
              imgProps={{
                referrerPolicy: 'no-referrer',
                crossOrigin: 'anonymous',
                loading: 'lazy',
                onError: (e) => { e.currentTarget.src = DEFAULT_AVATAR; },
              }}
              alt="프로필"
            >
              <PersonIcon sx={{ color: '#2563eb' }} />
            </Avatar>
          </Box>

          <Divider sx={{ mx: 2.5, mb: 2, borderColor: '#e2e8f0' }} />

          <List disablePadding>
            <NavLink to="/mypage" end style={navStyle}>
              {({ isActive }) => (
                <ListItemButton sx={isActive ? activeStyle : listItemStyle}>
                  <ListItemIcon sx={{ minWidth: 40, color: '#64748b' }}><HomeIcon /></ListItemIcon>
                  <ListItemText primary="내 정보" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }} />
                </ListItemButton>
              )}
            </NavLink>
            
            <NavLink to="/mypage/delivery" style={navStyle}>
              {({ isActive }) => (
                <ListItemButton sx={isActive ? activeStyle : listItemStyle}>
                  <ListItemIcon sx={{ minWidth: 40, color: '#64748b' }}><DescriptionIcon /></ListItemIcon>
                  <ListItemText primary="배송 정보 관리" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }} />
                </ListItemButton>
              )}
            </NavLink>
            
            <NavLink to={isOwner ? "/mypage/review/received" : "/mypage/review"} style={navStyle}>
              {({ isActive }) => (
                <ListItemButton sx={isActive ? activeStyle : listItemStyle}>
                  <ListItemIcon sx={{ minWidth: 40, color: '#64748b' }}><RateReviewIcon /></ListItemIcon>
                  <ListItemText primary={isOwner ? "내가 받은 리뷰 관리" : "내가 쓴 리뷰 관리"} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }} />
                </ListItemButton>
              )}
            </NavLink>
            
            <NavLink to={isOwner ? "/mypage/direct-requests/received" : "/mypage/direct-requests/sent"} style={navStyle}>
              {({ isActive }) => (
                <ListItemButton sx={isActive ? activeStyle : listItemStyle}>
                  <ListItemIcon sx={{ minWidth: 40, color: '#64748b' }}>
                    {isOwner ? <MoveToInboxIcon /> : <SendIcon />}
                  </ListItemIcon>
                  <ListItemText primary={isOwner ? "직접요청 수신함" : "보낸 직접요청"} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }} />
                </ListItemButton>
              )}
            </NavLink>

            <NavLink to="/mypage/edit" style={navStyle}>
              {({ isActive }) => (
                <ListItemButton sx={isActive ? activeStyle : listItemStyle}>
                  <ListItemIcon sx={{ minWidth: 40, color: '#64748b' }}><PersonIcon /></ListItemIcon>
                  <ListItemText primary="회원 정보 수정" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }} />
                </ListItemButton>
              )}
            </NavLink>
            
            {isOwner && cargoId && (
              <NavLink to={`vehicle/${cargoId}`} style={navStyle}>
                {({ isActive }) => (
                  <ListItemButton sx={isActive ? activeStyle : listItemStyle}>
                    <ListItemIcon sx={{ minWidth: 40, color: '#64748b' }}><BuildIcon /></ListItemIcon>
                    <ListItemText primary="내 차량 관리" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }} />
                  </ListItemButton>
                )}
              </NavLink>
            )}
          </List>
        </Drawer>   
      )}

      {isMobile && (
        <BottomNav isOwner={isOwner} cargoId={cargoId} />
      )}
    </>
  );
};

export default Sidebar;