import React, { useEffect, useState } from "react";
import {
  Box, Typography, Tabs, Tab, TextField, Table, TableHead, TableRow,
  TableCell, TableBody, Chip, Pagination, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, TableContainer, Paper
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { getPostList, getPostDetail } from "../../../api/qaboardApi";
import { createResponse, updateResponse } from "../../../api/adminResponseApi"; 
import { useNavigate, useLocation, NavLink } from "react-router-dom";

const Inquirie = () => {

  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();

  const [posts, setPosts] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedPost, setSelectedPost] = useState(null);
  const [open, setOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [answerContent, setAnswerContent] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  const handleTabChange = (event, newValue) => {
    navigate(newValue);
    setCurrentPage(1);
  };

  const handlePageChange = (e, value) => setCurrentPage(value);
  const handleSearchChange = (e) => setSearchKeyword(e.target.value);

  const fetchInquiries = async () => {
    if (location.pathname === '/admin/inquirie') {
      setIsLoading(true);
      try {
        const response = await getPostList({ page: currentPage - 1, size: 10, keyword: searchKeyword }, {}, true);
        setPosts(response.content);
        setTotalPages(response.totalPages);
      } catch (error) {
        console.error(error);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [currentPage, location.pathname, searchKeyword]);

  const handleView = async (postId) => {
    setDetailLoading(true);
    try {
      const data = await getPostDetail(postId);
      setSelectedPost(data);

      if (data.adminResponse) {
        setAnswerContent(data.adminResponse.content);
        setIsEditMode(true);
      } else {
        setAnswerContent("");
        setIsEditMode(false);
      }

      setOpen(true);
    } catch (e) {
      alert("조회 실패");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPost(null);
    setAnswerContent("");
    setIsEditMode(false);
  };

  const handleSaveAnswer = async () => {
    if (!answerContent.trim()) {
      alert("답변을 입력하세요");
      return;
    }

    try {
      if (isEditMode) {
        await updateResponse(selectedPost.postId, { content: answerContent });
        alert("답변 수정 완료");
      } else {
        await createResponse(selectedPost.postId, { content: answerContent });
        alert("답변 등록 완료");
      }

      handleClose();
      fetchInquiries(); 

    } catch (e) {
      alert("답변 저장 실패");
    }
  };

  const authorTypeMap = {
    MEMBER: "화주",
    CARGO: "차주",
    ADMIN: "관리자",
  };

  const textInputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "#ffffff",
      "& fieldset": { borderColor: "#e2e8f0" },
      "&:hover fieldset": { borderColor: "#cbd5e1" },
      "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "2px" },
    }
  };

  const tableCardStyle = {
    p: 0,
    borderRadius: "20px",
    backgroundColor: "#ffffff",
    border: "1px solid #f1f5f9",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.02)",
    overflow: "hidden"
  };

  return (
    /* 🟢 [가려짐 버그 원천 차단] pb 마진 패딩을 100px 추가해서 하단 탭 바 위로 페이지네이션 컴포넌트를 강제 견인 */
    <Box flexGrow={1} p={{ xs: 2.5, md: 5 }} pb={{ xs: "100px", md: 5 }} sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>
      
      {/* 상단 레이아웃 서치 영역: MemberOwner 대칭 컨트롤러 스택 */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2.5} mb={4}>
        <Box minWidth={0} sx={{ width: '100%' }}>
          <Typography variant="h4" fontWeight="900" color="#0f172a" letterSpacing="-0.5px" mb={2} sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }, textAlign: { xs: 'center', md: 'left' } }}>
                                 공지/문의 관리
                              </Typography>
          <Tabs 
                      value={location.pathname} 
                        onChange={handleTabChange}
                        textColor="primary"
                        indicatorColor="primary"
                        // 🟢 [핵심] variant를 삭제하고 대신 아래와 같이 배치하면 
                        // 쏠림 없이 전체 영역을 균등하게 차지합니다.
                        variant="fullWidth" 
                        sx={{ 
                          maxWidth: '100%',
                          "& .MuiTabs-indicator": { bgcolor: "#2563eb", height: "3px", borderRadius: "3px" }, 
                          "& .MuiTab-root": { 
                            fontWeight: "bold", 
                            color: "#64748b", 
                            fontSize: { xs: "0.75rem", sm: "0.95rem" }, // 모바일에서는 폰트 크기를 살짝 줄여서 한 줄 유지
                            minWidth: 0, 
                            px: { xs: 0, sm: 2 },
                            whiteSpace: "nowrap" // 👈 [중요] 글자가 무조건 한 줄로 나오게 강제
                          },
                          "& .MuiTab-root.Mui-selected": { color: "#2563eb" }
                        }}
                      >
            <Tab label="공지사항" value="/admin/notice" component={NavLink} to="/admin/notice" />
            <Tab label="문의사항" value="/admin/inquirie" component={NavLink} to="/admin/inquirie" />
          </Tabs>
        </Box>
      </Box>

      <TextField
        variant="outlined"
        placeholder="검색어 입력"
        size="small"
        value={searchKeyword}
        onChange={handleSearchChange}
        sx={{ width: { xs: '100%', md: 240 }, ...textInputStyle, mb: 2.5 }}
        InputProps={{
          startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: "#2563eb" }} />, 
        }}
      />

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={300} sx={{ color: "#2563eb" }}>
          <CircularProgress color="inherit" />
        </Box>
      ) : (
        <>
          {/* 📱 1. 모바일 전용 문의사항 가변 카드 리스트 구역 (md 미만 해상도 로테이션 노출) */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {posts && posts.length > 0 ? (
              posts.map(post => (
                <Paper
                  key={post.postId}
                  elevation={0}
                  onClick={() => handleView(post.postId)}
                  sx={{
                    p: 2.5,
                    mb: 2,
                    borderRadius: "20px",
                    border: "1px solid #f1f5f9",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.01)",
                    cursor: "pointer",
                    transition: 'background-color 0.2s',
                    minWidth: 0,
                    '&:hover': { bgcolor: '#f8fafc' }
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1.5} gap={1.5}>
                    <Typography variant="subtitle1" fontWeight="800" color="#0f172a" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                      {post.title}
                    </Typography>
                    <Typography variant="caption" color="#94a3b8" fontWeight="600" sx={{ flexShrink: 0 }}>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="body2" color="#334155" fontWeight="600">
                      <span style={{ color: '#94a3b8', marginRight: '6px', fontWeight: 'bold' }}>작성자</span>
                      {post.authorName}
                    </Typography>
                    <Box component="span" sx={{ px: 1, py: 0.3, borderRadius: "6px", fontSize: "0.75rem", fontWeight: "bold", bgcolor: post.authorType === 'MEMBER' ? '#f0fdf4' : '#fff7ed', color: post.authorType === 'MEMBER' ? '#16a34a' : '#ea580c' }}>
                      {authorTypeMap[post.authorType]}
                    </Box>
                  </Box>

                  <Box pt={1.5} display="flex" justifyContent="space-between" alignItems="center" sx={{ borderTop: "1px dashed #f1f5f9" }}>
                    <Typography variant="body2" color="#475569" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      {post.content}
                    </Typography>
                    
                    <Chip 
                      label={post.hasResponse ? "답변완료" : "대기"} 
                      size="small"
                      style={{
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        backgroundColor: post.hasResponse ? '#eff6ff' : '#f1f5f9',
                        color: post.hasResponse ? '#2563eb' : '#64748b'
                      }} 
                    />
                  </Box>
                </Paper>
              ))
            ) : (
              <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: "20px", border: "1px solid #f1f5f9" }}>
                <Typography color="#94a3b8" fontWeight="500">접수된 문의사항 데이터가 존재하지 않습니다.</Typography>
              </Paper>
            )}
          </Box>

          {/* 💻 2. 데스크톱용 와이드 테이블 구역 (md 이상 PC 전트 노출) */}
          <TableContainer component={Paper} elevation={0} sx={{ ...tableCardStyle, display: { xs: 'none', md: 'block' } }}>
            <Table sx={{ minWidth: 800, '& .MuiTableCell-root': { height: 54 } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>이름</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>제목</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>내용</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>구분</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>작성일</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }} align="center">상태</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {posts.map(post => (
                  <TableRow key={post.postId} onClick={() => handleView(post.postId)} sx={{ cursor: "pointer", '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ color: '#334155', fontWeight: 600 }}>{post.authorName}</TableCell>
                    <TableCell sx={{ color: '#000000', fontWeight: 700 }}>{post.title}</TableCell> 
                    <TableCell sx={{ color: '#475569' }}>{post.content.substring(0, 20)}...</TableCell>
                    <TableCell sx={{ color: '#475569' }}>
                      <Box component="span" sx={{ px: 1, py: 0.3, borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold", bgcolor: post.authorType === 'MEMBER' ? '#f0fdf4' : '#fff7ed', color: post.authorType === 'MEMBER' ? '#16a34a' : '#ea580c' }}>
                        {authorTypeMap[post.authorType]}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={post.hasResponse ? "답변완료" : "대기"} 
                        size="small"
                        style={{
                          fontWeight: 'bold',
                          borderRadius: '8px',
                          backgroundColor: post.hasResponse ? '#eff6ff' : '#f1f5f9',
                          color: post.hasResponse ? '#2563eb' : '#64748b'
                        }} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* 하단 페이지네이션 구역: 바닥 보정 패딩 덕분에 모바일 탭 바 위로 가림 없이 자동 세팅 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination 
          count={totalPages} 
          page={currentPage} 
          onChange={handlePageChange} 
          color="primary"
          size="medium"
          sx={{
            "& .MuiPaginationItem-root": { fontWeight: "bold", color: "#475569" },
            "& .MuiPaginationItem-root.Mui-selected": { bgcolor: "#2563eb", color: "#ffffff", "&:hover": { bgcolor: "#1d4ed8" } }
          }}
        />
      </Box>

      {/* 🟢 [답변 팝업창 세로 압축 패치 완료] maxHeight 제한 조건 부여로 모바일 환경 액정 탈출 짤림 원천 봉쇄 */}
      {selectedPost && (
        <Dialog 
          open={open} 
          onClose={handleClose} 
          fullWidth 
          maxWidth="xs" 
          PaperProps={{ 
            sx: { 
              borderRadius: "28px", 
              p: 1,
              width: "calc(100% - 32px)", 
              mx: "auto",
              maxHeight: { xs: "72vh", sm: "85vh" }, // 👈 창 높이가 액정을 절대 넘지 못하도록 72% 한계선 락(Lock) 결합
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)"
            } 
          }}
        >
          <DialogTitle sx={{ fontWeight: "900", fontSize: "1.35rem", color: "#0f172a", pt: 3, px: { xs: 2.5, sm: 3.5 }, pb: 1, letterSpacing: "-0.5px", textAlign: "center", flexShrink: 0 }}>
            {selectedPost.title}
          </DialogTitle>

          {/* 내부 본문 & 답변 인풋 영역만 유기적 스크롤 회전 */}
          <DialogContent dividers sx={{ borderColor: "#f1f5f9", px: { xs: 2.5, sm: 3.5 }, py: 2.5, overflowY: "auto", flex: "1 1 auto" }}>
            <Box sx={{ mb: 2.5, bgcolor: "#f8fafc", p: 2, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <Typography variant="body2" color="#475569" fontWeight="600">
                <span style={{ color: "#94a3b8", marginRight: "10px" }}>작성자:</span><span style={{ color: "#334155" }}>{selectedPost.authorName}</span>
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: "bold", color: "#1e293b" }}>문의 내용</Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: "12px", borderColor: "#cbd5e1", whiteSpace: "pre-wrap", minHeight: "80px", bgcolor: "#ffffff", fontSize: "0.95rem", color: "#334155", lineHeight: 1.6 }}>
              {selectedPost.content}
            </Paper>

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle2" fontWeight="900" color="#2563eb" mb={1}>✍️ 관리자 답변 서식</Typography>
              <TextField
                fullWidth
                multiline
                rows={4} // 세로 압축을 위해 줄 수 한 단계 스케일 다운
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder="답변 내용을 작성해 주세요."
                sx={textInputStyle}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 1.5, justifyContent: "center", flexShrink: 0 }}>
            <Button onClick={handleClose} sx={{ color: "#64748b", fontWeight: "bold", px: 3 }}>닫기</Button>
            <Button variant="contained" disableElevation onClick={handleSaveAnswer} sx={{ borderRadius: "10px", px: 3, fontWeight: "bold", bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>
              {isEditMode ? "수정완료" : "등록완료"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box> 
  );
};

export default Inquirie;