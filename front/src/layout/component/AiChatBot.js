import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// ✅ AI 챗봇 전용 보안 패턴: 한글, 영문, 숫자, 공백, 기본적인 문장부호(. , ? ! /)만 허용
// 태그(< >), 따옴표(' "), 세미콜론(;), 백슬래시(\) 등 모든 실행 가능 문자를 실시간 차단합니다.
const AI_SECURITY_REGEX = /[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣\s.,?!/]/g;

const AiChatBot = () => {
    const scrollRef = useRef(null);
    const [messages, setMessages] = useState([
        { role: 'ai', text: '퍼스트로드 AI 상담원입니다. 무엇을 도와드릴까요?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

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
            <button onClick={() => setIsOpen(!isOpen)} style={btnStyle}>
                {isOpen ? '✕' : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '24px' }}>🤖</span>
                        <span style={{ fontSize: '9px' }}>AI상담</span>
                    </div>
                )}
            </button>

            {/* 2. 채팅창 (CounselorChat 레이아웃과 통일) */}
            {isOpen && (
                <div style={chatWinStyle}>
                    {/* 헤더 안내 (CounselorChat의 noticeStyle 활용) */}
                    <div style={noticeStyle}>
                        ✨ 퍼스트로드 지능형 AI 상담 서비스
                    </div>

                    {/* 메시지 리스트 */}
                    <div style={msgListStyle}>
                        {messages.map((m, i) => (
                            <div key={i} style={m.role === 'user' ? myMsg : otherMsg}>
                                <strong>{m.role === 'user' ? '나' : 'AI'}:</strong> {m.text}
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
                            placeholder="AI에게 질문하기..."
                            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px' }}
                        />
                        <button onClick={handleSend} style={sendBtn}>전송</button>
                    </div>
                </div>
            )}
        </div>
    );
};


const btnStyle = { 
    width: '64px', 
    height: '64px', 
    borderRadius: '50%', 
    backgroundColor: '#0056b3', // AI는 파란색 계열로 차별화 (CounselorChat은 노란색)
    color: 'white',
    border: '2px solid white', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0
};

const chatWinStyle = { 
    position: 'absolute',
    bottom: '80px',
    right: '0',
    width: '320px', 
    height: '450px', 
    backgroundColor: '#f5f5f5', 
    border: '1px solid #ddd', 
    borderRadius: '15px', 
    display: 'flex', 
    flexDirection: 'column',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    zIndex: 1000 // 다른 요소보다 위에 뜨도록
};

const noticeStyle = { 
    backgroundColor: '#eef6ff', 
    color: '#0056b3', 
    fontSize: '11px', 
    padding: '8px', 
    textAlign: 'center', 
    fontWeight: 'bold',
    borderBottom: '1px solid #d0e3ff'
};

const msgListStyle = { flex: 1, overflowY: 'auto', padding: '10px' };
const inputArea = { display: 'flex', padding: '10px', backgroundColor: 'white', borderTop: '1px solid #ddd' };

// 메시지 말풍선 스타일
const myMsg = { textAlign: 'right', marginBottom: '10px', color: '#333', fontSize: '13px' };
const otherMsg = { textAlign: 'left', marginBottom: '10px', color: '#555', fontSize: '13px' };

const sendBtn = { 
    backgroundColor: 'transparent', 
    border: 'none', 
    color: '#0056b3', 
    fontWeight: 'bold', 
    cursor: 'pointer' 
};

export default AiChatBot;