import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Container,
  Rating,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Avatar,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import * as PortOne from "@portone/browser-sdk/v2";
import PageComponent from "../common/PageComponent";
import { getReceivedReviews } from "../../../api/reviewApi/reviewApi";
import { getMyReceivedReviewSummary } from "../../../api/reviewApi/reviewApi";
import {
  createReviewReply,
  modifyReviewReply,
  deleteReviewReply
} from "../../../api/reviewApi/reviewApi";
import { getMyVerificationStatus, startVerification, confirmVerification } from "../../../api/verificationApi/verificationApi";
import DriverProfileCard from "../common/DriverProfileCard.js";

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "http://localhost:8080";

const DEFAULT_AVATAR = "/image/placeholders/avatar.svg";

const getFirst = (...candidates) =>
  candidates.find((v) => v !== undefined && v !== null && v !== "") ?? "";

const normalizeProfileUrl = (v) => {
  if (!v) return null;
  if (v.startsWith("http")) return v;
  if (v.startsWith("/g2i4/uploads/")) return `${API_BASE}${v}`;
  return `${API_BASE}/g2i4/uploads/user_profile/${encodeURIComponent(v)}`;
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

const ReceivedReviewInform = () => {
  const [allReviews, setAllReviews] = useState([]);
  const [serverData, setServerData] = useState(initState);
  const [pageParams, setPageParams] = useState({ page: 1, size: 5 });

  const [editingReplyReviewNo, setEditingReplyReviewNo] = useState(null);
  const [inlineReplyContent, setInlineReplyContent] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);
  const [sortType, setSortType] = useState("latest");

  const [profileInfo, setProfileInfo] = useState({
    id: "",
    name: "",
    avatarUrl: null,
  });
  const [verification, setVerification] = useState({
    isVerified: false,
    verifiedAt: null,
    verifiedPhone: null,
  });
  const [loading, setLoading] = useState(false);
  const sortReviews = (list, sortType) => {
    const copied = [...list];

    switch (sortType) {
      case "ratingDesc":
        return copied.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
      case "ratingAsc":
        return copied.sort((a, b) => (Number(a.rating) || 0) - (Number(b.rating) || 0));
      case "oldest":
        return copied.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case "latest":
      default:
        return copied.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };
  const movePage = (pageObj) => {
    setPageParams((prev) => ({ ...prev, ...pageObj }));
  };
  const [summary, setSummary] = useState({
    cargoId: "",
    avgRating: 0,
    reviewCount: 0,
  });

  const fetchVerificationStatus = async () => {
    try {
      const data = await getMyVerificationStatus();

      setVerification({
        isVerified: Boolean(data?.isVerified),
        verifiedAt: data?.verifiedAt ?? null,
        verifiedPhone: data?.verifiedPhone ?? null,
      });
    } catch (error) {
      console.error("본인인증 상태 조회 실패:", error);
    }
  };
  const handleVerificationClick = async () => {
    if (verification.isVerified) return;

    setLoading(true);

    try {
      const data = await startVerification();

      const response = await PortOne.requestIdentityVerification({
        storeId: data.storeId,
        identityVerificationId: data.identityVerificationId,
        channelKey: data.channelKey,
        redirectUrl: data.redirectUrl,
      });

      // 실패 응답
      if (response?.code !== undefined) {
        alert(response.message || "본인인증에 실패했습니다.");
        return;
      }

      // 인증 완료 확인
      await confirmVerification({
        identityVerificationId: data.identityVerificationId,
      });

      // 여기 추가: 서버에서 최신 상태 다시 읽기
      await fetchVerificationStatus();

      alert("본인인증이 완료되었습니다.");
    } catch (error) {
      console.error("본인인증 시작 실패:", error);
      alert("본인인증 시작에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchSummary = async () => {
      try {
        const data = await getMyReceivedReviewSummary();

        if (!cancelled) {
          setSummary({
            cargoId: data?.cargoId ?? "",
            avgRating: Number(data?.avgRating ?? 0),
            reviewCount: Number(data?.reviewCount ?? 0),
          });
        }
      } catch (error) {
        console.error("받은 리뷰 요약 조회 실패:", error);
        if (!cancelled) {
          setSummary({
            cargoId: "",
            avgRating: 0,
            reviewCount: 0,
          });
        }
      }
    };

    fetchSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchVerification = async () => {
      try {
        const data = await getMyVerificationStatus();

        if (!cancelled) {
          setVerification({
            isVerified: Boolean(data?.isVerified),
            verifiedAt: data?.verifiedAt ?? null,
            verifiedPhone: data?.verifiedPhone ?? null,
          });
        }
      } catch (error) {
        console.error("본인인증 상태 조회 실패:", error);
        if (!cancelled) {
          setVerification({
            isVerified: false,
            verifiedAt: null,
            verifiedPhone: null,
          });
        }
      }
    };

    fetchVerification();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchUserInfo = async () => {
      try {
        const token = sessionStorage.getItem("accessToken");

        const res = await fetch(`${API_BASE}/g2i4/user/info`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const raw = await res.json();

        const data =
          raw?.data ||
          raw?.user ||
          raw?.payload ||
          raw?.profile ||
          raw?.account ||
          raw?.result ||
          raw ||
          {};

        const id = getFirst(data.cargo_id, data.cargoId, data.id, data.username);
        const name = getFirst(data.cargo_name, data.cargoName, data.name);
        const avatarName = getFirst(
          data.webPath,
          data.profileImage,
          data.cargo_profile_image,
          data.profile
        );

        const avatarUrl = normalizeProfileUrl(avatarName);

        if (!cancelled) {
          setProfileInfo({
            id: id || "",
            name: name || "",
            avatarUrl: avatarUrl || null,
          });
        }
      } catch (error) {
        console.error("프로필 정보 조회 실패:", error);
      }
    };

    fetchUserInfo();

    return () => {
      cancelled = true;
    };
  }, []);
  const applyPagedData = (list, nextPageParams = pageParams, nextSortType = sortType) => {
    const sorted = sortReviews(list, nextSortType);
    setServerData(paginate(sorted, nextPageParams));
  };

  const openInlineReplyEditor = (item) => {
    setEditingReplyReviewNo(item.reviewNo);
    setInlineReplyContent(item.reply?.content || "");
  };

  const closeInlineReplyEditor = () => {
    setEditingReplyReviewNo(null);
    setInlineReplyContent("");
  };

  const saveInlineReply = async (item) => {
    if (!inlineReplyContent.trim()) {
      alert("답글 내용을 입력하세요.");
      return;
    }

    if (item.reply) {
      await modifyReviewReply(item.reviewNo, inlineReplyContent.trim());
    } else {
      await createReviewReply(item.reviewNo, inlineReplyContent.trim());
    }

    await refreshReceivedReviews();
    closeInlineReplyEditor();
  };

  const removeInlineReply = async (item) => {
    if (!window.confirm("답글을 삭제할까요?")) return;

    await deleteReviewReply(item.reviewNo);
    await refreshReceivedReviews();
    closeInlineReplyEditor();
  };

  const refreshReceivedReviews = async () => {
    const data = await getReceivedReviews();
    const list = Array.isArray(data) ? data : [];

    setAllReviews(list);
    applyPagedData(list, pageParams, sortType);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchReceivedReviews = async () => {
      try {
        setLoading(true);

        const data = await getReceivedReviews();
        const list = Array.isArray(data) ? data : [];

        if (!cancelled) {
          setAllReviews(list);
          applyPagedData(list, pageParams);
        }
      } catch (error) {
        console.error("받은 리뷰 목록 조회 실패:", error);
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

    fetchReceivedReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    applyPagedData(allReviews, pageParams, sortType);
  }, [pageParams, sortType, allReviews]);

  const renderReviewCards = () => {
    if (loading) {
      return (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          불러오는 중...
        </Paper>
      );
    }

    if (!serverData.dtoList || serverData.dtoList.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          받은 리뷰가 없습니다.
        </Paper>
      );
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
              {/* 상단: 작성자 / 날짜 / 별점 */}
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1.5 }}>
                <Avatar
                  src={normalizeProfileUrl(item.writerProfileImage) || DEFAULT_AVATAR}
                  sx={{ width: 42, height: 42 }}
                >
                  {item.writerName?.[0] || item.writerId?.[0]?.toUpperCase() || "U"}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <Typography fontWeight={700} fontSize={14}>
                      {item.writerName || item.writerId || "작성자"}
                    </Typography>

                    <Typography fontSize={13} color="text.secondary">
                      {formatDateTime(item.createdAt)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Rating
                      value={Number(item.rating) || 0}
                      precision={0.5}
                      readOnly
                      size="small"
                    />
                    <Typography fontSize={13} fontWeight={700}>
                      {Number(item.rating || 0).toFixed(1)}
                    </Typography>
                  </Box>
                </Box>

              </Box>

              {/* 정보 박스 */}
              <Box
                sx={{
                  bgcolor: "#f3f4f6",
                  borderRadius: 1,
                  p: 1.5,
                  mb: 1.5,
                }}
              >
                <InfoRow label="화물명" value={item.cargoType} />
                <InfoRow label="무게" value={item.cargoWeight} />
                <InfoRow label="운송구간" value={`${item.startAddress || "-"} → ${item.endAddress || "-"}`} />
                <InfoRow label="배송완료" value={formatDateTime(item.deliveryCompletedAt)} />
              </Box>

              {/* 이미지 */}
              {thumbnailPath && (
                <Box sx={{ mb: 1.5 }}>
                  <img
                    src={`${API_BASE}/${thumbnailPath}`}
                    alt="review-thumbnail"
                    onClick={() => setSelectedImage(firstImage.imagePath)}
                    style={{
                      width: 180,
                      maxWidth: "100%",
                      height: 180,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                      cursor: "pointer",
                    }}
                  />
                </Box>
              )}

              {/* 리뷰 내용 */}
              <Typography fontSize={14} sx={{ whiteSpace: "pre-wrap", mb: 1 }}>
                {item.comment || "-"}
              </Typography>

              {editingReplyReviewNo === item.reviewNo ? (
                <Box sx={{ mt: 1.5 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    size="small"
                    label="차주 답글"
                    value={inlineReplyContent}
                    onChange={(e) => setInlineReplyContent(e.target.value)}
                  />

                  <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                    <Button size="small" onClick={closeInlineReplyEditor}>
                      취소
                    </Button>

                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => saveInlineReply(item)}
                    >
                      {item.reply ? "수정 완료" : "등록"}
                    </Button>
                  </Stack>
                </Box>
              ) : item.reply ? (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    position: "relative",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.2} alignItems="flex-start">
                      <Avatar
                        src={normalizeProfileUrl(item.driverProfileImage) || DEFAULT_AVATAR}
                        sx={{ width: 30, height: 30 }}
                      >
                        {item.driverName?.[0] || "차"}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
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
                    </Stack>

                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => openInlineReplyEditor(item)}
                        sx={{
                          width: 28,
                          height: 28,
                          color: "#6b7280",
                          "&:hover": { bgcolor: "#eef2ff", color: "#4f46e5" },
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={() => removeInlineReply(item)}
                        sx={{
                          width: 28,
                          height: 28,
                          color: "#9ca3af",
                          "&:hover": { bgcolor: "#fef2f2", color: "#dc2626" },
                        }}
                      >
                        <CloseRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ChatBubbleOutlineIcon />}
                  onClick={() => openInlineReplyEditor(item)}
                  sx={{
                    mt: 1,
                    borderColor: "#d1d5db",
                    color: "#111827",
                    bgcolor: "#fff",
                    borderRadius: 1.5,
                    fontWeight: 600,
                    px: 1.5,
                    "&:hover": {
                      bgcolor: "#f9fafb",
                      borderColor: "#9ca3af",
                    },
                  }}
                >
                  답글 작성
                </Button>
              )}
            </Paper>
          );
        })}
      </Stack>
    );
  };
  const reviewStats = useMemo(() => {
    const stats = {
      total: allReviews.length,
      avg: 0,
      five: 0,
      four: 0,
      three: 0,
      two: 0,
      one: 0,
    };

    if (allReviews.length === 0) return stats;

    let sum = 0;

    allReviews.forEach((item) => {
      const rating = Number(item.rating) || 0;
      sum += rating;

      if (rating >= 5) stats.five += 1;
      else if (rating >= 4) stats.four += 1;
      else if (rating >= 3) stats.three += 1;
      else if (rating >= 2) stats.two += 1;
      else stats.one += 1;
    });

    stats.avg = sum / allReviews.length;
    return stats;
  }, [allReviews]);
  return (
    <Box sx={{ bgcolor: "#f7f9fc", minHeight: "100vh", py: 6 }}>
      <Container maxWidth="xl" disableGutters sx={{ px: { xs: 1, sm: 2 } }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom textAlign="center">
          내가 받은 리뷰
        </Typography>


        <Box sx={{ mb: 4 }}>
          <DriverProfileCard
            title="프로필"
            profileInfo={profileInfo}
            summary={summary}
            verification={verification}
            reviewStats={reviewStats}
            showVerifyButton={true}
            verifyButtonLoading={loading}
            onVerifyClick={handleVerificationClick}
          />
        </Box>
        <Box mt={6}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>

          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              차주에게 작성된 리뷰 목록
            </Typography>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>정렬</InputLabel>
              <Select
                value={sortType}
                label="정렬"
                onChange={(e) => setSortType(e.target.value)}
              >
                <MenuItem value="latest">최신 순</MenuItem>
                <MenuItem value="oldest">오래된 순</MenuItem>
                <MenuItem value="ratingDesc">별점 높은 순</MenuItem>
                <MenuItem value="ratingAsc">별점 낮은 순</MenuItem>
              </Select>
            </FormControl>
          </Box>
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
              src={`http://localhost:8080/${selectedImage}`}
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

export default ReceivedReviewInform;