import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  Stack
} from '@mui/material';
import { Reply as ReplyIcon } from '@mui/icons-material';

const AdminResponseForm = ({ questionId, onSubmit, onCancel, isVisible }) => {
  const [responseContent, setResponseContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isVisible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!responseContent.trim()) {
      setError('답변 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const responseData = {
        questionId,
        content: responseContent.trim(),
        author: '고객지원팀',
        date: new Date().toISOString().split('T')[0]
      };

      await onSubmit(responseData);
      setResponseContent('');
    } catch (err) {
      setError('답변 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setResponseContent('');
    setError('');
    onCancel();
  };

  return (
    <Box sx={{ mt: 2, px: 3, pb: 3, borderTop: '1px solid #f3f4f6' }}>

      {/* 타이틀 */}
      <Box display="flex" alignItems="center" gap={1} mt={3} mb={2.5}>
        <ReplyIcon sx={{ color: '#DC2626', fontSize: 20 }} />
        <span style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>
          관리자 답변 작성
        </span>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={responseContent}
          onChange={(e) => setResponseContent(e.target.value)}
          placeholder="고객에게 도움이 되는 답변을 작성해주세요..."
          variant="outlined"
          disabled={isSubmitting}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              backgroundColor: '#fff',
              fontSize: '14px',
            },
          }}
        />

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button
            type="button"
            variant="outlined"
            onClick={handleCancel}
            disabled={isSubmitting}
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
            disabled={isSubmitting || !responseContent.trim()}
            startIcon={<ReplyIcon />}
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
            {isSubmitting ? '답변 등록 중...' : '답변 등록'}
          </Button>
        </Stack>
      </form>
    </Box>
  );
};

export default AdminResponseForm;
