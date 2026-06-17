import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import { Slide, IconButton, Box, useMediaQuery, useTheme } from '@mui/material'; 
import { Close as CloseIcon } from '@mui/icons-material';

// ✅ 스타일 상수를 컴포넌트 위로 이동하여 호이스팅 관련 오류 방지
const getBtnStyle = (isMobile) => ({
    width: isMobile ? '52px' : '64px', 
    height: isMobile ? '52px' : '64px', 
    borderRadius: '50%', 
    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
    color: 'white',
    border: 'none', 
    cursor: 'pointer', 
    boxShadow: '0 10px 20px rgba(245, 158, 11, 0.3)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
});

const chatWinStyle = {
    position: 'fixed',
    bottom: '90px',
    right: '20px',
    width: 'min(calc(100vw - 40px), 360px)', 
    height: 'min(calc(100vh - 200px), 500px)', 
    backgroundColor: '#f5f5f5', 
    border: '1px solid #ddd', 
    borderRadius: '24px', 
    display: 'flex', 
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    zIndex: 10000 // 블러 오버레이보다 높은 우선순위
};

const noticeStyle = { 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', 
    color: 'white', 
    fontSize: '11px', 
    padding: '10px 16px', 
    textAlign: 'center', 
    fontWeight: '800', 
    boxShadow: '0 2px 10px rgba(234, 88, 12, 0.2)' 
};

const msgListStyle = { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '4px' };
const myMsgWrapper = { display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' };
const otherMsgWrapper = { display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' };
const myMsgBubble = { 
    maxWidth: '80%', backgroundColor: '#ea580c', color: 'white', padding: '10px 14px', 
    borderRadius: '18px 18px 2px 18px', fontSize: '13px', lineHeight: '1.5', boxShadow: '0 2px 5px rgba(234, 88, 12, 0.2)'
};
const otherMsgBubble = { 
    maxWidth: '80%', backgroundColor: 'white', color: '#334155', padding: '10px 14px', 
    borderRadius: '18px 18px 18px 2px', fontSize: '13px', lineHeight: '1.5', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
};
const inputArea = { display: 'flex', padding: '12px', backgroundColor: 'white', borderTop: '1px solid #f1f5f9', alignItems: 'center', gap: '8px' };
const inputStyle = { flex: 1, border: '1px solid #e2e8f0', outline: 'none', borderRadius: '20px', padding: '8px 15px', fontSize: '13px', backgroundColor: '#f8fafc' };
const sendBtn = { 
    backgroundColor: 'transparent', 
    border: 'none', 
    color: '#ea580c', 
    fontWeight: '900', 
    cursor: 'pointer',
    padding: '4px 8px'
};

const CounselorChat = ({ isOpen, onToggle }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const scrollRef = useRef();

    // ✅ 채팅 보안 패턴: 태그나 스크립트에 사용되는 위험 문자 차단 (꺽쇠, 세미콜론, 슬래시 등)
    const CHAT_SAFE_REGEX = /[<>\\/;]/g;

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: 'sys-1',
                senderName: '시스템',
                message: '안녕하세요. 현재 문의가 폭주하여 상담사 연결이 지연되고 있습니다. 빠른 답변을 원하시면 AI 상담사를 이용해 주세요.',
                isSystem: true
            }]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        // ✅ 보안 처리: 입력된 값에서 위험 문자를 공백으로 치환 (무기 압수)
        const sanitizedInput = input.replace(CHAT_SAFE_REGEX, "");

        // 만약 특수문자만 입력해서 내용이 비어버렸다면 전송 중단
        if (!sanitizedInput.trim()) {
            setInput('');
            return;
        }

        const newMsg = { senderName: '사용자', message: sanitizedInput };

        try {
            const res = await axios.post('/api/chat/send', newMsg);
            setMessages([...messages, res.data]);
            setInput('');

            setTimeout(() => {
                const systemReply = {
                    id: `sys-${Date.now()}`,
                    senderName: '시스템',
                    message: '안녕하세요. 현재 문의가 폭주하여 상담사 연결이 지연되고 있습니다. 빠른 답변을 원하시면 AI 상담사를 이용해 주세요.',
                    isSystem: true
                };
                setMessages(prev => [...prev, systemReply]);
            }, 300);

        } catch (err) {
            console.error("전송 실패", err);
        }
    };

    return (
        /* ✅ 최상위 div의 fixed 속성을 제거했습니다. (App.js에서 관리) */
        <div style={{ position: 'relative' }}>
            <button onClick={onToggle} style={{...getBtnStyle(isMobile), background: isOpen ? '#334155' : 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)'}}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.3s', transform: isOpen ? 'scale(0.85)' : 'scale(1)' }}>
                    <HeadsetMicIcon style={{ fontSize: isMobile ? '20px' : '24px', marginBottom: '1px' }} />
                    <span style={{ fontSize: isMobile ? '8px' : '11px', fontWeight: '900', letterSpacing: '-0.2px' }}>상담</span>
                </div>
            </button>

            <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
                <div style={chatWinStyle}> {/* chatWinStyle은 최종 위치를 정의 */}
                    <div style={noticeStyle}>
                        <span style={{ flex: 1 }}>⚠️ 상담 지연 (AI 권장)</span>
                        <IconButton 
                            size="small" 
                            onClick={onToggle} 
                            sx={{ color: 'white', p: 0.5, display: { xs: 'none', md: 'inline-flex' } }}
                        >
                            <CloseIcon sx={{ fontSize: '18px' }} />
                        </IconButton>
                    </div>

                    <div style={msgListStyle}>
                        {messages.map((m, i) => (
                            <div key={i} style={m.senderName === '사용자' ? myMsgWrapper : otherMsgWrapper}>
                                <div style={m.senderName === '사용자' ? myMsgBubble : otherMsgBubble}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', opacity: 0.8 }}>
                                        {m.senderName}
                                    </div>
                                    {m.message}
                                </div>
                            </div>
                        ))}
                        <div ref={scrollRef} />
                    </div>

                    <div style={inputArea}>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="메시지 입력..."
                            style={inputStyle}
                        />
                        <button onClick={handleSend} style={sendBtn}>전송</button>
                    </div>
                </div>
            </Slide>
        </div>
    );
};

export default CounselorChat;