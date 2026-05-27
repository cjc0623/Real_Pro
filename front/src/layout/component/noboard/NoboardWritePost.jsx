import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Alert,
  Stack,
  Snackbar,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  ArrowBack as ArrowLeftIcon,
  Save as SaveIcon
} from '@mui/icons-material';

import { getNoticeDetail, createNotice, updateNotice, getNoticeCategories } from '../../../api/noticeApi';
import { getCurrentUserId } from '../../../utils/jwtUtils';


const WritePost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);


  // JWT에서 현재 사용자 ID를 가져와 디폴트로 설정
  const currentUserId = getCurrentUserId() || 'admin';


  const [formData, setFormData] = useState({
    title: '',
    author: currentUserId, // 디폴트로 authorID 설정
    content: '',
    category: 'GENERAL' // 기본 카테고리
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [categories, setCategories] = useState([]);


  // 수정 모드일 때 기존 데이터 로드
  const loadNoticeForEdit = async () => {
    try {
      setLoading(true);
      const response = await getNoticeDetail(id);
      setFormData({
        title: response.title,
        author: response.authorName,
        content: response.content,
        category: response.category || 'GENERAL'
      });
    } catch (err) {
      console.error('공지사항 로드 실패:', err);
      setSnackbar({ open: true, message: '공지사항을 불러오는데 실패했습니다.', severity: 'error' });
      navigate('/noboard');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 목록 로드
  const loadCategories = async () => {
    try {
      const categoryData = await getNoticeCategories();
      setCategories(categoryData); // GENERAL 포함하여 모든 카테고리 표시
    } catch (err) {
      console.error('카테고리 로드 실패:', err);
      // 기본 카테고리 설정
      setCategories([
        { value: 'GENERAL', displayName: '사용안내' },
        { value: 'SYSTEM', displayName: '시스템' },
        { value: 'SERVICE', displayName: '서비스' },
        { value: 'UPDATE', displayName: '업데이트' }
      ]);
    }
  };

  useEffect(() => {
    loadCategories();
    if (isEditing && id) {
      loadNoticeForEdit();
    }
  }, [id, isEditing]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    }

    if (!formData.author.trim()) {
      newErrors.author = '작성자를 입력해주세요.';
    }

    if (!formData.content.trim()) {
      newErrors.content = '내용을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {

      // JWT 토큰 기반 인증 사용 (API에서 자동으로 JWT 토큰 처리)
      // formData.author 값은 백엔드에서 authorName으로 저장됨

      console.log('=== 제출 데이터 확인 ===');
      console.log('isEditing:', isEditing);
      console.log('formData:', formData);
      console.log('게시글 ID:', id);
      
      if (isEditing) {
        console.log('수정 API 호출 중...');
        await updateNotice(id, formData);
        setSnackbar({ open: true, message: '공지가 성공적으로 수정되었습니다.', severity: 'success' });
      } else {
        console.log('생성 API 호출 중...');
        await createNotice(formData);
        setSnackbar({ open: true, message: '새 공지가 성공적으로 작성되었습니다.', severity: 'success' });
      }
      
      // 성공 메시지 표시 후 1.5초 뒤 목록으로 이동
      setTimeout(() => {
        navigate('/noboard');
      }, 1500);
    } catch (error) {
      console.error('저장 실패:', error);
      setSnackbar({ open: true, message: `오류가 발생했습니다: ${error.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleCancel = () => {
    if (window.confirm('작성을 취소하시겠습니까? 입력한 내용이 사라집니다.')) {
      navigate('/noboard');
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  /* ── 공통 TextField sx ── */
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      backgroundColor: '#fff',
    },
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── 상단 헤더: 흰 배경, 일반 텍스트 ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8">

        {/* 목록으로 링크 */}
        <button
          type="button"
          onClick={() => navigate('/noboard')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6"
        >
          <ArrowLeftIcon sx={{ fontSize: 16 }} />
          목록으로
        </button>

        {/* 페이지 제목 */}
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
          {isEditing ? '공지 수정' : '새 공지 작성'}
        </h1>
        <p className="text-gray-400 text-sm mt-1.5">
          {isEditing ? '공지사항 내용을 수정합니다.' : '새로운 공지사항을 작성합니다.'}
        </p>
      </div>

      {/* ── 폼 영역: 카드·테두리 없음 ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <div className="border-t border-gray-100 pt-8">
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>

              {/* 제목 */}
              <TextField
                label="제목"
                variant="outlined"
                fullWidth
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
                placeholder="공지 제목을 입력하세요"
                required
                disabled={loading}
                sx={fieldSx}
              />

              {/* 카테고리 */}
              <FormControl fullWidth required disabled={loading} sx={fieldSx}>
                <InputLabel id="category-label">카테고리</InputLabel>
                <Select
                  labelId="category-label"
                  value={formData.category}
                  label="카테고리"
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  sx={{ borderRadius: '10px' }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 작성자 (읽기 전용) */}
              <TextField
                label="작성자"
                variant="outlined"
                fullWidth
                value={formData.author}
                InputProps={{ readOnly: true }}
                error={!!errors.author}
                helperText={errors.author}
                required
                disabled={loading}
                sx={{
                  ...fieldSx,
                  '& .MuiOutlinedInput-root': {
                    ...fieldSx['& .MuiOutlinedInput-root'],
                    backgroundColor: '#f9fafb',
                  },
                }}
              />

              {/* 내용 */}
              <TextField
                label="내용"
                variant="outlined"
                multiline
                rows={12}
                fullWidth
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                error={!!errors.content}
                helperText={errors.content}
                placeholder="공지 내용을 입력하세요"
                required
                disabled={loading}
                sx={{
                  ...fieldSx,
                  '& .MuiInputBase-root': { alignItems: 'flex-start' },
                }}
              />

              {/* 하단 버튼 */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">

                {/* 취소 — 아웃라인 */}
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  startIcon={<ArrowLeftIcon />}
                  disabled={loading}
                  sx={{
                    borderRadius: '10px',
                    borderColor: '#d1d5db',
                    color: '#6b7280',
                    px: 3,
                    py: 1.25,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
                  }}
                >
                  취소
                </Button>

                {/* 작성하기 — 메인 컬러(빨간) */}
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                  sx={{
                    borderRadius: '10px',
                    backgroundColor: '#DC2626',
                    px: 3,
                    py: 1.25,
                    textTransform: 'none',
                    fontWeight: 700,
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: '#B91C1C',
                      boxShadow: '0 4px 14px rgba(220,38,38,0.35)',
                    },
                    '&:disabled': { backgroundColor: '#e5e7eb', color: '#9ca3af' },
                  }}
                >
                  {loading ? '저장 중...' : (isEditing ? '수정하기' : '작성하기')}
                </Button>
              </div>

            </Stack>
          </Box>
        </div>
      </div>

      {/* ── Snackbar (기존 유지) ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default WritePost;