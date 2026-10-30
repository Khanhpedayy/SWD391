import { useEffect, useRef, useState } from "react";
import "./AIChatbot.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SUGGESTIONS = [
    "Giải thích một khái niệm khó",
    "Tạo 5 câu hỏi trắc nghiệm JavaScript",
    "Làm sao để ôn tập hiệu quả?"
];

export default function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Xin chào! 👋 Mình là AI Tutor. Bạn muốn giải bài tập, ôn tập kiến thức hay tạo câu hỏi luyện tập?"
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading, isOpen]);

    async function sendMessage(text = input) {
        const content = text.trim();
        if (!content || loading) return;

        const nextMessages = [...messages, { role: "user", content }];
        setMessages(nextMessages);
        setInput("");
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/ai/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: nextMessages
                        .filter((message) => message.role === "user" || message.role === "assistant")
                        .slice(-12)
                        .map(({ role, content: messageContent }) => ({ role, content: messageContent }))
                })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || "Không thể kết nối AI.");

            setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
        } catch (err) {
            setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        sendMessage();
    }

    function resetChat() {
        setMessages([{
            role: "assistant",
            content: "Cuộc trò chuyện mới bắt đầu! Bạn cần mình giúp gì hôm nay?"
        }]);
        setError("");
    }

    return (
        <div className="ai-chatbot">
            {isOpen && (
                <section className="ai-chat-window" aria-label="AI Tutor chatbot">
                    <header className="ai-chat-header">
                        <div className="ai-chat-avatar">✦</div>
                        <div className="ai-chat-heading">
                            <strong>AI Tutor</strong>
                            <span><i /> Trợ lý học tập</span>
                        </div>
                        <button className="ai-icon-button" onClick={resetChat} title="Cuộc trò chuyện mới" aria-label="Cuộc trò chuyện mới">↻</button>
                        <button className="ai-icon-button" onClick={() => setIsOpen(false)} title="Đóng chat" aria-label="Đóng chat">×</button>
                    </header>

                    <div className="ai-chat-messages">
                        {messages.map((message, index) => (
                            <div className={`ai-message-row ${message.role}`} key={`${index}-${message.role}`}>
                                {message.role === "assistant" && <span className="ai-message-avatar">✦</span>}
                                <div className="ai-message-bubble">{message.content}</div>
                            </div>
                        ))}
                        {loading && (
                            <div className="ai-message-row assistant">
                                <span className="ai-message-avatar">✦</span>
                                <div className="ai-message-bubble ai-typing"><span /><span /><span /></div>
                            </div>
                        )}
                        {messages.length === 1 && (
                            <div className="ai-suggestions">
                                <p>Bạn có thể hỏi mình:</p>
                                {SUGGESTIONS.map((suggestion) => (
                                    <button key={suggestion} onClick={() => sendMessage(suggestion)} disabled={loading}>{suggestion}</button>
                                ))}
                            </div>
                        )}
                        {error && <div className="ai-chat-error">{error}</div>}
                        <div ref={bottomRef} />
                    </div>

                    <form className="ai-chat-form" onSubmit={handleSubmit}>
                        <input
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder="Nhập câu hỏi của bạn..."
                            aria-label="Nhập câu hỏi"
                            maxLength={4000}
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !input.trim()} aria-label="Gửi tin nhắn">➤</button>
                    </form>
                    <p className="ai-chat-disclaimer">AI có thể trả lời chưa chính xác. Hãy kiểm tra lại kiến thức quan trọng.</p>
                </section>
            )}

            <button className={`ai-chat-launcher ${isOpen ? "opened" : ""}`} onClick={() => setIsOpen((open) => !open)} aria-label={isOpen ? "Đóng AI Tutor" : "Mở AI Tutor"}>
                {isOpen ? "×" : "✦"}
                {!isOpen && <span>Hỏi AI Tutor</span>}
            </button>
        </div>
    );
}
