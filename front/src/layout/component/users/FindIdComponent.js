import { API_BASE } from '../../../config';
// src/layout/component/users/FindIdComponent.jsx
import * as React from 'react';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
} from '@mui/material';
import EmailVerifyDialog from '../auth/EmailVerifyDialog';
import { useNavigate } from 'react-router-dom';

// 환경별 API 베이스

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 다른 페이지(로그인/비밀번호 찾기)와 통일된 브랜드 레드 버튼 스타일
const brandButtonSx = {
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
};

const FindIdComponent = ({ onComplete }) => {
    const [email, setEmail] = React.useState('');
    const [openEmailModal, setOpenEmailModal] = React.useState(false);
    const [name, setName] = React.useState('');

    const navigate = useNavigate();

    const canOpenVerify = !!email && emailRegex.test(email) && !!name.trim();

    // 1) 인증 다이얼로그 열기
    const onClickVerifyEmail = () => {
        if (!name.trim()) {
            alert('이름을 입력해 주세요.');
            return;
        }
        if (canOpenVerify) setOpenEmailModal(true);
    };

    // 2) 다이얼로그 인증 성공 → 아이디 조회
    const handleEmailVerified = async (ok) => {
        setOpenEmailModal(false);
        if (!ok || !email) return;

        try {
            const qs = new URLSearchParams({ email });
            if (name.trim()) qs.set('name', name.trim());

            const res = await fetch(`${API_BASE}/api/auth/find-id?${qs.toString()}`, {
                headers: { Accept: 'application/json' },
            });

            if (!res.ok) {
                alert('해당 정보로 가입된 아이디가 없습니다.');
                return;
            }

            const data = await res.json();
            const foundId = data?.loginId || '';

            if (!foundId) {
                alert('해당 정보로 가입된 아이디가 없습니다.');
                return;
            }

            alert(`가입된 아이디는 [ ${foundId} ] 입니다.`);

            const goLogin = window.confirm('로그인 하시겠습니까?');
            if (goLogin) {
                navigate(`/login?loginId=${encodeURIComponent(foundId)}`, { replace: true });
            }

            if (typeof onComplete === 'function') onComplete(foundId);
        } catch (err) {
            console.error(err);
            alert('아이디 찾기 중 오류가 발생했습니다.');
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 6, mb: 8 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <img src="/image/logo/main_logo.png" alt="로고" style={{ height: 56 }} />
            </Box>
            <Box sx={{ p: 3, borderRadius: '12px', bgcolor: 'white', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
                    아이디 찾기
                </Typography>

                {/* 이름 입력 */}
                <TextField
                    label="이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    variant="outlined"
                    sx={{ width: '100%', mb: 2 }}
                />

                {/* 이메일 입력 */}
                <TextField
                    label="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="outlined"
                    placeholder="example@gmail.com"
                    sx={{ width: '100%', mb: 0.5 }}
                    helperText={
                        email.length > 0 && !emailRegex.test(email)
                            ? '이메일 형식을 확인해 주세요.'
                            : '가입한 이메일만 유효합니다.'
                    }
                    error={email.length > 0 && !emailRegex.test(email)}
                />

                <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2, ...brandButtonSx }}
                    onClick={onClickVerifyEmail}
                    disabled={!canOpenVerify}
                >
                    인증하기
                </Button>
            </Box>

            {/* 이메일 인증 다이얼로그 */}
            <EmailVerifyDialog
                open={openEmailModal}
                email={email}
                onClose={() => setOpenEmailModal(false)}
                onVerified={handleEmailVerified}
            />
        </Container>
    );
};

export default FindIdComponent;
