import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  Stack,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import { useLocation } from "react-router-dom";
import { postOrderPome } from "../../../api/orderAPI/orderApi";

const MAX_W = 720;

const serverInitState = {
  ordererName: "",
  ordererPhone: "",
  ordererEmail: "",
  startAddress: "",
  endAddress: "",
  startRestAddress: "",
  endRestAddress: "",
  addressee: "",
  addresseeEmail: "",
  receiverPhone: "",
  baseCost: "",
  distanceCost: "",
  specialOptionCost: "",
  totalCost: "",
  distanceDiscount: 0, // [추가] 거리 할인 필드 초기값
  matchingNo: "",
};

// ===== 인쇄 핸들러 =====
const handlePrint = () => {
  window.print();
};

const splitPhone = (raw) => {
  const d = (raw ?? "").replace(/\D/g, "");
  if (!d) return ["", "", ""];
  if (d.startsWith("02") && (d.length === 9 || d.length === 10)) {
    return d.length === 9
      ? [d.slice(0, 2), d.slice(2, 5), d.slice(5)]
      : [d.slice(0, 2), d.slice(2, 6), d.slice(6)];
  }
  if (d.length === 11) return [d.slice(0, 3), d.slice(3, 7), d.slice(7)];
  if (d.length === 10) return [d.slice(0, 3), d.slice(3, 6), d.slice(6)];
  return [d.slice(0, 3), d.slice(3, d.length - 4), d.slice(-4)];
};

const joinPhone = (raw) => {
  const [a, b, c] = splitPhone(raw);
  return [a, b, c].filter(Boolean).join("-") || "";
};

const toCurrency = (v) => {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("ko-KR");
};

// 라벨-값 한 줄 : 모바일은 세로, 태블릿 이상은 가로
const Row = ({ label, children, last }) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    spacing={{ xs: 0.25, sm: 2 }}
    sx={{
      py: 1.25,
      borderBottom: last ? "none" : "1px solid #f3f4f6",
    }}
  >
    <Box
      sx={{
        width: { xs: "100%", sm: 130 },
        flexShrink: 0,
        textAlign: { xs: "left", sm: "right" },
        color: "#9ca3af",
        fontSize: { xs: 13, sm: 14 },
      }}
    >
      {label}
    </Box>
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        fontWeight: 600,
        fontSize: 14,
        color: "#111827",
        wordBreak: "break-all",
        whiteSpace: "pre-wrap",
      }}
    >
      {children}
    </Box>
  </Stack>
);

const SectionTitle = ({ children }) => (
  <Box sx={{ width: "100%", maxWidth: MAX_W, mx: "auto", mb: 1.25, mt: 0.5 }}>
    <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>
      {children}
    </Typography>
  </Box>
);

const cardSx = {
  width: "100%",
  maxWidth: MAX_W,
  mx: "auto",
  mb: 4,
  borderRadius: "14px",
  border: "1px solid #f3f4f6",
  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
  bgcolor: "#fff",
  p: { xs: 2.5, sm: 3 },
};

const OrderSummaryReadOnly = () => {
  const { state } = useLocation();
  const matchingNo = state?.matchingNo;
  const passedOrderSheet = state?.orderSheet;

  const [serverData, setServerData] = useState(serverInitState);

  // ===== 인쇄 CSS 한 번만 삽입 =====
  useEffect(() => {
    const id = "order-print-style";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
  /* 화면에서는 숨김 - 먼저 선언 */
  .print-footer {
    display: none;
  }

  @media print {
    button,
    .no-print,
    header,
    nav,
    .MuiAppBar-root,
    .MuiDrawer-root {
      display: none !important;
    }
    body {
      background-color: white !important;
    }
    .MuiPaper-root {
      border: 1px solid #ccc !important;
      box-shadow: none !important;
    }
    .print-footer {
      display: flex !important;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .print-footer img {
      height: 60px;
      width: auto;
    }

  }
`;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (!matchingNo) return;
    postOrderPome(matchingNo)
      .then((data) => {
        console.log(data);
        setServerData(data);
      })
      .catch(console.error);
  }, [matchingNo]);

  const ordererPhone = useMemo(
    () => joinPhone(serverData.ordererPhone),
    [serverData.ordererPhone]
  );

  const receiverPhone = useMemo(() => {
    const src = serverData.receiverPhone ?? passedOrderSheet?.phone;
    return joinPhone(src);
  }, [serverData.receiverPhone, passedOrderSheet?.phone]);

  const showCoupon =
    serverData.finalPaymentAmount !== undefined &&
    serverData.totalCost > serverData.finalPaymentAmount;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#fafafa",
        pt: { xs: 5, md: 7 },
        pb: { xs: 15, md: 7 }, // 모바일 하단 탭바에 버튼이 가려지지 않도록 아래쪽에 충분한 텀 추가
        px: { xs: 2, sm: 3 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: { xs: 22, sm: 28 },
          color: "#111827",
          mb: { xs: 4, sm: 5 },
          textAlign: "center",
        }}
      >
        주문서 요약 <Box component="span" sx={{ color: "#9ca3af", fontWeight: 700, fontSize: { xs: 14, sm: 18 } }}>(읽기 전용)</Box>
      </Typography>

      {/* ===== 출발지(주문자) 정보 ===== */}
      <SectionTitle>출발지 정보</SectionTitle>
      <Paper elevation={0} sx={cardSx}>
        <Row label="주문자">{serverData.ordererName || "-"}</Row>
        <Row label="물품 출발 주소">{serverData.startAddress || "-"}</Row>
        <Row label="상세 주소">
          {serverData.startRestAddress ?? passedOrderSheet?.startRestAddress ?? "-"}
        </Row>
        <Row label="휴대전화">{ordererPhone || "-"}</Row>
        <Row label="이메일" last>{serverData.ordererEmail || "-"}</Row>
      </Paper>

      {/* ===== 도착지(받는분) 정보 ===== */}
      <SectionTitle>도착지 정보</SectionTitle>
      <Paper elevation={0} sx={cardSx}>
        <Row label="받는분">
          {serverData.addressee ?? passedOrderSheet?.addressee ?? "-"}
        </Row>
        <Row label="물품 도착 주소">{serverData.endAddress || "-"}</Row>
        <Row label="상세 주소">
          {serverData.endRestAddress ?? passedOrderSheet?.endRestAddress ?? "-"}
        </Row>
        <Row label="휴대전화">{receiverPhone || "-"}</Row>
        <Row label="이메일" last>
          {serverData.addresseeEmail ?? passedOrderSheet?.addresseeEmail ?? "-"}
        </Row>
      </Paper>

      {/* ===== 결제/요금 요약 ===== */}
      <SectionTitle>결제 요약</SectionTitle>
      <Paper elevation={0} sx={cardSx}>
        <Row label="기본요금">{toCurrency(serverData.baseCost)} 원</Row>
        <Row label="거리요금">{toCurrency(serverData.distanceCost)} 원</Row>

        {/* 🚨 [추가 섹션] 거리 자동 할인 내역 */}
        {Number(serverData.distanceDiscount) > 0 && (
          <Row label="거리할인">
            <Box component="span" sx={{ color: "#d32f2f", fontWeight: 700 }}>
              - {toCurrency(serverData.distanceDiscount)} 원
            </Box>
          </Row>
        )}

        <Row label="옵션요금" last={!showCoupon}>
          {toCurrency(serverData.specialOptionCost)} 원
        </Row>

        {/* 쿠폰 할인 내역 */}
        {showCoupon && (
          <Row label="쿠폰할인" last>
            <Box component="span" sx={{ color: "#d32f2f", fontWeight: 700 }}>
              - {toCurrency(serverData.totalCost - serverData.finalPaymentAmount)} 원
            </Box>
          </Row>
        )}

        <Divider sx={{ my: 2, borderStyle: "dashed", borderColor: "#e5e7eb" }} />

        {/* 총 결제금액 강조 박스 */}
        <Box
          sx={{
            px: { xs: 2, sm: 2.5 },
            py: 2,
            borderRadius: "12px",
            bgcolor: "#fef2f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
            총 결제금액
          </Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
            <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: "#DC2626" }}>
              {toCurrency(serverData.finalPaymentAmount ?? serverData.totalCost)}
            </Typography>
            <Typography sx={{ color: "#DC2626", fontWeight: 900, fontSize: 16 }}>원</Typography>
          </Box>
        </Box>
      </Paper>

      <Box className="print-footer">
        <img
          src="/image/logo/main_logo.png"
          alt="로고"
          style={{ height: 60, width: "auto" }}
        />
      </Box>

      <Button
        variant="contained"
        startIcon={<PrintIcon />}
        onClick={handlePrint}
        disableElevation
        sx={{
          mt: 2,
          minWidth: { xs: "100%", sm: 260 },
          maxWidth: MAX_W,
          py: 1.5,
          borderRadius: "10px",
          backgroundColor: "#DC2626",
          textTransform: "none",
          fontWeight: 700,
          fontSize: 15,
          "&:hover": { backgroundColor: "#B91C1C" },
          "@media print": { display: "none" },
        }}
      >
        인쇄 · PDF 저장
      </Button>
    </Box>
  );
};

export default OrderSummaryReadOnly;
