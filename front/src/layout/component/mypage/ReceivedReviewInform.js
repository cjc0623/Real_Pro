import { API_BASE } from '../../../config';
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
  Snackbar,
  Alert,
  Chip,
  LinearProgress,
  Divider,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import * as PortOne from "@portone/browser-sdk/v2";
import PageComponent from "../common/PageComponent";
import { getReceivedReviews } from "../../../api/reviewApi/reviewApi";
import { getMyReceivedReviewSummary } from "../../../api/reviewApi/reviewApi";
import { getDriverTrustScore } from "../../../api/reviewApi/reviewApi.js";
import {
  createReviewReply,
  modifyReviewReply,
  deleteReviewReply
} from "../../../api/reviewApi/reviewApi";
import { getMyVerificationStatus, startVerification, confirmVerification } from "../../../api/verificationApi/verificationApi";
import DriverProfileCard from "../common/DriverProfileCard.js";

const DEFAULT_AVATAR = "/image/placeholders/avatar.svg";

const getFirst = (...candidates) =>
  candidates.find((v) => v !== undefined && v !== null && v !== "") ?? "";

const normalizeProfileUrl = (v) => {
  if (!v) return null;
  if (v.startsWith("http")) return v;
  if (v.startsWith("/fr/uploads/")) return `${API_BASE}${v}`;
  return `${API_BASE}/fr/uploads/user_profile/${encodeURIComponent(v)}`;
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

const ReceivedReviewInform = () => {
  const [allReviews, setAllReviews] = useState([]);
  const [serverData, setServerData] = useState(initState);
  const [pageParams, setPageParams] = useState({ page: 1, size: 5 });

  const [editingReplyReviewNo, setEditingReplyReviewNo] = useState(null);
  const [inlineReplyContent, setInlineReplyContent] = useState("");

  const [trustData, setTrustData] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [openDeleteReplyDialog, setOpenDeleteReplyDialog] = useState(false);
  const [deleteReplyTarget, setDeleteReplyTarget] = useState(null);

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
        showSnackbar(response.message || "본인인증 실패", "error");
        return;
      }

      // 인증 완료 확인
      await confirmVerification({
        identityVerificationId: data.identityVerificationId,
      });

      // 여기 추가: 서버에서 최신 상태 다시 읽기
      await fetchVerificationStatus();

      showSnackbar("본인인증이 완료되었습니다.");
    } catch (error) {
      console.error("본인인증 시작 실패:", error);
      showSnackbar("본인인증 시작 실패", "error");
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

    const fetchTrustScore = async () => {
      try {
        const cargoId = profileInfo?.id;

        if (!cargoId) return;

        const data = await getDriverTrustScore(cargoId);

        if (!cancelled) {
          setTrustData(data);
        }
      } catch (error) {
        console.error("신뢰도 조회 실패:", error);

        if (!cancelled) {
          setTrustData(null);
        }
      }
    };

    fetchTrustScore();

    return () => {
      cancelled = true;
    };
  }, [profileInfo]);
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

        const res = await fetch(`${API_BASE}/fr/user/info`, {
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
      showSnackbar("답글 내용을 입력하세요.", "warning");
      return;
    }

    try {
      if (item.reply) {
        await modifyReviewReply(item.reviewNo, inlineReplyContent.trim());
        showSnackbar("답글이 수정되었습니다.");
      } else {
        await createReviewReply(item.reviewNo, inlineReplyContent.trim());
        showSnackbar("답글이 등록되었습니다.");
      }

      await refreshReceivedReviews();
      closeInlineReplyEditor();
    } catch (e) {
      console.error("답글 저장 실패:", e);
      showSnackbar("답글 저장에 실패했습니다.", "error");
    }
  };

  const handleOpenDeleteReplyDialog = (item) => {
    setDeleteReplyTarget(item);
    setOpenDeleteReplyDialog(true);
  };

  const closeDeleteReplyDialog = () => {
    setDeleteReplyTarget(null);
    setOpenDeleteReplyDialog(false);
  };

  const removeInlineReply = async () => {
    if (!deleteReplyTarget) return;

    try {
      await deleteReviewReply(deleteReplyTarget.reviewNo);
      await refreshReceivedReviews();

      setSnackbar({
        open: true,
        message: "답글이 삭제되었습니다.",
        severity: "success",
      });

      closeDeleteReplyDialog();
    } catch (e) {
      console.error(e);

      setSnackbar({
        open: true,
        message: "답글 삭제 실패",
        severity: "error",
      });
    }
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

              {/* 이미지 (최대 3장) */}
              {item.images?.length > 0 && (
                <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                  {item.images.slice(0, 3).map((img) => (
                    <Box
                      key={img.reviewImageNo}
                      component="img"
                      src={`${API_BASE}/${img.thumbnailPath || img.imagePath}`}
                      alt="review-thumbnail"
                      onClick={() => setSelectedImage(img.imagePath)}
                      sx={{
                        width: { xs: "calc(33.33% - 8px)", sm: 100 },
                        height: { xs: "auto", sm: 100 },
                        aspectRatio: "1/1",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                        cursor: "pointer",
                      }}
                    />
                  ))}
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
                        onClick={() => handleOpenDeleteReplyDialog(item)}
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
    <Box sx={{ bgcolor: "#f7f9fc", minHeight: "100vh", pt: 6, pb: { xs: 15, md: 6 } }}>
      <Container maxWidth="xl" disableGutters sx={{ px: { xs: 1, sm: 2 } }}>
        <Typography variant="h4" fontWeight="900" color="#0f172a" letterSpacing="-0.5px" mb={4} sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }, textAlign: { xs: 'center', md: 'left' } }}>
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

          {trustData && (
            <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: { xs: 2.5, sm: 3 },
                borderRadius: 4,
                border: "1px solid #e5e7eb",
                bgcolor: "#ffffff",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
              }}
            >
              {/* 헤더 */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Box>
                  <Typography fontSize={13} color="text.secondary" fontWeight={700}>
                    DRIVER TRUST INSIGHT
                  </Typography>

                  <Typography variant="h6" fontWeight={900}>
                    차주 신뢰도 분석
                  </Typography>

                  <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.5 }}>
                    평점, 배송 이력, 인증 여부, 리뷰 감성을 종합해 산정한 점수입니다.
                  </Typography>
                </Box>

                <Chip
                  label={trustData.trustGrade}
                  sx={{
                    fontWeight: 800,
                    bgcolor:
                      trustData.trustScore >= 85
                        ? "#ecfdf5"
                        : trustData.trustScore >= 70
                          ? "#eff6ff"
                          : trustData.trustScore >= 50
                            ? "#fffbeb"
                            : "#fef2f2",
                    color:
                      trustData.trustScore >= 85
                        ? "#047857"
                        : trustData.trustScore >= 70
                          ? "#1d4ed8"
                          : trustData.trustScore >= 50
                            ? "#b45309"
                            : "#b91c1c",
                  }}
                />
              </Box>

              {/* 상단 핵심 지표 */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1.2fr 2fr" },
                  gap: 2.5,
                }}
              >
                {/* 점수 메인 카드 */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "#fff",
                  }}
                >
                  <Typography fontSize={13} sx={{ color: "#cbd5e1" }}>
                    종합 신뢰 점수
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, mt: 1 }}>
                    <Typography fontSize={48} fontWeight={900} lineHeight={1}>
                      {trustData.trustScore}
                    </Typography>
                    <Typography fontSize={18} fontWeight={800} sx={{ mb: 0.5 }}>
                      / 100
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Number(trustData.trustScore) || 0, 100)}
                    sx={{
                      mt: 2,
                      height: 9,
                      borderRadius: 999,
                      bgcolor: "rgba(255,255,255,0.18)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        bgcolor:
                          trustData.trustScore >= 85
                            ? "#34d399"
                            : trustData.trustScore >= 70
                              ? "#60a5fa"
                              : trustData.trustScore >= 50
                                ? "#fbbf24"
                                : "#f87171",
                      },
                    }}
                  />

                  <Typography fontSize={13} sx={{ mt: 1.5, color: "#cbd5e1" }}>
                    현재 등급은 <b style={{ color: "#fff" }}>{trustData.trustGrade}</b> 입니다.
                  </Typography>
                </Box>

                {/* 요약 카드 4개 */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                    gap: 1.5,
                  }}
                >
                  {[
                    ["평균 평점", `${trustData.averageRating ?? 0}`, "5점 만점"],
                    ["배송 완료", `${trustData.completedDeliveryCount ?? 0}건`, "완료 이력"],
                    ["리뷰 수", `${trustData.reviewCount ?? 0}개`, "누적 리뷰"],
                    ["본인 인증", trustData.verified ? "완료" : "미완료", "신원 확인"],
                  ].map(([label, value, sub]) => (
                    <Box
                      key={label}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: "#f8fafc",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <Typography fontSize={12} color="text.secondary" fontWeight={700}>
                        {label}
                      </Typography>
                      <Typography fontSize={22} fontWeight={900} sx={{ mt: 0.5 }}>
                        {value}
                      </Typography>
                      <Typography fontSize={12} color="text.secondary">
                        {sub}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* 점수 산정 근거 + 감성 분석 */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
                  gap: 2.5,
                }}
              >
                {/* 점수 breakdown */}
                <Box>
                  <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                    점수 산정 근거
                  </Typography>

                  {[
                    ["평점 점수", trustData.ratingScore, 40],
                    ["리뷰 경험", trustData.reviewScore, 15],
                    ["배송 경험", trustData.deliveryScore, 20],
                    ["감성 분석", trustData.sentimentScore, 15],
                    ["본인 인증", trustData.verifiedScore, 10],
                  ].map(([label, score, max]) => {
                    const value = Math.min(((Number(score) || 0) / max) * 100, 100);

                    return (
                      <Box key={label} sx={{ mb: 1.6 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography fontSize={13} color="text.secondary" fontWeight={700}>
                            {label}
                          </Typography>
                          <Typography fontSize={13} fontWeight={900}>
                            +{score ?? 0} / {max}
                          </Typography>
                        </Box>

                        <LinearProgress
                          variant="determinate"
                          value={value}
                          sx={{
                            height: 8,
                            borderRadius: 999,
                            bgcolor: "#eef2f7",
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 999,
                              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>

                {/* 리뷰 감성 분석 */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                    리뷰 감성 분석
                  </Typography>

                  <Stack spacing={1.2}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography fontSize={14} color="success.main" fontWeight={800}>
                        긍정 리뷰
                      </Typography>
                      <Typography fontSize={14} fontWeight={900}>
                        {trustData.positiveReviewCount ?? 0}개
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography fontSize={14} color="text.secondary" fontWeight={800}>
                        중립 리뷰
                      </Typography>
                      <Typography fontSize={14} fontWeight={900}>
                        {trustData.neutralReviewCount ?? 0}개
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography fontSize={14} color="error.main" fontWeight={800}>
                        부정 리뷰
                      </Typography>
                      <Typography fontSize={14} fontWeight={900}>
                        {trustData.negativeReviewCount ?? 0}개
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Paper>
          )}
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

      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>이미지 보기</DialogTitle>
        {/* 이미지 중앙 정렬 및 최소 높이 확보 */}
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2, minHeight: '200px' }}>
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
      <Dialog
        open={openDeleteReplyDialog}
        onClose={closeDeleteReplyDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>답글 삭제</DialogTitle>

        <DialogContent>
          <Typography fontSize={14}>
            이 답글을 삭제할까요? 삭제하면 복구할 수 없습니다.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDeleteReplyDialog}>취소</Button>

          <Button color="error" variant="contained" onClick={removeInlineReply}>
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReceivedReviewInform;