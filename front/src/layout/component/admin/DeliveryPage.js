import React, { useEffect, useMemo, useState } from "react";
import {
    Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
    Chip, Paper, CircularProgress, TableContainer, Tabs, Tab, TextField
} from "@mui/material";
import { fetchAllDeliveries } from "../../../api/adminApi/adminDeliveryApi";
import SearchIcon from "@mui/icons-material/Search";

const DeliveryPage = () => {
    const [allDeliveries, setAllDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("ALL");
    const [keyword, setKeyword] = useState("");

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const getStatusChip = (status) => {
        let label = "";
        let customStyle = {};
        switch (status) {
            case "COMPLETED": 
                label = "배송 완료"; 
                customStyle = { bgcolor: "#eff6ff", color: "#2563eb", fontWeight: "bold", borderRadius: "8px" }; 
                break;
            case "IN_TRANSIT": 
                label = "배송 중";  
                customStyle = { bgcolor: "#e0f2fe", color: "#0284c7", fontWeight: "bold", borderRadius: "8px" };    
                break;
            case "PENDING":    
                label = "대기";      
                customStyle = { bgcolor: "#fff7ed", color: "#ea580c", fontWeight: "bold", borderRadius: "8px" }; 
                break;
            default:           
                label = status;      
                customStyle = { bgcolor: "#f1f5f9", color: "#64748b", fontWeight: "bold", borderRadius: "8px" };
        }
        return <Chip label={label} style={customStyle} size="small" />;
    };

    useEffect(() => {
        const loadAllDeliveries = async () => {
            try {
                const data = await fetchAllDeliveries(activeTab, keyword);
                const sortedData = data.sort((a, b) => b.date.localeCompare(a.date));
                setAllDeliveries(sortedData);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        loadAllDeliveries();
    }, [activeTab, keyword]);

    const tableCardStyle = {
        p: 0,
        borderRadius: "20px",
        backgroundColor: "#ffffff",
        border: "1px solid #f1f5f9",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.02)",
        overflow: "hidden"
    };

    return (
        <Box flexGrow={1} p={{ xs: 2.5, md: 5 }} sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>
            <Box
                display="flex"
                flexDirection={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', md: 'center' }}
                gap={2}
                mb={4}
            >
                <Box minWidth={0} sx={{ width: '100%' }}>
                    <Typography 
                        variant="h4" 
                        fontWeight="900" 
                        color="#0f172a" 
                        letterSpacing="-0.5px" 
                        mb={1.5} 
                        sx={{ 
                            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }, 
                            textAlign: { xs: 'center', md: 'left' },
                            width: '100%' 
                        }}
                    >
                        전체 배송 내역
                    </Typography>
                    
                    <Tabs
                      value={activeTab}
                      onChange={handleTabChange}
                      textColor="primary"
                      indicatorColor="primary"
                      // 🟢 [핵심] variant를 삭제하고 대신 아래와 같이 배치하면 
                      // 쏠림 없이 전체 영역을 균등하게 차지합니다.
                      variant="fullWidth" 
                      sx={{ 
                        maxWidth: '100%',
                        "& .MuiTabs-indicator": { bgcolor: "#2563eb", height: "3px", borderRadius: "3px" }, 
                        "& .MuiTab-root": { 
                          fontWeight: "bold", 
                          color: "#64748b", 
                          fontSize: { xs: "0.75rem", sm: "0.95rem" }, // 모바일에서는 폰트 크기를 살짝 줄여서 한 줄 유지
                          minWidth: 0, 
                          px: { xs: 0, sm: 2 },
                          whiteSpace: "nowrap" // 👈 [중요] 글자가 무조건 한 줄로 나오게 강제
                        },
                        "& .MuiTab-root.Mui-selected": { color: "#2563eb" }
                      }}
                    >
                        <Tab label="전체" value="ALL" />
                        <Tab label="대기" value="PENDING" />
                        <Tab label="배송 중" value="IN_TRANSIT" />
                        <Tab label="배송 완료" value="COMPLETED" />
                    </Tabs>
                </Box>
                
                <TextField
                    variant="outlined"
                    placeholder="주문자/배송자 검색"
                    size="small"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    sx={{ 
                        width: { xs: '100%', md: 240 }, 
                        flexShrink: 0,
                        "& .MuiOutlinedInput-root": {
                            borderRadius: "14px",
                            backgroundColor: "#ffffff",
                            "& fieldset": { borderColor: "#e2e8f0" },
                            "&:hover fieldset": { borderColor: "#cbd5e1" },
                            "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "2px" },
                        }
                    }}
                    InputProps={{
                        startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: "#2563eb" }} />, 
                    }}
                />
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={300} sx={{ color: "#2563eb" }}>
                    <CircularProgress color="inherit" />
                </Box>
            ) : error ? (
                <Typography color="error" fontWeight="bold">배송 내역을 불러오지 못했습니다.</Typography>
            ) : (
                <>
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                        {allDeliveries.length > 0 ? (
                            allDeliveries.map((d, i) => (
                                <Paper 
                                    key={d.deliveryNo ?? i} 
                                    elevation={0} 
                                    sx={{ p: 2.5, mb: 2, borderRadius: "20px", border: "1px solid #f1f5f9", backgroundColor: "#ffffff", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}
                                >
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                        <Typography variant="caption" fontWeight="600" color="#64748b">{d.date}</Typography>
                                        {getStatusChip(d.deliveryStatus)}
                                    </Box>
                                    <Box mb={1.5}>
                                        <Typography variant="body2" color="#334155" fontWeight="700">
                                            <Box component="span" sx={{ color: '#2563eb', mr: 0.5 }}>출발</Box> {d.start}
                                        </Typography>
                                        <Typography variant="body2" color="#334155" fontWeight="700" sx={{ mt: 0.5 }}>
                                            <Box component="span" sx={{ color: '#0ea5e9', mr: 0.5 }}>도착</Box> {d.end}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" pt={1.5} sx={{ borderTop: "1px dashed #f1f5f9" }}>
                                        <Box>
                                            <Typography variant="caption" display="block" color="#94a3b8">주문/배송</Typography>
                                            <Typography variant="body2" color="#475569" fontWeight="500">
                                                {d.owner} → {d.carrierName || "미지정"}
                                            </Typography>
                                        </Box>
                                        <Box textAlign="right">
                                            <Typography variant="caption" display="block" color="#94a3b8">{d.type} ({d.distance})</Typography>
                                            <Typography variant="body1" color="#2563eb" fontWeight="800">
                                                {d.amount}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            ))
                        ) : (
                            <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                                <Typography color="#94a3b8" fontWeight="500">배송 기록이 존재하지 않습니다.</Typography>
                            </Paper>
                        )}
                    </Box>

                    <TableContainer component={Paper} elevation={0} sx={{ ...tableCardStyle, display: { xs: 'none', md: 'block' } }}>
                        <Table size="small" sx={{ minWidth: 900, '& .MuiTableCell-root': { height: 52, whiteSpace: 'nowrap' } }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>출발 날짜</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>출발지</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>도착지</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>거리</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>종류</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>금액</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>주문자</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>배송자</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }} align="center">배송 현황</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {allDeliveries.length > 0 ? (
                                    allDeliveries.map((d, i) => (
                                        <TableRow key={d.deliveryNo ?? i} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                            <TableCell sx={{ color: '#64748b' }}>{d.date}</TableCell>
                                            <TableCell sx={{ color: '#334155', fontWeight: 500 }}>{d.start}</TableCell>
                                            <TableCell sx={{ color: '#334155', fontWeight: 500 }}>{d.end}</TableCell>
                                            <TableCell sx={{ color: '#475569' }}>{d.distance}</TableCell>
                                            <TableCell sx={{ color: '#475569' }}>{d.type}</TableCell>
                                            <TableCell sx={{ color: '#2563eb', fontWeight: 700 }}>{d.amount}</TableCell> 
                                            <TableCell sx={{ color: '#334155' }}>{d.owner}</TableCell>
                                            <TableCell sx={{ color: '#334155' }}>{d.carrierName}</TableCell>
                                            <TableCell align="center" sx={{ py: 1 }}>{getStatusChip(d.deliveryStatus)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#94a3b8', fontWeight: 500 }}>
                                            배송 기록이 존재하지 않습니다.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Box>
    );
};

export default DeliveryPage;