import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { updateProfileImage } from '../../../slice/loginSlice';
import {
  Avatar, Box, Button, Divider, Grid, IconButton, InputAdornment,
  TextField, Typography, Paper
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// =================== 공통 상수/유틸 ===================
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  'http://localhost:8080';

const DEFAULT_AVATAR = '/image/placeholders/avatar.svg';

const getFirst = (...candidates) =>
  candidates.find(v => v !== undefined && v !== null && v !== '') ?? '';

const normalizeProfileUrl = (v) => {
  if (!v) return null;
  if (v.startsWith('http')) return v;
  if (v.startsWith('/fr/uploads/')) return `${API_BASE}${v}`;
  return `${API_BASE}/fr/uploads/user_profile/${encodeURIComponent(v)}`;
};

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem('accessToken') ||
    sessionStorage.getItem('ACCESS_TOKEN');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// =================== 컴포넌트 ===================
const EditMyInform = () => {
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const togglePasswordVisibility = (field) =>
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));

  const [userType, setUserType] = useState(null);

  const [user, setUser] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    createdDate: '',
    postcode: '',
  });

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [loading, setLoading] = useState(true);

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [coupons, setCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);

  const fetchMyCoupons = useCallback(async () => {
    try {
      const res = await api.get(`/fr/coupons/my-list`);
      setCoupons(res.data);
    } catch (err) {
      if (err.message === "Network Error" || err.code === "ERR_CONNECTION_REFUSED") {
        console.warn("서버가 응답하지 않습니다. 네트워크 상태를 확인하세요.");
      }
    }
  }, []);

  const handleIssueCoupons = async () => {
    if (!user.id || userType !== 'MEMBER') return;
    setCouponLoading(true);
    try {
      await api.post('/fr/coupons/issue-test', { memId: user.id });
      alert("테스트 쿠폰이 발급되었습니다!");
      fetchMyCoupons(); 
    } catch (err) {
      if (err.response && err.response.status === 400) {
        const errorMsg = err.response.data || "이미 유효한 쿠폰을 보유하고 있습니다. 만료 후 다시 받아주세요!";
        alert(errorMsg);
      } else {
        alert("발급 실패: " + (err.response?.data?.result || err.message));
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const handleDeleteImageServer = async () => {
    if (!window.confirm('프로필 이미지를 삭제할까요?')) return;
    try {
      setUploading(true);
      await api.delete('/fr/user/profile-image');
      setAvatarUrl(null);
      alert('프로필 이미지가 삭제되었습니다.');
    } catch (err) {
      alert('삭제 실패');
    } finally {
      setUploading(false);
    }
  };

  const loadDaumPostcode = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.daum && window.daum.Postcode) return resolve();
      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Daum Postcode script load failed'));
      document.body.appendChild(script);
    });
  }, []);

  const openPostcode = useCallback(async () => {
    try {
      await loadDaumPostcode();
      new window.daum.Postcode({
        oncomplete: (data) => {
          const road = data.roadAddress || data.address;
          const zonecode = data.zonecode || '';
          setUser(prev => ({ ...prev, address: road, postcode: zonecode }));
        },
      }).open();
    } catch (e) {
      console.error(e);
    }
  }, [loadDaumPostcode]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await api.get('/fr/user/info');
        const raw = res?.data ?? {};
        const type = raw.userType || raw.type || raw.role || raw.loginType || null;
        const data = raw.data || raw.user || raw.payload || raw.profile || raw.account || raw.result || {};

        const normalized = type === 'MEMBER'
          ? {
              id: getFirst(data.mem_id, data.memberId, data.id, data.username),
              name: getFirst(data.mem_name, data.memberName, data.name),
              email: getFirst(data.mem_email, data.memberEmail, data.email),
              phone: getFirst(data.mem_phone, data.memberPhone, data.phone),
              address: getFirst(data.mem_address, data.memberAddress, data.address),
              createdDate: getFirst(data.mem_create_id_date_time, data.memCreatedDateTime, data.created_at, data.createdAt),
            }
          : {
              id: getFirst(data.cargo_id, data.cargoId, data.id, data.username),
              name: getFirst(data.cargo_name, data.cargoName, data.name),
              email: getFirst(data.cargo_email, data.cargoEmail, data.email),
              phone: getFirst(data.cargo_phone, data.cargoPhone, data.phone),
              address: getFirst(data.cargo_address, data.cargoAddress, data.address),
              createdDate: getFirst(data.cargo_created_date_time, data.cargoCreateidDateTime, data.created_at, data.createdAt),
            };

        const avatarName = getFirst(data.webPath, data.profileImage, data.mem_profile_image, data.cargo_profile_image, data.profile);
        const initialAvatar = normalizeProfileUrl(avatarName);

        if (!canceled) {
          setUserType(type);
          setUser(prev => ({ ...prev, ...normalized }));
          setAvatarUrl(initialAvatar || null);
        }
      } catch (err) {
        console.error('회원 정보 불러오기 실패:', err);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => { canceled = true; };
  }, []);

  useEffect(() => {
    if (user.id && userType === 'MEMBER') {
      fetchMyCoupons(); 
      const timer = setInterval(() => {
        fetchMyCoupons();
      }, 5000); 
      return () => clearInterval(timer); 
    }
  }, [user.id, userType, fetchMyCoupons]);

  const handleSaveAddress = async () => {
    try {
      const url = userType === 'MEMBER'
        ? `/fr/member/${encodeURIComponent(user.id)}/address`
        : `/fr/cargo/${encodeURIComponent(user.id)}/address`;

      await api.put(url, { address: user.address, postcode: user.postcode || null });
      alert('주소가 변경되었습니다.');
    } catch (e) {
      alert('주소 변경 실패');
    }
  };

  const handleChangePassword = async () => {
    try {
      const url = userType === 'MEMBER'
        ? `/fr/member/${encodeURIComponent(user.id)}/password`
        : `/fr/cargo/${encodeURIComponent(user.id)}/password`;

      await api.put(url, { currentPassword: pwd.current, newPassword: pwd.next });
      alert('비밀번호가 변경되었습니다.');
      setPwd({ current: '', next: '', confirm: '' });
    } catch (err) {
      alert('비밀번호 변경 실패');
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    fd.append('userType', userType);
    fd.append('id', user.id);

    try {
      setUploading(true);
      const { data } = await api.post('/fr/user/upload-image', fd);
      const url = normalizeProfileUrl(data?.webPath ?? data?.filename);
      if (url) {
        setAvatarUrl(`${url}?v=${Date.now()}`);
        dispatch(updateProfileImage(`${url}?v=${Date.now()}`));
      }
      alert('이미지 업로드 완료');
    } catch (err) {
      alert('업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const triggerFilePick = () => fileInputRef.current?.click();

  // 공통 텍스트 필드 테두리 및 라운딩 스킨 설정
  const textFieldStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "#f8fafc",
      "& fieldset": { borderColor: "#e2e8f0" },
      "&:hover fieldset": { borderColor: "#cbd5e1" },
      "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "2px" },
    }
  };

  if (loading) return <Box sx={{ p: 7, color: '#2563eb', fontWeight: 'bold' }}>불러오는 중…</Box>;

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 4, md: 5 }, 
      pl: { xs: 2, sm: 4, md: 6, lg: 10 }, 
      pr: { xs: 2, sm: 4, md: 6, lg: 10 }, 
      bgcolor: '#f8fafc', // 사이드바 배경과 연동되는 은은한 배경
      minHeight: '100vh' 
    }}>
      
      {/* 화이트 플로팅 카드 레이아웃 구성 */}
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4, md: 5 }, borderRadius: "24px", backgroundColor: "#ffffff", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)", mb: 10 }}>
        
        <Typography variant="h5" fontWeight="900" color="#0f172a" mb={1}>회원 정보 수정</Typography>
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 4 }}>
          로그인 유형 : <span style={{ color: '#2563eb' }}>{userType === 'MEMBER' ? '일반 회원' : '화물(차량) 소유자'}</span>
        </Typography>

        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
              <Avatar sx={{ width: 90, height: 90, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)" }} src={avatarUrl || DEFAULT_AVATAR} />
              <Box display="flex" flexDirection="column" gap={1.2}>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadImage} />
                <Button variant="contained" disableElevation onClick={triggerFilePick} disabled={uploading} sx={{ minWidth: 140, borderRadius: "12px", bgcolor: "#2563eb", fontWeight: "bold", "&:hover": { bgcolor: "#1d4ed8" } }}>사진 업로드</Button>
                <Button variant="outlined" color="error" onClick={handleDeleteImageServer} disabled={uploading} sx={{ borderRadius: "12px", fontWeight: "bold", borderColor: "#fee2e2", bgcolor: "#fff5f5", "&:hover": { bgcolor: "#ffe4e4", borderColor: "#fca5a5" } }}>사진 삭제</Button>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              pl: { xs: 0, md: 5 }, 
              borderLeft: { xs: 'none', md: '2px solid #f1f5f9' }, 
              mt: { xs: 2, md: 0 },
              display: 'flex', flexDirection: 'column', gap: 1
            }}>
              <Typography fontWeight="800" color="#1e293b" mb={0.5}>회원 기본 프로필</Typography>
              <Typography color="#475569" fontSize="0.95rem"><b>이 름 :</b> {user.name}</Typography>
              <Typography color="#475569" fontSize="0.95rem"><b>아이디 :</b> {user.id}</Typography>
              <Typography color="#475569" fontSize="0.95rem"><b>이메일 :</b> {user.email}</Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: '#f1f5f9' }} />

        {/* 주소 변경 구역 동글동글 가공 */}
        <Typography fontWeight="800" color="#1e293b" mb={2}>주소 설정</Typography>
        <Box display="flex" gap={2} mb={2} flexDirection={{ xs: 'column', sm: 'row' }}>
          <TextField label="주소" fullWidth value={user.address || ''} InputProps={{ readOnly: true }} sx={textFieldStyle} />
          <Button variant="outlined" onClick={openPostcode} sx={{ whiteSpace: 'nowrap', borderRadius: "12px", px: 3, fontWeight: "bold", color: "#2563eb", borderColor: "#cbd5e1", "&:hover": { bgcolor: "#eff6ff" } }}>주소 찾기</Button>
          <Button variant="contained" disableElevation onClick={handleSaveAddress} sx={{ whiteSpace: 'nowrap', borderRadius: "12px", px: 4, fontWeight: "bold", bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>변경하기</Button>
        </Box>

        {userType === 'MEMBER' && (
          <>
            <Divider sx={{ my: 4, borderColor: '#f1f5f9' }} />
            <Typography fontWeight="800" color="#1e293b" mb={2}>내 쿠폰 관리</Typography>
            <Box sx={{ p: 3, bgcolor: '#ffffff', borderRadius: "18px", border: '1px solid #f1f5f9', boxShadow: "0 2px 12px rgba(0,0,0,0.01)", mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="body1" color="#334155" fontWeight="600">사용 가능한 정기 쿠폰: <span style={{ color: '#2563eb', fontWeight: 800 }}>{coupons.length}</span>장</Typography>
                  <Typography variant="caption" color="#94a3b8" fontWeight="500">테스트 운영 기간 동안 상시 발급이 가능합니다.</Typography>
                </Box>
                <Button 
                  variant="contained" 
                  disableElevation
                  onClick={handleIssueCoupons} 
                  disabled={couponLoading || coupons.length > 0} 
                  sx={{ 
                    borderRadius: "12px", fontWeight: "bold",
                    bgcolor: coupons.length > 0 ? '#f1f5f9' : '#2563eb',
                    "&:hover": { bgcolor: '#1d4ed8' }
                  }}
                >
                  {couponLoading ? '발급 중...' : coupons.length > 0 ? '보유 중' : '쿠폰 다운로드'}
                </Button>
              </Box>
              
              <Divider sx={{ mb: 2.5, borderColor: '#f8fafc' }} />
              
              <Box sx={{ maxHeight: 250, overflowY: 'auto', pr: 0.5 }}>
                {coupons.length === 0 ? (
                  <Typography variant="body2" color="#94a3b8" textAlign="center" py={3} fontWeight="500">보유 중인 할인 쿠폰이 존재하지 않습니다.</Typography>
                ) : (
                  coupons.map((mc) => (
                    <Box key={mc.mcno} sx={{ p: 2, mb: 1.5, bgcolor: '#f8fafc', borderRadius: "14px", border: '1px solid #e2e8f0', transition: 'all 0.2s', '&:hover': { borderColor: '#bfdbfe', bgcolor: '#f0f7ff' } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" fontWeight="700" color="#334155">{mc.coupon.couponName}</Typography>
                        <Box sx={{ px: 1.5, py: 0.5, bgcolor: '#eff6ff', borderRadius: '8px' }}>
                          <Typography variant="body2" fontWeight="800" color="#2563eb">
                            {mc.coupon.discountValue}% 할인
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between" mt={1.5} borderTop="1px dashed #e2e8f0" pt={1}>
                        <Typography variant="caption" color="#94a3b8" fontWeight="500">
                          발급 : {mc.issuedAt ? new Date(mc.issuedAt).toLocaleDateString() : '-'}
                        </Typography>
                        <Typography variant="caption" color="#ef4444" fontWeight="600">
                          만료 : {mc.expiryDate ? new Date(mc.expiryDate).toLocaleString() : '-'} 까지
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </>
        )}

        <Divider sx={{ my: 4, borderColor: '#f1f5f9' }} />

        {/* 비밀번호 변경 구역 동글동글 가공 */}
        <Typography fontWeight="800" color="#1e293b" mb={2}>보안 비밀번호 변경</Typography>
        <Box display="flex" flexDirection="column" gap={2.5}>
          <TextField label="현재 비밀번호" fullWidth type={showPassword.current ? 'text' : 'password'} value={pwd.current} onChange={(e) => setPwd(p => ({ ...p, current: e.target.value }))} sx={textFieldStyle}
            InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => togglePasswordVisibility('current')}>{showPassword.current ? <Visibility sx={{ color: '#2563eb' }} /> : <VisibilityOff />}</IconButton></InputAdornment> }} />
          <TextField label="새로운 비밀번호" fullWidth type={showPassword.new ? 'text' : 'password'} value={pwd.next} onChange={(e) => setPwd(p => ({ ...p, next: e.target.value }))} sx={textFieldStyle}
            InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => togglePasswordVisibility('new')}>{showPassword.new ? <Visibility sx={{ color: '#2563eb' }} /> : <VisibilityOff />}</IconButton></InputAdornment> }} />
          <Box textAlign="right">
            <Button variant="contained" disableElevation sx={{ width: 160, height: 48, borderRadius: "12px", fontWeight: "bold", bgcolor: '#2563eb', "&:hover": { bgcolor: '#1d4ed8' } }} onClick={handleChangePassword}>
              비밀번호 변경
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default EditMyInform;