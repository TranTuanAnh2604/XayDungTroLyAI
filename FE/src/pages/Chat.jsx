import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
    getSessions,
    createSession,
    getMessages,
    sendMessage,
    deleteMessage
} from "../services/chatService";

export default function Chat() {
    const textareaRef = useRef(null);
    const scrollRef = useRef(null);

    const navigate = useNavigate();
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);        // cho handleSend
    const [regeneratingIndex, setRegeneratingIndex] = useState(null); // cho handleRegenerate
    const [error, setError] = useState("");
    const [feedbacks, setFeedbacks] = useState({});

    const handleFeedback = (msgId, type) => {
        setFeedbacks(prev => ({
            ...prev,
            [msgId]: prev[msgId] === type ? null : type, // toggle
        }));
    };

    const handleRegenerate = async (aiMsgIndex) => {
        const userMsg = messages[aiMsgIndex - 1];
        const aiMsg = messages[aiMsgIndex];
        if (!userMsg || userMsg.role !== 'user') return;

        setRegeneratingIndex(aiMsgIndex); // ← chỉ đánh dấu index này
        setError("");

        try {
            const isRealId = (id) => id && !String(id).startsWith('temp-')
            if (isRealId(aiMsg?.id)) await deleteMessage(sessionId, aiMsg.id);
            if (isRealId(userMsg?.id)) await deleteMessage(sessionId, userMsg.id);

            await sendMessage(sessionId, userMsg.content);

            const res = await getMessages(sessionId);
            setMessages(res.data || []);
        } catch (err) {
            console.log('Regenerate error:', err.response?.data)
            setError(err.response?.data?.message || "Không thể tạo lại câu trả lời!");
        } finally {
            setRegeneratingIndex(null);
        }
    };

    const handleInput = () => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = "";
            el.style.height = el.scrollHeight + "px";
        }
    };

    // Cuộn xuống cuối mỗi khi có tin nhắn mới
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Load session gần nhất (hoặc tạo mới nếu chưa có session nào)
    useEffect(() => {
        let isMounted = true;

        (async () => {
            setIsLoading(true);
            setError("");
            try {
                const sessionsRes = await getSessions();
                const sessions = sessionsRes.data || [];

                let activeSessionId;
                if (sessions.length > 0) {
                    // Session đầu tiên là gần nhất (BE đã sort theo LastActivity giảm dần)
                    activeSessionId = sessions[0].id;
                } else {
                    const newSessionRes = await createSession();
                    activeSessionId = newSessionRes.data.id;
                }

                if (!isMounted) return;
                setSessionId(activeSessionId);

                const messagesRes = await getMessages(activeSessionId);
                if (!isMounted) return;
                setMessages(messagesRes.data || messagesRes || []);
            } catch (err) {
                console.error("Load session error:", err.response || err);
                if (isMounted) {
                    // Nếu 401 → token hết hạn → redirect login
                    if (err.response?.status === 401) {
                        navigate('/login');
                        return;
                    }
                    setError(err.response?.data?.message || err.response?.data?.messenger || "Không thể tải hội thoại!");
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        })();

        return () => { isMounted = false; };
    }, []);

    const handleNewChat = useCallback(async () => {
        setError("");
        setIsLoading(true);
        try {
            const res = await createSession();
            setSessionId(res.data.id);
            setMessages([]);
        } catch (err) {
            setError(err.response?.data?.messenger || "Không tạo được hội thoại mới!");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSend = async () => {
        const content = input.trim();
        if (!content || !sessionId || isSending) return;

        setIsSending(true);
        setError("");

        const tempUserMsg = {
            id: `temp-${Date.now()}`,
            role: "user",
            content,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempUserMsg]);
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "";
        }

        try {
            await sendMessage(sessionId, content, messages);

            // Load lại từ DB để có real id cho cả user msg lẫn AI msg
            const res = await getMessages(sessionId);
            setMessages(res.data || []);
        } catch (err) {
            // Xóa temp msg nếu lỗi
            setMessages((prev) => prev.filter(m => m.id !== tempUserMsg.id));
            setError(err.response?.data?.messenger || "Gửi tin nhắn thất bại!");
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestionClick = (text) => {
        setInput(text);
    };

    // Tách code block ```...``` ra khỏi text thường để render giống AI Message gốc
    const renderContent = (content) => {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
            }
            parts.push({ type: "code", lang: match[1] || "code", value: match[2] });
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < content.length) {
            parts.push({ type: "text", value: content.slice(lastIndex) });
        }
        if (parts.length === 0) parts.push({ type: "text", value: content });

        return parts.map((part, i) => {
            if (part.type === "code") {
                return (
                    <div key={i} className="bg-[#191c1e] rounded-lg overflow-hidden border border-[#c4c7c9]/30">
                        <div className="flex justify-between items-center px-[16px] py-[4px] bg-[#c4c7c9]/10 border-b border-[#c4c7c9]/20">
                            <span className="text-[12px] font-medium text-[#818486] uppercase tracking-wider">{part.lang}</span>
                            <button
                                onClick={() => navigator.clipboard.writeText(part.value)}
                                className="flex items-center gap-[4px] text-[#818486] hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                <span className="text-[12px] font-medium">Copy code</span>
                            </button>
                        </div>
                        <div className="p-[16px] overflow-x-auto">
                            <pre className="text-[13px] leading-relaxed" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                                {part.value}
                            </pre>
                        </div>
                    </div>
                );
            }
            return part.value.trim() ? (
                <p key={i} className="text-[16px] leading-[1.5] whitespace-pre-wrap">
                    {part.value.trim()}
                </p>
            ) : null;
        });
    };

    return (
        <div
            className="flex h-screen w-full overflow-hidden text-[#0b1c30]"
            style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#f8f9ff" }}
        >
            {/* Sidebar */}
            <Sidebar
                onNewChat={handleNewChat}
                currentSessionId={sessionId}
                onSelectSession={async (id) => {
                    console.log("Selecting session:", id)
                    setError("")
                    setMessages([])
                    setSessionId(id)
                    setIsLoading(true)
                    try {
                        const res = await getMessages(id)
                        console.log("Messages loaded:", res)
                        // res đã là {success, messenger, data: [...]}
                        setMessages(res.data || res || [])
                    } catch (err) {
                        console.error("Load messages error:", err.response || err)
                        setError(err.response?.data?.message || "Không tải được hội thoại!")
                    } finally {
                        setIsLoading(false)
                    }
                }}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:ml-[280px] w-full relative bg-[#f8f9ff]">
                {/* Top Bar */}
                <header className="flex justify-between items-center w-full px-[24px] py-[8px] sticky top-0 z-30 bg-[#f8f9ff]/70 backdrop-blur-xl border-b border-[#c6c6cd] shadow-sm">
                    <div className="flex items-center gap-[16px] w-full max-w-[600px]">
                        <div className="relative w-full max-w-md focus-within:ring-2 focus-within:ring-[#6b38d4] rounded-lg transition-all">
                        </div>
                    </div>
                    <div className="flex items-center gap-[8px]">
                        <button
                            onClick={handleNewChat}
                            title="New Chat"
                            className="p-[8px] rounded-full text-[#45464d] hover:text-[#000000] hover:bg-[#dce9ff] transition-colors"
                        >
                            <span className="material-symbols-outlined">add_circle</span>
                        </button>
                        <div className="ml-[8px] pl-[8px] border-l border-[#c6c6cd]">
                        </div>
                    </div>
                </header>

                {/* Chat Canvas */}
                <main ref={scrollRef} className="flex-1 overflow-y-auto p-[24px] flex flex-col gap-[40px] pb-[200px]">
                    <div className="w-full max-w-[900px] mx-auto flex flex-col gap-[24px]">

                        {isLoading ? (
                            <div className="flex justify-center py-[40px]">
                                <span className="material-symbols-outlined animate-spin text-[#6b38d4] text-[32px]">progress_activity</span>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-[80px] text-center">
                                <span className="material-symbols-outlined text-[#c6c6cd] text-[48px] mb-[16px]">forum</span>
                                <p className="text-[16px] text-[#45464d]">Bắt đầu cuộc hội thoại với AI Assistant</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isUser = msg.role === "user";
                                return isUser ? (
                                    <div key={msg.id} className="flex gap-[16px] justify-end max-w-[85%] self-end">
                                        <div className="bg-[#131b2e] text-[#7c839b] rounded-2xl rounded-tr-sm p-[16px] shadow-sm border border-[#c6c6cd]/20">
                                            <p className="text-[16px] leading-[1.5] whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                        <img
                                            alt="User"
                                            className="w-8 h-8 rounded-full mt-auto mb-1"
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7H_O_ofbbJA8S0e7wLsQEpoZ84JMr5LcmXABn6PvpLTu8BG647Eg3jm0BzfJup86VaiihqQf2nX99O839buAlmgomH6sk9vE7C9Xx54b2ZEzkZeAKOZXnvhSTSaCgAaet4biaZt3gxgjB4pSP5QZox-_2YcD06OnJFTfAjYuLULLna-wgj5gr0VEKRGjweqV3y133vl4v9xtXRgNn1EmV7Rpns-lqfPN2lU1kvoagVbqtlhl-FdJQcxHKQFMF3lohTbmjkbo-7ig"
                                        />
                                    </div>
                                ) : (
                                    <div key={msg.id} className="flex gap-[16px] max-w-[95%]">
                                        <div className="w-8 h-8 rounded-full bg-[#6b38d4] flex-shrink-0 flex items-center justify-center text-white mt-1">
                                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                robot_2
                                            </span>
                                        </div>
                                        <div className="bg-white text-[#0b1c30] border border-[#c6c6cd]/50 rounded-2xl rounded-tl-sm p-[16px] shadow-sm flex flex-col gap-[16px] w-full">
                                            {renderContent(msg.content)}

                                                {/* AI Actions */}
                                                <div className="flex items-center gap-[8px] mt-[8px] pt-[8px] border-t border-[#c6c6cd]/20">
                                                    {/* Like */}
                                                    <button
                                                        onClick={() => handleFeedback(msg.id, 'like')}
                                                        title="Good response"
                                                        className={`p-[4px] rounded transition-colors ${feedbacks[msg.id] === 'like'
                                                                ? 'text-[#6b38d4] bg-[#e9ddff]'
                                                                : 'text-[#45464d] hover:bg-[#dce9ff]'
                                                            }`}
                                                    >
                                                        <span
                                                            className="material-symbols-outlined text-[18px]"
                                                            style={feedbacks[msg.id] === 'like' ? { fontVariationSettings: "'FILL' 1" } : {}}
                                                        >
                                                            thumb_up
                                                        </span>
                                                    </button>

                                                    {/* Dislike */}
                                                    <button
                                                        onClick={() => handleFeedback(msg.id, 'dislike')}
                                                        title="Bad response"
                                                        className={`p-[4px] rounded transition-colors ${feedbacks[msg.id] === 'dislike'
                                                                ? 'text-[#ba1a1a] bg-[#ffdad6]'
                                                                : 'text-[#45464d] hover:bg-[#dce9ff]'
                                                            }`}
                                                    >
                                                        <span
                                                            className="material-symbols-outlined text-[18px]"
                                                            style={feedbacks[msg.id] === 'dislike' ? { fontVariationSettings: "'FILL' 1" } : {}}
                                                        >
                                                            thumb_down
                                                        </span>
                                                    </button>

                                                    {/* Regenerate */}
                                                    <button
                                                        onClick={() => handleRegenerate(index)}
                                                        title="Regenerate"
                                                        disabled={regeneratingIndex !== null} // disable tất cả khi đang regenerate 1 cái
                                                        className="p-[4px] rounded text-[#45464d] hover:bg-[#dce9ff] transition-colors disabled:opacity-40"
                                                    >
                                                        <span className={`material-symbols-outlined text-[18px] ${regeneratingIndex === index ? 'animate-spin' : ''}`}>
                                                            refresh
                                                        </span>
                                                    </button>
                                                </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* AI đang trả lời (typing indicator) */}
                        {isSending && (
                            <div className="flex gap-[16px] max-w-[95%]">
                                <div className="w-8 h-8 rounded-full bg-[#6b38d4] flex-shrink-0 flex items-center justify-center text-white mt-1">
                                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        robot_2
                                    </span>
                                </div>
                                <div className="bg-white text-[#45464d] border border-[#c6c6cd]/50 rounded-2xl rounded-tl-sm p-[16px] shadow-sm">
                                    <span className="material-symbols-outlined animate-pulse text-[18px]">more_horiz</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-center text-[#ba1a1a] text-[14px]">{error}</p>
                        )}
                    </div>
                </main>

                {/* Input Area */}
                <div className="absolute bottom-0 w-full px-[24px] pb-[24px] pt-[40px] bg-gradient-to-t from-[#f8f9ff] via-[#f8f9ff] to-transparent pointer-events-none">
                    <div className="w-full max-w-[900px] mx-auto pointer-events-auto">
                        {/* Suggestion Chips */}
                        <div className="flex gap-[8px] mb-[16px] overflow-x-auto pb-[4px]">
                            {["Explain this code", "Optimize performance", "Write unit tests"].map((label) => (
                                <button
                                    key={label}
                                    onClick={() => handleSuggestionClick(label)}
                                    className="px-[16px] py-[4px] rounded-full bg-[#e9ddff] text-[#5516be] text-[13px] font-medium whitespace-nowrap hover:bg-[#d0bcff] transition-colors border border-[#d0bcff]/50"
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Input Box */}
                        <div className="rounded-xl border border-[#c6c6cd]/50 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] flex items-end gap-[8px] p-[8px] focus-within:ring-2 focus-within:ring-[#6b38d4]/50 focus-within:border-[#6b38d4] transition-all bg-white"
                            style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
                        >
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 bg-transparent border-none focus:ring-0 resize-none p-[8px] text-[16px] text-[#0b1c30] placeholder:text-[#c6c6cd] focus:outline-none"
                                style={{ maxHeight: "150px", minHeight: "40px" }}
                                placeholder="Message AI Assistant..."
                                rows={1}
                                onInput={handleInput}
                                disabled={isSending || isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isSending || isLoading || !input.trim()}
                                className="p-[8px] rounded-lg bg-[#000000] text-white hover:bg-[#000000]/90 transition-all shadow-sm active:scale-95 flex items-center justify-center h-10 w-10 shrink-0 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    send
                                </span>
                            </button>
                        </div>

                        <div className="text-center mt-[4px]">
                            <span className="text-[11px] text-[#76777d]">
                                AI Assistant may produce inaccurate information about people, places, or facts.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}