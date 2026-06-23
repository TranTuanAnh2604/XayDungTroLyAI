import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { getInboxGmails, getGmailDetail } from "../services/gmailService";

export default function Gmail() {
    const [gmails, setGmails] = useState([]);
    const [selectedGmail, setSelectedGmail] = useState(null);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSelectGmail = async (gmail) => {
        // Nếu thư chưa đọc → mark as read trong state
        if (gmail.isUnread) {
            setGmails(prev =>
                prev.map(g => g.id === gmail.id ? { ...g, isUnread: false } : g)
            );
            gmail = { ...gmail, isUnread: false };
        }

        setSelectedGmail(gmail);
        setSelectedDetail(null);
        setIsDetailLoading(true);
        try {
            const res = await getGmailDetail(gmail.id);
            if (res.data) setSelectedDetail(res.data);
        } catch {
            // fallback: dùng snippet
        } finally {
            setIsDetailLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        (async () => {
            setIsLoading(true);
            setError("");

            try {
                const res = await getInboxGmails(15);
                if (!isMounted) return;

                if (res.data && res.data.length > 0) {
                    setGmails(res.data);
                    setSelectedGmail(res.data[0]);
                    setIsDetailLoading(true);
                    try {
                        const detail = await getGmailDetail(res.data[0].id);
                        if (!isMounted) return;
                        if (detail.data) setSelectedDetail(detail.data);
                    } catch {
                        // fallback snippet
                    } finally {
                        if (isMounted) setIsDetailLoading(false);
                    }
                } else if (res.success === false) {
                    setError("connect");
                }
                // ✅ data: [] thì gmails rỗng, không set error
            } catch {
                if (isMounted) setError("connect");
            } finally {
                // ✅ Quan trọng — luôn tắt loading
                if (isMounted) setIsLoading(false);
            }
        })();

        return () => { isMounted = false; };
    }, []);

    // Format sender name từ "Name <gmail>"
    const parseSender = (from = "") => {
        const match = from.match(/^(.*?)\s*<(.+)>$/);
        if (match) return { name: match[1].trim() || match[2], gmail: match[2] };
        return { name: from, gmail: from };
    };

    // Format date
    const formatDate = (dateStr = "") => {
        try {
            const d = new Date(dateStr);
            const now = new Date();
            if (d.toDateString() === now.toDateString()) {
                return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
            }
            return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" });
        } catch { return dateStr; }
    };

    // Initials avatar
    const getInitials = (name = "") => {
        const parts = name.trim().split(" ");
        return parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name.slice(0, 2).toUpperCase();
    };

    const detail = selectedDetail || selectedGmail;
    const sender = parseSender(detail?.from);

    return (
        <div className="flex h-screen overflow-hidden antialiased"
            style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#f8f9ff", color: "#0b1c30" }}>
            <Sidebar />

            <main className="flex-1 flex flex-col ml-0 md:ml-[280px] h-screen overflow-hidden bg-[#f8f9ff]">

                {/* TopBar */}
                <header className="flex justify-between items-center w-full px-[24px] py-[8px] sticky top-0 z-30 bg-[#f8f9ff]/70 backdrop-blur-xl shadow-sm border-b border-[#c6c6cd] shrink-0">
                    <div className="flex-1 max-w-md mx-[16px] relative group">
                        <div className="absolute inset-y-0 left-0 pl-[8px] flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-[#45464d] group-focus-within:text-[#6b38d4] transition-colors">search</span>
                        </div>
                        <input
                            className="w-full pl-[40px] pr-[16px] py-[8px] bg-white border border-[#c6c6cd] rounded-full text-[16px] text-[#0b1c30] focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] transition-all"
                            placeholder="Tìm kiếm gmail..."
                            type="text"
                        />
                    </div>
                </header>

                {/* Inbox Canvas */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Gmail List */}
                    <div className="w-full md:w-[400px] flex flex-col border-r border-[#c6c6cd] bg-white shrink-0">
                        <div className="p-[16px] border-b border-[#c6c6cd] flex items-center justify-between bg-white sticky top-0 z-10">
                            <h2 className="text-[24px] font-semibold text-[#000000]">Inbox</h2>
                            <span className="px-[8px] py-[4px] rounded-full bg-[#dce9ff] text-[#0b1c30] text-[14px] font-medium">
                                {gmails.filter(e => e.isUnread).length} chưa đọc
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                // Skeleton loading
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="p-[16px] border-b border-[#c6c6cd] animate-pulse">
                                        <div className="flex gap-[12px]">
                                            <div className="w-10 h-10 rounded-full bg-[#e5e7eb] shrink-0"></div>
                                            <div className="flex-1 space-y-[8px]">
                                                <div className="h-[14px] bg-[#e5e7eb] rounded w-3/4"></div>
                                                <div className="h-[14px] bg-[#e5e7eb] rounded w-full"></div>
                                                <div className="h-[12px] bg-[#e5e7eb] rounded w-5/6"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : error === "connect" ? (
                                <div className="flex flex-col items-center justify-center h-full p-[32px] text-center">
                                    <span className="material-symbols-outlined text-[48px] text-[#c6c6cd] mb-[16px]">mail</span>
                                    <p className="text-[16px] font-semibold text-[#0b1c30] mb-[8px]">Chưa kết nối Gmail</p>
                                    <p className="text-[14px] text-[#45464d] mb-[16px]">
                                        Hãy đăng nhập bằng Google ở trang đăng nhập để xem được gmail
                                    </p>
                                </div>
                            ) : gmails.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full p-[32px] text-center">
                                    <span className="material-symbols-outlined text-[48px] text-[#c6c6cd] mb-[16px]">inbox</span>
                                    <p className="text-[16px] text-[#45464d]">Hộp thư trống</p>
                                </div>
                            ) : (
                                gmails.map((gmail) => {
                                    const s = parseSender(gmail.from);
                                    const isSelected = selectedGmail?.id === gmail.id;
                                    return (
                                        <div
                                            key={gmail.id}
                                            onClick={() => handleSelectGmail(gmail)}
                                            className={`p-[16px] border-b border-[#c6c6cd] cursor-pointer transition-colors relative
                                                ${isSelected ? "border-l-4 border-l-[#6b38d4] bg-[#eff4ff]" : "hover:bg-[#eff4ff]"}
                                                ${gmail.isUnread ? "" : "opacity-70"}`}
                                        >
                                            <div className="flex gap-[12px]">
                                                <div className="w-10 h-10 rounded-full bg-[#d3e4fe] flex items-center justify-center text-[14px] font-bold text-[#6b38d4] shrink-0">
                                                    {getInitials(s.name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-[4px]">
                                                        <span className={`text-[14px] truncate ${gmail.isUnread ? "font-bold text-[#0b1c30]" : "font-medium text-[#0b1c30]"}`}>
                                                            {s.name}
                                                        </span>
                                                        <span className={`text-[12px] shrink-0 ml-[8px] ${gmail.isUnread ? "font-semibold text-[#8455ef]" : "text-[#45464d]"}`}>
                                                            {formatDate(gmail.date)}
                                                        </span>
                                                    </div>
                                                    <h3 className={`text-[14px] truncate mb-[4px] ${gmail.isUnread ? "font-semibold text-[#000000]" : "text-[#000000]"}`}>
                                                        {gmail.subject || "(Không có tiêu đề)"}
                                                    </h3>
                                                    <p className="text-[13px] text-[#45464d] line-clamp-2 leading-tight">{gmail.snippet}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Gmail Detail */}
                    <div className="hidden md:flex flex-1 flex-col bg-[#f8f9ff] relative">
                        {!detail ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-[32px]">
                                <span className="material-symbols-outlined text-[64px] text-[#c6c6cd] mb-[16px]">mark_email_read</span>
                                <p className="text-[18px] text-[#45464d]">Chọn một gmail để đọc</p>
                            </div>
                        ) : (
                            <>
                                {/* Detail Header */}
                                <div className="p-[24px] border-b border-[#c6c6cd] flex justify-between items-center bg-white shrink-0">
                                    <div className="flex items-center gap-[16px]">
                                        <div className="w-12 h-12 rounded-full bg-[#d3e4fe] flex items-center justify-center text-[20px] font-bold text-[#6b38d4]">
                                            {getInitials(sender.name)}
                                        </div>
                                        <div>
                                            <h2 className="text-[20px] font-semibold text-[#000000]">{detail.subject || "(Không có tiêu đề)"}</h2>
                                            <div className="flex items-center gap-[8px] mt-[4px]">
                                                <span className="text-[14px] font-medium text-[#0b1c30]">{sender.name}</span>
                                                <span className="text-[14px] text-[#45464d]">&lt;{sender.gmail}&gt;</span>
                                                <span className="text-[14px] text-[#45464d]">{formatDate(detail.date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-[8px]">
                                        {[{ icon: "reply", title: "Reply" }, { icon: "forward", title: "Forward" }, { icon: "more_vert", title: "More" }].map(({ icon, title }) => (
                                            <button key={icon} title={title} className="p-[8px] rounded-full hover:bg-[#eff4ff] text-[#45464d] transition-colors">
                                                <span className="material-symbols-outlined">{icon}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                    {/* Gmail Body */}
                                    <div className="flex-1 overflow-y-auto p-[24px]">
                                        {isDetailLoading ? (
                                            <div className="space-y-[12px] animate-pulse">
                                                {Array.from({ length: 6 }).map((_, i) => (
                                                    <div key={i} className={`h-[16px] bg-[#e5e7eb] rounded ${i % 3 === 2 ? "w-2/3" : "w-full"}`}></div>
                                                ))}
                                            </div>
                                        ) : selectedDetail?.bodyHtml ? (
                                            <div
                                                className="prose max-w-none text-[#0b1c30]"
                                                dangerouslySetInnerHTML={{ __html: selectedDetail.bodyHtml }}
                                            />
                                        ) : selectedDetail?.body ? (
                                            <pre className="whitespace-pre-wrap text-[16px] leading-[1.6] text-[#0b1c30] font-sans">
                                                {selectedDetail.body}
                                            </pre>
                                        ) : (
                                            <p className="text-[16px] leading-[1.6] text-[#0b1c30]">{detail.snippet}</p>
                                        )}
                                    </div>

                                {/* Reply Bar */}
                                <div className="p-[24px] border-t border-[#c6c6cd] bg-white shrink-0">
                                    <div className="relative rounded-xl border border-[#c6c6cd] focus-within:border-[#6b38d4] focus-within:ring-2 focus-within:ring-[#6b38d4]/20 transition-all p-[4px] flex flex-col"
                                        style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)" }}>
                                        <textarea
                                            className="w-full bg-transparent border-none resize-none text-[16px] text-[#0b1c30] p-[8px] min-h-[80px] focus:ring-0 focus:outline-none placeholder:text-[#45464d]/50"
                                            placeholder="Trả lời..."
                                            rows={2}
                                        />
                                        <div className="flex justify-between items-center mt-[4px] px-[8px] pb-[8px]">
                                            <button className="p-[4px] rounded text-[#8455ef] hover:bg-[#dce9ff] transition-colors flex items-center gap-[4px]">
                                                <span className="material-symbols-outlined text-[20px]">edit_note</span>
                                                <span className="text-[14px] font-medium">Draft với AI</span>
                                            </button>
                                            <button className="px-[16px] py-[8px] rounded-lg text-white text-[14px] font-semibold flex items-center gap-[4px] hover:shadow-md transition-shadow"
                                                style={{ background: "linear-gradient(135deg, #6b38d4, #8455ef)" }}>
                                                <span>Gửi</span>
                                                <span className="material-symbols-outlined text-[18px]">send</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}