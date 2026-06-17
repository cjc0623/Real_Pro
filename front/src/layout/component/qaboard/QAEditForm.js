import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon, EditNote as EditNoteIcon } from '@mui/icons-material';

// 사이트 공통 입력창 스타일 (borderRadius 10px · 흰 배경)
const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: '#fff',
    fontSize: '14px',
  },
};

// ✅ 보안 패턴: 한글, 영문, 숫자, 공백, 그리고 기본적인 문장부호(. , ? ! /)만 허용
// SQL 인젝션 위험이 있는 따옴표(' "), 세미콜론(;), 태그(< >), 백슬래시(\) 등을 원천 차단합니다.
const SECURITY_SAFE_REGEX = /[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣\s.,?!/]/g;

const QAEditForm = ({ item, categories, onSave, onCancel, isVisible }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    isPrivate: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item && isVisible) {
      setFormData({
        title: item.title || '',
        content: item.content || '',
        category: item.category || '',
        isPrivate: item.isPrivate || false
      });
    }
  }, [item, isVisible]);

  if (!isVisible) return null;

  const handleChange = (field) => (event) => {
    let value = field === 'isPrivate' ? event.target.checked : event.target.value;
    
    // ✅ 제목과 내용 입력 시 실시간 보안 필터링 (인젝션 공격 시도 즉시 무력화)
    if (field === 'title' || field === 'content') {
        value = value.replace(SECURITY_SAFE_REGEX, "");
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 프론트엔드 검증 강화
    if (!formData.title || !formData.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (formData.title.trim().length > 200) {
      setError('제목은 200자 이내로 입력해주세요.');
      return;
    }

    if (!formData.content || !formData.content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    if (!formData.category || formData.category.trim() === '') {
      setError('카테고리를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 데이터 검증 및 정규화
      const updatedItem = {
        ...item,
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category.trim(),
        isPrivate: Boolean(formData.isPrivate), // 명시적 Boolean 변환
        lastModified: new Date().toISOString().split('T')[0]
      };
      
      // 상세한 디버깅 로그
      console.log('QAEditForm - 전송할 데이터 검증:');
      console.log('  - Title:', `"${updatedItem.title}" (${updatedItem.title.length}자)`);
      console.log('  - Content:', `"${updatedItem.content.substring(0, 50)}..." (${updatedItem.content.length}자)`);
      console.log('  - Category:', `"${updatedItem.category}"`);
      console.log('  - IsPrivate:', updatedItem.isPrivate, typeof updatedItem.isPrivate);
      console.log('  - ID:', updatedItem.id);
      
      await onSave(updatedItem);
    } catch (err) {
      console.error('QAEditForm - 수정 중 오류:', err);
      setError(`수정 중 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: item?.title || '',
      content: item?.content || '',
      category: item?.category || '',
      isPrivate: item?.isPrivate || false
    });
    setError('');
    onCancel();
  };

  return (
    <Box sx={{ mt: 2, px: 3, pb: 3, borderTop: '1px solid #f3f4f6' }}>

      {/* 타이틀 */}
      <Box display="flex" alignItems="center" gap={1} mt={3} mb={2.5}>
        <EditNoteIcon sx={{ color: '#DC2626', fontSize: 20 }} />
        <span style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>
          게시글 수정
        </span>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="제목"
            value={formData.title}
            onChange={handleChange('title')}
            variant="outlined"
            disabled={isSubmitting}
            required
            helperText={formData.title.length > 0 ? "특수문자(', \", ;, <, >)는 입력할 수 없습니다." : ""}
            sx={inputSx}
          />

          <FormControl fullWidth required>
            <InputLabel>카테고리</InputLabel>
            <Select
              value={formData.category}
              label="카테고리"
              onChange={handleChange('category')}
              disabled={isSubmitting}
              sx={{ borderRadius: '10px', backgroundColor: '#fff' }}
            >
              {categories?.filter(c => c.id !== 'all').map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="내용"
            multiline
            rows={4}
            value={formData.content}
            onChange={handleChange('content')}
            variant="outlined"
            disabled={isSubmitting}
            required
            placeholder="수정할 내용을 입력해주세요"
            sx={inputSx}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isPrivate}
                onChange={handleChange('isPrivate')}
                disabled={isSubmitting}
                sx={{ '&.Mui-checked': { color: '#DC2626' } }}
              />
            }
            label="비공개 문의"
          />

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button
              type="button"
              variant="outlined"
              onClick={handleCancel}
              disabled={isSubmitting}
              startIcon={<CancelIcon />}
              sx={{
                borderRadius: '10px',
                borderColor: '#d1d5db',
                color: '#6b7280',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
              }}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={<SaveIcon />}
              sx={{
                borderRadius: '10px',
                backgroundColor: '#DC2626',
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: 'none',
                '&:hover': { backgroundColor: '#B91C1C', boxShadow: 'none' },
                '&:disabled': { backgroundColor: '#e5e7eb', color: '#9ca3af' },
              }}
            >
              {isSubmitting ? '수정 중...' : '수정 완료'}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
};

export default QAEditForm;