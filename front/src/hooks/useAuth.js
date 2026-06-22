import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStore } from '../lib/tokenStore';
import { useDispatch } from 'react-redux';
import { login as loginAction, logout as logoutAction, getUserInfoAsync } from '../slice/loginSlice';

const API_BASE =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_API_BASE ||
    'http://localhost:8080';

export default function useAuth() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    /**
     * 로그인
     * - 성공: data 반환
     * - 실패: Error throw → 상위(LoginPage)에서 alert 처리
     */
    const login = useCallback(
        async ({ loginId, password, remember = true }) => {
            // 계정 연속 전환 대비: 새 로그인 시작 전 Redux를 먼저 initState로 리셋(이전 계정 잔존 방지)
            dispatch(logoutAction());

            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ loginId, password }),
            });

            if (!res.ok) {
                // 실패 → 토큰 정리 후 에러 throw
                tokenStore.clear();

                let msg = '';
                try {
                    const ct = res.headers.get('content-type') || '';
                    if (ct.includes('application/json')) {
                        const j = await res.json();
                        msg = j.message || j.error || '';
                    } else {
                        msg = await res.text();
                    }
                } catch {
                    // ignore
                }

                if (res.status === 429) {
                    throw new Error('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.');
                }
                
                // 🟢 서버에서 보내준 메시지(정지 사유 등)가 있다면 우선적으로 표시하고, 없으면 기본 메시지 출력
                const defaultMsg = res.status === 401 ? '아이디 또는 비밀번호가 올바르지 않습니다.' : `로그인 실패 (code: ${res.status})`;
                throw new Error(msg || defaultMsg);
            }

            // 성공 처리
            const data = await res.json(); // { accessToken, refreshToken, ... }
            tokenStore.save(
                { accessToken: data.accessToken, refreshToken: data.refreshToken },
                remember
            );

            // Redux 로그인 상태 반영
            try {
                const base64Url = data.accessToken.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(
                    decodeURIComponent(
                        atob(base64)
                            .split('')
                            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                            .join('')
                    )
                );

                dispatch(
                    loginAction({
                        email: payload.email || payload.memEmail || '',
                        nickname: payload.name || '',
                        pw: '',
                        roles: payload.roles || payload.rolenames || ['USER'],
                        memberId: payload.memId || payload.cargoId || payload.sub || null,
                    })
                );
            } catch {
                // payload 파싱 실패는 무시
            }

            // 새 계정의 정확한 roles·memberId·프로필을 서버에서 즉시 확정(헤더 effect race에 의존하지 않음)
            dispatch(getUserInfoAsync());

            // 알림 등 토큰 의존 데이터가 새 계정으로 즉시 재조회되도록 명시 신호 발사
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('authChanged'));

            return data;
        },
        [dispatch]
    );

    /**
     * 로그아웃
     * - 백엔드 로그아웃 호출 후 토큰 삭제
     * - 기본적으로 /login 페이지로 이동
     */
    const logout = useCallback(
        async (to = '/login') => {
            try {
                await fetch(`${API_BASE}/api/auth/logout`, {
                    method: 'POST',
                    credentials: 'include',
                });
            } catch {
                // ignore
            }
            tokenStore.clear();
            dispatch(logoutAction()); // 토큰뿐 아니라 Redux 로그인 상태도 함께 초기화
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('authChanged'));
            navigate(to, { replace: true });
        },
        [navigate, dispatch]
    );

    return { login, logout };
}
