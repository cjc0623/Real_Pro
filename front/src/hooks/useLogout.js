import { API_BASE } from '../config';
// src/hooks/useLogout.js
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useLogout() {
    const navigate = useNavigate();

    const logout = useCallback(async (redirectTo = '/login') => {
        

        try {
            // 0) 서버측 폐기(blacklist)용으로 제거 전에 refresh 토큰을 확보
            const refreshToken = sessionStorage.getItem('refreshToken');

            // 1) 로컬/세션 저장소 토큰 제거
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('refreshToken');

            // axios를 쓰고 있다면 기본 Authorization 헤더도 제거
            if (typeof window !== 'undefined' && window.axios) {
                delete window.axios.defaults.headers.common['Authorization'];
            }

            // 2) 서버에 로그아웃 알림 → refresh 토큰을 서버측에서 폐기(재사용 차단)
            try {
                await fetch(`${API_BASE}/api/auth/logout`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: 'user_logout', refreshToken }),
                });
            } catch (_) {
                /* 서버 엔드포인트 없거나 실패해도 무시 */
            }
        } finally {
            // 3) 라우팅
            navigate(redirectTo, { replace: true });
        }
    }, [navigate]);

    return logout;
}
