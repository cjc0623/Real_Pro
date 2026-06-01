import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Grid, Paper, Typography, Button, Modal, TextField,
  IconButton, Select, MenuItem, InputLabel, FormControl, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useParams, useNavigate } from 'react-router-dom';

// ===== 공통 API 베이스/인스턴스 =====
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken') || sessionStorage.getItem('ACCESS_TOKEN');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 구/신 경로 모두 보정
const toPreviewUrl = (p) => {
  if (!p) return null;
  const s = String(p);
  if (s.startsWith('http')) return s;
  if (s.startsWith('/g2i4/uploads/')) return `${API_BASE}${s}`;
  if (s.startsWith('/uploads/')) return `${API_BASE}/g2i4${s}`;
  return `${API_BASE}/g2i4/uploads/cargo/${encodeURIComponent(s)}`;
};

const EditVehicleInform = () => {
  const { cargoId } = useParams();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [weightOptions, setWeightOptions] = useState(['0.5톤','1톤','2톤','3톤','4톤','5톤이상']); 
  const [loading, setLoading] = useState(false); 
  

  const [formData, setFormData] = useState({
    no: null,
    name: '',
    weight: '',
    cargoNumber: '',
    image: null,
    preview: null
  });

  useEffect(() => {
    if (!cargoId) {
      alert('접근 권한이 없습니다. (cargoId 누락)');
      navigate('/login', { replace: true });
    }
  }, [cargoId, navigate]);

  const fetchVehicles = async () => {
    if (!cargoId) return;
    try {
      const cargoRes = await api.get(`/g2i4/cargo/list/${cargoId}`);
      const cargoList = cargoRes.data || [];

      const myVehicles = cargoList.map(c => ({
        no: c.cargoNo,
        name: c.cargoName || '',
        weight: c.cargoCapacity || '',
        imagePath: c.cargoImage,
        preview: toPreviewUrl(c.cargoImage),
        cargoNumber: c.cargoNumber || '',
        status: c.status || 'PENDING'
      }));

      setVehicles(myVehicles);
    } catch (err) {
      console.error('데이터 불러오기 실패:', err);
    }
  };

  const fetchWeightOptions = async () => {
    try {
      const res = await api.get(`/g2i4/admin/fees/basic/rows`);
      const uniq = Array.from(new Set(res.data || [])).filter(Boolean);
      if (uniq.length) setWeightOptions(uniq);
    } catch (err) {
      console.warn('weight 옵션 불러오기 실패:', err);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchWeightOptions();
  }, [cargoId]);

  const handleOpen = (index = null) => {
    setEditingIndex(index);
    if (index !== null) {
      const { no, name, weight, preview, cargoNumber } = vehicles[index];
      setFormData({ no, name, weight: String(weight ?? ''), cargoNumber: cargoNumber || '', image: null, preview });
    } else {
      setFormData({ no: null, name: '', weight: '', cargoNumber: '', image: null, preview: null });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingIndex(null);
  };

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData(prev => ({
      ...prev,
      image: file,
      preview: URL.createObjectURL(file)
    }));
  };

  const handleSave = async () => {
    const { no, name, weight, cargoNumber, image } = formData;
    if (!cargoId) { alert('접근 권한이 없습니다.'); return; }
    
    // 신규 등록 시 이미지 필수 체크
    if (no === null && !image) {
      alert('차량 등록을 위해 차량 사진 업로드는 필수입니다.');
      return;
    }
    
    if (!name || !weight || !cargoNumber) {
      alert('차량 이름, 적재 무게, 차량 번호를 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      if (no != null) {
        // [수정] 기존 데이터 수정
        const payload = { name, address: weight, weight, cargoNumber };
        await api.put(`/g2i4/cargo/update/${no}`, payload);
        
        if (image) {
          const fd = new FormData();
          fd.append('image', image);
          await api.post(`/g2i4/cargo/upload/${no}`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      } else {
        // [신규 등록] 통합 전송 (Multipart/Form-Data)
        const formDataPayload = new FormData();
        
        const dto = {
          name,
          address: weight,
          weight,
          cargoNumber
        };
        
        // 🚨 [에러 해결 핵심] Blob 생성 시 type을 명시적으로 'application/json'으로 지정
        const jsonBlob = new Blob([JSON.stringify(dto)], { type: "application/json" });
        formDataPayload.append('dto', jsonBlob);
        
        // 이미지 파일 추가
        formDataPayload.append('image', image);

        // 🚨 headers에 Content-Type을 명시적으로 적지 않아도 브라우저가 boundary를 자동으로 잡아줍니다.
        await api.post(`/g2i4/cargo/add/${cargoId}`, formDataPayload);
      }

      alert('차량 정보가 성공적으로 저장되었습니다. 관리자 승인을 기다려주세요.');
      await fetchVehicles();
      handleClose();
    } catch (err) {
      console.error('차량 저장 실패:', err.response?.data || err.message);
      alert(err.response?.data || '차량 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index) => {
    const target = vehicles[index];
    if (!target?.no) return;
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/g2i4/cargo/delete/${target.no}`);
      await fetchVehicles();
    } catch (err) {
      console.error('차량 삭제 실패:', err);
      alert('삭제 실패');
    }
  };

  // 공통 텍스트 필드 디자인 스킨 정의 (동글동글 매치용)
  const inputSkinedStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "#f8fafc",
      "& fieldset": { borderColor: "#e2e8f0" },
      "&:hover fieldset": { borderColor: "#cbd5e1" },
      "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "2px" },
    }
  };

  return (
    <Box sx={{ p: { xs: 2.5, sm: 4, md: 5 }, pl: { xs: 2, sm: 4, md: 6, lg: 10 }, pr: { xs: 2, sm: 4, md: 6, lg: 10 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight="900" color="#0f172a" mb={5} textAlign="left">내 차량 관리</Typography>

      {/* 🟢 AdminCargoApproval 양식과 똑같이 alignItems="stretch" 적용 및 모바일 1열 상태일 때를 대비해 justifyContent 반응형 분기 추가 */}
      <Grid container spacing={{ xs: 3, md: 4 }} alignItems="stretch" justifyContent={{ xs: 'center', sm: 'flex-start' }}>
        {vehicles.map((vehicle, idx) => (
          // 🟢 Grid item에 display="flex"를 주어 내부 카드가 100% 일치된 고정 높이를 가지게 유도
          // 🟢 모바일(xs)에서 단독 배치될 때 비정상적으로 좌우로 늘어나는 현상을 막기 위해 maxWidth 제안선 바인딩 추가
          <Grid item key={idx} xs={12} sm={6} lg={4} display="flex" sx={{ maxWidth: { xs: '450px', sm: '100%' } }}>
            {/* 🟢 height: '100%' 추가로 카드가 Grid item 높이만큼 완벽하게 늘어나도록 설정 */}
            <Paper elevation={0} sx={{
              width: '100%',
              height: '100%', 
              p: 3,
              borderRadius: "20px",
              backgroundColor: "#ffffff",
              border: vehicle.status !== 'APPROVED' ? '2px dashed #fee2e2' : '1px solid #f1f5f9',
              boxShadow: "0 4px 25px rgba(0, 0, 0, 0.02)",
              display: 'flex', 
              flexDirection: 'column', 
              boxSizing: 'border-box',
              height: { xs: 380, sm: 420 }, // 🟢 모든 카드의 세로 높이를 고정하여 통일
              overflow: 'hidden', // 🟢 내용물이 카드를 뚫고 나가지 않게 차단
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-3px)' }
            }}>
              <Box sx={{
                height: { xs: 160, sm: 190 },  // ← 반응형 높이
                bgcolor: '#f8fafc', 
                borderRadius: "14px", // 내부 썸네일 존 라운딩
                border: "1px solid #e2e8f0",
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0 // 상단 썸네일 박스 세로 높이 고정
              }}>
                <img
                  src={vehicle.preview || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="310"><rect width="100%" height="100%" fill="%23f8fafc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="22" font-family="sans-serif" font-weight="bold">No Vehicle Image</text></svg>'}
                  alt="preview"
                  style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </Box>

              {/* 🟢 flexGrow: 1과 내부 flex 배치를 설정해 글자 수가 달라도 본문 높이가 완전 유기적으로 동일하게 유지되도록 확장 */}
              <Box sx={{ textAlign: 'center', mt: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                <Box sx={{ width: '100%', minWidth: 0 }}>
                  <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={1} flexWrap="nowrap" sx={{ width: '100%', minWidth: 0 }}>
                    <Typography 
                      fontWeight="800" 
                      variant="h6" 
                      color="#334155" 
                      sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        flexShrink: 1 // 🟢 이름이 길면 줄어들게 설정
                      }}
                    >
                      {vehicle.name}
                    </Typography>
                    {/* 상태 태그를 마이페이지 양식에 맞춰 알약(Pill) 형태로 밴딩 */}
                    {vehicle.status === 'PENDING' && <Chip label="대기" size="small" sx={{ fontWeight: 'bold', borderRadius: '8px', bgcolor: '#fff7ed', color: '#ea580c', flexShrink: 0 }} />}
                    {vehicle.status === 'APPROVED' && <Chip label="승인" size="small" sx={{ fontWeight: 'bold', borderRadius: '8px', bgcolor: '#eff6ff', color: '#2563eb', flexShrink: 0 }} />}
                    {vehicle.status === 'REJECTED' && <Chip label="거절" size="small" sx={{ fontWeight: 'bold', borderRadius: '8px', bgcolor: '#fef2f2', color: '#dc2626', flexShrink: 0 }} />}
                  </Box>
                  <Typography color="textSecondary" fontSize="0.9rem" fontWeight="500" noWrap>{vehicle.weight}</Typography>
                  <Typography 
                    variant="body2" 
                    color="#2563eb" 
                    fontWeight="700" 
                    mt={0.8}
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} // 🟢 차량번호 말줄임 처리
                  >
                    차량번호: {vehicle.cargoNumber}
                  </Typography>
                </Box>
              </Box>

              {/* 🟢 mt: 'auto' 배치로 본문 컨텐츠가 밀리거나 버튼 유무와 관계없이 무조건 하단 바닥선에 칼정렬 고정 */}
              <Box sx={{ mt: 'auto', pt: 3 }} display="flex" gap={1.2}>
                {vehicle.status !== 'APPROVED' && (
                  <Button fullWidth variant="contained" disableElevation onClick={() => handleOpen(idx)} sx={{ borderRadius: "12px", fontWeight: "bold", bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>수정</Button>
                )}
                <Button fullWidth variant="outlined" color="error" onClick={() => handleDelete(idx)} sx={{ borderRadius: "12px", fontWeight: "bold", borderColor: "#fee2e2", bgcolor: "#fff5f5", "&:hover": { bgcolor: "#ffe4e4" } }}>삭제</Button>
              </Box>
            </Paper>
          </Grid>
        ))}


        {/* 🟢 신규 차량 추가 버튼 UI 완전 개편 및 사이즈 통일 */}
        <Grid item xs={12} sm={6} lg={4} display="flex" sx={{ maxWidth: { xs: '450px', sm: '100%' } }}>
          <Paper onClick={() => handleOpen()} elevation={0} sx={{
            width: '100%',   
            height: { xs: 380, sm: 420 }, // 🟢 등록된 차량 카드와 높이를 1px 오차 없이 일치화
            minHeight: 'auto',
            border: '2px dashed #cbd5e1', 
            borderRadius: "20px",
            backgroundColor: "#f8fafc", // 다른 카드와 차별성을 두기 위한 배경
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            boxSizing: 'border-box',
            '&:hover': { 
              borderColor: '#2563eb', 
              bgcolor: '#f0f7ff', 
              transform: 'translateY(-3px)',
              boxShadow: '0 10px 25px rgba(37, 99, 235, 0.1)',
              '& .add-icon': { color: '#2563eb', transform: 'scale(1.1)', bgcolor: '#dbeafe' },
              '& .add-txt': { color: '#2563eb' } 
            }
          }}>
            {/* 커다란 플러스 아이콘 역할을 하는 동그란 박스 */}
            <Box className="add-icon" sx={{ 
              width: 64, 
              height: 64, 
              borderRadius: '50%', 
              bgcolor: '#e2e8f0', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              mb: 2, 
              transition: 'all 0.2s ease-in-out', 
              color: '#64748b', 
              fontSize: '2rem', 
              fontWeight: 'bold'
            }}>
              ＋
            </Box>
            <Typography variant="h6" className="add-txt" sx={{ fontWeight: "800", color: "#64748b", transition: "color 0.2s" }}>
              신규 차량 추가
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#94a3b8', fontWeight: 500 }}>
              새로운 운송 차량을 등록하세요
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 모달 팝업 내부 입력 필드 동글동글 마사지 */}
      <Modal open={open} onClose={handleClose}>
        <Box sx={{
          p: { xs: 3, md: 5 },
          bgcolor: '#ffffff', 
          borderRadius: "24px", // 모달 바깥 모서리 대폭 곡률 추가
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
          width: '90%', maxWidth: 950,
          mx: 'auto', mt: { xs: '5%', md: '6%' },  
          position: 'relative',
          maxHeight: '85vh',   
          overflowY: 'auto'    
        }}>
          <IconButton onClick={handleClose} sx={{ position: 'absolute', top: 16, right: 16, color: "#64748b", "&:hover": { bgcolor: "#f1f5f9" } }}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="900" color="#0f172a" mb={4}>차량 정보 입력</Typography>
          
          <Box display="flex" gap={4} flexDirection={{ xs: 'column', md: 'row' }}>
            <Box sx={{ flex: 1, bgcolor: '#f8fafc', aspectRatio: '5/3', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <img
                src={formData.preview || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300"><rect width="100%" height="100%" fill="%23f8fafc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="20" font-family="sans-serif" font-weight="bold">No Vehicle Image</text></svg>'}
                alt="preview"
                style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </Box>
            
            <Box flex={1} display="flex" flexDirection="column" gap={2.5}>
              <TextField label="차량 이름 (예: 다마스)" value={formData.name} onChange={handleChange('name')} fullWidth sx={inputSkinedStyle} />
              <TextField label="차량 번호 (예: 12가 3456)" value={formData.cargoNumber} onChange={handleChange('cargoNumber')} fullWidth sx={inputSkinedStyle} />
              
              <FormControl fullWidth sx={inputSkinedStyle}>
                <InputLabel id="weight-label">적재 무게</InputLabel>
                <Select labelId="weight-label" label="적재 무게" value={formData.weight} onChange={handleChange('weight')}>
                  {weightOptions.map((w) => (
                    <MenuItem key={w} value={w}>{w}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button variant="outlined" component="label" sx={{ borderRadius: "12px", py: 1.2, fontWeight: "bold", color: "#2563eb", borderColor: "#cbd5e1", "&:hover": { bgcolor: "#eff6ff" } }}>
                차량 이미지 업로드
                <input hidden accept="image/*" type="file" onChange={handleImageChange} />
              </Button>
            </Box>
          </Box>
          
          <Box mt={5} display="flex" gap={2}>
            <Button fullWidth variant="contained" disableElevation onClick={handleSave} disabled={loading} sx={{ py: 1.5, borderRadius: "12px", fontWeight: "bold", bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>
              {loading ? '저장 중...' : '저장 (관리자 승인 대기)'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default EditVehicleInform;