import React, { useEffect, useState } from "react";
import {
  Avatar, Box, Dialog, DialogContent, Divider, IconButton,
  Rating, Stack, Typography, CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { getShipperProfileCard } from "../../../api/userinfoApi/userInfoApi";
import { getShipperWrittenReviews } from "../../../api/reviewApi/reviewApi";

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
 * 화주 공개 프로필 모달.
 * - 차주가 운송접수목록에서 화주 아이디 클릭 시 표시.
 * - 카드(이름/이미지/가입일) + 화주가 작성한 리뷰 목록.
 */
const ShipperProfileModal = ({ open, memId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!open || !memId) return;
    let ignore = false;

    (async () => {
      setLoading(true);
      try {
        const [c, r] = await Promise.all([
          getShipperProfileCard(memId),
          getShipperWrittenReviews(memId).catch(() => []),
        ]);
        if (!ignore) {
          setCard(c);
          setReviews(Array.isArray(r) ? r : []);
        }
      } catch (e) {
        if (!ignore) {
          setCard(null);
          setReviews([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [open, memId]);

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
        ) : !card ? (
          <Box sx={{ py: 8, textAlign: "center", color: "#94a3b8" }}>
            <Typography>화주 정보를 불러올 수 없습니다.</Typography>
          </Box>
        ) : (
          <Box sx={{ px: { xs: 3, sm: 4 }, pb: 4 }}>
            {/* 프로필 카드 */}
            <Stack alignItems="center" spacing={1.2} sx={{ mb: 3 }}>
              <Avatar
                src={normalizeProfileUrl(card.memberProfileImage) || DEFAULT_AVATAR}
                alt={card.memberName || "화주"}
                sx={{ width: 88, height: 88, border: "2px solid #e5e7eb" }}
                imgProps={{ onError: (e) => { e.currentTarget.src = DEFAULT_AVATAR; } }}
              />
              <Typography variant="h6" fontWeight="bold" color="#0f172a">
                {card.memberName || "-"}
              </Typography>
              <Typography variant="body2" color="#64748b">
                {card.memberId}
              </Typography>
              <Typography variant="caption" color="#94a3b8">
                가입일 {formatDate(card.createdAt)}
              </Typography>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {/* 작성한 리뷰 */}
            <Typography variant="subtitle1" fontWeight="bold" color="#1e293b" sx={{ mb: 1.5 }}>
              작성한 리뷰 {reviews.length}개
            </Typography>

            {reviews.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center", color: "#94a3b8" }}>
                <Typography variant="body2">작성한 리뷰가 없습니다.</Typography>
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
                        기사님: {rv.driverName ?? "-"}
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

export default ShipperProfileModal;
