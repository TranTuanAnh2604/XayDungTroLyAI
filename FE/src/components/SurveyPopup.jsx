import { useState, useEffect } from "react";
import api from "../services/api";

const Q1_OPTIONS = ["Học tập", "Công việc", "Lập trình", "Quản lý thời gian", "Quản lý tài chính", "Khác"];
const Q2_OPTIONS = ["Ngắn gọn", "Chi tiết", "Hướng dẫn từng bước", "Tự điều chỉnh theo ngữ cảnh"];
const Q3_OPTIONS = ["Deadline gần nhất", "Mức độ quan trọng", "Hiệu quả làm việc", "Cân bằng công việc và nghỉ ngơi"];
const Q4_OPTIONS = ["Hay quên deadline", "Dễ bị phân tâm", "Thích lên kế hoạch trước", "Thường làm việc sát hạn", "Thích hoàn thành từng việc một"];
const Q5_OPTIONS = ["Nhắc nhở công việc sắp đến hạn", "Gợi ý sắp xếp lịch làm việc", "Đề xuất chia nhỏ công việc lớn", "Nhắc nghỉ ngơi khi làm việc lâu", "Đưa ra lời khuyên để nâng cao hiệu suất"];

function toArray(str) {
    return str ? str.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

export default function SurveyPopup({ isOpen, onClose, onSaved }) {
    const [supportAreas, setSupportAreas] = useState([]);
    const [responseStyle, setResponseStyle] = useState("");
    const [priorities, setPriorities] = useState([]);
    const [traits, setTraits] = useState([]);
    const [proactiveSupport, setProactiveSupport] = useState([]);
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
                    setSupportAreas(toArray(a.SupportAreas));
                    setResponseStyle(a.ResponseStyle || "");
                    setPriorities(toArray(a.Priorities));
                    setTraits(toArray(a.Traits));
                    setProactiveSupport(toArray(a.ProactiveSupport));
                }
            } catch (err) {
                console.error("Lỗi tải khảo sát:", err);
            } finally {
                setLoading(false);
            }
        };
        loadExisting();
    }, [isOpen]);

    const toggle = (list, setList, value, max = null) => {
        if (list.includes(value)) {
            setList(list.filter((v) => v !== value));
        } else {
            if (max && list.length >= max) return; // chặn chọn quá giới hạn
            setList([...list, value]);
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError("");
        try {
            await api.post("/memory/survey", {
                supportAreas,
                responseStyle,
                priorities,
                traits,
                proactiveSupport,
            });
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Cá nhân hóa trải nghiệm AI
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <p className="text-sm text-gray-500">Đang tải...</p>
                ) : (
                    <div className="space-y-6">
                        {/* Câu 1 */}
                        <div>
                            <p className="mb-2 font-medium text-gray-700">
                                1. AI sẽ hỗ trợ bạn chủ yếu trong lĩnh vực nào? (Chọn nhiều)
                            </p>
                            <div className="space-y-1">
                                {Q1_OPTIONS.map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 text-sm text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={supportAreas.includes(opt)}
                                            onChange={() => toggle(supportAreas, setSupportAreas, opt)}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Câu 2 */}
                        <div>
                            <p className="mb-2 font-medium text-gray-700">
                                2. Bạn muốn AI trả lời theo phong cách nào? (Chọn 1)
                            </p>
                            <div className="space-y-1">
                                {Q2_OPTIONS.map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 text-sm text-gray-600">
                                        <input
                                            type="radio"
                                            name="responseStyle"
                                            checked={responseStyle === opt}
                                            onChange={() => setResponseStyle(opt)}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Câu 3 */}
                        <div>
                            <p className="mb-2 font-medium text-gray-700">
                                3. Khi AI đưa ra gợi ý hoặc lập kế hoạch, AI nên ưu tiên điều gì? (Chọn tối đa 2)
                            </p>
                            <div className="space-y-1">
                                {Q3_OPTIONS.map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 text-sm text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={priorities.includes(opt)}
                                            onChange={() => toggle(priorities, setPriorities, opt, 2)}
                                            disabled={!priorities.includes(opt) && priorities.length >= 2}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Câu 4 */}
                        <div>
                            <p className="mb-2 font-medium text-gray-700">
                                4. Điều nào mô tả đúng nhất về bạn? (Chọn nhiều)
                            </p>
                            <div className="space-y-1">
                                {Q4_OPTIONS.map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 text-sm text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={traits.includes(opt)}
                                            onChange={() => toggle(traits, setTraits, opt)}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Câu 5 */}
                        <div>
                            <p className="mb-2 font-medium text-gray-700">
                                5. AI nên chủ động hỗ trợ bạn như thế nào? (Chọn nhiều)
                            </p>
                            <div className="space-y-1">
                                {Q5_OPTIONS.map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 text-sm text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={proactiveSupport.includes(opt)}
                                            onChange={() => toggle(proactiveSupport, setProactiveSupport, opt)}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={onClose}
                                className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100"
                            >
                                Để sau
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? "Đang lưu..." : "Lưu khảo sát"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}