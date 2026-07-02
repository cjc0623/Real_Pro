import { API_BASE } from '../../../config';
import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import axios from 'axios';

const pickToken = () =>
  sessionStorage.getItem('accessToken') ||
  sessionStorage.getItem('ACCESS_TOKEN') ||
  null;

export default function RequireAuth() {
  const location = useLocation();
  const [ok, setOk] = useState(null); 

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = pickToken();
      if (!token) return setOk(false);
      try {
        await axios.get(`${API_BASE}/fr/user/info`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!cancelled) setOk(true);
      } catch {
        if (!cancelled) setOk(false);
      }
    })();
    return () => { cancelled = true; };
  }, []); 

  // 인증 확인 중: 빈 화면 대신 로딩 표시 (깜빡임 제거)
  if (ok === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!ok) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from: location,
          flash: { severity: 'warning', message: '로그인이 필요한 페이지입니다.' }
        }}
      />
    );
  }

  return <Outlet />;
}
