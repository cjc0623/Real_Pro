import React, { useEffect, useState, useCallback } from "react";
import { Box, Typography, CircularProgress, Button, TextField, IconButton, Stack, Alert, Tabs, Tab, Paper, TableContainer } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchFeesExtraFull, saveFeeExtraCell, addExtraRow, deleteExtraRow } from "../../../api/adminApi/adminApi";
import { NavLink, useLocation } from "react-router-dom";

// 🟢 [테이블 디자인 리포밍] 팀장님 원래 디자인 폼 유지, 모바일 압축을 위해 패딩 오프셋만 유연하게 보정
const thStyle = {
  borderBottom: "1px solid #e2e8f0",
  borderRight: "1px solid #f1f5f9",
  padding: { xs: "12px 6px", sm: "14px 10px" }, // 📱 모바일에서 양옆 패딩을 줄여 압축 홀딩
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
  padding: { xs: "6px 4px", sm: "8px 6px" }, // 📱 모바일 셀 패딩 다이어트
  textAlign: "center" 
};

// 🟢 [셀 입력창 디자인 리포밍] 가로 슬라이드 주범이었던 120px 고정 폭을 모바일 가변 폭으로 피팅!
const inputStyle = {
  width: "100%", // 👈 가로폭 100% 가변으로 변경하여 화면 밖 탈출 원천 차단
  maxWidth: "85px", // 👈 숫자가 이쁘게 들어가는 최적의 슬림 가이드라인 지정
  textAlign: "center",
  padding: "6px 8px",
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

const FeesExtra = () => {
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
        <FeesExtraTable setLoading={setLoading} />
      )}
    </Box>
  );
};

const FeesExtraTable = ({ setLoading }) => {
  const [columns, setColumns] = useState(["추가요금"]);
  const [rows, setRows] = useState([]);
  const [grid, setGrid] = useState([]);
  const [newRow, setNewRow] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();

  const activeTab = location.pathname.includes("feesExtra") ? 1 : 0;

  const fetchFull = useCallback(async () => {
    setError("");
    try {
      const res = await fetchFeesExtraFull();
      const data = res?.data || {};
      
      setGrid([]); 
      
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setColumns(Array.isArray(data.columns) ? data.columns : ["추가요금"]);
      setGrid(Array.isArray(data.grid) ? data.grid : []);
    } catch (e) {
      console.error("[extra/full] failed:", e);
      setError("추가요금 데이터를 불러오지 못했습니다.");
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
    if (!window.confirm("모든 추가요금 변경사항을 일괄 저장하시겠습니까?")) return;
    setLoading(true);
    try {
      for (let i = 0; i < rows.length; i++) {
        const payload = {
          extraChargeTitle: String(rows[i] || "").trim(),
          extraCharge: Number(grid[i]?.[0]) || 0,
        };
        await saveFeeExtraCell(payload);
      }
      await fetchFull();
      alert("추가요금표가 완벽하게 저장되었습니다!");
    } catch (e) {
      console.error("400 에러 상세:", e.response?.data);
      alert("저장 실패 (400): 필드명이 extraChargeTitle과 extraCharge인지 확인하세요.");
    } finally {
      setLoading(false);
    }
  };

  const onAddRow = async () => {
    const name = newRow.trim();
    if (!name) return;
    try {
      await addExtraRow(name);
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
      await deleteExtraRow(key);
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
    overflow: "hidden", // 👈 가로 슬라이드 휠 자체를 완전히 제거!
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
          placeholder="새 항목 (예: 파손주의)"
          value={newRow}
          onChange={(e) => setNewRow(e.target.value)}
          sx={{ 
            width: { xs: '100%', sm: 240 },
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

      {/* 팀장님의 원본 레이아웃 100% 보존 유지 구역 */}
      <TableContainer component={Paper} elevation={0} sx={tableCardStyle}>
        {/* 📱 minWidth 제한 장치를 걷어내어 스마트폰 디스플레이 너비에 맞춰 칼핏 압축 안착 */}
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, backgroundColor: "#f1f5f9", color: "#1e293b", fontWeight: "900", width: "45%" }}>항목</th>
              {columns.map((col, idx) => <th key={idx} style={{ ...thStyle, width: "40%" }}>{col}</th>)}
              <th style={{ ...thStyle, borderRight: "none", width: "15%" }}>제어</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((rowLabel, rowIdx) => (
              <tr key={rowLabel} style={{ transition: "background-color 0.2s" }}>
                <th style={{ ...thStyle, backgroundColor: "#f8fafc", color: "#334155", fontWeight: "800", textAlign: "left", paddingLeft: "12px" }}>
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
                      p: 1,
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

export default FeesExtra;