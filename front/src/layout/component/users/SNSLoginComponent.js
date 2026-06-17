/* eslint-disable no-undef */
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  'http://localhost:8080';

/** @param {'naver'|'kakao'|'google'} provider */
function startOAuth(provider) {
  (window.top ?? window).location.href = `${API_BASE}/oauth2/authorization/${provider}`;
}

/* ── 아이콘 SVG ─────────────────────────────────────── */

const NaverIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"
      fill="#ffffff"
    />
  </svg>
);

const KakaoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 3C6.477 3 2 6.477 2 10.6c0 2.65 1.665 4.985 4.184 6.34-.184.686-.674 2.486-.77 2.874-.12.487.178.48.374.35C7.326 19.169 12 15.93 12 15.93c3.955 0 10-2.933 10-5.33C22 6.477 17.523 3 12 3z"
      fill="#3A1D1D"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

/* ── 컴포넌트 ─────────────────────────────────────────── */

const SNSLoginComponent = () => {
  const base =
    'w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 mb-2 cursor-pointer border-0 outline-none';

  return (
    <div className="flex flex-col gap-0">

      {/* 네이버 */}
      <button
        type="button"
        onClick={() => startOAuth('naver')}
        className={`${base} text-white`}
        style={{ backgroundColor: '#03C75A' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#02b34e')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#03C75A')}
      >
        <NaverIcon />
        <span>네이버로 시작하기</span>
      </button>

      {/* 카카오 */}
      <button
        type="button"
        onClick={() => startOAuth('kakao')}
        className={`${base} text-[#3A1D1D]`}
        style={{ backgroundColor: '#FEE500' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e6cf00')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FEE500')}
      >
        <KakaoIcon />
        <span>카카오로 시작하기</span>
      </button>

      {/* 구글 */}
      <button
        type="button"
        onClick={() => startOAuth('google')}
        className={`${base} text-gray-700`}
        style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
      >
        <GoogleIcon />
        <span>Google로 시작하기</span>
      </button>

    </div>
  );
};

export default SNSLoginComponent;
