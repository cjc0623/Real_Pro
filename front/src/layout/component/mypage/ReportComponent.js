import React, { useState, useEffect } from 'react';
import { reportUser, reportCreate } from '../../../api/userinfoApi/reportApi';
import {
  Box, Typography, CircularProgress, Alert,
  Button,
  TextField
} from '@mui/material';

const initState = {
  reporterId: '',
  targetId: '',
  targetName: '',
  content: '',
};

// 공통 입력 필드 스타일 (다른 마이페이지 컴포넌트와 통일)
const textFieldStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    backgroundColor: "#f8fafc",
    "& fieldset": { borderColor: "#e2e8f0" },
    "&:hover fieldset": { borderColor: "#cbd5e1" },
    "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "2px" },
  },
  "& .MuiInputLabel-root": { fontWeight: 600 }
};

const ReportComponent = ({ matchingNo, onClose }) => {
  const [formState, setFormState] = useState(initState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!matchingNo) {
      setIsLoading(false);
      setError('Delivery number is required.');
      return;
    }

    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const data = await reportUser(matchingNo);
        setFormState(prevState => ({
          ...prevState,
          reporterId: data.reporterId,
          targetId: data.targetId,
          targetName: data.targetName,
        }));
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || err.message || 'Failed to fetch report details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [matchingNo]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!formState.reporterId && !isLoading) {
    return <Alert severity="info">신고 대상 정보를 불러오지 못했습니다.</Alert>;
  }

  const handleContentChange = (e) => {
    setFormState(prevState => ({ ...prevState, content: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!formState.content) {
      alert('신고 내용을 입력해주세요.');
      return;
    }

    try {
      await reportCreate(formState);

      // 수정: 1회 신고 제한 방식이므로 성공 시 항상 신규 접수
      alert('신고가 접수되었습니다.');

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Failed to submit report:", error);

      // 수정: 백엔드 에러 메시지 그대로 표시
      const msg = error?.response?.data?.message || '신고 접수 중 오류가 발생했습니다.';
      alert(msg);
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="caption" display="block" color="text.secondary" mb={1.5}>
        허위 신고 시 서비스 이용에 제한이 있을 수 있습니다.
        <Box component="br" sx={{ display: { xs: "block", sm: "none" } }} />
        정확한 내용을 입력해 주세요.
      </Typography>

      <TextField
        label="신고자 ID"
        value={formState.reporterId}
        fullWidth
        margin="dense"
        InputProps={{ readOnly: true, sx: { color: '#64748b' } }}
        sx={textFieldStyle}
      />

      <TextField
        label="신고 대상 ID"
        value={formState.targetId}
        fullWidth
        margin="dense"
        InputProps={{ readOnly: true, sx: { color: '#64748b' } }}
        sx={textFieldStyle}
      />

      <TextField
        label="신고 내용"
        value={formState.content}
        onChange={handleContentChange}
        fullWidth
        margin="dense"
        multiline
        rows={3}
        placeholder="신고 내용을 입력하세요..."
        sx={{ ...textFieldStyle, mt: 0.5 }}
      />

      <Button
        variant="contained"
        fullWidth
        disableElevation
        sx={{ 
          mt: 2.5, 
          py: 1.2, 
          borderRadius: "12px", 
          fontWeight: "bold", 
          bgcolor: "#2563eb", 
          "&:hover": { bgcolor: "#1d4ed8" } 
        }}
        onClick={handleSubmit}
        disabled={!formState.content || !formState.targetId}
      >
        신고 접수
      </Button>
    </Box>
  );
};

export default ReportComponent;