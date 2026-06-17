import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { login as loginAction, logout as logoutAction, getUserInfoAsync } from '../slice/loginSlice';
import logo from '../assets/logo.png'; // 기현님 로고 경로 확인!

// ✅ 백엔드 베이스 URL
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_API_BASE ||
  'http://localhost:8080';

const pages = [
  { label: '견적서 작성', path: '/estimatepage' },
  { label: '운송 접수 사항', path: '/estimatepage/list' },
  { label: '고객지원', path: '/qaboard' },
  { label: '공지사항', path: '/noboard' },
];

const settings = [
  { label: '마이페이지', path: '/mypage' },
  // { label: '주문내역 확인', path: '/mypage' },
  { label: '배송상태', path: '/mypage' },
  { label: '로그아웃', path: '/logout' },
];

const settingsAdmin = [
  { label: '관리자페이지', path: '/admin' },
  { label: '회원조회', path: '/admin/memberAll' },
  { label: '배송상태', path: '/admin/deliveryPage' },
  { label: '로그아웃', path: '/logout' },
];

const DEFAULT_AVATAR = '/image/placeholders/avatar.svg';

const pickToken = () =>
  sessionStorage.getItem('accessToken') ||
  sessionStorage.getItem('accessToken') ||
  sessionStorage.getItem('ACCESS_TOKEN') ||
  sessionStorage.getItem('ACCESS_TOKEN') ||
  null;

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function ResponsiveAppBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 1. 상태 가져오기
  const loginState = useSelector((state) => state?.login);
  const hasReduxLogin = Boolean(loginState?.email || loginState?.memberId);
  const accessToken = (typeof window !== 'undefined') ? pickToken() : null;
  const isLogin = hasReduxLogin || Boolean(accessToken);

  // 2. ✅ roles 정의 (순서가 가장 먼저 와야 합니다!)
  const roles = Array.isArray(loginState?.roles) ? loginState.roles :
    (loginState?.roles ? [loginState.roles] : []);

  // 3. ✅ 정의된 roles를 사용하여 권한 판별
  const isAdmin = roles.includes('ROLE_ADMIN');
  const isDriver = roles.some(r => String(r).toUpperCase().includes('DRIVER'));

  // 4. 나머지 경로 및 이름 설정
  const myPagePath = isAdmin ? '/admin' : '/mypage';
  const myPageLabel = isAdmin ? '관리자페이지' : '마이페이지';
  const displayUserName = loginState?.memberId || loginState?.nickname || loginState?.email || '회원';



  // ✅ 1) 앱 로드 시: 토큰 리프레시 로직 (기존 엔진 유지)
  useEffect(() => {
    if (hasReduxLogin || accessToken) return;
    let aborted = false;
    const silentRefresh = async () => {
      try {
        const storedRefresh =
          sessionStorage.getItem('refreshToken') ||
          sessionStorage.getItem('refreshToken');

        if (!storedRefresh) return;
        const res = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefresh }),
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const newAccess = data.accessToken || data.access || data.token || null;
        if (!newAccess || aborted) return;

        sessionStorage.setItem('accessToken', newAccess);

        const payload = decodeJwt(newAccess) || {};
        dispatch(loginAction(payload));
        dispatch(getUserInfoAsync());
      } catch { /* ignore */ }
    };
    silentRefresh();
    return () => { aborted = true; };
  }, [hasReduxLogin, accessToken, dispatch]);

  // ✅ 2) 새로고침 시 정보 복원 (기존 엔진 유지)
  useEffect(() => {
    const t = pickToken();
    if (isLogin && t && !loginState.profileImage) {
      const payload = decodeJwt(t);
      if (payload) {
        dispatch(
          loginAction({
            email: payload.email || payload.memEmail || '',
            nickname: payload.name || '',
            pw: '',
            roles: payload.roles || payload.rolenames || ['USER'],
            memberId: payload.memId || payload.cargoId || payload.sub || null,
          })
        );
        dispatch(getUserInfoAsync());
      }
    }
  }, [isLogin, dispatch, loginState.profileImage]);

  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleOpenNavMenu = (e) => setAnchorElNav(e.currentTarget);
  const handleOpenUserMenu = (e) => setAnchorElUser(e.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  // ✅ 4) 로그아웃
  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');

      try {
        await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
      } catch { /* ignore */ }
      dispatch(logoutAction());
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="relative z-50 bg-white text-gray-800 font-sans w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row justify-between items-center h-16 lg:h-20 relative">



          <Link to="/" className="flex-shrink-0">
            <img
              className="w-32 lg:w-44 h-auto object-contain"
              src={logo}
              alt="퍼스트로드 로고"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-x-7 absolute left-1/2 -translate-x-1/2">
            <Link to="/guide" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">이용가이드</Link>
            <Link to="/quick-search" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">간편조회</Link>
            <Link to="/estimatepage" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">온라인 퀵 접수</Link>
            <Link to="/estimatepage/list" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">운송 접수 목록</Link>
            <Link to="/noboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">공지사항</Link>
            <Link to="/qaboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">문의사항</Link>
          </nav>

          <div className="flex items-center gap-3 text-sm">
            {isLogin ? (
              <>
                <Link
                  to={myPagePath}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {displayUserName}
                </Link>
                <button
                  onClick={handleLogout}
                  aria-label="로그아웃"
                  title="로그아웃"
                  className="bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors
                             flex items-center justify-center
                             p-2.5 lg:px-4 lg:py-2"
                >
                  {/* 데스크탑: 텍스트 */}
                  <span className="hidden lg:inline text-sm whitespace-nowrap">로그아웃</span>
                  {/* 모바일/태블릿: 로그아웃 아이콘 */}
                  <svg
                    className="lg:hidden w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                시작하기
              </Link>
            )}

            <button
              className="lg:hidden flex flex-col justify-center gap-[5px] ml-2 p-1"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="메뉴 열기"
            >
              <span className={`block w-[22px] h-[2px] bg-gray-700 rounded transition-all duration-300 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
              <span className={`block w-[22px] h-[2px] bg-gray-700 rounded transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-[22px] h-[2px] bg-gray-700 rounded transition-all duration-300 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <nav className="lg:hidden flex flex-col border-t border-gray-100 bg-white shadow-lg">
          {[
            { label: '이용가이드', path: '/guide' },
            { label: '간편조회', path: '/quick-search' },
            { label: '온라인 퀵 접수', path: '/estimatepage' },
            { label: '운송 접수 목록', path: '/estimatepage/list' },
            { label: '공지사항', path: '/noboard' },
            { label: '문의사항', path: '/qaboard' },
          ].map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMenuOpen(false)}
              className="px-6 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b border-gray-100 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}