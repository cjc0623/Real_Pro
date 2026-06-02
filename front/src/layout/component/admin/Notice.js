import React, { useEffect, useState } from 'react';
import { getNoticeDetail, getNotices, createNotice } from '../../../api/noticeApi';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Pagination,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const Notice = () => {
  const [notices, setNotices] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedNotice, setSelectedNotice] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); 

  const fetchNotices = () => {
    getNotices({ page: page, size: 10, keyword: searchKeyword }).then(data => {
      setNotices(data.content);
      setTotalPages(data.totalPages);
    }).catch(error => {
      console.error("Error fetching notices:", error);
    });
  };

  useEffect(() => {
    fetchNotices();
  }, [page, searchKeyword, location.pathname]);

  const handleTabChange = (event, newValue) => {
    navigate(newValue);
  };

  const handlePageChange = (event, value) => {
    setPage(value - 1);
  };

  const handleSearchChange = (e) => setSearchKeyword(e.target.value);

  const handleView = (noticeId) => {
    setLoading(true);
    getNoticeDetail(noticeId).then(data => {
      setSelectedNotice(data);
      setOpen(true);
      setLoading(false);
    }).catch(error => {
      console.error("Error fetching notice detail:", error);
      alert("공지사항을 불러오는 데 실패했습니다.");
      setLoading(false);
    });
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedNotice(null);
  };
  const handleWriteClose = () => {
    setWriteOpen(false);
    setNoticeTitle("");
    setNoticeContent("");
  };

  const handleCreateNotice = async () => {
    if (!noticeTitle.trim()) {
      alert("제목을 입력하세요.");
      return;
    }

    if (!noticeContent.trim()) {
      alert("내용을 입력하세요.");
      return;
    }

    try {
      await createNotice({
        title: noticeTitle,
        content: noticeContent,
      });

      alert("공지사항이 등록되었습니다.");
      handleWriteClose();
      setPage(0);
      fetchNotices();
    } catch (error) {
      console.error("Error creating notice:", error);
      alert("공지사항 등록에 실패했습니다.");
    }
  };

  // 공통 둥글둥글 고급 입력창 스킨 정의
  const textInputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "#ffffff",
      "& fieldset": { borderColor: "#e2e8f0" },
      "&:hover fieldset": { borderColor: "#cbd5e1" },
      "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "2px" },
    }
  };

  // 공통 둥글둥글 고급 테이블 카드 프레임 설정
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
      
      {/* 상단 레이아웃 타이틀 & 탭바 제어 컨테이너 프레임 */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2.5} mb={3}>
        <Box minWidth={0} sx={{ width: '100%' }}>
          <Typography variant="h4" fontWeight="900" color="#0f172a" letterSpacing="-0.5px" mb={2} sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }, textAlign: { xs: 'center', md: 'left' } }}>
            공지/문의 관리
          </Typography>
          <Tabs 
            value={location.pathname} 
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            variant="fullWidth" 
            sx={{
              maxWidth: '100%',
              "& .MuiTabs-indicator": { bgcolor: "#2563eb", height: "3px", borderRadius: "3px" }, 
              "& .MuiTab-root": { 
                fontWeight: "bold", 
                color: "#64748b", 
                fontSize: { xs: "0.75rem", sm: "0.95rem" }, 
                minWidth: 0,
                px: { xs: 0, sm: 2 },
                whiteSpace: "nowrap" 
              },
              "& .MuiTab-root.Mui-selected": { color: "#2563eb" }
            }}
          >
            <Tab label="공지사항" value="/admin/notice" component={NavLink} to="/admin/notice" />
            <Tab label="문의사항" value="/admin/inquirie" component={NavLink} to="/admin/inquirie" />
          </Tabs>
        </Box>
      </Box>

      {/* 🟢 [디자인 대개편 핵심] 검색창 바로 우측에 작성 버튼을 나란히 평행 결착 구동 */}
      <Box 
        display="flex" 
        gap={1.5} 
        alignItems="center"
        flexDirection={{ xs: 'column', sm: 'row' }} // 모바일 스마트폰 환경에서는 수직 유연 정렬 자동 전환
        sx={{ width: '100%', mb: 4 }}
      >
        <TextField
          variant="outlined"
          placeholder="Search"
          size="small"
          value={searchKeyword}
          onChange={handleSearchChange}
          sx={{ width: { xs: '100%', sm: 240 }, ...textInputStyle }} // 데스크톱 규격 폭 단단히 고정
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: "#2563eb" }} />, 
          }}
        />

        <Button
          variant="contained"
          disableElevation
          onClick={() => setWriteOpen(true)}
          sx={{ 
            py: 1, 
            px: 2.5, 
            borderRadius: "12px", 
            fontWeight: "bold", 
            bgcolor: "#2563eb", 
            width: { xs: '100%', sm: 'auto' }, // 모바일은 꽉 차게, PC 환경에선 검색바 우측 옆에 예쁜 핏으로 밀착
            height: 40, // 👈 TextField size="small" 규격 높이와 완벽한 수평선 평행 일치 매칭
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            "&:hover": { bgcolor: "#1d4ed8" } 
          }} 
        >
          공지사항 작성
        </Button>
      </Box>

      {/* 메인 데이터 보드 분기 트랙 */}
      {/* 📱 1. 모바일 전용 공지사항 가변 카드 리스트 뷰 구역 */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {notices && notices.length > 0 ? (
          notices.map((notice) => (
            <Paper
              key={notice.noticeId}
              elevation={0}
              onClick={() => handleView(notice.noticeId)}
              sx={{
                p: 2.5,
                mb: 2,
                borderRadius: "20px",
                border: "1px solid #f1f5f9",
                backgroundColor: "#ffffff",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.01)",
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                minWidth: 0,
                '&:hover': { bgcolor: '#f8fafc' }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1.5} gap={1.5}>
                <Typography variant="subtitle1" fontWeight="800" color="#0f172a" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                  {notice.title}
                </Typography>
                <Typography variant="caption" color="#94a3b8" fontWeight="600" sx={{ flexShrink: 0 }}>
                  {new Date(notice.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="#475569" fontWeight="500">
                  <span style={{ color: '#94a3b8', marginRight: '6px', fontWeight: 'bold' }}>작성자</span>
                  {notice.authorName}
                </Typography>
                <Typography variant="body2" color="#64748b" fontWeight="500">
                  <span style={{ color: '#94a3b8', marginRight: '4px' }}>조회수</span> {notice.viewCount}
                </Typography>
              </Box>
            </Paper>
          ))
        ) : (
          <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: "20px", border: "1px solid #f1f5f9" }}>
            <Typography color="#94a3b8" fontWeight="500">등록된 공지사항 데이터가 존재하지 않습니다.</Typography>
          </Paper>
        )}
      </Box>

      {/* 💻 2. 데스크톱용 와이드 테이블 구역 */}
      <TableContainer component={Paper} elevation={0} sx={{ ...tableCardStyle, display: { xs: 'none', md: 'block' } }}>
        <Table sx={{ minWidth: 600, '& .MuiTableCell-root': { height: 54 } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>작성자</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>작성일</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.8 }}>조회수</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notices.map((notice) => (
              <TableRow
                key={notice.noticeId}
                onClick={() => handleView(notice.noticeId)}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f8fafc' } }}
              >
                <TableCell sx={{ color: '#000000', fontWeight: 700 }}> 
                  {notice.title}
                </TableCell>
                <TableCell sx={{ color: '#334155', fontWeight: 500 }}>{notice.authorName}</TableCell>
                <TableCell sx={{ color: '#64748b' }}>{new Date(notice.createdAt).toLocaleDateString()}</TableCell>
                <TableCell sx={{ color: '#475569' }}>{notice.viewCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 하단 페이지네이션 구역 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <Pagination
          count={totalPages}
          page={page + 1}
          onChange={handlePageChange}
          color="primary"
          size={isMobile ? "small" : "medium"}
          sx={{
            "& .MuiPaginationItem-root": { fontWeight: "bold", color: "#475569", borderRadius: "8px" },
            "& .MuiPaginationItem-root.Mui-selected": { bgcolor: "#2563eb", color: "#ffffff", "&:hover": { bgcolor: "#1d4ed8" } }
          }}
        />
      </Box>

      {/* 공지 상세 모달 다이얼로그 */}
      {selectedNotice && (
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
              maxHeight: { xs: "72vh", sm: "80vh" }, 
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)"
            } 
          }}
        >
          <DialogTitle sx={{ fontWeight: "900", fontSize: "1.35rem", color: "#0f172a", pt: 3, px: { xs: 2.5, sm: 3.5 }, pb: 1, letterSpacing: "-0.5px", textAlign: "center", flexShrink: 0 }}>
            {selectedNotice.title}
          </DialogTitle>
          
          <DialogContent dividers sx={{ borderColor: "#f1f5f9", px: { xs: 2.5, sm: 3.5 }, py: 2.5, overflowY: "auto", flex: "1 1 auto" }}>
            <Box sx={{ mb: 3, bgcolor: "#f8fafc", p: 2, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <Typography variant="body2" color="#64748b" fontWeight="600" sx={{ lineHeight: 1.7 }}>
                <span style={{ color: "#94a3b8", marginRight: "10px" }}>작성자:</span><span style={{ color: "#334155" }}>{selectedNotice.authorName}</span><br />
                <span style={{ color: "#94a3b8", marginRight: "10px" }}>작성일:</span><span style={{ color: "#334155" }}>{new Date(selectedNotice.createdAt).toLocaleString()}</span><br />
                <span style={{ color: "#94a3b8", marginRight: "10px" }}>조회수:</span><span style={{ color: "#334155" }}>{selectedNotice.viewCount}</span>
              </Typography>
            </Box>

            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: "#334155", lineHeight: 1.65, px: 0.5, fontSize: "0.95rem" }}>
              {selectedNotice.content}
            </Typography>
          </DialogContent>
          
          <DialogActions sx={{ p: 1.5, justifyContent: "center", flexShrink: 0 }}>
            <Button onClick={handleClose} sx={{ color: "#475569", fontWeight: "900", fontSize: "1rem", px: 4, py: 0.5 }}>
              닫기
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* 공지 작성 모달 다이얼로그 */}
      <Dialog open={writeOpen} onClose={handleWriteClose} fullWidth maxWidth="md" fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : "24px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: "900", color: "#0f172a" }}>✍️ 공지사항 작성</DialogTitle>

        <DialogContent dividers sx={{ borderColor: "#f1f5f9", pt: 2 }}>
          <TextField
            fullWidth
            label="제목"
            value={noticeTitle}
            onChange={(e) => setNoticeTitle(e.target.value)}
            sx={{ mb: 2.5, ...textInputStyle }}
          />

          <TextField
            fullWidth
            multiline
            rows={isMobile ? 12 : 8}
            label="내용"
            value={noticeContent}
            onChange={(e) => setNoticeContent(e.target.value)}
            sx={textInputStyle}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleWriteClose} sx={{ color: "#64748b", fontWeight: "bold" }}>취소</Button>
          <Button variant="contained" disableElevation onClick={handleCreateNotice} sx={{ borderRadius: "10px", px: 3, fontWeight: "bold", bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>
            등록완료
          </Button>
        </DialogActions>
      </Dialog>

      {loading && (
        <Dialog open={loading} PaperProps={{ sx: { borderRadius: "16px", p: 2 } }}>
          <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <CircularProgress sx={{ color: "#2563eb" }} />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default Notice;