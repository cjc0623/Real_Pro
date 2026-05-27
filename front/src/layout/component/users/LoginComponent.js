import * as React from 'react';
import { Link } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import SNSLoginComponent from './SNSLoginComponent';

const LoginComponent = ({
  onSubmit,
  onFindId,
  onFindPassword,
  loading = false,
  initialLoginId = '',
  resetSignal = 0,
}) => {
  const [form, setForm] = React.useState({
    loginId: initialLoginId,
    password: '',
    remember: true,
  });

  // ID 프리필 동기화
  React.useEffect(() => {
    setForm((prev) => ({ ...prev, loginId: initialLoginId || '' }));
  }, [initialLoginId]);

  // 실패 시 비밀번호 초기화 + 포커스
  const pwRef = React.useRef(null);
  const firstRender = React.useRef(true);
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setForm((prev) => ({ ...prev, password: '' }));
    pwRef.current?.focus();
  }, [resetSignal]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onSubmit) return;
    await onSubmit(form);
  };

  const canSubmit = form.loginId.trim() && form.password.trim() && !loading;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full font-sans px-4">

      {/* 로고 */}
      <div className="mb-8 flex justify-center">
        <img src="/image/logo/main_logo.png" alt="퍼스트로드 로고" className="h-14 object-contain" />
      </div>

      {/* 로그인 폼 — 카드 없이 */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: '100%', maxWidth: 400 }}
      >
        {/* 아이디 입력 */}
        <TextField
          label="아이디"
          name="loginId"
          value={form.loginId}
          onChange={handleChange}
          fullWidth
          sx={{ mb: 1.5 }}
          disabled={loading}
          autoComplete="username"
        />

        {/* 비밀번호 입력 */}
        <TextField
          label="비밀번호"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          fullWidth
          sx={{ mb: 2.5 }}
          disabled={loading}
          autoComplete="current-password"
          inputRef={pwRef}
        />

        {/* 로그인 버튼 */}
        <Button
          fullWidth
          variant="contained"
          type="submit"
          disabled={!canSubmit}
          sx={{
            backgroundColor: '#DC2626',
            '&:hover': { backgroundColor: '#B91C1C' },
            '&:disabled': { backgroundColor: '#e5e7eb', color: '#9ca3af' },
            borderRadius: '10px',
            textTransform: 'none',
            fontSize: '15px',
            fontWeight: 700,
            py: 1.5,
            boxShadow: 'none',
            '&:hover:not(:disabled)': {
              boxShadow: '0 4px 14px rgba(220,38,38,0.35)',
              backgroundColor: '#B91C1C',
            },
          }}
        >
          {loading ? '로그인 중…' : '로그인'}
        </Button>

        {/* 아이디/비밀번호 찾기 */}
        <div className="flex justify-center gap-4 mt-3">
          <button
            type="button"
            onClick={onFindId}
            disabled={loading}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            아이디 찾기
          </button>
          <span className="text-gray-200 text-sm">|</span>
          <button
            type="button"
            onClick={() => onFindPassword?.(form.loginId)}
            disabled={loading}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            비밀번호 찾기
          </button>
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400 font-medium">소셜 계정으로 시작하기</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* SNS 로그인 */}
        <SNSLoginComponent />

        {/* 회원가입 안내 */}
        <p className="text-center text-sm text-gray-400 mt-8">
          아직 회원이 아니신가요?{' '}
          <Link
            to="/signup"
            className="text-red-600 font-semibold hover:underline"
          >
            회원가입
          </Link>
        </p>
      </Box>
    </div>
  );
};

export default LoginComponent;
