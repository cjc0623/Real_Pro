// src/layout/component/users/SignUpComponent.jsx
import * as React from 'react';
import {
    FormControl, IconButton, InputAdornment, InputLabel, OutlinedInput,
    TextField, FormHelperText, Box, Autocomplete, Button
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import useIdForm from '../../../hooks/useIdForm';
import usePasswordForm from '../../../hooks/usePasswordForm';
import EmailVerifyDialog from '../auth/EmailVerifyDialog';

// ✅ 보안 패턴 정의: SQL Injection 및 XSS 방지를 위한 금지 문자
const FORBIDDEN_REGEX = /[ '"\\;<>\/]/;
// ✅ 아이디 전용 패턴: 영문 대소문자와 숫자만 허용
const ID_STRICT_REGEX = /^[a-zA-Z0-9]*$/;

// ✅ 공통 에러 메시지 헬퍼
function getErrorMessage(data) {
    if (data == null) return '요청에 실패했습니다.';
    if (typeof data === 'string') return data;
    if (data instanceof Error) return data.message || '오류가 발생했습니다.';
    if (typeof data === 'object') {
        if (typeof data.message === 'string') return data.message;
        if (Array.isArray(data)) return data.map(getErrorMessage).join('\n');
        try { return JSON.stringify(data); } catch { return '오류가 발생했습니다.'; }
    }
    return String(data);
}

// 백엔드 베이스 URL
const API_BASE =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_API_BASE ||
    'http://localhost:8080';

// 해시에 signup_ticket이 실려 온 경우를 대비한 파서
function getTicketFromHash(hash) {
    const h = (hash || '').replace(/^#/, '');
    if (!h) return null;
    const map = new URLSearchParams(h);
    return map.get('signup_ticket') || map.get('signupTicket') || map.get('ticket');
}

/* ========= signup_ticket TTL 유틸 ========= */
const SIGNUP_TICKET_KEY = 'signup_ticket';
const SIGNUP_TICKET_TTL_MS = 5 * 60 * 1000; // 5분

function saveSignupTicketRaw(rawTicket) {
    if (!rawTicket) return;
    const payload = { value: String(rawTicket), exp: Date.now() + SIGNUP_TICKET_TTL_MS };
    try { sessionStorage.setItem(SIGNUP_TICKET_KEY, JSON.stringify(payload)); } catch { }
}
function loadSignupTicket() {
    try {
        const raw = sessionStorage.getItem(SIGNUP_TICKET_KEY);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (!obj?.value || typeof obj.exp !== 'number') return null;
        if (Date.now() > obj.exp) {
            sessionStorage.removeItem(SIGNUP_TICKET_KEY);
            return null;
        }
        return obj.value;
    } catch { return null; }
}
function clearSignupTicket() {
    try { sessionStorage.removeItem(SIGNUP_TICKET_KEY); } catch { }
}
/* ======================================== */

/* ── 공통 sx ── */
const redBtnSx = {
    borderRadius: '10px',
    textTransform: 'none',
    fontWeight: 700,
    fontSize: '15px',
    boxShadow: 'none',
    '&:hover:not(:disabled)': {
        boxShadow: '0 4px 14px rgba(220,38,38,0.35)',
        backgroundColor: '#B91C1C',
    },
    '&:disabled': { backgroundColor: '#e5e7eb', color: '#9ca3af' },
};

const SignUpComponent = () => {
    const navigate = useNavigate();
    const { hash } = useLocation();

    // 사용자 유형 (화주/차주)
    const [alignment, setAlignment] = React.useState('user'); // user=화주, car=차주
    const handleAlignment = (_, v) => { if (v) setAlignment(v); };
    const roles = alignment === 'car' ? 'DRIVER' : 'SHIPPER';

    // ID 폼 상태
    const { id, handleChange, isIdValid } = useIdForm();
    const [idChecked, setIdChecked] = React.useState(false);
    const [idAvailable, setIdAvailable] = React.useState(null);
    const [idStatus, setIdStatus] = React.useState('idle');
    const [idTouched, setIdTouched] = React.useState(false);

    // 비밀번호 폼 상태
    const {
        password1, password2, isPwValid, isPwMatch,
        showPassword1, showPassword2,
        handleChangePassword1, handleChangePassword2,
        toggleShowPassword1, toggleShowPassword2
    } = usePasswordForm();
    const [pw1Touched, setPw1Touched] = React.useState(false);
    const [pw2Touched, setPw2Touched] = React.useState(false);

    // ✅ 비밀번호 보안 패턴 체크
    const isPwSafe = React.useMemo(() => !FORBIDDEN_REGEX.test(password1), [password1]);

    // 기타 폼
    const [emailLocal, setEmailLocal] = React.useState('');
    const [emailDomain, setEmailDomain] = React.useState('');
    const [emailVerified, setEmailVerified] = React.useState(false);
    const [openEmailModal, setOpenEmailModal] = React.useState(false);
    const [emailLocked, setEmailLocked] = React.useState(false);

    const [name, setName] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [selectedAddress, setSelectedAddress] = React.useState('');
    const [detailAddress, setDetailAddress] = React.useState('');

    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState('');

    const fullEmail = React.useMemo(() => {
        const l = emailLocal.trim(); const d = emailDomain.trim();
        return l && d ? `${l}@${d}` : '';
    }, [emailLocal, emailDomain]);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const canOpenVerify = !!fullEmail && emailRegex.test(fullEmail);

    const onClickVerifyEmail = () => {
        if (emailLocked) return;
        if (!canOpenVerify) return;
        setOpenEmailModal(true);
    };
    const handleEmailVerified = (ok) => {
        setEmailVerified(!!ok);
        if (ok) setOpenEmailModal(false);
    };

    /* ===============================
       소셜 첫가입 컨텍스트
       =============================== */
    React.useEffect(() => {
        const fromHash = getTicketFromHash(hash);

        if (!fromHash) {
            clearSignupTicket();
            setEmailLocked(false);
            setEmailVerified(false);
            setEmailLocal('');
            setEmailDomain('');
            setName('');
            return;
        }

        saveSignupTicketRaw(fromHash);
        try {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        } catch { }

        const ticket = loadSignupTicket();
        if (!ticket) {
            clearSignupTicket();
            setEmailLocked(false);
            setEmailVerified(false);
            setEmailLocal('');
            setEmailDomain('');
            setName('');
            return;
        }

        (async () => {
            try {
                const r = await fetch(
                    `${API_BASE}/api/auth/social/signup-context?ticket=${encodeURIComponent(ticket)}`,
                    { headers: { Accept: 'application/json' } }
                );
                if (!r.ok) {
                    clearSignupTicket();
                    setEmailLocked(false);
                    setEmailVerified(false);
                    setEmailLocal('');
                    setEmailDomain('');
                    setName('');
                    return;
                }
                const data = await r.json();

                if (data?.email) {
                    const [local, ...rest] = String(data.email).split('@');
                    setEmailLocal(local || '');
                    setEmailDomain(rest.join('@') || '');
                    setEmailVerified(true);
                    setEmailLocked(true);
                }
                if (data?.name) setName(data.name);
            } catch {
                clearSignupTicket();
                setEmailLocked(false);
                setEmailVerified(false);
                setEmailLocal('');
                setEmailDomain('');
                setName('');
            }
        })();
    }, [hash]);

    React.useEffect(() => {
        return () => { clearSignupTicket(); };
    }, []);

    // ===============================
    // ID 중복 확인
    // ===============================
    const handleCheckId = (() => {
        let reqToken = 0;
        return async () => {
            if (!id || !isIdValid) return;

            const myToken = ++reqToken;
            setIdStatus('checking');
            setIdChecked(false);
            setIdAvailable(null);

            try {
                const res = await fetch(
                    `${API_BASE}/api/auth/check-id?loginId=${encodeURIComponent(id)}`,
                    { method: 'GET', headers: { Accept: 'application/json' } }
                );

                if (myToken !== reqToken) return;

                if (!res.ok) {
                    let msg = '';
                    try { msg = await res.text(); } catch { }
                    console.warn('check-id failed', res.status, msg?.slice?.(0, 200));
                    setIdStatus('error');
                    setIdChecked(true);
                    setIdAvailable(null);
                    return;
                }

                const ct = res.headers.get('content-type') || '';
                let data = null;
                if (ct.includes('application/json')) {
                    data = await res.json();
                } else {
                    const txt = await res.text();
                    try { data = JSON.parse(txt); } catch {
                        console.warn('Non-JSON response for check-id:', txt?.slice?.(0, 200));
                        setIdStatus('error');
                        setIdChecked(true);
                        setIdAvailable(null);
                        return;
                    }
                }

                const toAvailable = (obj) => {
                    if (!obj || typeof obj !== 'object') return null;
                    if ('available' in obj) return !!obj.available;
                    if ('isDuplicate' in obj) return !obj.isDuplicate;
                    if ('duplicate' in obj) return !obj.duplicate;
                    if ('exists' in obj) return !obj.exists;
                    if ('inUse' in obj) return !obj.inUse;
                    if ('count' in obj) return !(Number(obj.count) > 0);
                    for (const v of Object.values(obj)) {
                        if (v && typeof v === 'object') {
                            const r = toAvailable(v);
                            if (r !== null) return r;
                        }
                    }
                    return null;
                };

                const available = toAvailable(data);
                if (available === true) {
                    setIdAvailable(true); setIdChecked(true); setIdStatus('available');
                } else if (available === false) {
                    setIdAvailable(false); setIdChecked(true); setIdStatus('taken');
                } else {
                    console.warn('Unrecognized check-id payload:', data);
                    setIdAvailable(null); setIdChecked(true); setIdStatus('error');
                }
            } catch (e) {
                console.error(e);
                setIdStatus('error'); setIdChecked(true); setIdAvailable(null);
            }
        };
    })();

    // 주소 검색
    const handleAddressSearch = () => {
        new window.daum.Postcode({
            oncomplete: (data) => setSelectedAddress(data.address)
        }).open();
    };

    // 제출 가능 여부
    const canSubmit =
        isIdValid &&
        idChecked && idAvailable === true &&
        isPwValid && isPwMatch && isPwSafe &&
        !!(emailLocked ? (emailLocal && emailDomain) : fullEmail) &&
        (emailLocked || emailVerified) &&
        name.trim().length > 0 &&
        password1.length >= 8;

    // 가입 요청
    const onSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || submitting) return;

        setSubmitError('');
        setSubmitting(true);

        try {
            const payloadBase = {
                role: roles,
                loginId: id,
                password: password1,
                name,
                email: fullEmail,
                phone,
                address: `${selectedAddress} ${detailAddress}`.trim()
            };

            const signupTicket = loadSignupTicket();

            if (emailLocked && signupTicket) {
                const res = await fetch(`${API_BASE}/api/auth/social/complete-signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ signupTicket, ...payloadBase })
                });

                const text = await res.text();
                let data;
                try { data = JSON.parse(text); } catch { data = text; }

                if (!res.ok) {
                    setSubmitError(getErrorMessage(data) || '가입 실패');
                    setSubmitting(false);
                    return;
                }

                if (data?.accessToken) sessionStorage.setItem('accessToken', data.accessToken);
                if (data?.refreshToken) sessionStorage.setItem('refreshToken', data.refreshToken);
                clearSignupTicket();
                navigate('/', { replace: true });
                return;
            }

            const res = await fetch(`${API_BASE}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payloadBase)
            });

            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch { data = text; }

            if (!res.ok) {
                setSubmitError(getErrorMessage(data) || '가입 실패');
                setSubmitting(false);
                return;
            }

            navigate('/login?joined=1', { replace: true });
        } catch (err) {
            console.error(err);
            setSubmitError('네트워크 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full font-sans px-4 py-12">

            {/* ── 로고 ── */}
            <div className="mb-8 flex justify-center">
                <img
                    src="/image/logo/main_logo.png"
                    alt="퍼스트로드 로고"
                    className="h-14 object-contain"
                />
            </div>

            {/* ── 제목 ── */}
            <h1 className="text-2xl font-black text-gray-900 mb-7 text-center">회원가입</h1>

            {/* ── 폼 ── */}
            <Box component="form" onSubmit={onSubmit} sx={{ width: '100%', maxWidth: 440 }}>

                {/* 화주 / 차주 탭 — 언더라인 스타일 */}
                <div className="border-b border-gray-200 mb-5">
                    <div className="flex">
                        {[{ val: 'user', label: '화주' }, { val: 'car', label: '차주' }].map(({ val, label }) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => handleAlignment(null, val)}
                                className={`
                                    flex-1 py-2.5 text-sm font-semibold
                                    border-b-2 -mb-px transition-all
                                    ${alignment === val
                                        ? 'border-gray-900 text-gray-900'
                                        : 'border-transparent text-gray-400 hover:text-gray-700'
                                    }
                                `}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── 아이디 + 중복확인 ── */}
                <Box display="flex" alignItems="flex-start" gap={1} sx={{ mb: 1.5 }}>
                    <TextField
                        id="outlined-id"
                        label="아이디"
                        value={id}
                        onChange={(e) => {
                            if (ID_STRICT_REGEX.test(e.target.value)) {
                                handleChange(e);
                                setIdChecked(false);
                                setIdAvailable(null);
                                setIdStatus('idle');
                            }
                        }}
                        onFocus={() => setIdTouched(true)}
                        onBlur={() => setIdTouched(false)}
                        error={(idTouched || idChecked) && id !== '' && (idStatus === 'error' || !isIdValid || idAvailable === false)}
                        helperText={
                            (idTouched || idChecked) && id !== ''
                                ? (!ID_STRICT_REGEX.test(id)
                                    ? '특수문자는 사용 불가능합니다.'
                                    : !idChecked
                                    ? '8~15자, 영문 대소문자와 숫자만 허용됩니다.'
                                    : idStatus === 'checking'
                                        ? '확인 중...'
                                        : idStatus === 'error'
                                            ? '확인 중 오류가 발생했습니다. 잠시 후 다시 시도하세요.'
                                            : !isIdValid
                                                ? ''
                                                : idAvailable === false
                                                    ? '이미 사용 중인 ID입니다.'
                                                    : '사용 가능한 ID입니다.')
                                : ''
                        }
                        sx={{ flex: 1, minWidth: 0 }}
                    />
                    <Button
                        variant="outlined"
                        onClick={handleCheckId}
                        disabled={!id || !isIdValid || idStatus === 'checking'}
                        sx={{
                            height: '56px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            px: 2,
                            borderRadius: '10px',
                            borderColor: '#d1d5db',
                            color: '#6b7280',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
                        }}
                    >
                        {idStatus === 'checking' ? '확인 중...' : '중복확인'}
                    </Button>
                </Box>

                {/* ── 비밀번호 ── */}
                <FormControl
                    sx={{ width: '100%', mb: 1.5 }}
                    variant="outlined"
                    error={(pw1Touched && isPwValid === false) || !isPwSafe}
                >
                    <InputLabel htmlFor="password1">비밀번호</InputLabel>
                    <OutlinedInput
                        id="password1"
                        autoComplete="new-password"
                        type={showPassword1 ? 'text' : 'password'}
                        value={password1}
                        onChange={handleChangePassword1}
                        onFocus={() => setPw1Touched(true)}
                        onBlur={() => setPw1Touched(false)}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton onClick={toggleShowPassword1} onMouseDown={(e) => e.preventDefault()} edge="end">
                                    {showPassword1 ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        }
                        label="비밀번호"
                    />
                    {pw1Touched && (
                        <FormHelperText>
                            {!isPwSafe
                                ? '금지된 특수문자(\' " ; < > / \\)가 포함되어 있습니다.'
                                : isPwValid === null ? '' : isPwValid ? '사용 가능한 비밀번호입니다.' : '영문, 숫자, 특수문자 포함 8~20자여야 합니다.'}
                        </FormHelperText>
                    )}
                </FormControl>

                {/* ── 비밀번호 재입력 ── */}
                <FormControl
                    sx={{ width: '100%', mb: 1.5 }}
                    variant="outlined"
                    error={pw2Touched && isPwMatch === false}
                >
                    <InputLabel htmlFor="password2">비밀번호 재입력</InputLabel>
                    <OutlinedInput
                        id="password2"
                        autoComplete="new-password"
                        type={showPassword2 ? 'text' : 'password'}
                        value={password2}
                        onChange={handleChangePassword2}
                        onFocus={() => setPw2Touched(true)}
                        onBlur={() => setPw2Touched(false)}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton onClick={toggleShowPassword2} onMouseDown={(e) => e.preventDefault()} edge="end">
                                    {showPassword2 ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        }
                        label="비밀번호 재입력"
                    />
                    {pw2Touched && password2 !== '' && (
                        <FormHelperText sx={{ color: isPwMatch ? '#16a34a' : '#d32f2f' }}>
                            {isPwMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                        </FormHelperText>
                    )}
                </FormControl>

                {/* ── 이메일 ── */}
                <Box sx={{ mb: 1.5 }}>
                    <Box display="flex" gap={1} alignItems="center" sx={{ mb: 1 }}>
                        <TextField
                            label="이메일"
                            value={emailLocal}
                            onChange={(e) => {
                                if (!emailLocked) { setEmailLocal(e.target.value); setEmailVerified(false); }
                            }}
                            InputProps={{ readOnly: emailLocked }}
                            sx={{ flex: 1, minWidth: 0 }}
                        />
                        <span className="text-gray-400 flex-shrink-0 font-medium select-none">@</span>
                        <Autocomplete
                            freeSolo
                            options={['gmail.com', 'naver.com', 'daum.net']}
                            value={emailDomain}
                            onInputChange={(_, v) => {
                                if (!emailLocked) { setEmailDomain(v); setEmailVerified(false); }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="도메인"
                                    InputProps={{ ...params.InputProps, readOnly: emailLocked }}
                                />
                            )}
                            sx={{ flex: 1, minWidth: 0 }}
                        />
                    </Box>

                    {/* 인증하기 / 인증완료 버튼 */}
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={onClickVerifyEmail}
                        disabled={emailLocked || !canOpenVerify}
                        sx={{
                            height: 48,
                            ...redBtnSx,
                            fontSize: '14px',
                            py: 0,
                            backgroundColor: emailVerified ? '#16a34a' : '#DC2626',
                            '&:hover:not(:disabled)': {
                                backgroundColor: emailVerified ? '#15803d' : '#B91C1C',
                                boxShadow: emailVerified
                                    ? '0 4px 14px rgba(22,163,74,0.3)'
                                    : '0 4px 14px rgba(220,38,38,0.35)',
                            },
                        }}
                    >
                        {emailLocked ? '✓ 인증완료' : emailVerified ? '✓ 인증완료' : '인증하기'}
                    </Button>
                </Box>

                <EmailVerifyDialog
                    open={openEmailModal}
                    email={fullEmail}
                    onClose={() => setOpenEmailModal(false)}
                    onVerified={handleEmailVerified}
                />

                {/* ── 이름 ── */}
                <TextField
                    label="이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    sx={{ mb: 1.5 }}
                />

                {/* ── 전화번호 ── */}
                <TextField
                    label="전화번호"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    fullWidth
                    sx={{ mb: 1.5 }}
                />

                {/* ── 주소 ── */}
                <TextField
                    disabled
                    label="주소"
                    value={selectedAddress}
                    fullWidth
                    InputProps={{
                        inputProps: { readOnly: true },
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={handleAddressSearch}>
                                    <SearchIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    sx={{ mb: 1.5 }}
                />

                {/* ── 상세 주소 ── */}
                <TextField
                    label="상세 주소"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    fullWidth
                    sx={{ mb: 2.5 }}
                />

                {/* ── 서버 에러 ── */}
                {submitError && (
                    <p className="text-red-500 text-sm mb-3 whitespace-pre-line">{submitError}</p>
                )}

                {/* ── 회원가입 버튼 ── */}
                <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={!canSubmit || submitting}
                    sx={{
                        backgroundColor: '#DC2626',
                        py: 1.5,
                        ...redBtnSx,
                    }}
                >
                    {submitting ? '가입 중...' : '회원가입'}
                </Button>

                {/* ── 로그인 링크 ── */}
                <p className="text-center text-sm text-gray-400 mt-6">
                    이미 회원이신가요?{' '}
                    <Link to="/login" className="text-red-600 font-semibold hover:underline">
                        로그인
                    </Link>
                </p>

            </Box>
        </div>
    );
};

export default SignUpComponent;
