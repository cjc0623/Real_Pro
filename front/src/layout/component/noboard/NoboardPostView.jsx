import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Alert,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  ArrowBack as ArrowLeftIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { getNoticeDetail, deleteNotice, getCategoryDisplayName } from '../../../api/noticeApi';
import { isCurrentUserAdmin, getCurrentUserId } from '../../../utils/jwtUtils';
import Breadcrumb from '../../../components/Breadcrumb';

const PostView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [canEditDelete, setCanEditDelete] = useState(false);

  // 공지사항 상세 로드
  const loadNoticeDetail = async () => {
    try {
      setLoading(true);
      const response = await getNoticeDetail(id);
      setNotice(response);
      setError(null);
    } catch (err) {
      console.error('공지사항 상세 로드 실패:', err);
      if (err.response && err.response.status === 404) {
        setError('존재하지 않는 공지사항입니다.');
        // 3초 후 자동으로 목록으로 이동
        setTimeout(() => {
          navigate('/noboard');
        }, 3000);
      } else {
        setError('공지사항을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadNoticeDetail();
    }
    // 사용자 정보 초기화
    const adminStatus = isCurrentUserAdmin();
    const userId = getCurrentUserId();

    setIsAdmin(adminStatus);
    setCurrentUserId(userId);
  }, [id]);

  // notice가 로드된 후 권한 확인
  useEffect(() => {
    if (notice && currentUserId !== null) {
      // 관리자이거나 작성자 본인이면 수정/삭제 가능
      const canModify = isAdmin || (notice.authorId === currentUserId);
      setCanEditDelete(canModify);
    }
  }, [notice, isAdmin, currentUserId]);

  const handleGoBack = () => {
    navigate('/noboard');
  };

  const handleEdit = () => {
    navigate(`/noboard/write/${notice.noticeId}`);
  };

  const handleDeleteClick = () => {
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialog(false);
    try {
      // JWT 토큰 기반 인증 사용 (userInfo는 실제로 API에서 JWT 토큰을 사용함)
      await deleteNotice(notice.noticeId);
      setSnackbar({ open: true, message: '삭제가 완료되었습니다.', severity: 'success' });
      // 성공 메시지 표시 후 1.5초 뒤 목록으로 이동
      setTimeout(() => {
        navigate('/noboard');
      }, 1500);
    } catch (err) {
      console.error('삭제 실패:', err);
      setSnackbar({ open: true, message: '삭제에 실패했습니다.', severity: 'error' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog(false);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // 공통 컨테이너 (목록·문의 페이지와 동일한 max-w / padding / font)
  const Page = ({ children }) => (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 font-sans">
      {children}
    </div>
  );

  if (loading) {
    return (
      <Page>
        <div className="flex flex-col items-center py-20">
          <CircularProgress size={34} />
          <p className="text-gray-400 text-sm mt-3">게시글을 불러오는 중입니다...</p>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Alert severity="error" sx={{ borderRadius: '10px' }}>{error}</Alert>
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200
                       text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon sx={{ fontSize: 18 }} /> 목록으로
          </button>
        </div>
      </Page>
    );
  }

  if (!notice) {
    return (
      <Page>
        <div className="text-center py-16">
          <p className="text-gray-800 font-semibold text-lg mb-6">게시글을 찾을 수 없습니다</p>
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-red-600
                       text-sm font-bold text-white hover:bg-red-700 transition-colors"
          >
            목록으로 돌아가기
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      {/* ── 브레드크럼 ── */}
      <Breadcrumb label="공지사항" />

      {/* ── 제목 헤더 ── */}
      <div className="border-b border-gray-200 pb-6 mb-8">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
          {getCategoryDisplayName(notice.category)}
        </span>

        <h1 className="text-2xl sm:text-3xl md:text-[2rem] font-black text-gray-900 leading-snug break-keep mt-3 mb-4">
          {notice.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <PersonIcon sx={{ fontSize: 15 }} />
            {notice.authorName}
          </span>
          <span className="flex items-center gap-1">
            <CalendarIcon sx={{ fontSize: 15 }} />
            {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div className="text-[15px] sm:text-base text-gray-700 leading-[1.9] whitespace-pre-wrap break-keep min-h-[160px] mb-10">
        {notice.content}
      </div>

      {/* ── 액션 버튼 ── */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-t border-gray-100 pt-6">
        <button
          type="button"
          onClick={handleGoBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200
                     text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftIcon sx={{ fontSize: 18 }} /> 목록으로
        </button>

        {canEditDelete && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200
                         text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <EditIcon sx={{ fontSize: 17 }} /> 수정
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-red-200
                         text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <DeleteIcon sx={{ fontSize: 17 }} /> 삭제
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          게시글 삭제
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            정말로 이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              borderColor: '#d1d5db',
              color: '#6b7280',
              '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            autoFocus
            sx={{
              borderRadius: '8px',
              backgroundColor: '#DC2626',
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#B91C1C', boxShadow: 'none' },
            }}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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
    </Page>
  );
};

export default PostView;
