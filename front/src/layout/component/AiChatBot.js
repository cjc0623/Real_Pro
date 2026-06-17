import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Slide, IconButton, useMediaQuery, useTheme } from '@mui/material'; // IconButton 추가
import { Close as CloseIcon } from '@mui/icons-material';

// ✅ AI 챗봇 전용 보안 패턴: 한글, 영문, 숫자, 공백, 기본적인 문장부호(. , ? ! /)만 허용
// 태그(< >), 따옴표(' "), 세미콜론(;), 백슬래시(\) 등 모든 실행 가능 문자를 실시간 차단합니다.
const AI_SECURITY_REGEX = /[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣\s.,?!/]/g;

// ✅ 스타일 상수를 컴포넌트 위로 이동하여 호이스팅 관련 오류 방지
const getBtnStyle = (isMobile) => ({
    width: isMobile ? '52px' : '64px', 
    height: isMobile ? '52px' : '64px', 
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    color: 'white',
    border: 'none', 
    cursor: 'pointer', 
    boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
    outline: 'none'
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
    zIndex: 10000 // 블러 오버레이 및 메인 버튼보다 높은 우선순위
};

const noticeStyle = { 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
    color: 'white', 
    fontSize: '11px', 
    padding: '10px 16px', 
    textAlign: 'center', 
    fontWeight: '800', 
    boxShadow: '0 2px 10px rgba(99, 102, 241, 0.2)',
};

const msgListStyle = { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '4px' };
const myMsgWrapper = { display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' };
const otherMsgWrapper = { display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' };
const myMsgBubble = { 
    maxWidth: '80%', backgroundColor: '#6366f1', color: 'white', padding: '10px 14px', 
    borderRadius: '18px 18px 2px 18px', fontSize: '13px', lineHeight: '1.5', boxShadow: '0 2px 5px rgba(99, 102, 241, 0.2)'
};
const otherMsgBubble = { 
    maxWidth: '80%', backgroundColor: 'white', color: '#334155', padding: '10px 14px', 
    borderRadius: '18px 18px 18px 2px', fontSize: '13px', lineHeight: '1.5', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
};
const inputArea = { display: 'flex', padding: '12px', backgroundColor: 'white', borderTop: '1px solid #f1f5f9', alignItems: 'center', gap: '8px' };
const inputStyle = { flex: 1, border: '1px solid #e2e8f0', outline: 'none', borderRadius: '20px', padding: '8px 15px', fontSize: '13px', backgroundColor: '#f8fafc' };
const sendBtn = { 
    backgroundColor: 'transparent', border: 'none', color: '#6366f1', fontWeight: '900', cursor: 'pointer', padding: '4px 8px'
};
const otherMsg = { textAlign: 'left', marginBottom: '10px', color: '#555', fontSize: '13px' };

const AiChatBot = ({ isOpen, onToggle }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const scrollRef = useRef(null);
    const [messages, setMessages] = useState([
        { role: 'ai', text: '퍼스트로드 AI 상담원입니다. 무엇을 도와드릴까요?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // 메시지 추가 시 자동 스크롤
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // ✅ 실시간 입력 필터링 핸들러 (인젝션 공격 코드 타이핑 즉시 삭제)
    const handleInputChange = (e) => {
        const { value } = e.target;
        const sanitizedValue = value.replace(AI_SECURITY_REGEX, "");
        setInput(sanitizedValue);
    };

    const handleSend = async () => {
        // 공백 제외 필터링 후 검사
        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        // 최종 전송 전 한 번 더 샌니타이징 (보안 2중 잠금)
        const finalInput = trimmedInput.replace(AI_SECURITY_REGEX, "");
        if (!finalInput) {
            setInput('');
            return;
        }

        const userMsg = { role: 'user', text: finalInput };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // 팀장님의 기존 백엔드 주소 유지
            const res = await axios.post("http://localhost:8080/api/ai/ask", { question: finalInput });
            
            // AI 답변도 혹시 모를 태그 포함 여부를 대비해 텍스트로만 렌더링 (리액트 기본 기능)
            setMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: "서버 연결 오류가 발생했습니다." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* 1. 플로팅 버튼 (CounselorChat 스타일과 통일) */}
            <button onClick={onToggle} style={{...getBtnStyle(isMobile), background: isOpen ? '#334155' : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'}}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.3s', transform: isOpen ? 'scale(0.85)' : 'scale(1)' }}>
                    <AutoAwesomeIcon style={{ fontSize: isMobile ? '20px' : '26px', marginBottom: '2px' }} />
                    <span style={{ fontSize: isMobile ? '8px' : '10px', fontWeight: '800', letterSpacing: '-0.5px' }}>AI 상담</span>
                </div>
            </button>

            {/* 2. 채팅창 (CounselorChat 레이아웃과 통일) */}
            <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
                <div style={chatWinStyle}> {/* chatWinStyle은 최종 위치를 정의 */}
                    {/* 헤더 안내 */}
                    <div style={noticeStyle}>
                        <span style={{ flex: 1 }}>✨ 지능형 AI 상담</span>
                        <IconButton 
                            size="small" 
                            onClick={onToggle} 
                            sx={{ color: 'white', p: 0.5, display: { xs: 'none', md: 'inline-flex' } }}
                        >
                            <CloseIcon sx={{ fontSize: '18px' }} />
                        </IconButton>
                    </div>

                    {/* 메시지 리스트 */}
                    <div style={msgListStyle}>
                        {messages.map((m, i) => (
                            <div key={i} style={m.role === 'user' ? myMsgWrapper : otherMsgWrapper}>
                                <div style={m.role === 'user' ? myMsgBubble : otherMsgBubble}>
                                    {/* 발신자 이름은 AI 상담 버튼과 통일성을 위해 'AI'로 표시 */}
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', opacity: 0.8 }}>
                                        {m.role === 'user' ? '나' : 'AI'}
                                    </div>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ ...otherMsg, color: '#888', fontStyle: 'italic' }}>
                                AI가 답변을 생각 중입니다...
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>

                    {/* 입력 영역 */}
                    <div style={inputArea}>
                        <input
                            value={input}
                            onChange={handleInputChange} // ✅ 보안 필터 적용
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

export default AiChatBot;