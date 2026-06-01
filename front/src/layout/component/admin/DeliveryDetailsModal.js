import React from 'react';
import {
    Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
    Chip, Paper, Modal, TableContainer, Divider
} from "@mui/material";

const DeliveryDetailsModal = ({ open, onClose, selectedUser }) => {
    // Copied from DeliveryPage.js and MemberAll.js
    const getStatusChip = (status) => {
        let label = "";
        let color = "default";
        switch (status) {
            case "COMPLETED":
                label = "배송 완료";
                color = "success";
                break;
            case "IN_TRANSIT":
                label = "배송 중";
                color = "info";
                break;
            case "PENDING":
                label = "대기";
                color = "warning";
                break;
            default:
                label = status;
                color = "default";
        }
        return <Chip label={label} color={color} size="small" />;
    };

    // 📱 모바일/데스크톱 대응 하이브리드 모달 스타일 미세 조정
    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '92vw', sm: '85vw', md: 850 }, // 📱 화면 크기에 맞춰 가로 폭 유연하게 스케일링
        maxWidth: '100%',
        maxHeight: '85vh', // 📱 스마트폰 화면 밖으로 삐져나가는 현상 원천 차단
        bgcolor: 'background.paper',
        border: '1px solid #e2e8f0', // 투박한 검정 테두리 파쇄 후 부드러운 보더 이식
        borderRadius: '24px', // 🟢 모서리 24px 고급 라운딩 스킨 마사지
        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
        p: { xs: 2.5, sm: 4 }, // 📱 모바일 여백 다이어트
        display: 'flex',
        flexDirection: 'column',
        outline: 'none',
        overflow: 'hidden'
    };

    if (!selectedUser) {
        return null; // Don't render if no user is selected
    }

    // 🚨 [버그 원천 분쇄 핵심] 백엔드 MariaDB/Spring DTO의 실제 필드명(memRole, memType, role)을 전부 동시 역추적
    const currentRole = String(selectedUser.memRole || selectedUser.memType || selectedUser.role || selectedUser.userType || "").toUpperCase();
    
    // 객체 내부에 OWNER나 물주 성격의 식별자가 확인된다면 true로 처리
    const isOwner = currentRole.includes("OWNER");

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="delivery-details-modal-title"
            aria-describedby="delivery-details-modal-description"
        >
            <Box sx={modalStyle}>
                <Typography id="delivery-details-modal-title" variant="h5" component="h2" fontWeight="900" color="#0f172a" mb={2.5}>
                    {selectedUser.memName ? `${selectedUser.memName}님의 배송 내역` : '배송 내역'}
                </Typography>
                
                {selectedUser && (selectedUser.details || []).length > 0 ? (
                    <>
                        {/* 📱 1. 모바일 전용 수직 카드 리스트 (반응형: 한눈에 보기) */}
                        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, overflowY: 'auto', maxHeight: '60vh', mb: 1, pr: 0.5 }}>
                            {selectedUser.details
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .map((d, i) => (
                                    <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                            <Typography variant="caption" fontWeight="800" color="#64748b">{d.date}</Typography>
                                            {getStatusChip(d.deliveryStatus)}
                                        </Box>
                                        <Box sx={{ mb: 1.5 }}>
                                            <Typography variant="body2" color="#334155" sx={{ mb: 0.5 }}>
                                                <strong style={{ color: '#2563eb', marginRight: '4px' }}>출발</strong> {d.start}
                                            </Typography>
                                            <Typography variant="body2" color="#334155">
                                                <strong style={{ color: '#ef4444', marginRight: '4px' }}>도착</strong> {d.end}
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
                                        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                                            <Typography variant="caption" color="#64748b">{d.type} · {d.distance}</Typography>
                                            <Typography variant="subtitle1" fontWeight="900" color="#2563eb">{d.amount}</Typography>
                                        </Box>
                                        <Typography variant="caption" display="block" sx={{ mt: 1, color: '#94a3b8' }}>
                                            주문: {d.owner} / 배송: {d.carrierName || '-'}
                                        </Typography>
                                    </Paper>
                                ))}
                        </Box>

                        {/* 💻 2. 데스크톱 전용 와이드 테이블 (md 이상) */}
                        <TableContainer 
                            component={Paper} 
                            variant="outlined" 
                            sx={{ 
                                mb: 1, 
                                borderRadius: '16px', 
                                borderColor: '#e2e8f0',
                                display: { xs: 'none', md: 'block' },
                                maxHeight: '60vh'
                            }}
                        >
                            <Table size="small" sx={{ minWidth: 750, '& .MuiTableCell-root': { py: 1.5, whiteSpace: 'nowrap' } }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>출발 날짜</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>출발지</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>도착지</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>거리</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>종류</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>금액</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>주문자</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>배송자</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>배송 현황</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedUser.details
                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                        .map((d, i) => (
                                        <TableRow key={i} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                            <TableCell sx={{ color: '#64748b' }}>{d.date}</TableCell>
                                            <TableCell sx={{ color: '#334155', fontWeight: 500 }}>{d.start}</TableCell>
                                            <TableCell sx={{ color: '#334155', fontWeight: 500 }}>{d.end}</TableCell>
                                            <TableCell sx={{ color: '#475569' }}>{d.distance}</TableCell>
                                            <TableCell sx={{ color: '#475569' }}>{d.type}</TableCell>
                                            <TableCell sx={{ color: '#2563eb', fontWeight: 700 }}>{d.amount}</TableCell>
                                            <TableCell sx={{ color: '#334155' }}>{d.owner}</TableCell>
                                            <TableCell sx={{ color: '#334155' }}>{d.carrierName || '-'}</TableCell>
                                            <TableCell>{getStatusChip(d.deliveryStatus)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                ) : selectedUser && (
                    <Paper variant="outlined" sx={{ mb: 1, p: 4, borderRadius: '16px', borderColor: '#e2e8f0', textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {isOwner ? '주문 기록이 없습니다(물주)' : '배송 기록이 없습니다(차주)'}
                        </Typography>
                    </Paper>
                )}
            </Box>
        </Modal>
    );
};

export default DeliveryDetailsModal;