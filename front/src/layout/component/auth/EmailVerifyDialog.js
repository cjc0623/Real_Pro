import { API_BASE } from '../../../config';
// src/components/auth/EmailVerifyDialog.jsx
import React from "react";
import {
    Dialog, DialogContent,
    TextField, Button, Stack, Typography, LinearProgress,
    Box, IconButton, Divider
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// 앱 전체(로그인/비밀번호 찾기)와 통일된 브랜드 레드 버튼 스타일
const brandButtonSx = {
    backgroundColor: "#DC2626",
    "&:hover": { backgroundColor: "#B91C1C" },
    "&:disabled": { backgroundColor: "#e5e7eb", color: "#9ca3af" },
    borderRadius: "10px",
    textTransform: "none",
    fontSize: "15px",
    fontWeight: 700,
    py: 1.3,
    boxShadow: "none",
    "&:hover:not(:disabled)": {
        boxShadow: "0 4px 14px rgba(220,38,38,0.35)",
        backgroundColor: "#B91C1C",
    },
};

export default function EmailVerifyDialog({ open, email, onClose, onVerified }) {
    const [phase, setPhase] = React.useState("idle"); // idle | sending | code | verifying | verified | error
    const [code, setCode] = React.useState("");
    const [msg, setMsg] = React.useState("");
    const [expiresIn, setExpiresIn] = React.useState(600); // 10분(서버와 표시만 맞춤)
    const [cooldown, setCooldown] = React.useState(0);     // 60초 재전송 대기

    // 카운트다운
    React.useEffect(() => {
        if (!open) return;
        let t1, t2;
        if (phase === "code") {
            t1 = setInterval(() => setExpiresIn((s) => (s > 0 ? s - 1 : 0)), 1000);
            t2 = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
        }
        return () => { clearInterval(t1); clearInterval(t2); };
    }, [open, phase]);

    React.useEffect(() => {
        if (!open) {
            setPhase("idle");
            setCode("");
            setMsg("");
            setExpiresIn(600);
            setCooldown(0);
        }
    }, [open]);

    const sendCode = async () => {
        setPhase("sending");
        setMsg("인증코드 전송 중…");
        try {
            const r = await fetch(`${API_BASE}/api/email/send-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const ok = r.ok;
            const text = await r.text();
            if (!ok) throw new Error(text || "전송 실패");
            setPhase("code");
            setMsg("이메일로 인증코드를 보냈어요. 10분 안에 입력해 주세요.");
            setExpiresIn(600);
            setCooldown(60);
        } catch (e) {
            setPhase("error");
            setMsg(e.message || "전송 중 오류가 발생했습니다.");
        }
    };

    const verifyCode = async () => {
        if (!code || code.length < 4) {
            setMsg("코드를 정확히 입력해 주세요.");
            return;
        }
        setPhase("verifying");
        setMsg("인증 확인 중…");
        try {
            const r = await fetch(`${API_BASE}/api/email/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });
            const data = await r.json().catch(() => ({}));
            if (!r.ok || !data.verified) throw new Error(data.message || "코드가 올바르지 않거나 만료되었습니다.");
            setPhase("verified");
            setMsg("이메일 인증이 완료되었습니다.");
            onVerified?.(true);
        } catch (e) {
            setPhase("code");
            setMsg(e.message || "인증 실패");
            onVerified?.(false);
        }
    };

    const showCodeArea =
        phase === "code" || phase === "verifying" || phase === "error" || phase === "verified";

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            PaperProps={{ sx: { borderRadius: "20px" } }}
        >
            <DialogContent sx={{ p: 0 }}>
                {/* 헤더 */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, pt: 2.5, pb: 1 }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                        이메일 인증
                    </Typography>
                    <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                </Box>

                <Box sx={{ px: 3, pb: 3 }}>
                    {/* 대상 이메일 */}
                    <Box sx={{ bgcolor: "#f8fafc", border: "1px solid #f0f0f0", borderRadius: "12px", px: 2, py: 1.2, mb: 2 }}>
                        <Typography variant="body2" color="#475569" fontWeight={600}>
                            {email}
                        </Typography>
                    </Box>

                    <Stack spacing={2}>
                        {(phase === "sending" || phase === "verifying") && (
                            <LinearProgress sx={{ borderRadius: 999, "& .MuiLinearProgress-bar": { bgcolor: "#DC2626" } }} />
                        )}

                        {phase === "idle" && (
                            <Typography variant="body2" color="#64748b">
                                아래 버튼을 눌러 인증코드를 이메일로 받으세요.
                            </Typography>
                        )}

                        {showCodeArea && (
                            <>
                                <TextField
                                    label="인증코드"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
                                    placeholder="6자리 코드"
                                    fullWidth
                                    inputProps={{ maxLength: 10, inputMode: "numeric" }}
                                    disabled={phase === "verifying" || phase === "verified"}
                                />
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color={expiresIn > 0 ? "#64748b" : "error"}>
                                        남은 시간 {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, "0")}
                                    </Typography>
                                    <Button
                                        size="small"
                                        onClick={sendCode}
                                        disabled={cooldown > 0 || phase === "verifying" || phase === "sending"}
                                        sx={{ color: "#DC2626", textTransform: "none", fontWeight: 700, "&:disabled": { color: "#9ca3af" } }}
                                    >
                                        재전송{cooldown > 0 ? ` (${cooldown}s)` : ""}
                                    </Button>
                                </Stack>
                            </>
                        )}

                        {!!msg && (
                            <Typography
                                variant="body2"
                                color={phase === "verified" ? "success.main" : phase === "error" ? "error.main" : "#475569"}
                            >
                                {msg}
                            </Typography>
                        )}
                    </Stack>

                    <Divider sx={{ my: 2.5 }} />

                    {/* 액션 버튼 */}
                    <Stack spacing={1}>
                        {phase === "idle" && (
                            <Button fullWidth variant="contained" onClick={sendCode} sx={brandButtonSx}>
                                코드 보내기
                            </Button>
                        )}
                        {(phase === "code" || phase === "verifying") && (
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={verifyCode}
                                disabled={phase === "verifying" || expiresIn === 0}
                                sx={brandButtonSx}
                            >
                                확인
                            </Button>
                        )}
                        <Button
                            fullWidth
                            onClick={onClose}
                            sx={{ color: "#64748b", textTransform: "none", fontWeight: 600, borderRadius: "10px", py: 1.1 }}
                        >
                            닫기
                        </Button>
                    </Stack>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
