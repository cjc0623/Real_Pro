import React, { useEffect, useMemo, useState } from "react";
import { API_SERVER_HOST } from "../../../api/serverConfig";
import {
  Box,
  Typography,
  Paper,
  Container,
  Rating,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Avatar,
  Snackbar,
  Alert,
  Pagination,
} from "@mui/material";
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import DriverProfileCard from "../common/DriverProfileCard.js";
import PageComponent from "../common/PageComponent";
import {
  getMyReviewsWithDriverId,
  getDriverDetail,
  deleteReview,
  modifyReview,
  getReviewByReviewNo,
} from "../../../api/reviewApi/reviewApi";

const DEFAULT_AVATAR = "/image/placeholders/avatar.svg";

const normalizeProfileUrl = (v) => {
  if (!v) return null;
  if (v.startsWith("http")) return v;
  if (v.startsWith("/fr/uploads/")) return `${API_SERVER_HOST}${v}`;
  return `${API_SERVER_HOST}/fr/uploads/user_profile/${encodeURIComponent(v)}`;
};

const initState = {
  dtoList: [],
  pageNumList: [],
  prev: false,
  next: false,
  totalCount: 0,
  prevPage: 0,
  nextPage: 0,
  totalPage: 0,
  current: 1,
};

const parseDateSmart = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDateTime = (v) => {
  const d = parseDateSmart(v);
  if (!d) return "-";
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
    <Typography
      component="span"
      sx={{ width: 70, flexShrink: 0, color: "text.secondary", fontSize: 13 }}
    >
      {label}
    </Typography>
    <Typography component="span" sx={{ fontSize: 13, fontWeight: 600, wordBreak: "break-all" }}>
      {value || "-"}
    </Typography>
  </Box>
);

const paginate = (data, { page, size }) => {
  const totalCount = data.length;
  const totalPage = Math.max(1, Math.ceil(totalCount / size));
  const current = Math.min(Math.max(1, page), totalPage);
  const startIdx = (current - 1) * size;
  const endIdx = startIdx + size;
  const pageData = data.slice(startIdx, endIdx);

  const startPage = Math.max(1, current - 2);
  const endPage = Math.min(totalPage, startPage + 4);
  const pageNumList = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return {
    dtoList: pageData,
    pageNumList,
    prev: current > 1,
    next: current < totalPage,
    totalCount,
    totalPage,
    prevPage: current > 1 ? current - 1 : 1,
    nextPage: current < totalPage ? current + 1 : totalPage,
    current,
  };
};

const MyReviewInform = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [allReviews, setAllReviews] = useState([]);
  const [serverData, setServerData] = useState(initState);
  const [pageParams, setPageParams] = useState({ page: 1, size: 5 });
  const [loading, setLoading] = useState(true);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [editReviewScore, setEditReviewScore] = useState(0);
  const [editReviewContent, setEditReviewContent] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteTargetReviewNo, setDeleteTargetReviewNo] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };
  const [openDriverDetailModal, setOpenDriverDetailModal] = useState(false);
  const [selectedDriverDetail, setSelectedDriverDetail] = useState(null);
  const [driverReviewSortType, setDriverReviewSortType] = useState("latest");
  const [driverReviewPage, setDriverReviewPage] = useState(1);
  const DRIVER_REVIEW_PAGE_SIZE = 3;
  const [editReviewImages, setEditReviewImages] = useState([]);
  const [deleteImageIds, setDeleteImageIds] = useState([]);
  const [newEditImages, setNewEditImages] = useState([]);

  const handleOpenDriverDetailModal = async (item) => {
    if (!item?.driverId) {
      showSnackbar("차주 식별 정보가 없습니다.", "warning");
      return;
    }

    try {
      const data = await getDriverDetail(item.driverId);
      setSelectedDriverDetail(data);
      setDriverReviewSortType("latest");
      setDriverReviewPage(1);
      setOpenDriverDetailModal(true);
    } catch (error) {
      console.error("차주 상세 조회 실패:", error);
      showSnackbar("차주 상세 정보를 불러오지 못했습니다.", "error");
    }
  };
  const handleCloseDriverDetailModal = () => {
    setOpenDriverDetailModal(false);
    setSelectedDriverDetail(null);
    setDriverReviewPage(1);
  };

  const movePage = (pageObj) => {
    setPageParams((prev) => ({ ...prev, ...pageObj }));
  };

  const applyPagedData = (list, nextPageParams = pageParams) => {
    const sorted = [...list].sort((a, b) => {
      const A = a?.reviewNo ?? 0;
      const B = b?.reviewNo ?? 0;
      return B - A;
    });

    setServerData(paginate(sorted, nextPageParams));
  };

  const reloadMyReviews = async () => {
    const data = await getMyReviewsWithDriverId();
    const list = Array.isArray(data) ? data : [];
    setAllReviews(list);
    applyPagedData(list);
  };

  const handleOpenEditModal = async (item) => {
    const detail = await getReviewByReviewNo(item.reviewNo);
    const merged = { ...item, ...detail };

    setSelectedReview(merged);
    setEditReviewScore(Number(merged.rating) || 0);
    setEditReviewContent(merged.comment || "");
    setEditReviewImages(merged.images || []);
    setDeleteImageIds([]);
    setNewEditImages([]);
    setOpenEditModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setSelectedReview(null);
    setEditReviewScore(0);
    setEditReviewContent("");
    setEditReviewImages([]);
    setDeleteImageIds([]);
    setNewEditImages([]);
  };

  const handleOpenDeleteDialog = (reviewNo) => {
    setDeleteTargetReviewNo(reviewNo);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeleteTargetReviewNo(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetReviewNo) return;

    try {
      await deleteReview(deleteTargetReviewNo);
      await reloadMyReviews();

      setSnackbar({
        open: true,
        message: "리뷰가 삭제되었습니다.",
        severity: "success",
      });
    } catch (e) {
      console.error("리뷰 삭제 실패:", e);

      setSnackbar({
        open: true,
        message: "리뷰 삭제에 실패했습니다.",
        severity: "error",
      });
    } finally {
      handleCloseDeleteDialog();
    }
  };
  const validateImageFiles = (files) => {
    if (files.length > 3) {
      alert("이미지는 최대 3장까지 선택할 수 있습니다.");
      return false;
    }

    const invalidFile = files.find((file) => {
      const lower = file.name.toLowerCase();

      const validExt =
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp");

      const validSize = file.size <= 10 * 1024 * 1024;

      return !validExt || !validSize;
    });

    if (invalidFile) {
      alert("jpg, jpeg, png, webp 파일만 가능하며, 1개당 최대 10MB까지 업로드할 수 있습니다.");
      return false;
    }

    return true;
  };
  const handleConfirmModify = async () => {
    if (!selectedReview) return;

    if (editReviewScore === 0) {
      showSnackbar("별점을 선택해야 합니다.", "warning");
      return;
    }

    if (!editReviewContent.trim()) {
      showSnackbar("리뷰 내용을 입력해야 합니다.", "warning");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("rating", editReviewScore);
      formData.append("comment", editReviewContent.trim());

      deleteImageIds.forEach((id) => {
        formData.append("deleteImageIds", id);
      });

      newEditImages.forEach((file) => {
        formData.append("newImages", file);
      });

      await modifyReview(selectedReview.reviewNo, formData);

      showSnackbar("리뷰가 수정되었습니다.");
      handleCloseEditModal();
      await reloadMyReviews();
    } catch (e) {
      console.error("리뷰 수정 실패:", e);
      showSnackbar("리뷰 수정에 실패했습니다.", "error");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchMyReviews = async () => {
      try {
        setLoading(true);

        const data = await getMyReviewsWithDriverId();
        const list = Array.isArray(data) ? data : [];

        if (!cancelled) {
          setAllReviews(list);
          applyPagedData(list, pageParams);
        }
      } catch (error) {
        console.error("내 리뷰 목록 조회 실패:", error);
        if (!cancelled) {
          setAllReviews([]);
          setServerData(paginate([], pageParams));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMyReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    applyPagedData(allReviews, pageParams);
  }, [pageParams]);

  // 공통 텍스트 폼 디자인 스킨 정의 (동글동글 매치용)
  const textInputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "#ffffff",
      "& fieldset": { borderColor: "#e2e8f0" },
      "&:hover fieldset": { borderColor: "#cbd5e1" },
      "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "2px" },
    }
  };

  const renderReviewCards = () => {
    if (loading) {
      return <Paper sx={{ p: 4, textAlign: "center", borderRadius: "16px", color: "#2563eb", fontWeight: "bold" }}>불러오는 중...</Paper>;
    }

    if (!serverData.dtoList || serverData.dtoList.length === 0) {
      return <Paper sx={{ p: 4, textAlign: "center", borderRadius: "16px", color: "text.secondary" }}>작성한 리뷰가 없습니다.</Paper>;
    }

    return (
      <Stack spacing={2.5}>
        {serverData.dtoList.map((item) => {
          return (
            <Paper
              key={item.reviewNo}
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3 },
                border: "1px solid #f1f5f9",
                borderRadius: "16px", // 🟢 동글동글 적용
                bgcolor: "#ffffff",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                position: "relative",
                "& .review-actions": {
                  opacity: { xs: 1, md: 0 },
                  transform: {
                    xs: "translateY(0)",
                    md: "translateY(-2px)",
                  },
                  transition: "all 0.2s ease-in-out",
                },
                "&:hover .review-actions": {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              }}
            >
              {/* 📱 핏 조율: 모바일 해상도(xs)에서 정보 텍스트와 우측 액션 단추 그룹이 깨지지 않게 유연 배치 가이드 장착 */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", sm: "flex-start" },
                  gap: 1.5,
                  mb: 1.5,
                }}
              >
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flex: 1, minWidth: 0, pr: 1 }}>
                  <Avatar
                    src={normalizeProfileUrl(item.driverProfileImage) || DEFAULT_AVATAR}
                    sx={{ width: 44, height: 44, border: "1px solid #e2e8f0" }}
                  >
                    {item.driverName?.[0] || "차"}
                  </Avatar>

                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography fontSize={13} color="text.secondary" fontWeight={500}>
                        운전기사
                      </Typography>

                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleOpenDriverDetailModal(item)}
                        sx={{
                          p: 0,
                          minWidth: "auto",
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: "#2563eb", // 🔵 메인 블루 포인트 매칭
                          textTransform: "none",
                          "&:hover": { backgroundColor: "transparent", textDecoration: "underline" }
                        }}
                      >
                        {item.driverName || "-"}
                      </Button>
                    </Stack>

                    <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.1 }}>
                      {formatDateTime(item.createdAt)}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                      <Rating value={Number(item.rating) || 0} precision={0.5} readOnly size="small" sx={{ color: "#ffb700" }} />
                      <Typography fontSize={13} fontWeight={700} color="text.primary">
                        {Number(item.rating || 0).toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Stack
                  direction="row"
                  spacing={0.5}
                  className="review-actions"
                  sx={{ flexShrink: 0, justifyContent: { xs: "flex-end", sm: "flex-start" }, mt: { xs: 1, sm: 0 } }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleOpenEditModal(item)}
                    sx={{
                      width: 32,
                      height: 32,
                      color: "#6b7280",
                      borderRadius: "10px",
                      "&:hover": { bgcolor: "#eff6ff", color: "#2563eb" }, // 🔵 블루 전환
                    }}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={() => handleOpenDeleteDialog(item.reviewNo)}
                    sx={{
                      width: 32,
                      height: 32,
                      color: "#9ca3af",
                      borderRadius: "10px",
                      "&:hover": { bgcolor: "#fff5f5", color: "#dc2626" },
                    }}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>

              {/* 디테일 박스 테두리 곡률 부드럽게 보정 (borderRadius: "12px") */}
              <Box sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", p: 1.5, mb: 1.5 }}>
                <InfoRow label="화물명" value={item.cargoType} />
                <InfoRow label="무게" value={item.cargoWeight} />
                <InfoRow label="운송구간" value={`${item.startAddress || "-"} → ${item.endAddress || "-"}`} />
                <InfoRow label="배송완료" value={formatDateTime(item.deliveryCompletedAt)} />
              </Box>

              {item.images?.length > 0 && (
                <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                  {item.images.slice(0, 3).map((img) => {
                    const path = img.thumbnailPath || img.imagePath;

                    return (
                      <Box
                        key={img.reviewImageNo}
                        component="img"
                        src={`${API_SERVER_HOST}/${path}`}
                        alt="review-thumbnail"
                        onClick={() => setSelectedImage(img.imagePath)}
                        sx={{
                          width: { xs: "calc(33.33% - 8px)", sm: 100 },
                          height: { xs: "auto", sm: 100 },
                          aspectRatio: "1/1",
                          objectFit: "cover",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          cursor: "pointer",
                        }}
                      />
                    );
                  })}
                </Box>
              )}

              <Typography fontSize={14} sx={{ whiteSpace: "pre-wrap", mb: 1.5, px: 0.5, lineHeight: 1.5 }}>
                {item.comment || "-"}
              </Typography>

              {item.reply && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 2,
                    borderRadius: "12px", // 🟢 동글동글
                    bgcolor: "#eff6ff", // 연한 블루 스킨 테마 분기
                    border: "1px solid #dbeafe",
                    mb: 1.5,
                  }}
                >
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography fontSize={13} fontWeight={700} color="#1e40af">
                      {item.driverName || "차주 답글"}
                    </Typography>

                    <Typography fontSize={12} color="text.secondary">
                      · {formatDateTime(item.reply.createdAt)}
                    </Typography>
                  </Stack>

                  <Typography fontSize={14} sx={{ whiteSpace: "pre-wrap", mt: 0.5, color: "#1e293b", lineHeight: 1.5 }}>
                    {item.reply.content}
                  </Typography>
                </Box>
              )}
            </Paper>
          );
        })}
      </Stack>
    );
  };

  const selectedDriverProfileInfo = {
    id: selectedDriverDetail?.profile?.driverId || "",
    name: selectedDriverDetail?.profile?.driverName || "운전기사",
    avatarUrl: selectedDriverDetail?.profile?.driverProfileImage || null,
  };

  const selectedDriverSummary = {
    avgRating: Number(selectedDriverDetail?.profile?.avgRating || 0),
    reviewCount: Number(selectedDriverDetail?.profile?.reviewCount || 0),
  };

  const selectedDriverVerification = {
    isVerified: Boolean(selectedDriverDetail?.profile?.isVerified),
  };
  const selectedDriverReviewStats = useMemo(() => {
    const reviews = Array.isArray(selectedDriverDetail?.reviews)
      ? selectedDriverDetail.reviews
      : [];

    const stats = {
      total: reviews.length,
      five: 0,
      four: 0,
      three: 0,
      two: 0,
      one: 0,
    };

    reviews.forEach((item) => {
      const rating = Number(item.rating) || 0;

      if (rating >= 5) stats.five += 1;
      else if (rating >= 4) stats.four += 1;
      else if (rating >= 3) stats.three += 1;
      else if (rating >= 2) stats.two += 1;
      else stats.one += 1;
    });

    return stats;
  }, [selectedDriverDetail]);

  const sortedDriverReviews = useMemo(() => {
    const reviews = Array.isArray(selectedDriverDetail?.reviews)
      ? [...selectedDriverDetail.reviews]
      : [];

    switch (driverReviewSortType) {
      case "ratingDesc":
        return reviews.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
      case "ratingAsc":
        return reviews.sort((a, b) => (Number(a.rating) || 0) - (Number(b.rating) || 0));
      case "oldest":
        return reviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case "latest":
      default:
        return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [selectedDriverDetail, driverReviewSortType]);
  const driverReviewTotalPage = Math.max(
    1,
    Math.ceil(sortedDriverReviews.length / DRIVER_REVIEW_PAGE_SIZE)
  );

  const pagedDriverReviews = useMemo(() => {
    const startIndex = (driverReviewPage - 1) * DRIVER_REVIEW_PAGE_SIZE;
    const endIndex = startIndex + DRIVER_REVIEW_PAGE_SIZE;
    return sortedDriverReviews.slice(startIndex, endIndex);
  }, [sortedDriverReviews, driverReviewPage]);

  useEffect(() => {
    if (driverReviewPage > driverReviewTotalPage) {
      setDriverReviewPage(driverReviewTotalPage);
    }
  }, [driverReviewPage, driverReviewTotalPage]);

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 6, pb: { xs: '100px', md: 6 }, overflow: 'hidden', }}>
      <Container maxWidth="xl" disableGutters sx={{
        px: { xs: 2, md: 4 },
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}>
        <Typography variant="h4" fontWeight="900" color="#0f172a" letterSpacing="-0.5px" mb={4} sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }, textAlign: { xs: 'center', md: 'left' } }}>
          내 리뷰 관리
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" fontWeight="800" color="#1e293b" mb={2.5}>
            내가 작성한 리뷰 목록
          </Typography>

          <Box>
            {renderReviewCards()}

            <Box
              sx={{
                mt: 6,
                display: "flex",
                justifyContent: "center",
                bgcolor: "transparent",
              }}
            >
              <PageComponent serverData={serverData} movePage={movePage} />
            </Box>
          </Box>
        </Box>
      </Container>

      {/* 📱 모바일 세로 액정 가려짐 완벽 차단 다이얼로그 (maxHeight + overflowY 적용) */}
      <Dialog open={openEditModal} onClose={handleCloseEditModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "20px", p: 1, maxHeight: { xs: "82vh", sm: "85vh" }, display: "flex", flexDirection: "column" } }}>
        <DialogTitle sx={{ fontWeight: "bold", flexShrink: 0 }}>리뷰 수정</DialogTitle>

        <DialogContent sx={{ overflowY: "auto", overflowX: "hidden", flex: "1 1 auto" }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, bgcolor: '#f8fafc', p: 1.5, borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>리뷰번호:</strong> {selectedReview?.reviewNo ?? "-"}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              <strong>배송번호:</strong> {selectedReview?.deliveryNo ?? "-"}
            </Typography>
          </Box>

          <Typography gutterBottom fontWeight="bold" sx={{ mt: 1 }}>
            별점
          </Typography>

          <Rating
            value={editReviewScore}
            precision={0.5}
            onChange={(event, newValue) => setEditReviewScore(newValue || 0)}
            sx={{ color: "#ffb700" }}
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            label="리뷰 내용"
            value={editReviewContent}
            onChange={(e) => setEditReviewContent(e.target.value)}
            sx={{ mt: 2.5, ...textInputStyle }}
          />
          <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap", mt: 2.5 }}>
            {editReviewImages.map((img) => {
              const imageId = img.reviewImageNo;
              const checked = deleteImageIds.includes(imageId);

              return (
                <Box
                  key={imageId}
                  sx={{
                    position: "relative",
                    width: 100,
                    height: 100,
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: checked ? "2px solid #ef4444" : "1px solid #e2e8f0",
                    opacity: checked ? 0.45 : 1,
                    transition: "all 0.2s"
                  }}
                >
                  <img
                    src={`${API_SERVER_HOST}/${img.imagePath}`}
                    alt={`review-${imageId}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  <IconButton
                    size="small"
                    onClick={() => {
                      setDeleteImageIds((prev) =>
                        checked
                          ? prev.filter((id) => id !== imageId)
                          : [...prev, imageId]
                      );
                    }}
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 22,
                      height: 22,
                      bgcolor: checked ? "#10b981" : "rgba(15,23,42,0.65)",
                      color: "#fff",
                      "&:hover": {
                        bgcolor: checked ? "#059669" : "rgba(15,23,42,0.85)",
                      },
                    }}
                  >
                    {checked ? "↺" : <CloseRoundedIcon sx={{ fontSize: 14 }} />}
                  </IconButton>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ mt: 3, p: 2, border: "1px dashed #cbd5e1", borderRadius: "14px", bgcolor: "#fafafa" }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
              📸 새 이미지 추가
            </Typography>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);

                if (!validateImageFiles(files)) {
                  e.target.value = "";
                  setNewEditImages([]);
                  return;
                }

                setNewEditImages(files);
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, flexShrink: 0 }}>
          <Button onClick={handleCloseEditModal} sx={{ color: "text.secondary", fontWeight: "bold" }}>취소</Button>
          <Button onClick={handleConfirmModify} variant="contained" disableElevation sx={{ borderRadius: "12px", px: 3, fontWeight: "bold", bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 📱 운전기사 상세정보 화면 이탈 방지 모달 (maxHeight + overflowY 적용) */}
      <Dialog
        open={openDriverDetailModal}
        onClose={handleCloseDriverDetailModal}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "24px", p: 1, maxHeight: { xs: "82vh", sm: "85vh" }, display: "flex", flexDirection: "column" } }}
      >
        <DialogTitle sx={{ fontWeight: "bold", flexShrink: 0 }}>운전기사 상세 정보</DialogTitle>

        <DialogContent sx={{ overflowY: "auto", overflowX: "hidden", flex: "1 1 auto" }}>
          <DriverProfileCard
            title="운전기사 프로필"
            profileInfo={selectedDriverProfileInfo}
            summary={selectedDriverSummary}
            verification={selectedDriverVerification}
            reviewStats={selectedDriverReviewStats}
            showVerifyButton={false}
          />

          <Box sx={{ mt: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2.5,
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="h6" fontWeight="800" color="#1e293b">
                차주에게 작성된 리뷰 목록
              </Typography>

              <FormControl size="small" sx={{ minWidth: 160, ...textInputStyle }}>
                <InputLabel>정렬</InputLabel>
                <Select
                  value={driverReviewSortType}
                  label="정렬"
                  onChange={(e) => {
                    setDriverReviewSortType(e.target.value);
                    setDriverReviewPage(1);
                  }}
                >
                  <MenuItem value="latest">최신 순</MenuItem>
                  <MenuItem value="oldest">오래된 순</MenuItem>
                  <MenuItem value="ratingDesc">별점 높은 순</MenuItem>
                  <MenuItem value="ratingAsc">별점 낮은 순</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {pagedDriverReviews.length ? (
              <Stack spacing={2}>
                {pagedDriverReviews.map((review) => {
                  return (
                    <Paper
                      key={review.reviewNo}
                      elevation={0}
                      sx={{
                        p: { xs: 2, sm: 2.5 },
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        bgcolor: "#fff",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, mb: 1.5 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontSize={14} fontWeight={700} color="#334155">{review.writerName || review.writerId || "작성자"}</Typography>
                          <Typography fontSize={12} color="text.secondary">{formatDateTime(review.createdAt)}</Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                            <Rating value={Number(review.rating) || 0} precision={0.5} readOnly size="small" sx={{ color: "#ffb700" }} />
                            <Typography fontSize={13} fontWeight={700} color="text.primary">{Number(review.rating || 0).toFixed(1)}</Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ bgcolor: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9", p: 1.5, mb: 1.5 }}>
                        <InfoRow label="화물명" value={review.cargoType} />
                        <InfoRow label="무게" value={review.cargoWeight} />
                        <InfoRow label="운송구간" value={`${review.startAddress || "-"} → ${review.endAddress || "-"}`} />
                        <InfoRow label="배송완료" value={formatDateTime(review.deliveryCompletedAt)} />
                      </Box>
                      {review.images?.length > 0 && (
                        <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                          {review.images.slice(0, 3).map((img) => (
                            <Box
                              key={img.reviewImageNo}
                              component="img"
                              src={`${API_SERVER_HOST}/${img.thumbnailPath || img.imagePath}`}
                              alt="review-thumbnail"
                              onClick={() => setSelectedImage(img.imagePath)}
                              sx={{
                                width: { xs: "calc(33.33% - 8px)", sm: 96 },
                                height: { xs: "auto", sm: 96 },
                                aspectRatio: "1/1",
                                objectFit: "cover",
                                borderRadius: "12px",
                                border: "1px solid #e2e8f0",
                                cursor: "pointer",
                              }}
                            />
                          ))}
                        </Box>
                      )}
                      <Typography fontSize={14} color="#475569" sx={{ whiteSpace: "pre-wrap", mb: 1.5, lineHeight: 1.5 }}>{review.comment || "-"}</Typography>
                      {review.reply && (
                        <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "12px", bgcolor: "#eff6ff", border: "1px solid #dbeafe" }}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography fontSize={13} fontWeight={700} color="#1e40af">{selectedDriverDetail?.profile?.driverName || "차주 답글"}</Typography>
                            <Typography fontSize={12} color="text.secondary">· {formatDateTime(review.reply.createdAt)}</Typography>
                          </Stack>
                          <Typography fontSize={14} sx={{ whiteSpace: "pre-wrap", mt: 0.5, color: "#1e293b", lineHeight: 1.5 }}>{review.reply.content}</Typography>
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>등록된 리뷰가 없습니다.</Typography>
            )}
            {pagedDriverReviews.length > 0 && (
              <Box sx={{ mt: 6, display: "flex", justifyContent: "center" }}>
                <Pagination
                  count={driverReviewTotalPage}
                  page={driverReviewPage}
                  onChange={(_, value) => setDriverReviewPage(value)}
                  color="primary"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    "& .MuiPaginationItem-root": { fontWeight: "bold", color: "#475569", borderRadius: "8px" },
                    "& .MuiPaginationItem-root.Mui-selected": { bgcolor: "#2563eb", color: "#ffffff", "&:hover": { bgcolor: "#1d4ed8" } }
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, flexShrink: 0 }}>
          <Button onClick={handleCloseDriverDetailModal} sx={{ color: "#2563eb", fontWeight: "bold" }}>닫기</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>이미지 보기</DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2, minHeight: '200px' }}>
          {selectedImage && (
            <Box
              component="img"
              src={`${API_SERVER_HOST}/${selectedImage}`}
              alt="preview"
              sx={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: "12px",
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedImage(null)} sx={{ color: "text.secondary", fontWeight: "bold" }}>닫기</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 0.5 } }}
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>리뷰 삭제</DialogTitle>

        <DialogContent><Typography fontSize={14} color="text.secondary">이 리뷰를 삭제할까요? 삭제하면 복구할 수 없습니다.</Typography></DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteDialog} sx={{ color: "text.secondary", fontWeight: "bold" }}>
            취소
          </Button>

          <Button
            color="error"
            variant="contained"
            disableElevation
            onClick={handleConfirmDelete}
            sx={{ borderRadius: "10px", fontWeight: "bold" }}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: "12px", fontWeight: "bold" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>

  );
};

export default MyReviewInform;