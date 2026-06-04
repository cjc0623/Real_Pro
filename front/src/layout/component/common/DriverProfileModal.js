import React, { useEffect, useState } from "react";
import {
  Avatar, Box, Chip, Dialog, DialogContent, Divider, IconButton,
  Rating, Stack, Typography, CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VerifiedIcon from "@mui/icons-material/Verified";
import { getDriverDetail } from "../../../api/reviewApi/reviewApi";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";
const DEFAULT_AVATAR = "/image/placeholders/avatar.svg";

const normalizeProfileUrl = (v) => {
  if (!v) return null;
  if (v.startsWith("http")) return v;
  if (v.startsWith("/g2i4/uploads/")) return `${API_BASE}${v}`;
  return `${API_BASE}/g2i4/uploads/user_profile/${encodeURIComponent(v)}`;
};

const formatDate = (v) => (v ? String(v).slice(0, 10) : "-");

/**
 * 차주 공개 프로필 모달.
 * - 화주가 승인 화면에서 차주명 클릭 시 표시(승인 전 확인).
 * - 카드(이름/이미지/평점/인증) + 차주가 받은 리뷰 목록.
 */
const DriverProfileModal = ({ open, cargoId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!open || !cargoId) return;
    let ignore = false;

    (async () => {
      setLoading(true);
      try {
        const data = await getDriverDetail(cargoId);
        if (!ignore) {
          setProfile(data?.profile ?? null);
          setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
        }
      } catch (e) {
        if (!ignore) {
          setProfile(null);
          setReviews([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [open, cargoId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: "20px" } }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", px: 2, pt: 1.5 }}>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : !profile ? (
          <Box sx={{ py: 8, textAlign: "center", color: "#94a3b8" }}>
            <Typography>기사 정보를 불러올 수 없습니다.</Typography>
          </Box>
        ) : (
          <Box sx={{ px: { xs: 3, sm: 4 }, pb: 4 }}>
            {/* 프로필 카드 */}
            <Stack alignItems="center" spacing={1.0} sx={{ mb: 3 }}>
              <Avatar
                src={normalizeProfileUrl(profile.driverProfileImage) || DEFAULT_AVATAR}
                alt={profile.driverName || "기사님"}
                sx={{ width: 88, height: 88, border: "2px solid #e5e7eb" }}
                imgProps={{ onError: (e) => { e.currentTarget.src = DEFAULT_AVATAR; } }}
              />
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Typography variant="h6" fontWeight="bold" color="#0f172a">
                  {profile.driverName || "-"}
                </Typography>
                {profile.isVerified && (
                  <Chip
                    icon={<VerifiedIcon sx={{ fontSize: 16 }} />}
                    label="본인인증"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ height: 22, fontSize: "0.7rem" }}
                  />
                )}
              </Stack>
              <Typography variant="body2" color="#64748b">
                {profile.driverId}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Rating value={Number(profile.avgRating) || 0} precision={0.5} readOnly size="small" sx={{ color: "#ffb700" }} />
                <Typography variant="body2" fontWeight="700" color="#334155">
                  {Number(profile.avgRating || 0).toFixed(1)}
                </Typography>
                <Typography variant="caption" color="#94a3b8">
                  (리뷰 {Number(profile.reviewCount || 0)}개)
                </Typography>
              </Stack>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {/* 받은 리뷰 */}
            <Typography variant="subtitle1" fontWeight="bold" color="#1e293b" sx={{ mb: 1.5 }}>
              받은 리뷰 {reviews.length}개
            </Typography>

            {reviews.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center", color: "#94a3b8" }}>
                <Typography variant="body2">받은 리뷰가 없습니다.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5} sx={{ maxHeight: 320, overflowY: "auto", pr: 0.5 }}>
                {reviews.map((rv) => (
                  <Box
                    key={rv.reviewNo}
                    sx={{ p: 2, borderRadius: "14px", border: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="700" color="#334155">
                        {rv.writerName ?? "익명"}
                      </Typography>
                      <Typography variant="caption" color="#94a3b8">
                        {formatDate(rv.createdAt)}
                      </Typography>
                    </Box>
                    <Rating value={Number(rv.rating) || 0} precision={0.5} readOnly size="small" sx={{ color: "#ffb700" }} />
                    <Typography variant="body2" color="#475569" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                      {rv.comment}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DriverProfileModal;
