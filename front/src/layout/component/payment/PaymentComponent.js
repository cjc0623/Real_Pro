import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, Divider, Button, Stack } from "@mui/material";
import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { completePayment } from "../../../api/paymentApi/paymentApi";

const Row = ({ label, value, dim }) => (
  <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ py: 1 }}>
    <Box sx={{ width: { xs: 104, sm: 150 }, flexShrink: 0, textAlign: "right", color: "#9ca3af", fontSize: 14 }}>
      {label}
    </Box>
    <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-all", fontWeight: 600, fontSize: 14, color: dim ? "#9ca3af" : "#111827" }}>
      {value}
    </Typography>
  </Stack>
);

const formatAmount = (v) => {
  if (v == null || v === "") return "0";
  return Number(v).toLocaleString('ko-KR');
};

const pad2 = (n) => String(n).padStart(2, "0");
const formatDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${yyyy}년 ${mm}월 ${dd}일 ${hh}시 ${mi}분`;
};

const digitsOnly = (s = "") => String(s).replace(/\D/g, "");

const formatPhone = (raw) => {
  const d = digitsOnly(raw);
  if (!d) return raw || "";
  if (d.startsWith("02")) {
    if (d.length === 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    if (d.length >= 10) return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return raw;
};

const PaymentComponent = () => {
  const { state } = useLocation();
  const [viewData, setViewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const paymentNo = state?.paymentNo || sessionStorage.getItem("paymentNo");

  // 🟢 페이지 진입 시 스크롤 위치를 맨 위로 강제 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!paymentNo) {
      alert("잘못된 접근 방식입니다.");
      navigate("/");
      return;
    }
    (async () => {
      try {
        const dto = await completePayment(paymentNo);

        // 🚨 [데이터 정합성 매핑 핵심]
        // 서버 DTO가 totalCost에 이미 할인된 값을 담아주는 오지랖을 부려도
        // 우리는 (최종금액 + 할인액)을 통해 진짜 '주문 원금'을 역산해냅니다.
        console.log("DTO 데이터 확인:", dto);

        setViewData({
          ...dto,
          addresseeName: dto.addressee,
          addresseePhone: dto.addresseePhone,
          endRestAddress: dto.endRestAdreess,

          // 🚨 [이중 할인 완전 차단]
          // 1. 주문 원금 자리 : 서버가 준 totalCost(96,161)가 이미 할인이 끝난 가격이므로 그대로 사용
          totalCost: dto.totalCost,

          // 2. 쿠폰 할인 자리 : 화면상 안내를 위해 0으로 처리하거나, 보여주지 않도록 설정
          // (만약 할인액을 보여주고 싶다면 서버가 준 원금에서 역산해야 하지만, 
          // 일단 이중 할인을 막는 게 우선이므로 0으로 세팅하여 뺄셈을 방지합니다.)
          discountPrice: 0,

          // 3. 최종 결제 금액 : 서버가 준 값을 아무런 가공 없이 그대로 출력
          finalCost: dto.totalCost
        });
      } catch (e) {
        console.error(e);
        alert("주문 완료 정보를 불러오지 못했습니다.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [paymentNo, navigate]);

  if (loading) return <Box sx={{ p: 4 }}>정보를 불러오는 중입니다...</Box>;
  if (!viewData) return null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fafafa", py: { xs: 5, md: 7 }, px: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* ── 성공 헤더 ── */}
      <CheckCircleIcon sx={{ fontSize: 56, color: "#16a34a", mb: 1.5 }} />
      <Typography sx={{ fontWeight: 900, fontSize: { xs: 24, sm: 28 }, color: "#111827", mb: 1 }}>
        주문 완료
      </Typography>
      <Typography sx={{ color: "#6b7280", fontSize: 14, mb: 4 }}>
        고객님의 주문이 정상적으로 완료되었습니다.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 640,
          borderRadius: "14px",
          border: "1px solid #f3f4f6",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          p: { xs: 2.5, sm: 4 },
        }}
      >
        <Row label="주문번호 :" value={viewData.orderUuid} />
        <Row label="화물 운반자 이름 :" value={viewData.cargoName} />
        <Row label="화물 운반자 전화번호 :" value={formatPhone(viewData.cargoPhone)} />

        <Divider sx={{ my: 1.5, borderColor: "#f3f4f6" }} />

        <Row label="받으시는 분 :" value={viewData.addresseeName} />
        <Row label="전화번호 :" value={formatPhone(viewData.addresseePhone)} />
        <Row label="배달지 정보 :" value={viewData.endAddress} />
        <Row label={"\u00A0"} value={viewData.endRestAddress} />

        <Divider sx={{ my: 1.5, borderColor: "#f3f4f6" }} />

        <Row label="결제 정보 :" value={viewData.paymentMethod} />

        {/* ✅ 원금 표시 (역산된 진짜 정가) */}
        {viewData.discountPrice > 0 && (
          <Row label="주문 원금 :" value={`${formatAmount(viewData.totalCost)} 원`} dim={true} />
        )}

        {/* ✅ 쿠폰 할인 표시 */}
        {viewData.discountPrice > 0 && (
          <Row
            label="쿠폰 할인 :"
            value={`- ${formatAmount(viewData.discountPrice)} 원`}
            dim={true}
          />
        )}

        <Row label="승인일시 :" value={formatDateTime(viewData.paidAt)} />

        {/* 🚨 핵심: 서버가 준 최종 결제액(DB값)을 어떤 계산도 없이 그대로 출력 */}
        <Box
          sx={{
            mt: 2,
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
            최종 결제 금액
          </Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
            <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: "#DC2626" }}>
              {formatAmount(viewData.finalCost)}
            </Typography>
            <Typography sx={{ color: "#DC2626", fontWeight: 900, fontSize: 16 }}>원</Typography>
          </Box>
        </Box>
      </Paper>

      <Button
        variant="contained"
        size="large"
        disableElevation
        sx={{
          mt: 4,
          minWidth: 260,
          py: 1.5,
          borderRadius: "10px",
          backgroundColor: "#DC2626",
          textTransform: "none",
          fontWeight: 700,
          fontSize: 15,
          "&:hover": { backgroundColor: "#B91C1C" },
        }}
        onClick={() => navigate("/")}
      >
        홈으로 가기
      </Button>
    </Box>
  );
}

export default PaymentComponent;