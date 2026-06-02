import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  ArrowDownward,
  ArrowForward,
  CheckCircleOutline,
  ReceiptLongOutlined,
} from "@mui/icons-material";
import { postSearchFeesBasic } from "../api/estimateApi/estimateApi";
import { calculateDistanceBetweenAddresses } from "../layout/component/common/calculateDistanceBetweenAddresses";
import { useSelector } from "react-redux";
import Breadcrumb from "../components/Breadcrumb";

const initState = {
  startAddress: "",
  endAddress: "",
  cargoType: "",
  cargoWeight: "",
  totalCost: 0,
  distanceKm: "",
};

/* ── 공통 TextField sx ── */
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#fff",
  },
};

const QuickSearchPage = () => {
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState(initState);
  const [fees, setFees] = useState([]);
  const [baseCost, setBaseCost] = useState(0);
  const [distanceCost, setDistanceCost] = useState(0);
  const [exPrice, setExprice] = useState(0);
  const [openPrice, setOpenPrice] = useState(false);
  const [loading, setLoading] = useState(false);
  const { roles } = useSelector((state) => state.login);
  const isAdmin = roles.includes("ROLE_ADMIN");

  /* ── 요금표 로드 ── */
  useEffect(() => {
    postSearchFeesBasic()
      .then((data) => setFees(data))
      .catch((err) => console.error("데이터 로드 실패:", err));
  }, []);

  /* ── 요금 자동 계산 ── */
  useEffect(() => {
    const fee = fees.find((f) => f.weight === estimate.cargoWeight) || null;
    const dist = Number(estimate.distanceKm ?? 0);
    const base = Number(fee?.initialCharge ?? 0);
    const rate = Number(fee?.ratePerKm ?? 0);
    const distCost = dist * rate;
    const total = base + distCost;
    setBaseCost(base);
    setDistanceCost(distCost);
    setEstimate((prev) => ({
      ...prev,
      totalCost: total,
      baseCost: base,
      distanceCost: distCost,
    }));
    setExprice(total);
  }, [estimate.cargoWeight, estimate.distanceKm, fees]);

  /* ── Daum 주소 검색 ── */
  const handleAddressSearch = (setter) => {
    new window.daum.Postcode({
      oncomplete: function (data) {
        setter(data.address);
      },
    }).open();
  };

  /* ── 거리 계산 & 결과 표시 ── */
  const calculateDistance = async () => {
    setLoading(true);
    try {
      const km = await calculateDistanceBetweenAddresses(
        estimate.startAddress,
        estimate.endAddress
      );
      setEstimate((prev) => ({ ...prev, distanceKm: km }));
      setOpenPrice(true);
    } catch (err) {
      alert("거리 계산 중 문제가 발생했습니다. 주소를 다시 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  /* ── 다시 조회 ── */
  const handleReset = () => {
    setOpenPrice(false);
    setEstimate(initState);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">

        {/* ── 브레드크럼 ── */}
        <Breadcrumb label="간편조회" />

        {/* ── 헤더 ── */}
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 leading-tight">
            빠르게 운송 요금을 확인하세요
          </h1>
          <p className="text-gray-400 text-sm sm:text-base break-keep">
            출발지·도착지·화물 무게만 입력하면 즉시 예상 운임을 계산해드립니다
          </p>
        </div>

        {/* ── 2컬럼 레이아웃 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">

          {/* ── 좌측: 입력 폼 ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 h-full">
            <h2 className="text-base font-bold text-gray-800 mb-5">간편 견적 조회</h2>

            {/* 출발지 */}
            <TextField
              fullWidth
              placeholder="출발지 주소 검색"
              value={estimate.startAddress}
              InputProps={{
                readOnly: true,
                onClick: () =>
                  handleAddressSearch((addr) =>
                    setEstimate((prev) => ({ ...prev, startAddress: addr }))
                  ),
                sx: { cursor: "pointer" },
                startAdornment: (
                  <InputAdornment position="start">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex-shrink-0 whitespace-nowrap">
                      출발
                    </span>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddressSearch((addr) =>
                          setEstimate((prev) => ({ ...prev, startAddress: addr }))
                        );
                      }}
                    >
                      <SearchIcon sx={{ fontSize: 20, color: "#9ca3af" }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ ...fieldSx, mb: 1.5 }}
            />

            {/* 방향 화살표 */}
            <div className="flex justify-center my-1">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <ArrowDownward sx={{ fontSize: 16, color: "#6b7280" }} />
              </div>
            </div>

            {/* 도착지 */}
            <TextField
              fullWidth
              placeholder="도착지 주소 검색"
              value={estimate.endAddress}
              InputProps={{
                readOnly: true,
                onClick: () =>
                  handleAddressSearch((addr) =>
                    setEstimate((prev) => ({ ...prev, endAddress: addr }))
                  ),
                sx: { cursor: "pointer" },
                startAdornment: (
                  <InputAdornment position="start">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-semibold flex-shrink-0 whitespace-nowrap">
                      도착
                    </span>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddressSearch((addr) =>
                          setEstimate((prev) => ({ ...prev, endAddress: addr }))
                        );
                      }}
                    >
                      <SearchIcon sx={{ fontSize: 20, color: "#9ca3af" }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ ...fieldSx, mt: 1.5, mb: 3 }}
            />

            {/* 화물 무게 */}
            <FormControl
              fullWidth
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": { borderRadius: "12px" },
              }}
            >
              <InputLabel id="cargo-fee-label">화물 무게</InputLabel>
              <Select
                labelId="cargo-fee-label"
                label="화물 무게"
                value={estimate.cargoWeight || ""}
                onChange={(e) =>
                  setEstimate((prev) => ({ ...prev, cargoWeight: e.target.value }))
                }
              >
                {fees && fees.length > 0 ? (
                  fees.map((fee) => (
                    <MenuItem key={fee.tno} value={fee.weight}>
                      {fee.weight}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>데이터를 불러오는 중입니다...</MenuItem>
                )}
              </Select>
            </FormControl>

            {/* 안내 문구 */}
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              주소 및 화물 무게를 입력 후 조회하기 버튼을 눌러주세요
            </p>

            {/* 조회하기 버튼 */}
            <Button
              fullWidth
              variant="contained"
              onClick={calculateDistance}
              disabled={loading}
              sx={{
                height: 52,
                borderRadius: "12px",
                backgroundColor: "#DC2626",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "16px",
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "#B91C1C",
                  boxShadow: "0 4px 14px rgba(220,38,38,0.3)",
                },
                "&:disabled": { backgroundColor: "#e5e7eb", color: "#9ca3af" },
              }}
            >
              {loading ? "계산 중..." : "조회하기"}
            </Button>
          </div>

          {/* ── 우측: 결과 카드 or 빈 상태 ── */}
          {!openPrice ? (

            /* 조회 전 — 플레이스홀더 */
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center h-full min-h-[360px] p-8 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <ReceiptLongOutlined sx={{ fontSize: 28, color: "#d1d5db" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-400 mb-1">
                  견적을 조회하면
                </p>
                <p className="text-sm text-gray-400">
                  예상 운임이 여기에 표시됩니다
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-[200px]">
                {["출발지 입력", "도착지 입력", "화물 무게 선택"].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-xs text-gray-400">{step}</p>
                  </div>
                ))}
              </div>
            </div>

          ) : (

            /* 조회 후 — 결과 카드 */
            <div className="flex flex-col gap-4 h-full">

              {/* 다크 결과 카드 */}
              <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 text-white">
                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mb-5">
                  예상 견적 결과
                </p>

                {/* 경로 요약 */}
                <div className="flex items-start gap-3 mb-6">
                  <div className="flex flex-col items-center gap-0.5 pt-1 flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    <div className="w-px h-7 bg-gray-600" />
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  </div>
                  <div className="flex flex-col gap-3 flex-1 min-w-0">
                    <p className="text-sm text-gray-300 leading-snug break-keep">
                      {estimate.startAddress || "출발지"}
                    </p>
                    <p className="text-sm text-gray-300 leading-snug break-keep">
                      {estimate.endAddress || "도착지"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] text-gray-500 mb-0.5">거리</p>
                    <p className="text-sm font-bold text-gray-200">
                      {Number(estimate.distanceKm).toFixed(1)} km
                    </p>
                  </div>
                </div>

                {/* 금액 강조 */}
                <div className="border-t border-gray-700 pt-5">
                  <p className="text-xs text-gray-500 mb-2">예상 견적</p>
                  <p className="text-4xl sm:text-5xl font-black text-white leading-none">
                    {Number(exPrice).toLocaleString()}
                    <span className="text-lg sm:text-xl font-semibold text-gray-400 ml-2">원</span>
                  </p>

                  {/* 요금 breakdown */}
                  {baseCost > 0 && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="text-xs text-gray-500">
                        기본요금 {Number(baseCost).toLocaleString()}원
                      </span>
                      {distanceCost > 0 && (
                        <span className="text-xs text-gray-500">
                          거리요금 {Number(distanceCost).toLocaleString()}원
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-gray-600 mt-3 leading-relaxed">
                    본 금액은 예상 견적이며 실제 금액과 차이가 있을 수 있습니다
                  </p>
                </div>
              </div>

              {/* CTA 버튼 */}
              <Button
                fullWidth
                variant="contained"
                onClick={() =>
                  navigate("/estimatepage", {
                    state: {
                      startAddress: estimate.startAddress,
                      endAddress: estimate.endAddress,
                    },
                  })
                }
                endIcon={<ArrowForward />}
                sx={{
                  height: 52,
                  borderRadius: "12px",
                  backgroundColor: "#DC2626",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "15px",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "#B91C1C",
                    boxShadow: "0 6px 20px rgba(220,38,38,0.4)",
                  },
                }}
              >
                지금 바로 접수하기
              </Button>

              {/* 혜택 체크리스트 */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2.5">
                {[
                  "접수 즉시 담당 기사 배정",
                  "실시간 운송 현황 확인",
                  "안전한 화물 보험 적용",
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircleOutline sx={{ fontSize: 16, color: "#DC2626" }} />
                    <p className="text-xs font-medium text-gray-700">{text}</p>
                  </div>
                ))}
              </div>

              {/* 다시 조회 */}
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-center underline underline-offset-2"
              >
                다시 조회하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickSearchPage;
