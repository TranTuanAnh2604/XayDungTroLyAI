import { useRef, useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Sidebar from "../components/Sidebar";
import { getTasks } from "../services/taskService";
import { getNotifications } from "../services/notificationService";

export default function Dashboard() {
    const searchWrapperRef = useRef(null);
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Alex';

    // ── State động từ API ──────────────────────────────────────────
    const [tasks, setTasks] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [taskData, notifData] = await Promise.all([
                    getTasks(),
                    getNotifications(),
                ]);
                setTasks(Array.isArray(taskData) ? taskData : []);
                setNotifications(Array.isArray(notifData) ? notifData : []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // ── Tính toán từ data thực ──────────────────────────────────────
    const todayTasks = tasks.filter(t => t.status !== 'done').length;
    const highPriorityTasks = tasks.filter(t => t.priority === 3 && t.status !== 'done').length;
    const pendingNotifs = notifications.filter(n => n.status === 'pending').length;
    const overdueTasks = tasks.filter(t => {
        if (!t.dueDate || t.status === 'done') return false;
        return new Date(t.dueDate) < new Date();
    }).length;

    const tasksByStatus = {
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        in_review: tasks.filter(t => t.status === 'in_review').length,
        done: tasks.filter(t => t.status === 'done').length,
    };
    const totalTasks = tasks.length;
    const donePercent = totalTasks > 0 ? Math.round((tasksByStatus.done / totalTasks) * 100) : 0;

    // ── AI Recommendations dựa trên data thực ──────────────────────
    const aiRecommendations = [
        highPriorityTasks > 0
            ? `Bạn có ${highPriorityTasks} task khẩn cấp cần xử lý ngay`
            : 'Không có task khẩn cấp, tốt lắm!',
        overdueTasks > 0
            ? `${overdueTasks} task đã quá hạn, cần xử lý gấp`
            : 'Tất cả task đều trong hạn',
        pendingNotifs > 0
            ? `${pendingNotifs} nhắc nhở đang chờ`
            : 'Không có nhắc nhở nào đang chờ',
        tasksByStatus.in_progress > 0
            ? `${tasksByStatus.in_progress} task đang thực hiện`
            : 'Chưa có task nào đang thực hiện',
    ];

    // ── Data giả (thay bằng API sau khi pull) ──────────────────────
    const stats = [
        { icon: "task_alt", title: "Hoàn thành", value: String(tasksByStatus.done), color: "bg-green-100", iconColor: "text-green-600" },
        { icon: "pending_actions", title: "Đang làm", value: String(tasksByStatus.in_progress), color: "bg-blue-100", iconColor: "text-blue-600" },
        { icon: "notifications_active", title: "Nhắc nhở", value: String(pendingNotifs), color: "bg-purple-100", iconColor: "text-purple-600" },
        { icon: "warning", title: "Quá hạn", value: String(overdueTasks), color: "bg-red-100", iconColor: "text-red-600" },
    ];

    const quickActions = [
        { icon: "chat", title: "AI Chat", path: "/chat", color: "from-violet-500 to-purple-500" },
        { icon: "mail", title: "Gmail", path: "/gmail", color: "from-blue-500 to-cyan-500" },
        { icon: "task_alt", title: "Tasks", path: "/tasks", color: "from-green-500 to-emerald-500" },
        { icon: "calendar_month", title: "Calendar", path: "/calendar", color: "from-orange-500 to-red-500" },
        { icon: "mic", title: "Voice", path: "/voice", color: "from-pink-500 to-rose-500" },
        { icon: "notifications", title: "Reminders", path: "/reminders", color: "from-indigo-500 to-blue-600" },
        { icon: "assignment", title: "In Review", path: "/tasks", color: "from-amber-500 to-orange-500" },
        { icon: "settings", title: "Settings", path: "/settings", color: "from-slate-500 to-gray-600" },
    ];

    // Task gần deadline nhất (5 task)
    const upcomingTasks = [...tasks]
        .filter(t => t.dueDate && t.status !== 'done')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);

    const handleSearchFocus = () => {
        if (searchWrapperRef.current) {
            searchWrapperRef.current.classList.add("shadow-md");
            searchWrapperRef.current.style.transform = "translateY(-1px)";
        }
    };
    const handleSearchBlur = () => {
        if (searchWrapperRef.current) {
            searchWrapperRef.current.classList.remove("shadow-md");
            searchWrapperRef.current.style.transform = "none";
        }
    };

    const priorityLabel = { 1: 'Low', 2: 'Normal', 3: 'Urgent' };
    const priorityColor = { 1: 'text-green-600 bg-green-100', 2: 'text-blue-600 bg-blue-100', 3: 'text-red-600 bg-red-100' };
    const statusLabel = { pending: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' };

    return (
        <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex antialiased" style={{ fontFamily: "Inter, sans-serif" }}>
            <Sidebar />

            <main className="flex-1 flex flex-col min-w-0 md:ml-[280px]">
                {/* Header */}
                <header className="flex justify-between items-center w-full px-6 py-3 sticky top-0 z-30 bg-[#f8f9ff]/70 backdrop-blur-xl border-b border-[#c6c6cd] shadow-sm">
                    <div className="flex items-center gap-4 flex-1">
                        <button className="md:hidden text-[#45464d] hover:text-black p-2 rounded-full hover:bg-[#dce9ff]">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <div className="text-2xl font-extrabold text-black hidden md:block">Dashboard</div>
                        <div ref={searchWrapperRef} className="relative w-full max-w-md ml-auto md:ml-6 group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] group-focus-within:text-[#6b38d4]">search</span>
                            <input className="w-full bg-white border border-[#c6c6cd] rounded-full py-2.5 pl-11 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-[#6b38d4] transition-all shadow-sm"
                                placeholder="Ask AI or search..." type="text" onFocus={handleSearchFocus} onBlur={handleSearchBlur} />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/reminders')} className="text-[#45464d] hover:text-black p-2 rounded-full hover:bg-[#d3e4fe] relative">
                            <span className="material-symbols-outlined">notifications</span>
                            {pendingNotifs > 0 && (
                                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-[2px]">
                                    {pendingNotifs}
                                </span>
                            )}
                        </button>
                        
                    </div>
                </header>

                <div className="p-4 md:p-6 lg:p-10 max-w-[1440px] mx-auto w-full flex flex-col gap-8 overflow-y-auto">

                    {/* Hero */}
                    <section className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-[#6b38d4] via-[#8b5cf6] to-[#c084fc]">
                        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/10 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8">
                            <div className="max-w-2xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-4xl">smart_toy</span>
                                    </div>
                                    <div>
                                        <p className="text-white/80">Welcome back</p>
                                        <h2 className="text-5xl font-bold text-white">{userName}</h2>
                                    </div>
                                </div>
                                <h3 className="text-3xl text-white font-semibold mb-4">Your Personal AI Assistant</h3>
                                <p className="text-white/90 leading-8 text-lg">AI has analyzed your schedule and prepared today's overview.</p>
                                <div className="mt-8 flex gap-4">
                                    <button onClick={() => navigate("/chat")} className="px-8 py-3 rounded-xl bg-white text-[#6b38d4] font-semibold hover:scale-105 transition-all">
                                        Chat with AI
                                    </button>
                                    <button onClick={() => navigate("/tasks")} className="px-8 py-3 rounded-xl border border-white/40 text-white hover:bg-white/10 transition-all">
                                        View Tasks
                                    </button>
                                </div>
                            </div>

                            {/* Stats động */}
                            <div className="grid grid-cols-2 gap-4 min-w-[320px]">
                                {loading ? (
                                    <div className="col-span-2 flex items-center justify-center py-8">
                                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="rounded-2xl bg-white/15 backdrop-blur-lg p-5">
                                            <p className="text-white/80 text-sm">Tasks đang làm</p>
                                            <h1 className="text-white text-5xl font-bold mt-3">{todayTasks}</h1>
                                            <p className="text-white/70 mt-2">{highPriorityTasks} Khẩn cấp</p>
                                        </div>
                                        <div className="rounded-2xl bg-white/15 backdrop-blur-lg p-5">
                                            <p className="text-white/80 text-sm">Hoàn thành</p>
                                            <h1 className="text-white text-5xl font-bold mt-3">{tasksByStatus.done}</h1>
                                            <p className="text-white/70 mt-2">{donePercent}% tổng tasks</p>
                                        </div>
                                        <div className="rounded-2xl bg-white/15 backdrop-blur-lg p-5">
                                            <p className="text-white/80 text-sm">Nhắc nhở</p>
                                            <h1 className="text-white text-5xl font-bold mt-3">{pendingNotifs}</h1>
                                            <p className="text-white/70 mt-2">Đang chờ</p>
                                        </div>
                                        <div className="rounded-2xl bg-white/15 backdrop-blur-lg p-5">
                                            <p className="text-white/80 text-sm">Quá hạn</p>
                                            <h1 className="text-white text-5xl font-bold mt-3">{overdueTasks}</h1>
                                            <p className="text-white/70 mt-2">Cần xử lý</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* AI Recommendation */}
                    <div className="rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 text-white shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-3xl font-bold">AI Recommendation</h2>
                                <p className="text-white/80 mt-1">Dựa trên dữ liệu thực tế của bạn</p>
                            </div>
                            <span className="material-symbols-outlined text-6xl">psychology</span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {aiRecommendations.map((item, index) => (
                                <div key={index} className="bg-white/10 rounded-2xl p-4 backdrop-blur-lg hover:bg-white/20 transition">
                                    ✨ {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((item) => (
                            <div key={item.title} className="bg-white rounded-3xl p-6 shadow hover:shadow-2xl transition hover:-translate-y-1">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color}`}>
                                    <span className={`material-symbols-outlined text-3xl ${item.iconColor}`}>{item.icon}</span>
                                </div>
                                <h3 className="mt-5 text-gray-500 text-sm">{item.title}</h3>
                                <div className="text-4xl font-bold mt-2">
                                    {loading ? <div className="w-8 h-8 border-4 border-gray-200 border-t-[#6b38d4] rounded-full animate-spin"></div> : item.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Task Progress + Upcoming Tasks */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Task Progress */}
                        <div className="bg-white rounded-3xl p-6 shadow">
                            <h3 className="text-xl font-bold mb-6">Tiến độ Tasks</h3>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-8 h-8 border-4 border-[#6b38d4] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : totalTasks === 0 ? (
                                <div className="text-center py-8 text-gray-400">Chưa có task nào</div>
                            ) : (
                                <div className="flex flex-col gap-5">
                                    {[
                                        { label: 'To Do', value: tasksByStatus.pending, color: 'bg-gray-400' },
                                        { label: 'In Progress', value: tasksByStatus.in_progress, color: 'bg-[#6b38d4]' },
                                        { label: 'In Review', value: tasksByStatus.in_review, color: 'bg-amber-500' },
                                        { label: 'Done', value: tasksByStatus.done, color: 'bg-green-500' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-gray-600">{label}</span>
                                                <span className="font-bold">{value} / {totalTasks}</span>
                                            </div>
                                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${color} rounded-full transition-all duration-500`}
                                                    style={{ width: `${totalTasks > 0 ? (value / totalTasks) * 100 : 0}%` }}>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="mt-2 pt-4 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-gray-500 text-sm">Tổng hoàn thành</span>
                                        <span className="text-2xl font-bold text-[#6b38d4]">{donePercent}%</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Upcoming Tasks */}
                        <div className="bg-white rounded-3xl p-6 shadow">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Deadline gần nhất</h3>
                                <button onClick={() => navigate('/tasks')} className="text-sm text-[#6b38d4] font-medium hover:underline">
                                    Xem tất cả
                                </button>
                            </div>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-8 h-8 border-4 border-[#6b38d4] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : upcomingTasks.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <span className="material-symbols-outlined text-4xl mb-2 block">task_alt</span>
                                    Không có task nào sắp đến hạn
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {upcomingTasks.map(task => {
                                        const due = new Date(task.dueDate);
                                        const isOverdue = due < new Date();
                                        return (
                                            <div key={task.id}
                                                onClick={() => navigate('/tasks')}
                                                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#f8f9ff] cursor-pointer transition-colors border border-transparent hover:border-[#e0e0e0]">
                                                <div className={`w-2 h-2 rounded-full shrink-0 ${task.priority === 3 ? 'bg-red-500' : task.priority === 1 ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{task.title}</p>
                                                    <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                                        {isOverdue ? '⚠️ Quá hạn · ' : ''}
                                                        {due.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <span className={`text-[10px] px-2 py-1 rounded-full font-medium shrink-0 ${priorityColor[task.priority]}`}>
                                                    {priorityLabel[task.priority]}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div>
                        <h3 className="text-xl font-bold mb-4">Truy cập nhanh</h3>
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                            {quickActions.map(item => (
                                <button key={item.title} onClick={() => navigate(item.path)}
                                    className="rounded-3xl bg-white shadow hover:shadow-xl hover:-translate-y-1 transition-all p-5 flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                                        <span className="material-symbols-outlined text-white text-2xl">{item.icon}</span>
                                    </div>
                                    <h3 className="mt-3 font-medium text-xs text-center">{item.title}</h3>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notifications preview */}
                    {!loading && notifications.filter(n => n.status === 'pending').length > 0 && (
                        <div className="bg-white rounded-3xl p-6 shadow">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Nhắc nhở đang chờ</h3>
                                <button onClick={() => navigate('/reminders')} className="text-sm text-[#6b38d4] font-medium hover:underline">
                                    Xem tất cả
                                </button>
                            </div>
                            <div className="flex flex-col gap-3">
                                {notifications.filter(n => n.status === 'pending').slice(0, 3).map(n => (
                                    <div key={n.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#f0ebff] border border-[#d0bcff]">
                                        <div className="w-9 h-9 rounded-full bg-[#e9ddff] flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-[#6b38d4] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{n.title}</p>
                                            <p className="text-xs text-[#6b38d4] mt-0.5">
                                                {new Date(n.scheduledAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-[#6b38d4] shrink-0"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Floating Button */}
                <button onClick={() => navigate("/chat")}
                    className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-2xl hover:scale-110 transition-all flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">smart_toy</span>
                </button>
            </main>
        </div>
    );
}
