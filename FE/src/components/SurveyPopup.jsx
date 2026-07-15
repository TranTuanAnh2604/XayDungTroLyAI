import { useState, useEffect } from "react";
import api from "../services/api";

const QUESTIONS = [
    {
        icon: "school",
        title: "AI sẽ hỗ trợ bạn chủ yếu trong lĩnh vực nào?",
        hint: "Chọn nhiều",
        key: "supportAreas",
        type: "multi",
        options: ["Học tập", "Công việc", "Lập trình", "Quản lý thời gian", "Quản lý tài chính", "Khác"],
    },
    {
        icon: "chat_bubble",
        title: "Bạn muốn AI trả lời theo phong cách nào?",
        hint: "Chọn 1",
        key: "responseStyle",
        type: "single",
        options: ["Ngắn gọn", "Chi tiết", "Hướng dẫn từng bước", "Tự điều chỉnh theo ngữ cảnh"],
    },
    {
        icon: "target",
        title: "Khi AI đưa ra gợi ý hoặc lập kế hoạch, AI nên ưu tiên điều gì?",
        hint: "Chọn tối đa 2",
        key: "priorities",
        type: "multi",
        max: 2,
        options: ["Deadline gần nhất", "Mức độ quan trọng", "Hiệu quả làm việc", "Cân bằng công việc và nghỉ ngơi"],
    },
    {
        icon: "person",
        title: "Điều nào mô tả đúng nhất về bạn?",
        hint: "Chọn nhiều",
        key: "traits",
        type: "multi",
        options: ["Hay quên deadline", "Dễ bị phân tâm", "Thích lên kế hoạch trước", "Thường làm việc sát hạn", "Thích hoàn thành từng việc một"],
    },
    {
        icon: "bolt",
        title: "AI nên chủ động hỗ trợ bạn như thế nào?",
        hint: "Chọn nhiều",
        key: "proactiveSupport",
        type: "multi",
        options: ["Nhắc nhở công việc sắp đến hạn", "Gợi ý sắp xếp lịch làm việc", "Đề xuất chia nhỏ công việc lớn", "Nhắc nghỉ ngơi khi làm việc lâu", "Đưa ra lời khuyên để nâng cao hiệu suất"],
    },
    {
        icon: "favorite",
        title: "Bạn thường dành thời gian rảnh cho hoạt động nào?",
        hint: "Chọn nhiều",
        key: "hobbies",
        type: "multi",
        options: [
            "Nghe nhạc",
            "Xem phim",
            "Đọc sách",
            "Chơi game",
            "Thể thao",
            "Du lịch",
            "Nấu ăn",
            "Khác"
        ],
    },
    {
        icon: "music_note",
        title: "Bạn thích thể loại âm nhạc nào nhất?",
        hint: "Chọn nhiều",
        key: "musicGenres",
        type: "multi",
        options: [
            "Pop",
            "Rock",
            "Ballad",
            "Rap/Hip-hop",
            "Lo-fi",
            "EDM",
            "Nhạc không lời",
            "Không nghe nhạc"
        ],
    },
    {
        icon: "restaurant",
        title: "Bạn thích loại đồ ăn hoặc thức uống nào?",
        hint: "Chọn nhiều",
        key: "favoriteFoods",
        type: "multi",
        options: [
            "Đồ ăn Việt",
            "Đồ ăn Hàn",
            "Đồ ăn Nhật",
            "Đồ ăn nhanh",
            "Cà phê",
            "Trà sữa",
            "Đồ ngọt",
            "Ăn chay"
        ],
    },
    {
        icon: "mood",
        title: "Khi trò chuyện, bạn muốn AI thể hiện tính cách như thế nào?",
        hint: "Chọn tối đa 2",
        key: "aiPersonality",
        type: "multi",
        max: 2,
        options: [
            "Thân thiện",
            "Hài hước",
            "Chuyên nghiệp",
            "Nghiêm túc",
            "Động viên, tích cực",
            "Thẳng vào vấn đề"
        ],
    },
    {
        icon: "lightbulb",
        title: "AI nên ghi nhớ điều gì về bạn để hỗ trợ tốt hơn?",
        hint: "Chọn nhiều",
        key: "personalPreferences",
        type: "multi",
        options: [
            "Sở thích cá nhân",
            "Thói quen làm việc",
            "Mục tiêu dài hạn",
            "Môn học hoặc lĩnh vực yêu thích",
            "Những điều tôi không thích",
            "Các dự án tôi đang thực hiện"
        ],
    },
];

function toArray(str) {
    return str ? str.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

export default function SurveyPopup({ isOpen, onClose, onSaved }) {
    const [answers, setAnswers] = useState({
        supportAreas: [],
        responseStyle: "",
        priorities: [],
        traits: [],
        proactiveSupport: [],

        hobbies: [],
        musicGenres: [],
        favoriteFoods: [],
        aiPersonality: [],
        personalPreferences: [],
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        const loadExisting = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await api.get("/memory/survey");
                const a = res?.data?.data?.answers;
                if (a) {
                    setAnswers({
                        supportAreas: toArray(a.SupportAreas),
                        responseStyle: a.ResponseStyle || "",
                        priorities: toArray(a.Priorities),
                        traits: toArray(a.Traits),
                        proactiveSupport: toArray(a.ProactiveSupport),

                        hobbies: toArray(a.Hobbies),
                        musicGenres: toArray(a.MusicGenres),
                        favoriteFoods: toArray(a.FavoriteFoods),
                        aiPersonality: toArray(a.AiPersonality),
                        personalPreferences: toArray(a.PersonalPreferences),
                    });
                }
            } catch (err) {
                console.error("Lỗi tải khảo sát:", err);
            } finally {
                setLoading(false);
            }
        };
        loadExisting();
    }, [isOpen]);

    const toggleMulti = (key, value, max) => {
        setAnswers((prev) => {
            const list = prev[key];
            if (list.includes(value)) {
                return { ...prev, [key]: list.filter((v) => v !== value) };
            }
            if (max && list.length >= max) return prev; // chặn chọn quá giới hạn
            return { ...prev, [key]: [...list, value] };
        });
    };

    const setSingle = (key, value) => {
        setAnswers((prev) => ({ ...prev, [key]: value }));
    };

    const answeredCount = QUESTIONS.filter((q) => {
        const v = answers[q.key];
        return q.type === "single" ? !!v : v.length > 0;
    }).length;

    const handleSubmit = async () => {
        setSaving(true);
        setError("");
        try {
            await api.post("/memory/survey", answers);
            onSaved?.();
            onClose?.();
        } catch (err) {
            setError("Không thể lưu khảo sát. Vui lòng thử lại.");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

                {/* Header gradient */}
                <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#6b38d4] via-[#8b5cf6] to-[#c084fc] px-6 py-6">
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="relative z-10 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-white text-2xl">psychology</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Cá nhân hóa trải nghiệm AI</h2>
                                <p className="text-white/80 text-sm mt-0.5">Vài câu hỏi nhỏ để AI hiểu bạn hơn</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors shrink-0"
                        >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>

                    {/* Progress dots */}
                    <div className="relative z-10 flex items-center gap-1.5 mt-5">
                        {QUESTIONS.map((q, i) => {
                            const done = answers[q.key] && (Array.isArray(answers[q.key]) ? answers[q.key].length > 0 : !!answers[q.key]);
                            return (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${done ? "bg-white flex-[1.5]" : "bg-white/30 flex-1"}`}
                                ></div>
                            );
                        })}
                    </div>
                    <p className="relative z-10 text-white/70 text-xs mt-2">{answeredCount}/{QUESTIONS.length} câu đã trả lời</p>
                </div>

                {/* Body */}
                <div className="overflow-y-auto px-6 py-6 flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-[#e9ddff] border-t-[#6b38d4] rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-7">
                            {QUESTIONS.map((q, idx) => {
                                const value = answers[q.key];
                                const isSelected = (opt) =>
                                    q.type === "single" ? value === opt : value.includes(opt);

                                return (
                                    <div key={q.key}>
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-xl bg-[#f0ebff] flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="material-symbols-outlined text-[#6b38d4] text-[18px]">{q.icon}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-800 leading-snug">
                                                    <span className="text-[#6b38d4] mr-1">{idx + 1}.</span>{q.title}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">{q.hint}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 pl-11">
                                            {q.options.map((opt) => {
                                                const selected = isSelected(opt);
                                                const disabled = q.max && !selected && value.length >= q.max;
                                                const shapeClass = q.type === "single" ? "rounded-full" : "rounded-[6px]";
                                                return (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        disabled={disabled}
                                                        onClick={() =>
                                                            q.type === "single"
                                                                ? setSingle(q.key, opt)
                                                                : toggleMulti(q.key, opt, q.max)
                                                        }
                                                        className={`flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all
                              ${selected
                                                                ? "bg-[#f0ebff] border-[#6b38d4] text-[#4c1d95]"
                                                                : disabled
                                                                    ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                                                                    : "bg-white border-[#c6c6cd] text-gray-600 hover:border-[#8455ef]"
                                                            }`}
                                                    >
                                                        <span
                                                            className={`flex items-center justify-center w-4 h-4 shrink-0 border-2 ${shapeClass} transition-colors
                                ${selected
                                                                    ? "bg-[#6b38d4] border-[#6b38d4]"
                                                                    : disabled
                                                                        ? "border-gray-300"
                                                                        : "border-gray-300"
                                                                }`}
                                                        >
                                                            {selected && (
                                                                <span className="material-symbols-outlined text-white text-[12px] leading-none" style={{ fontVariationSettings: "'wght' 700" }}>
                                                                    check
                                                                </span>
                                                            )}
                                                        </span>
                                                        {opt}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {error && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">error</span>
                                    {error}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        Để sau
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || loading}
                        className="rounded-xl bg-gradient-to-r from-[#6b38d4] to-[#8b5cf6] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#6b38d4]/30 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Đang lưu...
                            </>
                        ) : (
                            "Lưu khảo sát"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}