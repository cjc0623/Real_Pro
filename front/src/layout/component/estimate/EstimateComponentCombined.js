import React, { useState, useEffect, useRef } from "react";
import {
    TextField, Button, Stack, Select, MenuItem,
    FormControl, InputLabel, OutlinedInput, Checkbox, ListItemText,
    Box, IconButton, InputAdornment, useMediaQuery, useTheme,
    Dialog, DialogActions, DialogContent,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KakaoMapViewer from "./KakaoMapViewer";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { postAdd, postSearchFeesBasic, postSearchFeesExtra } from "../../../api/estimateApi/estimateApi";
import useCustomMove from "../../../hooks/useCustomMove";
import { calculateDistanceBetweenAddresses } from "../common/calculateDistanceBetweenAddresses";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { isCurrentUserAdmin } from "../../../utils/jwtUtils";
import { getCurrentUserInfo } from "../../../utils/jwtUtils";

const tomorrowStart = dayjs().add(1, "day").hour(9).minute(0).second(0).millisecond(0);

const initState = {
    startAddress: "",
    endAddress: "",
    cargoType: "",
    cargoWeight: "",
    startTime: tomorrowStart,
    totalCost: 0,
    distanceKm: "",
    baseCost: 0,
    distanceCost: 0,
    specialOption: 0,
};

/* ── 공통 sx ── */
const fieldSx = {
    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
};
const cardSx = {
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    p: 3,
    bgcolor: "#ffffff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

const EstimateComponentCombined = () => {
    const [fees, setFees] = useState([]);
    const [extra, setExtra] = useState([]);
    const [estimate, setEstimate] = useState(initState);
    const [specialNotes, setSpecialNotes] = useState([]);
    const [specialNoteCost, setSpecialNoteCost] = useState(0);
    const [baseCost, setBaseCost] = useState(0);
    const [distanceCost, setDistanceCost] = useState(0);
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [openEstimateSend, setOpenEstimateSend] = useState(false);
    const [specialMenuOpen, setSpecialMenuOpen] = useState(false);
    const { moveToHome } = useCustomMove();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const navigate = useNavigate();
    const { roles, email } = useSelector((state) => state.login);
    const authChecked = useRef(false);
    const isAdmin = isCurrentUserAdmin();
    const mapRef = useRef(null);

    useEffect(() => {
        if (authChecked.current) return;

        const token = sessionStorage.getItem("accessToken");
        if (!token) {
            authChecked.current = true;
            alert("로그인이 필요합니다.");
            navigate("/", { replace: true });
            return;
        }

        if (roles.length === 0) return;

        authChecked.current = true;

        const isShipper = roles.includes("ROLE_SHIPPER");
        if (!isShipper && !isAdmin) {
            alert("일반회원만 주문이 가능합니다.");
            navigate("/", { replace: true });
            return;
        }

        postSearchFeesBasic().then(setFees).catch(() => { });
        postSearchFeesExtra().then(setExtra).catch(() => { });
    }, [roles, email, navigate]);

    useEffect(() => {
        const fee = fees.find((f) => f.weight === estimate.cargoWeight) || null;
        const base = fee ? Number(fee.initialCharge) : 0;
        const distCost = estimate.distanceKm * (fee ? Number(fee.ratePerKm) : 0);
        const extraCost = specialNotes.reduce((sum, n) => sum + n.extraCharge, 0);
        setBaseCost(base);
        setDistanceCost(distCost);
        setSpecialNoteCost(extraCost);
        setEstimate((prev) => ({
            ...prev,
            totalCost: base + distCost + extraCost,
            baseCost: base,
            distanceCost: distCost,
            specialOption: extraCost,
        }));
    }, [estimate.cargoWeight, estimate.distanceKm, specialNotes, fees]);

    const handleSpecialNoteChange = (e) => {
        const selected = extra.filter((n) => e.target.value.includes(n.extraChargeTitle));
        setSpecialMenuOpen(false);
        setSpecialNotes(selected);
    };

    const handleAddressSearch = (setter) => {
        new window.daum.Postcode({ oncomplete: (data) => setter(data.address) }).open();
    };

    const calculateDistance = async () => {
        try {
            const km = await calculateDistanceBetweenAddresses(estimate.startAddress, estimate.endAddress);
            setEstimate((prev) => ({ ...prev, distanceKm: km }));
        } catch {
            alert("거리 계산 중 문제가 발생했습니다. 주소를 다시 확인해주세요.");
        }
    };

    const handleClickAdd = () => {
        if (!estimate.distanceKm) { alert("예상거리를 입력해주세요"); setOpenEstimateSend(false); return; }
        if (!estimate.cargoType) { alert("화물종류를 입력해주세요"); setOpenEstimateSend(false); return; }
        if (!estimate.cargoWeight) { alert("화물무게를 입력해주세요"); setOpenEstimateSend(false); return; }
        const estimateToSend = { ...estimate, startTime: estimate.startTime.format("YYYY-MM-DDTHH:mm:ss") };
        postAdd(estimateToSend).then(() => { alert("견적서 제출이 완료되었습니다."); moveToHome(); });
    };

    const handleChangeEstimate = (e) => setEstimate((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    const isInvalidHour = (data) => data.hour() < 9 || data.hour() > 16;
    const isBeforeMinDateTime = (date) => date.isBefore(dayjs().add(24, "hour").startOf("day"));

    /* ── 출발지·도착지 둘 다 입력되면 자동으로 거리 계산 ── */
    useEffect(() => {
        if (!estimate.startAddress || !estimate.endAddress) return;
        calculateDistanceBetweenAddresses(estimate.startAddress, estimate.endAddress)
            .then((km) => setEstimate((prev) => ({ ...prev, distanceKm: km })))
            .catch(() => {}); // 자동 계산 실패는 조용히 무시
    }, [estimate.startAddress, estimate.endAddress]);

    return (
        <Box sx={{ py: 3 }}>
            <Box sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 3,
                alignItems: isMobile ? "stretch" : "stretch",
            }}>

                {/* ── 좌측: 입력 폼 ── */}
                <Box sx={{ width: isMobile ? "100%" : 460, flexShrink: 0, ...cardSx }}>

                    <h2 className="text-lg font-black text-gray-900 text-center mb-5">
                        견적서 작성
                    </h2>

                    <Stack spacing={2}>

                        {/* 출발지 */}
                        <TextField
                            label="출발지 주소"
                            value={estimate.startAddress}
                            fullWidth
                            sx={fieldSx}
                            InputProps={{
                                readOnly: true,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => handleAddressSearch((addr) =>
                                            setEstimate((prev) => ({ ...prev, startAddress: addr }))
                                        )}>
                                            <SearchIcon sx={{ fontSize: 20, color: "#9ca3af" }} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {/* 도착지 */}
                        <TextField
                            label="도착지 주소"
                            value={estimate.endAddress}
                            fullWidth
                            sx={fieldSx}
                            InputProps={{
                                readOnly: true,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => handleAddressSearch((addr) =>
                                            setEstimate((prev) => ({ ...prev, endAddress: addr }))
                                        )}>
                                            <SearchIcon sx={{ fontSize: 20, color: "#9ca3af" }} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {/* 예상 거리 (읽기 전용) */}
                        <TextField
                            label="예상 거리(km)"
                            value={estimate.distanceKm}
                            InputProps={{ readOnly: true }}
                            fullWidth
                            sx={fieldSx}
                        />

                        {/* 거리 계산 버튼 — 필드 아래 분리 배치 */}
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={calculateDistance}
                            sx={{
                                height: 46,
                                borderRadius: "10px",
                                borderColor: "#d1d5db",
                                color: "#374151",
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "14px",
                                "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" },
                            }}
                        >
                            거리 계산
                        </Button>

                        {/* 화물 종류 */}
                        <TextField
                            label="화물 종류"
                            name="cargoType"
                            value={estimate.cargoType}
                            onChange={handleChangeEstimate}
                            fullWidth
                            sx={fieldSx}
                        />

                        {/* 화물 무게 */}
                        <FormControl fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}>
                            <InputLabel id="cargo-fee-label">화물 무게</InputLabel>
                            <Select
                                labelId="cargo-fee-label"
                                label="화물 무게"
                                value={estimate.cargoWeight || ""}
                                onChange={(e) => setEstimate((prev) => ({ ...prev, cargoWeight: e.target.value }))}
                            >
                                {fees.map((fee) => (
                                    <MenuItem key={fee.tno} value={fee.weight}>{fee.weight}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* 예약 시간 */}
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateTimePicker
                                label="예약 시간"
                                value={estimate.startTime}
                                minDateTime={tomorrowStart}
                                shouldDisableDate={(data) => isBeforeMinDateTime(data.hour(9))}
                                shouldDisableTime={(value, clockType) => clockType === "hours" && isInvalidHour(value)}
                                onChange={(newTime) => setEstimate((prev) => ({ ...prev, startTime: newTime }))}
                                format="YYYY년 MM월 DD일 A hh:mm"
                                closeOnSelect={false}
                                renderInput={(params) => <TextField {...params} fullWidth sx={fieldSx} />}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                            />
                        </LocalizationProvider>

                        {/* 특이사항 */}
                        <FormControl fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}>
                            <InputLabel>특이사항 선택</InputLabel>
                            <Select
                                multiple
                                input={<OutlinedInput label="특이사항 선택" />}
                                value={specialNotes.map((n) => n.extraChargeTitle)}
                                open={specialMenuOpen}
                                onOpen={() => setSpecialMenuOpen(true)}
                                onClose={() => setSpecialMenuOpen(false)}
                                onChange={handleSpecialNoteChange}
                                renderValue={(selected) => selected.join(", ")}
                            >
                                {extra.map((opt) => (
                                    <MenuItem key={opt.extraChargeTitle} value={opt.extraChargeTitle}>
                                        <Checkbox checked={specialNotes.some((n) => n.extraChargeTitle === opt.extraChargeTitle)} />
                                        <ListItemText primary={`${opt.extraChargeTitle} +${opt.extraCharge.toLocaleString()}원`} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* 선택된 특이사항 목록 */}
                        {specialNotes.length > 0 && (
                            <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                                {specialNotes.map((note) => (
                                    <p key={note.extraChargeTitle} className="text-xs text-gray-600 py-0.5">
                                        {note.extraChargeTitle}: +{note.extraCharge.toLocaleString()}원
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* ── 하단 버튼 ── */}
                        <div className="flex gap-2 pt-2">
                            {/* 견적서 제출 — 빨간 */}
                            <Button
                                variant="contained"
                                onClick={() => setOpenEstimateSend(true)}
                                disabled={isAdmin === true}
                                sx={{
                                    flex: 1,
                                    height: 48,
                                    borderRadius: "10px",
                                    backgroundColor: "#DC2626",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: "14px",
                                    boxShadow: "none",
                                    "&:hover:not(:disabled)": {
                                        backgroundColor: "#B91C1C",
                                        boxShadow: "0 4px 14px rgba(220,38,38,0.3)",
                                    },
                                    "&:disabled": { backgroundColor: "#e5e7eb", color: "#9ca3af" },
                                }}
                            >
                                견적서 제출
                            </Button>

                            {/* 취소 — 아웃라인 */}
                            <Button
                                variant="outlined"
                                onClick={() => setOpenCancelDialog(true)}
                                sx={{
                                    flex: 1,
                                    height: 48,
                                    borderRadius: "10px",
                                    borderColor: "#d1d5db",
                                    color: "#6b7280",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" },
                                }}
                            >
                                취소
                            </Button>
                        </div>
                    </Stack>
                </Box>

                {/* ── 우측: 지도 + 금액 ── */}
                <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <Stack spacing={3} sx={{ flex: 1 }}>

                        {/* 경로 지도 카드 — 상단, 남은 높이 전부 채움 */}
                        <Box sx={{ ...cardSx, flex: 1, display: "flex", flexDirection: "column" }}>
                            {/* 헤더: 제목 좌측, 초기화 우측 */}
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-bold text-gray-900">경로 지도</p>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                        setEstimate((prev) => ({
                                            ...prev,
                                            startAddress: "",
                                            endAddress: "",
                                            distanceKm: "",
                                        }));
                                        mapRef.current?.reset();
                                    }}
                                    sx={{
                                        borderRadius: "8px",
                                        borderColor: "#d1d5db",
                                        color: "#6b7280",
                                        textTransform: "none",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        px: 1.5,
                                        py: 0.5,
                                        "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" },
                                    }}
                                >
                                    주소 초기화
                                </Button>
                            </div>

                            <Box sx={{ flex: 1, minHeight: 300 }}>
                                <KakaoMapViewer
                                    ref={mapRef}
                                    startAddress={estimate.startAddress}
                                    endAddress={estimate.endAddress}
                                    onAddressSelect={(type, addr) => {
                                        setEstimate((prev) => ({
                                            ...prev,
                                            [`${type}Address`]: addr,
                                        }));
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* 금액 산정 카드 — 하단 고정 */}
                        <Box sx={cardSx}>
                            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mb-4">
                                금액 산정
                            </p>

                            {/* 요금 3분할 미니 카드 */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                                    <p className="text-[11px] text-gray-400 mb-1.5">기본 요금</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {baseCost.toLocaleString()}
                                        <span className="text-xs font-normal text-gray-500 ml-0.5">원</span>
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                                    <p className="text-[11px] text-gray-400 mb-1.5">거리 요금</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {distanceCost.toLocaleString()}
                                        <span className="text-xs font-normal text-gray-500 ml-0.5">원</span>
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                                    <p className="text-[11px] text-gray-400 mb-1.5">추가 요금</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {specialNoteCost.toLocaleString()}
                                        <span className="text-xs font-normal text-gray-500 ml-0.5">원</span>
                                    </p>
                                </div>
                            </div>

                            {/* 총 금액 강조 */}
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-[11px] text-gray-400 mb-1.5">총 금액</p>
                                <p className="text-4xl font-black text-gray-900 leading-none">
                                    {estimate.totalCost.toLocaleString()}
                                    <span className="text-lg font-semibold text-gray-500 ml-1.5">원</span>
                                </p>
                                <p className="text-[11px] text-gray-400 mt-2">
                                    예상 금액이며 실제 금액과 차이가 있을 수 있습니다
                                </p>
                            </div>
                        </Box>

                    </Stack>
                </Box>
            </Box>

            {/* ── 취소 다이얼로그 ── */}
            <Dialog
                open={openCancelDialog}
                onClose={() => setOpenCancelDialog(false)}
                PaperProps={{ sx: { width: 400, borderRadius: "16px", p: 1 } }}
            >
                <DialogContent>
                    <p className="text-lg font-bold text-gray-900 mb-1">작성을 취소하시겠습니까?</p>
                    <p className="text-sm text-gray-400">입력한 내용이 모두 사라집니다.</p>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                    <Button
                        onClick={() => setOpenCancelDialog(false)}
                        variant="outlined"
                        sx={{
                            borderRadius: "8px",
                            borderColor: "#d1d5db",
                            color: "#6b7280",
                            textTransform: "none",
                            fontWeight: 600,
                            "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" },
                        }}
                    >
                        아니요
                    </Button>
                    <Button
                        onClick={() => { setOpenCancelDialog(false); moveToHome(); }}
                        variant="contained"
                        sx={{
                            borderRadius: "8px",
                            backgroundColor: "#DC2626",
                            textTransform: "none",
                            fontWeight: 700,
                            boxShadow: "none",
                            "&:hover": { backgroundColor: "#B91C1C" },
                        }}
                    >
                        확인
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── 제출 다이얼로그 ── */}
            <Dialog
                open={openEstimateSend}
                onClose={() => setOpenEstimateSend(false)}
                PaperProps={{ sx: { width: 400, borderRadius: "16px", p: 1 } }}
            >
                <DialogContent>
                    <p className="text-lg font-bold text-gray-900 mb-1">견적을 제출하시겠습니까?</p>
                    <p className="text-sm text-gray-400">
                        견적 내용과 틀리면 배송이 거절될 수 있습니다.
                    </p>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                    <Button
                        onClick={() => setOpenEstimateSend(false)}
                        variant="outlined"
                        sx={{
                            borderRadius: "8px",
                            borderColor: "#d1d5db",
                            color: "#6b7280",
                            textTransform: "none",
                            fontWeight: 600,
                            "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" },
                        }}
                    >
                        아니요
                    </Button>
                    <Button
                        onClick={handleClickAdd}
                        variant="contained"
                        sx={{
                            borderRadius: "8px",
                            backgroundColor: "#DC2626",
                            textTransform: "none",
                            fontWeight: 700,
                            boxShadow: "none",
                            "&:hover": { backgroundColor: "#B91C1C" },
                        }}
                    >
                        확인
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EstimateComponentCombined;
