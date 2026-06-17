import React, { useEffect, useState, useCallback } from "react";
import { Box, Typography, CircularProgress, Button, TextField, IconButton, Stack, Alert, Tabs, Tab, Paper, TableContainer } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchFeesBasicFull, saveFeeBasicCell, addBasicRow, deleteBasicRow } from "../../../api/adminApi/adminApi";
import { NavLink, useLocation } from "react-router-dom";

// 🟢 [테이블 디자인 리포밍] 기존 스타일 보존 + 모바일 압축 패딩 연동
const thStyle = {
  borderBottom: "1px solid #e2e8f0",
  borderRight: "1px solid #f1f5f9",
  padding: { xs: "12px 4px", sm: "14px 10px" }, // 📱 모바일 양옆 패딩 최적화
  textAlign: "center",
  backgroundColor: "#f8fafc", 
  color: "#475569",
  fontWeight: "bold",
  fontSize: "0.9rem",
  whiteSpace: "nowrap",
};

const tdStyle = { 
  borderBottom: "1px solid #f1f5f9", 
  borderRight: "1px solid #f1f5f9",
  padding: { xs: "6px 2px", sm: "8px 6px" }, // 📱 모바일 셀 내부 패딩 다이어트
  textAlign: "center" 
};

// 🟢 [셀 입력창 디자인 리포밍] 고정 100px을 제거하고 100% 가변 폭 및 최대 너비 제한 적용
const inputStyle = {
  width: "100%", // 👈 가로 슬라이드 방지를 위해 가변폭으로 전환
  maxWidth: "80px", // 👈 모바일 화면에서도 짤리지 않는 최적의 입력 폭 규격
  textAlign: "center",
  padding: "6px 4px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px", 
  backgroundColor: "#ffffff",
  color: "#334155",
  fontWeight: "600",
  fontSize: "0.85rem",
  boxSizing: "border-box",
  transition: "all 0.2s",
  outline: "none",
};

const FeesBasic = () => {
  const [loading, setLoading] = useState(false);

  return (
    <Box flexGrow={1} p={{ xs: 2.5, md: 5 }} pb={{ xs: "120px", md: 5 }} sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Typography variant="h4" fontWeight="900" color="#0f172a" letterSpacing="-0.5px" mb={2} sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }, textAlign: { xs: 'center', md: 'left' } }}>
                              요금 정책 관리
                          </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="300px" sx={{ color: "#2563eb" }}>
          <CircularProgress color="inherit" />
        </Box>
      ) : (
        <FeesBasicTable setLoading={setLoading} />
      )}
    </Box>
  );
};

const FeesBasicTable = ({ setLoading }) => {
  const [columns, setColumns] = useState(["거리별 요금", "기본 요금"]);
  const [rows, setRows] = useState([]);
  const [grid, setGrid] = useState([]);
  const [newRow, setNewRow] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();

  const activeTab = location.pathname.includes("feesExtra") ? 1 : 0;

  const fetchFull = useCallback(async () => {
    setError("");
    try {
      const res = await fetchFeesBasicFull();
      const data = res?.data || {};
      
      setGrid([]); 
      
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setColumns(Array.isArray(data.columns) ? data.columns : ["거리별 요금", "기본 요금"]);
      setGrid(Array.isArray(data.grid) ? data.grid : []);
    } catch (e) {
      console.error("[basic/full] failed:", e);
      setError("요금 데이터를 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => { fetchFull(); }, [fetchFull]);

  const handleChange = (r, c, v) => {
    setGrid(prev => {
      const next = prev.map(row => [...row]);
      if (!next[r]) next[r] = [];
      next[r][c] = v;
      return next;
    });
  };

  const handleSaveAll = async () => {
    if (!rows || rows.length === 0) return;
    if (!window.confirm("입력한 모든 요금을 일괄 저장하시겠습니까?")) return;
    setLoading(true);
    try {
      for (let i = 0; i < rows.length; i++) {
        const payload = {
          weight: String(rows[i] || "").trim(),
          ratePerKm: Number(grid[i]?.[0]) || 0,
          initialCharge: Number(grid[i]?.[1]) || 0,
          cargoName: "미지정"
        };
        console.log(`[전송 데이터 확인]:`, payload);
        await saveFeeBasicCell(payload);
      }
      await fetchFull();
      alert("전체 요금표 저장 성공!");
    } catch (e) {
      console.error(" 400 에러 상세 내용:", e.response?.data);
      alert(`저장 실패 (400): 서버가 데이터를 거절했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  const onAddRow = async () => {
    const name = newRow.trim();
    if (!name) return;
    try {
      await addBasicRow(name);
      setNewRow("");
      await fetchFull();
    } catch (e) { alert("행 추가 실패"); }
  };

  const onDeleteRow = async (name) => {
    const key = (name || "").trim();
    if (!key) return;
    if (!window.confirm(`'${key}' 행을 삭제하시겠습니까?`)) return;
    
    setLoading(true);
    try {
      await deleteBasicRow(key);
      setGrid([]); 
      await fetchFull();
    } catch (e) { 
      alert("행 삭제 실패"); 
    } finally {
      setLoading(false);
    }
  };

  const tableCardStyle = {
    p: 0,
    borderRadius: "20px",
    backgroundColor: "#ffffff",
    border: "1px solid #f1f5f9",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.02)",
    overflow: "hidden", // 👈 강제로 가로 슬라이드가 절대 생기지 않도록 차단
    maxWidth: "100%",
    mb: 4
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>{error}</Alert>}

      <Tabs
        value={activeTab}
        textColor="primary"
        indicatorColor="primary"
        variant="fullWidth"
        sx={{ 
          mb: 4,
          "& .MuiTabs-indicator": { bgcolor: "#2563eb", height: "3px", borderRadius: "3px" }, 
          "& .MuiTab-root": { fontWeight: "bold", color: "#64748b", fontSize: "0.95rem" },
          "& .MuiTab-root.Mui-selected": { color: "#2563eb" }
        }}
      >
        <Tab value={0} label="기본요금 설정" component={NavLink} to="/admin/feesBasic" />
        <Tab value={1} label="추가요금 설정" component={NavLink} to="/admin/feesExtra" />
      </Tabs>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        mb={4}
      >
        <TextField
          size="small"
          placeholder="새 중량 (예: 7톤)"
          value={newRow}
          onChange={(e) => setNewRow(e.target.value)}
          sx={{ 
            width: { xs: '100%', sm: 220 },
            "& .MuiOutlinedInput-root": {
              borderRadius: "14px",
              backgroundColor: "#ffffff",
              "& fieldset": { borderColor: "#e2e8f0" },
              "&:hover fieldset": { borderColor: "#cbd5e1" },
              "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "2px" },
            }
          }}
        />
        <Button variant="contained" disableElevation onClick={onAddRow} sx={{ py: 1, px: 3, borderRadius: "12px", fontWeight: "bold", bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" }, width: { xs: '100%', sm: 'auto' } }}>
          행 추가
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={tableCardStyle}>
        {/* 📱 minWidth 제한을 없애고 컬럼 비율을 균등 정렬하여 모바일 가로 화면 안에 고정 */}
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, backgroundColor: "#f1f5f9", color: "#1e293b", fontWeight: "900", width: "28%" }}>중량(톤수)</th>
              <th style={{ ...thStyle, width: "29%" }}>거리별 요금</th>
              <th style={{ ...thStyle, width: "28%" }}>기본 요금</th>
              <th style={{ ...thStyle, borderRight: "none", width: "15%" }}>제어</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((rowLabel, rowIdx) => (
              <tr key={rowLabel} style={{ transition: "background-color 0.2s" }}>
                <th style={{ ...thStyle, backgroundColor: "#f8fafc", color: "#334155", fontWeight: "800", fontSize: "0.85rem" }}>
                  {rowLabel}
                </th>
                {columns.map((_, colIdx) => (
                  <td key={`${rowLabel}-${colIdx}`} style={tdStyle}>
                    <input
                      type="text"
                      value={grid[rowIdx]?.[colIdx] ?? ""}
                      onChange={(e) => handleChange(rowIdx, colIdx, e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                ))}
                <td style={{ ...tdStyle, borderRight: "none" }}>
                  <IconButton 
                    onClick={() => onDeleteRow(rowLabel)}
                    sx={{ 
                      color: "#94a3b8", 
                      borderRadius: "10px",
                      p: 0.5,
                      "&:hover": { bgcolor: "#fff5f5", color: "#ef4444" } 
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 4 }}>
        <Button
          variant="contained"
          disableElevation
          size="large"
          onClick={handleSaveAll}
          sx={{ 
            width: { xs: '100%', sm: 320 }, 
            py: 1.5,
            borderRadius: "14px", 
            fontWeight: "900", 
            fontSize: "1.05rem",
            bgcolor: "#2563eb", 
            "&:hover": { bgcolor: "#1d4ed8" }
          }}
        >
          전체 요금 변경사항 저장하기
        </Button>
      </Box>
    </Box>
  );
};

export default FeesBasic;