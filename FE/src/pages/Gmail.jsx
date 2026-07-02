import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { getInboxGmails, getGmailDetail, summarizeGmail, summarizeAllGmails } from "../services/gmailService";

export default function Gmail() {
    const [gmails, setGmails] = useState([]);
    const [selectedGmail, setSelectedGmail] = useState(null);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [error, setError] = useState("");

    // --- Tóm tắt ---
    const [summary, setSummary] = useState(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState("");

    // --- Tóm tắt tất cả ---
    const [showAllSummaryModal, setShowAllSummaryModal] = useState(false);
    const [allSummaries, setAllSummaries] = useState([]);
    const [isLoadingAllSummaries, setIsLoadingAllSummaries] = useState(false);
    const [allSummaryError, setAllSummaryError] = useState("");

    const handleSelectGmail = async (gmail) => {
        if (gmail.isUnread) {
            setGmails(prev =>
                prev.map(g => g.id === gmail.id ? { ...g, isUnread: false } : g)
            );
            gmail = { ...gmail, isUnread: false };
        }

        setSelectedGmail(gmail);
        setSelectedDetail(null);
        setSummary(null);
        setSummaryError("");
        setIsDetailLoading(true);
        try {
            const res = await getGmailDetail(gmail.id);
            if (res.data) setSelectedDetail(res.data);
        } catch {
            // fallback snippet
        } finally {
            setIsDetailLoading(false);
        }
    };

    const handleSummarize = async () => {
        if (!selectedGmail) return;
        setSummary(null);
        setSummaryError("");
        setIsSummarizing(true);
        try {
            const res = await summarizeGmail(selectedGmail.id);
            if (res.data) {
                setSummary(res.data);
            } else {
                setSummaryError("Không thể tóm tắt email này.");
            }
        } catch {
            setSummaryError("Đã xảy ra lỗi khi tóm tắt.");
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleSummarizeAll = async () => {
        setShowAllSummaryModal(true);
        setAllSummaries([]);
        setAllSummaryError("");
        setIsLoadingAllSummaries(true);
        try {
            const res = await summarizeAllGmails(15);
            if (res.data && res.data.length > 0) {
                setAllSummaries([...res.data].sort((a, b) => a.index - b.index));
            } else {
                setAllSummaryError("Không có email nào để tóm tắt.");
            }
        } catch {
            setAllSummaryError("Đã xảy ra lỗi khi tóm tắt toàn bộ email.");
        } finally {
            setIsLoadingAllSummaries(false);
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
            } catch {
                if (isMounted) setError("connect");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        })();

        return () => { isMounted = false; };
    }, []);

    const parseSender = (from = "") => {
        const match = from.match(/^(.*?)\s*<(.+)>$/);
        if (match) return { name: match[1].trim() || match[2], gmail: match[2] };
        return { name: from, gmail: from };
    };

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

            <main className="flex-1 min-w-0 flex flex-col ml-0 md:ml-[280px] h-screen overflow-hidden bg-[#f8f9ff]">
                <div className="flex-1 min-w-0 flex overflow-hidden">

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
                    <div className="hidden md:flex flex-1 min-w-0 flex-col bg-[#f8f9ff] relative overflow-x-hidden">
                        {!detail ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-[32px]">
                                <span className="material-symbols-outlined text-[64px] text-[#c6c6cd] mb-[16px]">mark_email_read</span>
                                <p className="text-[18px] text-[#45464d]">Chọn một gmail để đọc</p>
                            </div>
                        ) : (
                            <>
                                {/* Detail Header */}
                                <div className="p-[24px] border-b border-[#c6c6cd] flex flex-col md:flex-row md:justify-between md:items-center gap-[16px] bg-white shrink-0">
                                    <div className="flex items-center gap-[16px] min-w-0">
                                        <div className="w-12 h-12 rounded-full bg-[#d3e4fe] flex items-center justify-center text-[20px] font-bold text-[#6b38d4] shrink-0">
                                            {getInitials(sender.name)}
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-[20px] font-semibold text-[#000000] truncate">{detail.subject || "(Không có tiêu đề)"}</h2>
                                            <div className="flex flex-wrap items-center gap-[8px] mt-[4px]">
                                                <span className="text-[14px] font-medium text-[#0b1c30]">{sender.name}</span>
                                                <span className="text-[14px] text-[#45464d]">&lt;{sender.gmail}&gt;</span>
                                                <span className="text-[14px] text-[#45464d]">{formatDate(detail.date)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-[10px] items-center shrink-0">
                                        {/* Nhóm nút tóm tắt AI — gộp chung 1 khung để dễ phân biệt 2 phạm vi */}
                                        <div className="flex items-center gap-[2px] p-[3px] rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
                                            {/* Tóm tắt email đang xem */}
                                            <button
                                                onClick={handleSummarize}
                                                disabled={isSummarizing}
                                                title="Tóm tắt email đang xem"
                                                className="flex items-center gap-[6px] px-[13px] py-[7px] rounded-lg text-[13px] font-semibold text-white transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                                                style={{ background: "linear-gradient(135deg, #6b38d4, #8455ef)" }}
                                            >
                                                {isSummarizing ? (
                                                    <svg className="animate-spin w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                    </svg>
                                                ) : (
                                                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                                )}
                                                <span>{isSummarizing ? "Đang tóm tắt..." : "Tóm tắt"}</span>
                                            </button>

                                            {/* Tóm tắt toàn bộ inbox */}
                                            <button
                                                onClick={handleSummarizeAll}
                                                disabled={gmails.length === 0}
                                                title="Tóm tắt toàn bộ Gmail trong Inbox"
                                                className="flex items-center gap-[6px] px-[13px] py-[7px] rounded-lg text-[13px] font-semibold text-[#6b38d4] transition-all hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">playlist_add_check</span>
                                                <span>Tất cả ({gmails.length})</span>
                                            </button>
                                        </div>

                                        <div className="w-px h-[24px] bg-[#c6c6cd]"></div>
                                    </div>
                                </div>

                                {/* Gmail Body */}
                                <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-[24px] flex flex-col gap-[20px]">

                                    {/* Panel tóm tắt AI */}
                                    {(summary || summaryError || isSummarizing) && (
                                        <div className="rounded-xl border border-[#c6c6cd] bg-white overflow-hidden shrink-0">
                                            {/* Header panel */}
                                            <div className="flex items-center justify-between px-[16px] py-[12px] border-b border-[#c6c6cd]"
                                                style={{ background: "linear-gradient(135deg, #ede9fe, #dce9ff)" }}>
                                                <div className="flex items-center gap-[8px]">
                                                    <span className="material-symbols-outlined text-[18px] text-[#6b38d4]">auto_awesome</span>
                                                    <span className="text-[14px] font-semibold text-[#6b38d4]">Tóm tắt bằng AI</span>
                                                </div>
                                                <button
                                                    onClick={() => { setSummary(null); setSummaryError(""); }}
                                                    className="p-[4px] rounded-full hover:bg-[#6b38d4]/10 text-[#6b38d4] transition-colors"
                                                    title="Đóng"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                                </button>
                                            </div>

                                            {/* Nội dung */}
                                            <div className="p-[16px]">
                                                {isSummarizing ? (
                                                    <div className="space-y-[10px] animate-pulse">
                                                        {[...Array(3)].map((_, i) => (
                                                            <div key={i} className={`h-[14px] bg-[#e5e7eb] rounded ${i === 2 ? "w-2/3" : "w-full"}`} />
                                                        ))}
                                                    </div>
                                                ) : summaryError ? (
                                                    <p className="text-[14px] text-[#d85a30]">{summaryError}</p>
                                                ) : (
                                                    <p className="text-[15px] leading-[1.7] text-[#0b1c30] whitespace-pre-wrap break-words overflow-wrap-anywhere">{summary}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Nội dung email */}
                                    <div className="flex-1 min-w-0 max-w-full overflow-x-hidden [overflow-wrap:anywhere]">
                                        {isDetailLoading ? (
                                            <div className="space-y-[12px] animate-pulse">
                                                {Array.from({ length: 6 }).map((_, i) => (
                                                    <div key={i} className={`h-[16px] bg-[#e5e7eb] rounded ${i % 3 === 2 ? "w-2/3" : "w-full"}`}></div>
                                                ))}
                                            </div>
                                        ) : selectedDetail?.bodyHtml ? (
                                            <div
                                                className="prose max-w-none text-[#0b1c30] break-words [&_*]:max-w-full [&_a]:break-all [&_img]:max-w-full [&_img]:h-auto [&_table]:block [&_table]:overflow-x-auto"
                                                dangerouslySetInnerHTML={{ __html: selectedDetail.bodyHtml }}
                                            />
                                        ) : selectedDetail?.body ? (
                                            <pre className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[16px] leading-[1.6] text-[#0b1c30] font-sans">
                                                {selectedDetail.body}
                                            </pre>
                                        ) : (
                                            <p className="text-[16px] leading-[1.6] text-[#0b1c30] break-words [overflow-wrap:anywhere]">{detail.snippet}</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal tóm tắt tất cả gmail */}
            {showAllSummaryModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]"
                    onClick={() => setShowAllSummaryModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-[820px] max-h-[85vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header modal */}
                        <div
                            className="flex items-center justify-between px-[24px] py-[18px] shrink-0"
                            style={{ background: "linear-gradient(135deg, #6b38d4, #8455ef)" }}
                        >
                            <div className="flex items-center gap-[10px]">
                                <span className="material-symbols-outlined text-white text-[22px]">auto_awesome</span>
                                <h2 className="text-[18px] font-semibold text-white">
                                    Tóm tắt tất cả Gmail {allSummaries.length > 0 && `(${allSummaries.length})`}
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowAllSummaryModal(false)}
                                className="p-[6px] rounded-full hover:bg-white/20 text-white transition-colors"
                                title="Đóng"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        {/* Nội dung modal */}
                        <div className="flex-1 overflow-y-auto p-[20px] bg-[#f8f9ff]">
                            {isLoadingAllSummaries ? (
                                <div className="flex flex-col items-center justify-center gap-[16px] py-[60px]">
                                    <svg className="animate-spin w-[36px] h-[36px] text-[#6b38d4]" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    <p className="text-[15px] text-[#45464d]">Đang tóm tắt các email, vui lòng chờ trong giây lát...</p>
                                </div>
                            ) : allSummaryError ? (
                                <div className="flex flex-col items-center justify-center gap-[8px] py-[60px] text-center">
                                    <span className="material-symbols-outlined text-[40px] text-[#c6c6cd]">error_outline</span>
                                    <p className="text-[15px] text-[#d85a30]">{allSummaryError}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-[12px]">
                                    {allSummaries.map((item) => {
                                        const s = parseSender(item.from);
                                        return (
                                            <div
                                                key={item.id}
                                                className="flex gap-[14px] bg-white rounded-xl border border-[#c6c6cd] p-[16px] hover:shadow-sm transition-shadow"
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                                                    style={{ background: "linear-gradient(135deg, #6b38d4, #8455ef)" }}
                                                >
                                                    {item.index}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline gap-[8px] mb-[4px]">
                                                        <span className="text-[13px] font-semibold text-[#6b38d4] truncate">
                                                            {s.name}
                                                        </span>
                                                        <span className="text-[12px] text-[#45464d] shrink-0">
                                                            {formatDate(item.date)}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-[15px] font-semibold text-[#0b1c30] mb-[6px] truncate">
                                                        {item.subject || "(Không có tiêu đề)"}
                                                    </h3>
                                                    <p className="text-[14px] leading-[1.6] text-[#0b1c30] whitespace-pre-wrap break-words">
                                                        {item.summary}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}