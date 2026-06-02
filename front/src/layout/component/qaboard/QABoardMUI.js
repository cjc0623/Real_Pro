import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../../../slice/loginSlice';
import * as qaboardApi from '../../../api/qaboardApi';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Pagination,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search,
  Person,
  CalendarToday,
  ExpandMore,
  Lock
} from '@mui/icons-material';

import AdminResponseForm from './AdminResponseForm';
import AdminResponseEditForm from './AdminResponseEditForm';
import QAActionButtons from './QAActionButtons';
import QAEditForm from './QAEditForm';
import useCustomLogin from '../../../hooks/useCustomLogin';
import { getPostVisibility, getActionPermissions } from './qaPermissionUtils';
import Breadcrumb from '../../../components/Breadcrumb';

const SECURITY_SAFE_REGEX = /[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣\s.,?!/]/g;

const QABoardMUI = () => {
  const dispatch = useDispatch();
  const { isAdmin, currentUserId, loginState } = useCustomLogin();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isNewInquiryOpen, setIsNewInquiryOpen] = useState(false);
  const [newInquiry, setNewInquiry] = useState({
    title: '',
    content: '',
    category: '',
    isPrivate: false
  });
  const [expandedPosts, setExpandedPosts] = useState(new Set());

  const [editingItemId, setEditingItemId] = useState(null);
  const [replyingToId, setReplyingToId] = useState(null);
  const [editingResponseId, setEditingResponseId] = useState(null);
  const [qaData, setQaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const ITEMS_PER_PAGE = 4;

  const createUserInfo = (defaultUserName = '익명') => ({
    userId: currentUserId || loginState.memberId || 'anonymous',
    userName: loginState.nickname || defaultUserName
  });

  const categories = [
    { id: 'all', name: '전체' },
    { id: 'general', name: '일반문의' },
    { id: 'technical', name: '기술지원' },
    { id: 'billing', name: '결제/요금' },
    { id: 'service', name: '서비스이용' },
    { id: 'etc', name: '기타' }
  ];

  const handleNewInquiryChange = (field) => (e) => {
    let value = field === 'isPrivate' ? e.target.checked : e.target.value;

    if (field === 'title' || field === 'content') {
      value = value.replace(SECURITY_SAFE_REGEX, '');
    }

    setNewInquiry(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearchChange = (e) => {
    const sanitizedValue = e.target.value.replace(SECURITY_SAFE_REGEX, '');
    setSearchTerm(sanitizedValue);
  };

  const fetchPostList = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        category: activeCategory,
        keyword: searchTerm,
        page: currentPage - 1,
        size: ITEMS_PER_PAGE
      };

      const userInfo = createUserInfo();
      const response = await qaboardApi.getPostList(params, userInfo);

      const transformedData = response.content.map(item => ({
        id: item.postId,
        title: item.title,
        content: item.content || '',
        author: item.authorId || item.authorName || '익명',
        authorId: item.authorId || '',
        authorType: item.authorType,
        category: item.category,
        date: item.createdAt ? item.createdAt.split('T')[0] : '',
        status: item.hasResponse ? 'answered' : 'pending',
        views: item.viewCount || 0,
        isPrivate: item.isPrivate,
        adminResponse: item.adminResponse
          ? {
              content: item.adminResponse.content,
              author: item.adminResponse.adminId || item.adminResponse.adminName || '관리자',
              date: item.adminResponse.createdAt ? item.adminResponse.createdAt.split('T')[0] : ''
            }
          : null
      }));

      setQaData(transformedData);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Failed to fetch post list:', error);

      let errorMessage = '게시글을 불러오는 중 오류가 발생했습니다.';

      if (error.response && error.response.status === 403) {
        errorMessage = '게시글 조회 권한이 없습니다.';
      } else if (error.response && error.response.status >= 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }

      setError(errorMessage);
      setQaData([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostList();
  }, [activeCategory, searchTerm, currentPage]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'answered':
        return { backgroundColor: '#e8f5e8', color: '#2e7d32' };
      case 'pending':
        return { backgroundColor: '#fff3e0', color: '#f57c00' };
      case 'resolved':
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
      default:
        return { backgroundColor: '#f5f5f5', color: '#424242' };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'answered':
        return '답변완료';
      case 'pending':
        return '답변대기';
      case 'resolved':
        return '해결완료';
      default:
        return '미분류';
    }
  };

  const togglePostExpansion = async (postId) => {
    const newExpanded = new Set(expandedPosts);

    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      try {
        const userInfo = createUserInfo();
        const postDetail = await qaboardApi.getPostDetail(postId, userInfo);

        setQaData(prevData =>
          prevData.map(post =>
            post.id === postId
              ? {
                  ...post,
                  content: postDetail.content,
                  views: postDetail.viewCount,
                  adminResponse: postDetail.adminResponse
                    ? {
                        content: postDetail.adminResponse.content,
                        author: postDetail.adminResponse.adminName,
                        date: postDetail.adminResponse.createdAt?.split('T')[0]
                      }
                    : null,
                  status: postDetail.hasResponse ? 'answered' : 'pending'
                }
              : post
          )
        );
      } catch (error) {
        console.error('상세 조회 실패:', error);
      }

      newExpanded.add(postId);
    }

    setExpandedPosts(newExpanded);
  };

  const handleSubmitInquiry = async () => {
    try {
      const postData = {
        title: newInquiry.title,
        content: newInquiry.content,
        category: newInquiry.category,
        isPrivate: newInquiry.isPrivate
      };

      const userInfo = createUserInfo();

      await qaboardApi.createPost(postData, userInfo);

      setIsNewInquiryOpen(false);
      setNewInquiry({
        title: '',
        content: '',
        category: '',
        isPrivate: false
      });
      fetchPostList();
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('게시글 작성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleEdit = (itemId) => {
    setEditingItemId(itemId);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const userInfo = createUserInfo('사용자');
        await qaboardApi.deletePost(itemId, userInfo);
        fetchPostList();
      } catch (error) {
        console.error('Failed to delete post:', error);
        alert('게시글 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleReply = (itemId) => {
    setReplyingToId(itemId);
  };

  const handleAdminEdit = (itemId) => {
    if (window.confirm('관리자 권한으로 이 게시글을 수정하시겠습니까?')) {
      setEditingItemId(itemId);
    }
  };

  const handleAdminDelete = async (itemId) => {
    if (window.confirm('관리자 권한으로 이 게시글을 삭제하시겠습니까?\n삭제된 게시글은 복구할 수 없습니다.')) {
      try {
        const userInfo = createUserInfo('관리자');
        await qaboardApi.deletePost(itemId, userInfo);
        fetchPostList();
      } catch (error) {
        console.error('Failed to delete post by admin:', error);
        alert('게시글 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleEditResponse = (itemId) => {
    setEditingResponseId(itemId);
  };

  const handleSaveResponseEdit = async (itemId, updatedResponse) => {
    try {
      const userInfo = createUserInfo('관리자');
      await qaboardApi.updateAdminResponse(itemId, updatedResponse, userInfo);

      await fetchPostList();

      const newExpanded = new Set(expandedPosts);
      newExpanded.add(itemId);
      setExpandedPosts(newExpanded);

      setEditingResponseId(null);
      alert('답변이 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('Failed to update admin response:', error);
      alert('답변 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancelResponseEdit = () => {
    setEditingResponseId(null);
  };

  const handleSaveEdit = async (updatedItem) => {
    try {
      const userInfo = createUserInfo();

      const updateData = {
        title: updatedItem.title,
        content: updatedItem.content,
        category: updatedItem.category,
        isPrivate: updatedItem.isPrivate
      };

      await qaboardApi.updatePost(updatedItem.id, updateData, userInfo);
      fetchPostList();
      setEditingItemId(null);
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('게시글 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  const handleSubmitAdminResponse = async (responseData) => {
    try {
      const userInfo = createUserInfo('관리자');
      await qaboardApi.createAdminResponse(responseData.questionId, responseData, userInfo);

      await fetchPostList();

      const newExpanded = new Set(expandedPosts);
      newExpanded.add(responseData.questionId);
      setExpandedPosts(newExpanded);

      setReplyingToId(null);
      alert('답변이 성공적으로 등록되었습니다.');
    } catch (error) {
      console.error('Failed to create admin response:', error);
      alert('답변 작성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancelAdminResponse = () => {
    setReplyingToId(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-32 sm:py-12 font-sans">

      {/* ── 브레드크럼 ── */}
      <Breadcrumb label="문의사항" />

      {/* ── 페이지 제목 ── */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-2">
          고객지원
        </h1>
        <p className="text-gray-400 text-sm sm:text-base break-keep">
          궁금한 사항이 있으시면 언제든 문의해주세요
        </p>
      </div>

      {/* ── 카테고리 탭 — 가로 스크롤 + 밑줄 스타일 ── */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex justify-center overflow-x-auto
                        [&::-webkit-scrollbar]:hidden
                        [-ms-overflow-style:none]
                        [scrollbar-width:none]">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`
                px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-medium
                transition-all border-b-2 -mb-px whitespace-nowrap flex-shrink-0
                ${activeCategory === cat.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── 검색바 + 새 문의 버튼 — 높이 통일 48px ── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          mb: 5,
        }}
      >
        <TextField
          fullWidth
          placeholder="궁금한 내용을 검색해보세요..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#9ca3af', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              height: 48,
            },
          }}
        />
        <Button
          variant="contained"
          onClick={() => setIsNewInquiryOpen(true)}
          sx={{
            flexShrink: 0,
            minWidth: { xs: '100%', sm: 160 },
            height: 48,
            borderRadius: '10px',
            backgroundColor: '#DC2626',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: 'none',
            whiteSpace: 'nowrap',
            '&:hover': {
              backgroundColor: '#B91C1C',
              boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
            },
          }}
        >
          새 문의 작성하기
        </Button>
      </Box>

      {/* ── Q&A 목록 ── */}
      {loading ? (
        <div className="flex flex-col items-center py-16">
          <CircularProgress size={34} />
          <p className="text-gray-400 text-sm mt-3">게시글을 불러오는 중입니다...</p>
        </div>
      ) : (
        /* 외곽 컨테이너: 단일 border + 둥근 모서리 */
        <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
          {qaData.map((item) => {
            const visibility  = getPostVisibility(item, isAdmin, currentUserId);
            const permissions = getActionPermissions(item, isAdmin, currentUserId);
            const isExpanded        = expandedPosts.has(item.id);
            const isEditing         = editingItemId    === item.id;
            const isReplying        = replyingToId     === item.id;
            const isEditingResponse = editingResponseId === item.id;

            return (
              /* 항목 wrapper: 하단 구분선만 */
              <div key={item.id} className="border-b border-gray-100 last:border-b-0">

                {/* 수정 폼 */}
                {isEditing && (
                  <QAEditForm
                    item={item}
                    categories={categories}
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                    isVisible={true}
                  />
                )}

                {/* 아코디언 카드 */}
                {!isEditing && (
                  <div
                    className={`cursor-pointer transition-colors duration-150
                      ${isExpanded ? 'bg-gray-50/70' : 'bg-white hover:bg-gray-50'}`}
                    onClick={(e) => { e.preventDefault(); togglePostExpansion(item.id); }}
                  >
                    {/* ── 헤더 행 ── */}
                    <div className="flex items-start justify-between px-4 sm:px-6 py-4 sm:py-5">
                      <div className="flex-1 min-w-0 pr-3">
                        {/* 뱃지 행 */}
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={getStatusColor(item.status)}
                          >
                            {getStatusText(item.status)}
                          </span>

                          {item.isPrivate && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium border border-gray-200 text-gray-500">
                              <Lock sx={{ fontSize: 11 }} /> 비공개
                            </span>
                          )}

                          <span className="text-xs text-gray-400">
                            {categories.find(c => c.id === item.category)?.name}
                          </span>
                        </div>

                        {/* 제목 */}
                        <p className="text-sm sm:text-base font-medium text-gray-800 leading-snug break-keep">
                          {visibility.displayTitle}
                        </p>
                      </div>

                      {/* 펼치기 화살표 */}
                      <ExpandMore
                        sx={{
                          flexShrink: 0,
                          color: '#9ca3af',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s',
                        }}
                      />
                    </div>

                    {/* ── 펼쳐진 내용 ── */}
                    {isExpanded && (
                      <div
                        className="border-t border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* 본문 */}
                        <div className="px-4 sm:px-6 py-4">
                          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {visibility.showContent ? item.content : '비공개 글입니다.'}
                          </p>
                        </div>

                        {/* 관리자 답변 */}
                        {visibility.showContent && item.adminResponse && (
                          <div className="px-4 sm:px-6 pb-4">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-semibold" style={{ color: '#111827' }}>
                                  {item.adminResponse.author}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {item.adminResponse.date}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {item.adminResponse.content}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 메타 정보 */}
                        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-100">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Person sx={{ fontSize: 13 }} />
                              {item.author}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <CalendarToday sx={{ fontSize: 13 }} />
                              {item.date}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">조회 {item.views}</span>
                        </div>

                        {/* 액션 버튼 */}
                        <QAActionButtons
                          item={item}
                          isAdmin={isAdmin}
                          isAuthor={permissions.canEdit}
                          currentUserId={currentUserId}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onReply={handleReply}
                          onAdminEdit={handleAdminEdit}
                          onAdminDelete={handleAdminDelete}
                          onEditResponse={handleEditResponse}
                          isExpanded={isExpanded}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 관리자 답변 작성 폼 */}
                {isReplying && (
                  <AdminResponseForm
                    questionId={item.id}
                    onSubmit={handleSubmitAdminResponse}
                    onCancel={handleCancelAdminResponse}
                    isVisible={true}
                  />
                )}

                {/* 관리자 답변 수정 폼 */}
                {isEditingResponse && (
                  <AdminResponseEditForm
                    item={item}
                    onSubmit={handleSaveResponseEdit}
                    onCancel={handleCancelResponseEdit}
                    isVisible={true}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── 에러 상태 ── */}
      {!loading && error && (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4 text-sm">{error}</p>
          <Button
            variant="outlined"
            onClick={fetchPostList}
            sx={{ borderRadius: '8px', textTransform: 'none', borderColor: '#d1d5db', color: '#6b7280' }}
          >
            다시 시도
          </Button>
        </div>
      )}

      {/* ── 빈 상태 ── */}
      {!loading && !error && qaData.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-800 font-semibold text-lg mb-2">게시글이 없습니다</p>
          <p className="text-gray-400 text-sm mb-6">
            {searchTerm ? '검색 조건에 맞는 게시글이 없습니다.' : '첫 번째 질문을 작성해보세요!'}
          </p>
          {!searchTerm && (
            <Button
              variant="contained"
              onClick={() => setIsNewInquiryOpen(true)}
              sx={{
                borderRadius: '10px',
                backgroundColor: '#DC2626',
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: 'none',
                '&:hover': { backgroundColor: '#B91C1C' },
              }}
            >
              첫 질문 작성하기
            </Button>
          )}
        </div>
      )}

      {/* ── 페이지네이션 ── */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(event, value) => { setCurrentPage(value); setExpandedPosts(new Set()); }}
            color="primary"
            size={isMobile ? "small" : "medium"}
            sx={{
              "& .MuiPaginationItem-root": { fontWeight: "bold", color: "#475569", borderRadius: "8px" },
              "& .MuiPaginationItem-root.Mui-selected": { bgcolor: "#2563eb", color: "#ffffff", "&:hover": { bgcolor: "#1d4ed8" } }
            }}
          />
        </Box>
      )}

      {/* ── 새 문의 작성 Dialog ── */}
      <Dialog
        open={isNewInquiryOpen}
        onClose={() => setIsNewInquiryOpen(false)}
        maxWidth="sm"
        fullWidth
        disableRestoreFocus={false}
        keepMounted={false}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '18px' }}>새 문의 작성</DialogTitle>

        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="제목"
              fullWidth
              value={newInquiry.title}
              onChange={handleNewInquiryChange('title')}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <FormControl fullWidth>
              <InputLabel>카테고리</InputLabel>
              <Select
                value={newInquiry.category}
                label="카테고리"
                onChange={handleNewInquiryChange('category')}
                sx={{ borderRadius: '10px' }}
              >
                {categories.filter(c => c.id !== 'all').map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="내용"
              multiline
              rows={4}
              fullWidth
              value={newInquiry.content}
              onChange={handleNewInquiryChange('content')}
              placeholder="문의 내용을 자세히 작성해주세요"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={newInquiry.isPrivate}
                  onChange={handleNewInquiryChange('isPrivate')}
                />
              }
              label="비공개 문의"
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setIsNewInquiryOpen(false)}
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
            onClick={handleSubmitInquiry}
            variant="contained"
            sx={{
              borderRadius: '8px',
              backgroundColor: '#DC2626',
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#B91C1C' },
            }}
          >
            문의 등록
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default QABoardMUI;