import React, { useEffect, useState, useMemo } from "react";
import {
  Avatar, Box, Chip, InputAdornment, Rating, TextField,
  Typography, CircularProgress, Button, ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { getDrivers } from "../../../api/directRequestApi/directRequestApi";
import DriverProfileModal from "./DriverProfileModal";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";
const DEFAULT_AVATAR = "/image/placeholders/avatar.svg";

const normalizeProfileUrl = (v) => {
  if (!v) return null;
  if (v.startsWith("http")) return v;
  if (v.startsWith("/g2i4/uploads/")) return `${API_BASE}${v}`;
  return `${API_BASE}/g2i4/uploads/user_profile/${encodeURIComponent(v)}`;
};

/**
 * 화주가 직접요청 보낼 차주를 검색·선택하는 컴포넌트 (다중 선택).
 * - 평점/리뷰수/본인인증 요약 카드 목록
 * - 카드 클릭 → 선택 토글, "상세" → 프로필+리뷰 모달
 * props: selectedIds(string[]), onToggle(cargoId, driverName)
 */
const DriverSearchSelect = ({ selectedIds = [], onToggle, isMobile = false }) => {
  const [keyword, setKeyword] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [sortKey, setSortKey] = useState("rating"); // rating | reviews | name

  // 클라이언트 측 정렬 (목록이 한 번에 내려오므로 백엔드 변경 불필요)
  const sortedDrivers = useMemo(() => {
    const arr = [...drivers];
    if (sortKey === "rating") {
      arr.sort((a, b) =>
        (Number(b.avgRating) || 0) - (Number(a.avgRating) || 0) ||
        (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0)
      );
    } else if (sortKey === "reviews") {
      arr.sort((a, b) =>
        (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0) ||
        (Number(b.avgRating) || 0) - (Number(a.avgRating) || 0)
      );
    } else if (sortKey === "name") {
      arr.sort((a, b) =>
        (a.driverName || a.driverId || "").localeCompare(b.driverName || b.driverId || "", "ko")
      );
    }
    return arr;
  }, [drivers, sortKey]);

  const fetchDrivers = async (kw = "") => {
    setLoading(true);
    try {
      const data = await getDrivers({ keyword: kw, requireVehicle: true });
      setDrivers(Array.isArray(data) ? data : []);
    } catch {
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers("");
  }, []);

  const handleSearch = () => fetchDrivers(keyword);

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        placeholder="차주 이름 검색"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
        sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Button onClick={handleSearch} size="small" sx={{ minWidth: 0 }}>
                <SearchIcon sx={{ fontSize: 20, color: "#9ca3af" }} />
              </Button>
            </InputAdornment>
          ),
        }}
      />

      {!loading && drivers.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: "#9ca3af", fontWeight: 600 }}>정렬</Typography>
          <ToggleButtonGroup
            value={sortKey}
            exclusive
            size="small"
            onChange={(e, v) => v && setSortKey(v)}
            sx={{
              gap: 0.8,
              "& .MuiToggleButtonGroup-grouped": {
                border: "1px solid #e5e7eb !important",
                borderRadius: "999px !important",
                mx: 0,
              },
              "& .MuiToggleButton-root": {
                textTransform: "none",
                py: 0.4,
                px: 1.6,
                fontSize: "12px",
                lineHeight: 1.2,
                color: "#64748b",
                "&:hover": { bgcolor: "#f8fafc" },
                "&.Mui-selected": {
                  color: "#2563eb",
                  bgcolor: "#eff6ff",
                  borderColor: "#bfdbfe !important",
                  "&:hover": { bgcolor: "#dbeafe" },
                },
              },
            }}
          >
            <ToggleButton value="rating">평점순</ToggleButton>
            <ToggleButton value="reviews">리뷰순</ToggleButton>
            <ToggleButton value="name">이름순</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress size={28} />
        </Box>
      ) : drivers.length === 0 ? (
        <Box sx={{ py: 5, textAlign: "center", color: "#94a3b8" }}>
          <Typography variant="body2">요청 가능한 차주가 없습니다.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, ...(isMobile ? {} : { maxHeight: 360, overflowY: "auto", pr: 0.5 }) }}>
          {sortedDrivers.map((d) => {
            const selected = selectedIds.includes(d.driverId);
            return (
              <Box
                key={d.driverId}
                onClick={() => onToggle(d.driverId, d.driverName)}
                sx={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: "14px",
                  border: selected ? "2px solid #2563eb" : "1px solid #e5e7eb",
                  bgcolor: selected ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                  transition: "all .15s",
                  "&:hover": { borderColor: "#93c5fd", bgcolor: "#f8fafc" },
                }}
              >
                {/* 선택 체크: 카드 우상단 절대배치 → 가로 폭 점유 안 함 */}
                {selected && (
                  <CheckCircleIcon
                    sx={{ position: "absolute", top: 8, right: 8, color: "#2563eb", fontSize: 20 }}
                  />
                )}

                <Avatar
                  src={normalizeProfileUrl(d.driverProfileImage) || DEFAULT_AVATAR}
                  alt={d.driverName}
                  sx={{ width: 46, height: 46, flexShrink: 0, border: "1px solid #e5e7eb" }}
                  imgProps={{ onError: (e) => { e.currentTarget.src = DEFAULT_AVATAR; } }}
                />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.7, pr: selected ? 3 : 0 }}>
                    <Typography fontWeight={700} color="#0f172a" noWrap>
                      {d.driverName || d.driverId}
                    </Typography>
                    {d.isVerified && (
                      <Chip
                        icon={<VerifiedIcon sx={{ fontSize: 14 }} />}
                        label="인증"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ height: 20, fontSize: "0.65rem", flexShrink: 0 }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.3 }}>
                    <Rating value={Number(d.avgRating) || 0} precision={0.5} readOnly size="small" sx={{ color: "#ffb700" }} />
                    <Typography variant="caption" color="#64748b" sx={{ whiteSpace: "nowrap" }}>
                      {Number(d.avgRating || 0).toFixed(1)} · 리뷰 {Number(d.reviewCount || 0)}개
                    </Typography>
                  </Box>
                </Box>

                {/* 상세: 작은 고정폭 칩 버튼 → 텍스트 칸을 잠식하지 않음 */}
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => { e.stopPropagation(); setDetailId(d.driverId); }}
                  sx={{
                    flexShrink: 0,
                    minWidth: 0,
                    px: 1.4,
                    py: 0.4,
                    borderRadius: "999px",
                    textTransform: "none",
                    fontSize: "12px",
                    color: "#2563eb",
                    borderColor: "#bfdbfe",
                    "&:hover": { borderColor: "#93c5fd", bgcolor: "#eff6ff" },
                  }}
                >
                  상세
                </Button>
              </Box>
            );
          })}
        </Box>
      )}

      <DriverProfileModal
        open={!!detailId}
        cargoId={detailId}
        onClose={() => setDetailId(null)}
      />
    </Box>
  );
};

export default DriverSearchSelect;
