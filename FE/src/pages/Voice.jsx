import { useEffect, useRef, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import { processVoice, saveTranscript } from "../services/voiceService";

export default function Voice() {
    const barsRef = useRef([]);
    const recognitionRef = useRef(null);
    const transcriptRef = useRef(""); // giữ giá trị mới nhất, tránh lỗi closure
    const isConversationModeRef = useRef(false);

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("Bấm vào micro để bắt đầu nói...");
    const [aiResponse, setAiResponse] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [taskCreated, setTaskCreated] = useState(false);
    const [calendarCreated, setCalendarCreated] = useState(false);
    const [error, setError] = useState("");

    // Một số trình duyệt load danh sách voices bất đồng bộ, cần load trước
    useEffect(() => {
        if (!window.speechSynthesis) return;
        const loadVoices = () => window.speechSynthesis.getVoices();
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    // Đọc to bằng Speech Synthesis — khai báo trước vì handleSendToAI cần dùng
    const speakText = useCallback((text, onDone) => {
        if (!window.speechSynthesis) {
            onDone?.();
            return;
        }
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "vi-VN";

        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find((v) => v.lang === "vi-VN" || v.lang.startsWith("vi"));
        if (viVoice) utterance.voice = viVoice;

        // Callback khi đọc xong
        utterance.onend = () => onDone?.();

        window.speechSynthesis.speak(utterance);
    }, []);

    // Gửi text cho AI xử lý
    const handleSendToAI = useCallback(async (text) => {
        setIsProcessing(true);
        setError("");
        setAiResponse("");
        setTaskCreated(false);
        try {
            const res = await processVoice(text);
            // Response giờ là { reply, taskCreated, taskId }
            const { reply, taskCreated: tCreated, calendarEventCreated: cCreated } = res.data;

            setAiResponse(reply);
            if (tCreated) setTaskCreated(true);
            if (cCreated) setCalendarCreated(true);

            saveTranscript(text, reply).catch(console.error);

            speakText(reply, () => {
                if (recognitionRef.current && isConversationModeRef.current) {
                    transcriptRef.current = "";
                    setTranscript("");
                    setTaskCreated(false);
                    setTimeout(() => {
                        try {
                            recognitionRef.current.start();
                            setIsListening(true);
                        } catch (e) {
                            console.warn("Recognition restart failed:", e);
                        }
                    }, 800);
                }
            });
        } catch (err) {
            setError(err.response?.data?.messenger || "AI xử lý thất bại!");
        } finally {
            setIsProcessing(false);
        }
    }, [speakText]);

    // Khởi tạo Web Speech API
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            // dùng setTimeout để tránh setState đồng bộ ngay trong effect
            const timer = setTimeout(() => {
                setError("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Hãy dùng Chrome!");
            }, 0);
            return () => clearTimeout(timer);
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "vi-VN";
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let text = "";
            for (let i = 0; i < event.results.length; i++) {
                text += event.results[i][0].transcript;
            }
            transcriptRef.current = text;
            setTranscript(text);
        };

        recognition.onend = () => {
            setIsListening(false);
            const finalText = transcriptRef.current.trim();

            if (finalText) {
                handleSendToAI(finalText);
                return; // không restart ngay, chờ AI xong
            }

            // Không có text + đang conversation mode → restart
            if (isConversationModeRef.current) {
                setTimeout(() => {
                    if (!isConversationModeRef.current) return;
                    try {
                        recognition.start();
                        setIsListening(true);
                    } catch (e) {
                        console.warn("Restart failed:", e);
                    }
                }, 500);
            }
        };

        recognition.onerror = (event) => {
            // Bỏ qua lỗi aborted — đây là lỗi bình thường khi stop thủ công
            if (event.error === "aborted" || event.error === "no-speech") {
                setIsListening(false);
                return;
            }
            setError("Lỗi nhận diện giọng nói: " + event.error);
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
        };
    }, [handleSendToAI]);

    // Waveform animation
    useEffect(() => {
        const interval = setInterval(() => {
            barsRef.current.forEach((bar) => {
                if (bar) {
                    const randomScale = isListening ? 0.5 + Math.random() : 0.3;
                    bar.style.transform = `scaleY(${randomScale})`;
                }
            });
        }, 300);
        return () => clearInterval(interval);
    }, [isListening]);

    // Nút 1
    const handleSingleListen = () => {
        if (!recognitionRef.current || isProcessing) return;

        if (isListening) {
            recognitionRef.current.abort();
            setIsListening(false);
            return;
        }

        isConversationModeRef.current = false;
        transcriptRef.current = "";
        setTranscript("");
        setError("");

        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (e) {
            console.warn("Start failed:", e);
        }
    };

    const handleEndCall = () => {
        isConversationModeRef.current = false;
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
        window.speechSynthesis.cancel();
        setIsListening(false);
        transcriptRef.current = "";
        setTranscript("Bấm vào micro để bắt đầu nói...");
        setAiResponse("");
        setError("");
    };

    const waveformBars = [
        { h: "h-8" }, { h: "h-12" }, { h: "h-20" }, { h: "h-24" }, { h: "h-16" },
        { h: "h-20" }, { h: "h-10" }, { h: "h-14" }, { h: "h-8" },
    ];

    return (
        <>
            <style>{`
        .waveform-bar {
          transition: transform 0.3s ease;
          transform-origin: bottom;
        }
        .pulse-ring {
          animation: pulse-anim 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-anim {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .5; transform: scale(1.1); }
        }
        .typing-cursor::after {
          content: '|';
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>

            <div
                className="flex h-screen w-full overflow-hidden"
                style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#f8f9ff", color: "#0b1c30" }}
            >
                <Sidebar />

                <div className="flex-1 ml-0 md:ml-[280px] flex flex-col h-full bg-[#f8f9ff] relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#6b38d4] opacity-5 blur-[120px] rounded-full mix-blend-multiply"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#000000] opacity-5 blur-[100px] rounded-full mix-blend-multiply"></div>
                    </div>

                    <main className="flex-1 flex flex-col items-center justify-between p-[24px] md:p-[64px] relative z-10 max-w-[1000px] w-full mx-auto">
                        <div className="flex-1"></div>

                        <div className="w-full max-w-3xl text-center mb-[40px]">
                            <p className="text-[14px] font-semibold text-[#6b38d4] uppercase tracking-widest mb-[16px]">
                                {isListening ? "Listening..." : isProcessing ? "Đang xử lý..." : "Sẵn sàng"}
                            </p>

                            <h2 className="text-[32px] md:text-[40px] font-light leading-tight text-[#0b1c30] min-h-[100px] typing-cursor">
                                {transcript || "Bấm vào micro để bắt đầu nói..."}
                            </h2>

                            {aiResponse && (
                                <div className="mt-[24px] p-[16px] bg-white rounded-xl ...">
                                    <p className="text-[14px] font-semibold text-[#6b38d4] mb-[8px]">AI trả lời:</p>
                                    <p className="text-[16px] text-[#0b1c30]">{aiResponse}</p>
                                </div>
                            )}

                            {taskCreated && (
                                <div className="mt-[12px] p-[12px] bg-[#e6f4ea] border border-[#1a6b38] rounded-xl flex items-center gap-[8px]">
                                    <span className="material-symbols-outlined text-[#1a6b38]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        task_alt
                                    </span>
                                    <p className="text-[14px] text-[#1a6b38] font-medium">
                                        Task đã được tạo tự động!
                                    </p>
                                </div>
                            )}

                            {calendarCreated && (
                                <div className="mt-[12px] p-[12px] bg-[#e5eeff] border border-[#6b38d4] rounded-xl flex items-center gap-[8px]">
                                    <span className="material-symbols-outlined text-[#6b38d4]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        calendar_add_on
                                    </span>
                                    <p className="text-[14px] text-[#6b38d4] font-medium">
                                        Sự kiện đã được thêm vào Calendar!
                                    </p>
                                </div>
                            )}

                            {error && (
                                <p className="mt-[16px] text-[#ba1a1a] text-[14px]">{error}</p>
                            )}
                        </div>

                        <div className="flex items-end justify-center gap-1 h-24 mb-[64px] w-full">
                            {waveformBars.map((bar, i) => (
                                <div
                                    key={i}
                                    ref={(el) => (barsRef.current[i] = el)}
                                    className={`w-2 bg-[#6b38d4] rounded-full ${bar.h} waveform-bar`}
                                ></div>
                            ))}
                        </div>

                        <div className="bg-[#f8f9ff]/80 backdrop-blur-xl border border-[#c6c6cd] shadow-sm rounded-full px-[24px] py-[8px] flex items-center justify-center gap-[24px] mb-[24px]">

                            {/* Nút 1 */}
                            <div className="relative">
                                {isListening && <div className="absolute inset-0 bg-[#6b38d4] rounded-full pulse-ring opacity-50"></div>}
                                <button
                                    onClick={handleSingleListen}
                                    disabled={isProcessing}
                                    className={`w-16 h-16 rounded-full text-white shadow-md flex items-center justify-center relative z-10 hover:opacity-90 transition-transform active:scale-95 disabled:opacity-50 ${isListening ? "bg-[#ba1a1a]" : "bg-[#6b38d4]"
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        {isListening ? "stop" : "mic"}
                                    </span>
                                </button>
                            </div>

                            {/* Nút 2 */}
                            <button
                                onClick={handleEndCall}
                                className="w-12 h-12 rounded-full flex items-center justify-center bg-[#ffdad6] text-[#93000a] hover:bg-[#ba1a1a] hover:text-white transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>call_end</span>
                            </button>
                        </div>

                        <div className="flex-1"></div>
                    </main>
                </div>
            </div>
        </>
    );
}