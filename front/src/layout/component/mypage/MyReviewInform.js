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
} from "@mui/material";
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
  if (v.startsWith("/g2i4/uploads/")) return `${API_SERVER_HOST}${v}`;
  return `${API_SERVER_HOST}/g2i4/uploads/user_profile/${encodeURIComponent(v)}`;
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
    <Typography component="span" sx={{ fontSize: 13, fontWeight: 600 }}>
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
  const [allReviews, setAllReviews] = useState([]);
  const [serverData, setServerData] = useState(initState);
  const [pageParams, setPageParams] = useState({ page: 1, size: 5 });
  const [loading, setLoading] = useState(true);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [editReviewScore, setEditReviewScore] = useState(0);
  const [editReviewContent, setEditReviewContent] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);
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
      alert("차주 식별 정보가 없습니다.");
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
      alert("차주 상세 정보를 불러오지 못했습니다.");
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

  const handleDelete = async (reviewNo) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteReview(reviewNo);
      alert("삭제 완료");
      await reloadMyReviews();
    } catch (e) {
      console.error("리뷰 삭제 실패:", e);
      alert("삭제 실패");
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
      alert("별점을 선택해야 합니다.");
      return;
    }

    if (!editReviewContent.trim()) {
      alert("리뷰 내용을 입력해야 합니다.");
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

      alert("수정 완료");
      handleCloseEditModal();
      await reloadMyReviews();
    } catch (e) {
      console.error("리뷰 수정 실패:", e);
      alert("수정 실패");
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

  const renderReviewCards = () => {
    if (loading) {
      return <Paper sx={{ p: 4, textAlign: "center" }}>불러오는 중...</Paper>;
    }

    if (!serverData.dtoList || serverData.dtoList.length === 0) {
      return <Paper sx={{ p: 4, textAlign: "center" }}>작성한 리뷰가 없습니다.</Paper>;
    }

    return (
      <Stack spacing={2}>
        {serverData.dtoList.map((item) => {
          const firstImage = item.images?.[0];
          const thumbnailPath = firstImage?.thumbnailPath || firstImage?.imagePath;

          return (
            <Paper
              key={item.reviewNo}
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                border: "1px solid #e5e7eb",
                borderRadius: 2,
                bgcolor: "#fff",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 1.5,
                }}
              >

                <Box sx={{ display: "flex", gap: 1.2, flex: 1, minWidth: 0, pr: 1 }}>
                  <Avatar
                    src={normalizeProfileUrl(item.driverProfileImage) || DEFAULT_AVATAR}
                    sx={{ width: 42, height: 42 }}
                  >
                    {item.driverName?.[0] || "차"}
                  </Avatar>

                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontSize={13} color="text.secondary">
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
                          textTransform: "none",
                        }}
                      >
                        {item.driverName || "-"}
                      </Button>
                    </Stack>

                    <Typography fontSize={13} color="text.secondary">
                      {formatDateTime(item.createdAt)}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                      <Rating value={Number(item.rating) || 0} precision={0.5} readOnly size="small" />
                      <Typography fontSize={13} fontWeight={700}>
                        {Number(item.rating || 0).toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ flexShrink: 0 }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleOpenEditModal(item)}
                    sx={{
                      width: 32,
                      height: 32,
                      color: "#6b7280",
                      "&:hover": { bgcolor: "#eef2ff", color: "#4f46e5" },
                    }}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={() => handleDelete(item.reviewNo)}
                    sx={{
                      width: 32,
                      height: 32,
                      color: "#9ca3af",
                      "&:hover": { bgcolor: "#fef2f2", color: "#dc2626" },
                    }}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>

              <Box sx={{ bgcolor: "#f3f4f6", borderRadius: 1, p: 1.5, mb: 1.5 }}>
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
                      <img
                        key={img.reviewImageNo}
                        src={`${API_SERVER_HOST}/${path}`}
                        alt="review-thumbnail"
                        onClick={() => setSelectedImage(img.imagePath)}
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #ddd",
                          cursor: "pointer",
                        }}
                      />
                    );
                  })}
                </Box>
              )}

              <Typography fontSize={14} sx={{ whiteSpace: "pre-wrap", mb: 1.5 }}>
                {item.comment || "-"}
              </Typography>

              {item.reply && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    mb: 1.5,
                  }}
                >
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography fontSize={13} fontWeight={700}>
                      {item.driverName || "차주 답글"}
                    </Typography>

                    <Typography fontSize={12} color="text.secondary">
                      · {formatDateTime(item.reply.createdAt)}
                    </Typography>
                  </Stack>

                  <Typography fontSize={14} sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
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
    <Box sx={{ bgcolor: '#f7f9fc', minHeight: '100vh', py: 6, pb: { xs: '80px', md: 6 }, overflow: 'hidden', }}>
      <Container maxWidth="xl" disableGutters sx={{
        px: { xs: 1, sm: 2 },
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom textAlign="center">
          내 리뷰 관리
        </Typography>

        <Box mt={6}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            내가 작성한 리뷰 목록
          </Typography>

          <Box>
            {renderReviewCards()}

            <Box
              sx={{
                mt: 2,
                py: 1.5,
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

      <Dialog open={openEditModal} onClose={handleCloseEditModal} maxWidth="sm" fullWidth>
        <DialogTitle>리뷰 수정</DialogTitle>

        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>리뷰번호:</strong> {selectedReview?.reviewNo ?? "-"}
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>배송번호:</strong> {selectedReview?.deliveryNo ?? "-"}
          </Typography>

          <Typography gutterBottom sx={{ mt: 1 }}>
            별점
          </Typography>

          <Rating
            value={editReviewScore}
            precision={0.5}
            onChange={(event, newValue) => setEditReviewScore(newValue || 0)}
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            label="리뷰 내용"
            value={editReviewContent}
            onChange={(e) => setEditReviewContent(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              기존 이미지
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {editReviewImages.map((img) => {
                const imageId = img.reviewImageNo;
                const checked = deleteImageIds.includes(imageId);

                return (
                  <Box key={imageId} sx={{ textAlign: "center" }}>
                    <img
                      src={`${API_SERVER_HOST}/${img.imagePath}`}
                      alt={`review-${imageId}`}
                      style={{
                        width: 100,
                        height: 100,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: checked ? "2px solid red" : "1px solid #ddd",
                        opacity: checked ? 0.5 : 1,
                      }}
                    />

                    <Button
                      size="small"
                      color={checked ? "success" : "error"}
                      onClick={() => {
                        setDeleteImageIds((prev) =>
                          checked
                            ? prev.filter((id) => id !== imageId)
                            : [...prev, imageId]
                        );
                      }}
                    >
                      {checked ? "복원" : "삭제"}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              새 이미지 추가
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

        <DialogActions>
          <Button onClick={handleCloseEditModal}>취소</Button>
          <Button onClick={handleConfirmModify} variant="contained">
            저장
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDriverDetailModal}
        onClose={handleCloseDriverDetailModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>운전기사 상세 정보</DialogTitle>

        <DialogContent>
          <DriverProfileCard
            title="운전기사 프로필"
            profileInfo={selectedDriverProfileInfo}
            summary={selectedDriverSummary}
            verification={selectedDriverVerification}
            reviewStats={selectedDriverReviewStats}
            showVerifyButton={false}
          />

          <Box sx={{ mt: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                차주에게 작성된 리뷰 목록
              </Typography>

              <FormControl size="small" sx={{ minWidth: 180 }}>
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
                  const firstImage = review.images?.[0];
                  const thumbnailPath = firstImage?.thumbnailPath || firstImage?.imagePath;

                  return (
                    <Paper
                      key={review.reviewNo}
                      elevation={0}
                      sx={{
                        p: { xs: 2, sm: 2.5 },
                        border: "1px solid #e5e7eb",
                        borderRadius: 2,
                        bgcolor: "#fff",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, mb: 1.5 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontSize={14} fontWeight={700}>
                            {review.writerName || review.writerId || "작성자"}
                          </Typography>

                          <Typography fontSize={13} color="text.secondary">
                            {formatDateTime(review.createdAt)}
                          </Typography>

                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                            <Rating
                              value={Number(review.rating) || 0}
                              precision={0.5}
                              readOnly
                              size="small"
                            />
                            <Typography fontSize={13} fontWeight={700}>
                              {Number(review.rating || 0).toFixed(1)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Box sx={{ bgcolor: "#f3f4f6", borderRadius: 1, p: 1.5, mb: 1.5 }}>
                        <InfoRow label="화물명" value={review.cargoType} />
                        <InfoRow label="무게" value={review.cargoWeight} />
                        <InfoRow label="운송구간" value={`${review.startAddress || "-"} → ${review.endAddress || "-"}`} />
                        <InfoRow label="배송완료" value={formatDateTime(review.deliveryCompletedAt)} />
                      </Box>

                      {review.images?.length > 0 && (
                        <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                          {review.images.slice(0, 3).map((img) => {
                            const path = img.thumbnailPath || img.imagePath;

                            return (
                              <img
                                key={img.reviewImageNo}
                                src={`${API_SERVER_HOST}/${path}`}
                                alt="review-thumbnail"
                                onClick={() => setSelectedImage(img.imagePath)}
                                style={{
                                  width: 96,
                                  height: 96,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                  border: "1px solid #ddd",
                                  cursor: "pointer",
                                }}
                              />
                            );
                          })}
                        </Box>
                      )}

                      <Typography fontSize={14} sx={{ whiteSpace: "pre-wrap", mb: 1.5 }}>
                        {review.comment || "-"}
                      </Typography>

                      {review.reply && (
                        <Box
                          sx={{
                            mt: 1.5,
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: "#f8fafc",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography fontSize={13} fontWeight={700}>
                              {selectedDriverDetail?.profile?.driverName || "차주 답글"}
                            </Typography>

                            <Typography fontSize={12} color="text.secondary">
                              · {formatDateTime(review.reply.createdAt)}
                            </Typography>
                          </Stack>

                          <Typography fontSize={14} sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                            {review.reply.content}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                등록된 리뷰가 없습니다.
              </Typography>
            )}
            {pagedDriverReviews.length > 0 && (
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  disabled={driverReviewPage <= 1}
                  onClick={() => setDriverReviewPage((prev) => prev - 1)}
                >
                  이전
                </Button>

                <Typography variant="body2">
                  {driverReviewPage} / {driverReviewTotalPage}
                </Typography>

                <Button
                  size="small"
                  variant="outlined"
                  disabled={driverReviewPage >= driverReviewTotalPage}
                  onClick={() => setDriverReviewPage((prev) => prev + 1)}
                >
                  다음
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDriverDetailModal}>닫기</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>이미지 보기</DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          {selectedImage && (
            <img
              src={`${API_SERVER_HOST}/${selectedImage}`}
              alt="preview"
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedImage(null)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>

  );
};

export default MyReviewInform;