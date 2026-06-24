import { useEffect, useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { getTasks, createTask, updateTask, updateStatus, deleteTask } from "../services/taskService";

const COLUMNS = [
    { key: "pending", label: "To Do", borderColor: "#c6c6cd", dot: false },
    { key: "in_progress", label: "In Progress", borderColor: "#6b38d4", dot: true },
    { key: "in_review", label: "In Review", borderColor: "#565e74", dot: false },
    { key: "done", label: "Done", borderColor: "#1a6b38", dot: false },
];

function PriorityBadge({ priority }) {
    if (priority === 3)
        return (
            <span className="px-[4px] py-[2px] bg-[#ffdad6] text-[#93000a] rounded text-[13px] font-bold flex items-center gap-[4px]">
                <span className="material-symbols-outlined text-[12px]">keyboard_double_arrow_up</span>Urgent
            </span>
        );
    if (priority === 1)
        return <span className="px-[4px] py-[2px] bg-[#e6f4ea] text-[#1a6b38] rounded text-[13px]">Low</span>;
    return null;
}

function TaskCard({ task, onStatusChange, onDelete, onEdit }) {
    const isUrgent = task.priority === 3;
    const [menuOpen, setMenuOpen] = useState(false);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const isOverdue = task.dueDate && new Date(task.dueDate.split("T")[0]) < today && task.status !== "done";

    return (
        <div className={`bg-white rounded-xl p-[16px] shadow-sm hover:shadow-md transition-shadow cursor-grab group relative
            ${isUrgent ? "border-l-4 border-l-[#ba1a1a] border-y border-r border-[#c6c6cd]" : "border border-[#c6c6cd]"}`}>
            <div className="flex justify-between items-start mb-[8px]">
                <div className="flex gap-[4px] flex-wrap">
                    <PriorityBadge priority={task.priority} />
                    {task.categories?.map((cat) => (
                        <span key={cat.id} className="px-[4px] py-[2px] bg-[#eff4ff] text-[#45464d] rounded text-[13px]">{cat.name}</span>
                    ))}
                </div>
                <div className="relative">
                    <button onClick={() => setMenuOpen((v) => !v)} className="text-[#45464d] opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                            <div className="absolute right-0 top-6 bg-white border border-[#c6c6cd] rounded-lg shadow-xl z-20 min-w-[160px]">
                                <button onClick={() => { onEdit(task); setMenuOpen(false); }}
                                    className="w-full text-left px-[12px] py-[8px] text-[13px] text-[#45464d] hover:bg-[#eff4ff] rounded-t-lg flex items-center gap-[6px]">
                                    <span className="material-symbols-outlined text-[14px]">edit</span>Sửa task
                                </button>
                                {COLUMNS.filter((c) => c.key !== task.status).map((col) => (
                                    <button key={col.key} onClick={() => { onStatusChange(task.id, col.key); setMenuOpen(false); }}
                                        className="w-full text-left px-[12px] py-[8px] text-[13px] text-[#45464d] hover:bg-[#eff4ff]">
                                        → {col.label}
                                    </button>
                                ))}
                                <button onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                                    className="w-full text-left px-[12px] py-[8px] text-[13px] text-[#ba1a1a] hover:bg-[#ffdad6] rounded-b-lg border-t border-[#c6c6cd] flex items-center gap-[6px]">
                                    <span className="material-symbols-outlined text-[14px]">delete</span>Xoá task
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <h4 className="text-[14px] font-semibold text-[#000000] mb-[4px] cursor-pointer hover:text-[#6b38d4] transition-colors"
                onClick={() => onEdit(task)}>
                {task.title}
            </h4>
            {task.description && <p className="text-[13px] text-[#45464d] line-clamp-2 mb-[16px]">{task.description}</p>}

            <div className="flex justify-between items-center mt-[8px]">
                <div className="flex items-center gap-[4px] text-[#45464d] text-[13px]">
                    {task.estimated_minutes && (
                        <span className="flex items-center gap-[2px]">
                            <span className="material-symbols-outlined text-[14px]">timer</span>{task.estimated_minutes}m
                        </span>
                    )}
                </div>
                {task.dueDate && (
                    <span className={`flex items-center gap-[4px] text-[13px] ${isOverdue ? "text-[#ba1a1a] font-medium" : isUrgent ? "text-[#ba1a1a]" : "text-[#45464d]"}`}>
                        <span className="material-symbols-outlined text-[14px]">{isOverdue ? "warning" : "schedule"}</span>
                        {isOverdue ? "Quá hạn · " : ""}
                        {new Date(task.dueDate).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                )}
            </div>
        </div>
    );
}

function TaskModal({ task, onClose, onSaved }) {
    const isEdit = !!task;

    // Format datetime-local value từ ISO string
    const toLocalDatetimeValue = (isoStr) => {
        if (!isoStr) return "";
        const d = new Date(isoStr);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const [form, setForm] = useState({
        title: task?.title ?? "",
        description: task?.description ?? "",
        priority: task?.priority ?? 2,
        status: task?.status ?? "pending",
        due_date: task?.dueDate ? toLocalDatetimeValue(task.dueDate) : "",
        estimated_minutes: task?.estimated_minutes ?? "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!form.title.trim()) { setError("Tiêu đề không được để trống"); return; }
        setLoading(true);
        try {
            const basePayload = {
                title: form.title,
                description: form.description || null,
                priority: Number(form.priority),
                // Gửi ISO string đầy đủ với timezone offset +07:00
                dueDate: form.due_date ? new Date(form.due_date).toISOString() : null,
            };

            if (isEdit) {
                await updateTask(task.id, { ...basePayload, status: form.status });
            } else {
                await createTask(basePayload);
            }
            onSaved();
            onClose();
        } catch (e) {
            setError(`${isEdit ? "Sửa" : "Tạo"} task thất bại: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-[24px] w-full max-w-md shadow-xl flex flex-col gap-[16px]">
                <div className="flex justify-between items-center">
                    <h3 className="text-[18px] font-bold text-[#000000]">{isEdit ? "Sửa Task" : "Tạo Task Mới"}</h3>
                    <button onClick={onClose} className="text-[#45464d] hover:text-[#000000]">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                {error && <p className="text-[#ba1a1a] text-[13px]">{error}</p>}
                <input className="border border-[#c6c6cd] rounded-lg px-[12px] py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]"
                    placeholder="Tiêu đề *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <textarea className="border border-[#c6c6cd] rounded-lg px-[12px] py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4] resize-none h-[80px]"
                    placeholder="Mô tả (tùy chọn)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <div className="flex gap-[8px]">
                    <select className="flex-1 border border-[#c6c6cd] rounded-lg px-[12px] py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]"
                        value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                        <option value={1}>Ưu tiên thấp</option>
                        <option value={2}>Bình thường</option>
                        <option value={3}>Khẩn cấp</option>
                    </select>
                    <select className="flex-1 border border-[#c6c6cd] rounded-lg px-[12px] py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]"
                        value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                        {COLUMNS.map((col) => <option key={col.key} value={col.key}>{col.label}</option>)}
                    </select>
                </div>
                <div className="flex gap-[8px]">
                    {/* ✅ Đổi thành datetime-local để chọn cả ngày lẫn giờ */}
                    <input
                        type="datetime-local"
                        className="flex-1 border border-[#c6c6cd] rounded-lg px-[12px] py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]"
                        value={form.due_date}
                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    />
                    <input type="number" className="flex-1 border border-[#c6c6cd] rounded-lg px-[12px] py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]"
                        placeholder="Ước tính (phút)" value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })} />
                </div>
                <div className="flex gap-[8px] justify-end">
                    <button onClick={onClose} className="px-[16px] py-[8px] border border-[#c6c6cd] rounded-lg text-[14px] text-[#45464d] hover:bg-[#eff4ff]">Hủy</button>
                    <button onClick={handleSubmit} disabled={loading}
                        className="px-[16px] py-[8px] bg-[#8455ef] text-white rounded-lg text-[14px] font-bold hover:shadow-md disabled:opacity-50">
                        {loading ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo Task"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function FilterBar({ filters, setFilters, totalFiltered, totalAll }) {
    const hasActiveFilter = filters.search || filters.priority !== "all" || filters.dueDate !== "all";

    return (
        <div className="flex flex-col gap-[8px]">
            <div className="flex gap-[8px] items-center flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-xs focus-within:ring-2 focus-within:ring-[#6b38d4] rounded-lg bg-white border border-[#c6c6cd] transition-all">
                    <span className="material-symbols-outlined absolute left-[8px] top-1/2 -translate-y-1/2 text-[#45464d] text-[18px]">search</span>
                    <input
                        className="w-full bg-transparent border-none pl-[36px] pr-[28px] py-[8px] text-[14px] text-[#000000] placeholder:text-[#45464d] focus:outline-none rounded-lg"
                        placeholder="Tìm kiếm task..."
                        value={filters.search}
                        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    />
                    {filters.search && (
                        <button onClick={() => setFilters((f) => ({ ...f, search: "" }))}
                            className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#45464d] hover:text-[#000]">
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    )}
                </div>
                <select
                    className="border border-[#c6c6cd] bg-white rounded-lg px-[10px] py-[8px] text-[13px] text-[#45464d] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]"
                    value={filters.sort}
                    onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
                >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="priority_high">Ưu tiên cao nhất</option>
                    <option value="priority_low">Ưu tiên thấp nhất</option>
                    <option value="due_soon">Deadline gần nhất</option>
                </select>
                {hasActiveFilter && (
                    <>
                        <button onClick={() => setFilters((f) => ({ ...f, search: "", priority: "all", dueDate: "all" }))}
                            className="flex items-center gap-[4px] px-[10px] py-[8px] text-[13px] text-[#ba1a1a] border border-[#ba1a1a] rounded-lg hover:bg-[#ffdad6] transition-colors">
                            <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>Xoá lọc
                        </button>
                        <span className="text-[13px] text-[#45464d]">{totalFiltered}/{totalAll} task</span>
                    </>
                )}
            </div>
            <div className="flex gap-[8px] flex-wrap items-center">
                {[
                    { val: "all", label: "Tất cả" },
                    { val: "3", label: "🔴 Urgent" },
                    { val: "2", label: "🟡 Normal" },
                    { val: "1", label: "🟢 Low" },
                ].map(({ val, label }) => (
                    <button key={val}
                        onClick={() => setFilters((f) => ({ ...f, priority: val }))}
                        className={`px-[10px] py-[4px] rounded-full text-[12px] font-medium border transition-colors
                            ${filters.priority === val ? "bg-[#6b38d4] text-white border-[#6b38d4]" : "bg-white text-[#45464d] border-[#c6c6cd] hover:border-[#6b38d4]"}`}>
                        {label}
                    </button>
                ))}
                <div className="w-px h-[20px] bg-[#c6c6cd] mx-[4px]" />
                {[
                    { val: "all", label: "Tất cả ngày" },
                    { val: "overdue", label: "⚠️ Quá hạn" },
                    { val: "today", label: "📅 Hôm nay" },
                    { val: "week", label: "📆 Tuần này" },
                ].map(({ val, label }) => (
                    <button key={val}
                        onClick={() => setFilters((f) => ({ ...f, dueDate: val }))}
                        className={`px-[10px] py-[4px] rounded-full text-[12px] font-medium border transition-colors
                            ${filters.dueDate === val ? "bg-[#6b38d4] text-white border-[#6b38d4]" : "bg-white text-[#45464d] border-[#c6c6cd] hover:border-[#6b38d4]"}`}>
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function parseDate(str) {
    if (!str) return null;
    const d = str.split("T")[0];
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day);
}

function applyFiltersAndSort(tasks, filters) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

    let result = [...tasks];

    if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        result = result.filter((t) =>
            t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
        );
    }
    if (filters.priority !== "all") {
        result = result.filter((t) => t.priority === Number(filters.priority));
    }
    if (filters.dueDate !== "all") {
        result = result.filter((t) => {
            const due = parseDate(t.dueDate);
            if (!due) return false;
            if (filters.dueDate === "overdue") return due < today && t.status !== "done";
            if (filters.dueDate === "today") return due.getTime() === today.getTime();
            if (filters.dueDate === "week") return due >= today && due <= endOfWeek;
            return true;
        });
    }
    result.sort((a, b) => {
        if (filters.sort === "newest") return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0);
        if (filters.sort === "oldest") return new Date(a.createdAt ?? 0) - new Date(b.createdAt ?? 0);
        if (filters.sort === "priority_high") return b.priority - a.priority;
        if (filters.sort === "priority_low") return a.priority - b.priority;
        if (filters.sort === "due_soon") {
            const da = parseDate(a.dueDate), db = parseDate(b.dueDate);
            if (!da) return 1; if (!db) return -1;
            return da - db;
        }
        return 0;
    });
    return result;
}

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalTask, setModalTask] = useState(undefined);
    const [filters, setFilters] = useState({
        search: "", priority: "all", dueDate: "all", sort: "newest",
    });

    const fetchTasks = async () => {
        setLoading(true); setError("");
        try {
            const data = await getTasks();
            setTasks(Array.isArray(data) ? data : []);
        } catch (e) {
            setError("Không thể tải tasks: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateStatus(id, newStatus);
            await fetchTasks();
        } catch (e) { alert("Cập nhật thất bại: " + e.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Bạn chắc chắn muốn xoá task này?")) return;
        try {
            await deleteTask(id);
            await fetchTasks();
        } catch (e) { alert("Xoá thất bại: " + e.message); }
    };

    const handleSaved = async () => { await fetchTasks(); };

    const filteredTasks = useMemo(() => applyFiltersAndSort(tasks, filters), [tasks, filters]);
    const getTasksByStatus = (statusKey) => filteredTasks.filter((t) => t.status === statusKey);

    const urgentCount = tasks.filter((t) => t.priority === 3 && t.status !== "done").length;
    const overdueCount = tasks.filter((t) => {
        const due = parseDate(t.dueDate);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return due && due < today && t.status !== "done";
    }).length;

    return (
        <div className="flex h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#f8f9ff", color: "#0b1c30" }}>
            <Sidebar />
            <main className="flex-1 flex flex-col md:ml-[280px] w-full h-full relative">
                <header className="flex justify-between items-center w-full px-[24px] py-[8px] sticky top-0 z-30 bg-[#f8f9ff]/70 backdrop-blur-xl border-b border-[#c6c6cd] shadow-sm">
                    <div className="flex items-center gap-[16px]">
                        <button className="md:hidden text-[#45464d] hover:text-[#000000] transition-colors">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <div className="hidden md:flex items-center gap-[8px] text-[#45464d] text-[14px] font-medium">
                            <span>Workspace</span>
                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            <span className="text-[#000000] font-bold">Project Alpha</span>
                        </div>
                        <h1 className="md:hidden text-[24px] font-extrabold text-[#000000]">AI Assistant</h1>
                    </div>
                    <div className="flex items-center gap-[16px]">
                        <button className="text-[#45464d] hover:text-[#000000] transition-colors relative">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-0 right-0 w-2 h-2 bg-[#ba1a1a] rounded-full"></span>
                        </button>
                        <button className="hidden sm:block text-[#45464d] hover:text-[#000000] transition-colors" onClick={fetchTasks}>
                            <span className="material-symbols-outlined">refresh</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-[16px] md:p-[24px] flex flex-col gap-[16px] bg-[#f8f9ff]">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-[#000000] mb-[4px]">Active Tasks</h2>
                            <p className="text-[16px] leading-[1.5] text-[#45464d]">
                                {loading ? "Đang tải..." : `${tasks.filter((t) => t.status !== "done").length} tasks đang hoạt động`}
                            </p>
                        </div>
                        {/* ✅ Chỉ giữ 1 nút New Task ở góc phải trên */}
                        <button onClick={() => setModalTask(null)}
                            className="flex items-center gap-[8px] bg-[#8455ef] text-white px-[16px] py-[8px] rounded-lg text-[14px] font-bold shadow-sm hover:shadow-md transition-all">
                            <span className="material-symbols-outlined">add</span>New Task
                        </button>
                    </div>

                    {error && (
                        <div className="bg-[#ffdad6] border border-[#ba1a1a] rounded-xl p-[12px] text-[#93000a] text-[14px] flex items-center gap-[8px]">
                            <span className="material-symbols-outlined text-[18px]">error</span>{error}
                            <button onClick={fetchTasks} className="ml-auto underline font-medium">Thử lại</button>
                        </div>
                    )}

                    <div className="bg-white/70 backdrop-blur-md border border-[#d0bcff] rounded-xl p-[16px] flex items-start gap-[16px] relative overflow-hidden"
                        style={{ boxShadow: "0 10px 25px -5px rgba(107,56,212,0.05)" }}>
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#6b38d4]"></div>
                        <div className="w-10 h-10 rounded-full bg-[#e9ddff] flex items-center justify-center text-[#6b38d4] shrink-0">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-[14px] font-bold text-[#000000] mb-[4px]">AI Priority Suggestion</h3>
                            <p className="text-[16px] leading-[1.5] text-[#45464d]">
                                {urgentCount > 0 && `${urgentCount} task khẩn cấp cần xử lý. `}
                                {overdueCount > 0 && `${overdueCount} task quá hạn cần chú ý. `}
                                {urgentCount === 0 && overdueCount === 0 && "Không có task khẩn cấp hay quá hạn. Tốt lắm!"}
                            </p>
                        </div>
                    </div>

                    <FilterBar filters={filters} setFilters={setFilters} totalFiltered={filteredTasks.length} totalAll={tasks.length} />

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-[16px] text-[#45464d]">
                                <div className="w-8 h-8 border-4 border-[#6b38d4] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[14px]">Đang tải tasks...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 flex gap-[24px] overflow-x-auto pb-[8px]"
                            style={{ scrollbarWidth: "thin", scrollbarColor: "#c6c6cd transparent" }}>
                            {COLUMNS.map((col) => {
                                const colTasks = getTasksByStatus(col.key);
                                return (
                                    <div key={col.key} className="flex flex-col w-[320px] shrink-0 gap-[8px]">
                                        <div className="flex items-center justify-between pb-[4px] border-b-2" style={{ borderColor: col.borderColor }}>
                                            <div className="flex items-center gap-[4px]">
                                                {col.dot && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.borderColor }}></span>}
                                                <h3 className="text-[18px] font-semibold text-[#000000]">{col.label}</h3>
                                            </div>
                                            <span className="bg-[#dce9ff] text-[#45464d] px-[8px] py-[2px] rounded-full text-[13px]">{colTasks.length}</span>
                                        </div>
                                        {/* ✅ Bỏ nút Add Task ở dưới mỗi cột */}
                                        <div className="flex flex-col gap-[8px] overflow-y-auto pr-[4px] flex-1">
                                            {colTasks.length === 0 ? (
                                                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#c6c6cd] rounded-xl bg-[#f8f9ff]/50 py-[32px]">
                                                    <span className="material-symbols-outlined text-[#c6c6cd] text-[32px] mb-[8px]">inbox</span>
                                                    <p className="text-[14px] font-medium text-[#45464d]">
                                                        {filteredTasks.length < tasks.length ? "Không khớp bộ lọc" : "Không có task"}
                                                    </p>
                                                </div>
                                            ) : (
                                                colTasks.map((task) => (
                                                    <TaskCard key={task.id} task={task}
                                                        onStatusChange={handleStatusChange}
                                                        onDelete={handleDelete}
                                                        onEdit={setModalTask}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {modalTask !== undefined && (
                <TaskModal task={modalTask} onClose={() => setModalTask(undefined)} onSaved={handleSaved} />
            )}
        </div>
    );
}
