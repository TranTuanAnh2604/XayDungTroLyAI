import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { getNotifications, createNotification, deleteNotification, suggestReminderTime } from '../services/notificationService'
import { getTasks } from '../services/taskService'

const STATUS_LABEL = { pending: 'Chờ', sent: 'Đã gửi' }
const STATUS_COLOR = { pending: 'bg-[#eff4ff] text-[#6b38d4]', sent: 'bg-[#e6f4ea] text-[#1a6b38]' }
const PAGE_SIZE = 5

function ReminderCard({ reminder, onDelete }) {
    const isPast = new Date(reminder.scheduledAt) < new Date()
    return (
        <div className="bg-white border border-[#c6c6cd] rounded-xl p-[16px] shadow-sm flex items-start gap-[12px]">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                ${reminder.status === 'sent' ? 'bg-[#e6f4ea]' : isPast ? 'bg-[#ffdad6]' : 'bg-[#e9ddff]'}`}>
                <span className="material-symbols-outlined text-[20px]"
                    style={{ color: reminder.status === 'sent' ? '#1a6b38' : isPast ? '#ba1a1a' : '#6b38d4' }}>
                    {reminder.status === 'sent' ? 'check_circle' : isPast ? 'warning' : 'notifications'}
                </span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[8px] mb-[2px]">
                    <h4 className="text-[14px] font-semibold text-[#000000] truncate">{reminder.title}</h4>
                    <span className={`px-[6px] py-[2px] rounded-full text-[11px] font-medium shrink-0 ${STATUS_COLOR[reminder.status]}`}>
                        {STATUS_LABEL[reminder.status]}
                    </span>
                </div>
                {reminder.body && <p className="text-[13px] text-[#45464d] mb-[4px]">{reminder.body}</p>}
                <p className="text-[12px] text-[#45464d] flex items-center gap-[4px]">
                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                    {new Date(reminder.scheduledAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                </p>
            </div>
            <button onClick={() => onDelete(reminder.id)}
                className="text-[#45464d] hover:text-[#ba1a1a] transition-colors shrink-0">
                <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
        </div>
    )
}

function CreateReminderModal({ onClose, onCreated }) {
    const [tasks, setTasks] = useState([])
    const [selectedTask, setSelectedTask] = useState(null)
    const [form, setForm] = useState({ title: '', body: '', scheduledAt: '' })
    const [aiSuggestion, setAiSuggestion] = useState(null)
    const [aiLoading, setAiLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => { getTasks().then(setTasks).catch(() => {}) }, [])

    const handleSelectTask = (taskId) => {
        const task = tasks.find(t => t.id === taskId)
        setSelectedTask(task)
        if (task) setForm(f => ({ ...f, title: `Nhắc nhở: ${task.title}`, body: task.description || '' }))
        setAiSuggestion(null)
    }

    const handleAISuggest = async () => {
        if (!selectedTask) return
        setAiLoading(true); setAiSuggestion(null)
        try {
            const suggestion = await suggestReminderTime(selectedTask)
            setAiSuggestion(suggestion)
            const localDt = new Date(suggestion.scheduledAt)
            const pad = n => String(n).padStart(2, '0')
            const formatted = `${localDt.getFullYear()}-${pad(localDt.getMonth()+1)}-${pad(localDt.getDate())}T${pad(localDt.getHours())}:${pad(localDt.getMinutes())}`
            setForm(f => ({ ...f, scheduledAt: formatted }))
        } catch (e) {
            setError('AI gặp lỗi: ' + e.message)
        } finally {
            setAiLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!form.title.trim()) { setError('Tiêu đề không được để trống'); return }
        if (!form.scheduledAt) { setError('Vui lòng chọn thời gian nhắc'); return }
        setLoading(true)
        try {
            await createNotification({ title: form.title, body: form.body || null, scheduledAt: new Date(form.scheduledAt).toISOString() })
            onCreated(); onClose()
        } catch (e) {
            setError('Tạo nhắc nhở thất bại: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-[24px] w-full max-w-md shadow-xl flex flex-col gap-[16px]">
                <div className="flex justify-between items-center">
                    <h3 className="text-[18px] font-bold text-[#000000]">Tạo Nhắc Nhở</h3>
                    <button onClick={onClose} className="text-[#45464d] hover:text-[#000000]">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                {error && <p className="text-[#ba1a1a] text-[13px]">{error}</p>}
                <div>
                    <label className="text-[13px] font-medium text-[#45464d] mb-[4px] block">Liên kết với task (để AI gợi ý giờ)</label>
                    <div className="flex gap-[8px]">
                        <select className="flex-1 border border-[#c6c6cd] rounded-lg px-[12px] py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]"
                            onChange={(e) => handleSelectTask(e.target.value)} defaultValue="">
                            <option value="">-- Chọn task --</option>
                            {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                        </select>
                        <button onClick={handleAISuggest} disabled={!selectedTask || aiLoading}
                            className="flex items-center gap-[6px] px-[12px] py-[8px] bg-[#e9ddff] text-[#6b38d4] rounded-lg text-[13px] font-medium hover:bg-[#d0bcff] disabled:opacity-40 transition-colors">
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                            {aiLoading ? 'Đang hỏi AI...' : 'AI gợi ý'}
                        </button>
                    </div>
                </div>
                {aiSuggestion && (
                    <div className="bg-[#e9ddff]/50 border border-[#d0bcff] rounded-lg p-[12px] flex items-start gap-[8px]">
                        <span className="material-symbols-outlined text-[#6b38d4] text-[18px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        <p className="text-[13px] text-[#45464d]"><span className="font-medium text-[#6b38d4]">AI đề xuất: </span>{aiSuggestion.reason}</p>
                    </div>
                )}
                <input className="border border-[#c6c6cd] rounded-lg px-[12px] py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]"
                    placeholder="Tiêu đề nhắc nhở *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <textarea className="border border-[#c6c6cd] rounded-lg px-[12px] py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4] resize-none h-[60px]"
                    placeholder="Nội dung (tùy chọn)" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
                <div>
                    <label className="text-[13px] font-medium text-[#45464d] mb-[4px] block">Thời gian nhắc *</label>
                    <input type="datetime-local" className="w-full border border-[#c6c6cd] rounded-lg px-[12px] py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]"
                        value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
                </div>
                <div className="flex gap-[8px] justify-end">
                    <button onClick={onClose} className="px-[16px] py-[8px] border border-[#c6c6cd] rounded-lg text-[14px] text-[#45464d] hover:bg-[#eff4ff]">Hủy</button>
                    <button onClick={handleSubmit} disabled={loading}
                        className="px-[16px] py-[8px] bg-[#8455ef] text-white rounded-lg text-[14px] font-bold hover:shadow-md disabled:opacity-50">
                        {loading ? 'Đang tạo...' : 'Tạo nhắc nhở'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// Component phân trang
function Pagination({ page, totalPages, totalItems, onPageChange }) {
    if (totalPages <= 1) return null

    const from = (page - 1) * PAGE_SIZE + 1
    const to = Math.min(page * PAGE_SIZE, totalItems)

    // Tính range số trang hiển thị (tối đa 5 nút)
    let start = Math.max(1, page - 2)
    let end = Math.min(totalPages, start + 4)
    if (end - start < 4) start = Math.max(1, end - 4)

    return (
        <div className="flex flex-col items-center gap-[8px] mt-[16px]">
            {/* Info */}
            

            {/* Nút điều hướng */}
            <div className="flex items-center gap-[6px]">
                {/* Về đầu */}
                <button onClick={() => onPageChange(1)} disabled={page === 1}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[#45464d] border border-[#c6c6cd] hover:bg-[#eff4ff] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <span className="material-symbols-outlined text-[16px]">first_page</span>
                </button>

                {/* Trang trước */}
                <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[#45464d] border border-[#c6c6cd] hover:bg-[#eff4ff] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>

                {/* Số trang */}
                {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
                    <button key={p} onClick={() => onPageChange(p)}
                        className={`w-9 h-9 rounded-lg text-[13px] font-medium transition-colors
                            ${page === p
                                ? 'bg-[#6b38d4] text-white border border-[#6b38d4]'
                                : 'text-[#45464d] border border-[#c6c6cd] hover:bg-[#e9ddff] hover:border-[#6b38d4]'
                            }`}>
                        {p}
                    </button>
                ))}

                {/* Trang sau */}
                <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[#45464d] border border-[#c6c6cd] hover:bg-[#eff4ff] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>

                {/* Về cuối */}
                <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[#45464d] border border-[#c6c6cd] hover:bg-[#eff4ff] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <span className="material-symbols-outlined text-[16px]">last_page</span>
                </button>
            </div>
        </div>
    )
}

export default function Reminders() {
    const [reminders, setReminders] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [filter, setFilter] = useState('all')
    const [page, setPage] = useState(1)

    const fetchReminders = async () => {
        setLoading(true)
        try {
            const data = await getNotifications()
            setReminders(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchReminders() }, [])

    // Reset về trang 1 khi đổi filter
    useEffect(() => { setPage(1) }, [filter])

    const handleDelete = async (id) => {
        if (!confirm('Xoá nhắc nhở này?')) return
        try {
            await deleteNotification(id)
            await fetchReminders()
            // Nếu xoá hết trang hiện tại thì lùi về trang trước
            const newFiltered = filtered.length - 1
            const maxPage = Math.ceil(newFiltered / PAGE_SIZE)
            if (page > maxPage && maxPage > 0) setPage(maxPage)
        } catch (e) {
            alert('Xoá thất bại: ' + e.message)
        }
    }

    const filtered = reminders.filter(r => filter === 'all' ? true : r.status === filter)
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const pendingCount = reminders.filter(r => r.status === 'pending').length

    return (
        <div className="flex h-screen overflow-hidden" style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f8f9ff', color: '#0b1c30' }}>
            <Sidebar />
            <main className="flex-1 flex flex-col md:ml-[280px] w-full h-full relative">
                <header className="flex justify-between items-center w-full px-[24px] py-[8px] sticky top-0 z-30 bg-[#f8f9ff]/70 backdrop-blur-xl border-b border-[#c6c6cd] shadow-sm">
                    <div className="hidden md:flex items-center gap-[8px] text-[#45464d] text-[14px] font-medium">
                        <span>Workspace</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        <span className="text-[#000000] font-bold">Nhắc nhở</span>
                    </div>
                    <button onClick={fetchReminders} className="ml-auto text-[#45464d] hover:text-[#000000]">
                        <span className="material-symbols-outlined">refresh</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-[16px] md:p-[24px] flex flex-col gap-[16px]">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-[#000000] mb-[4px]">Nhắc Nhở</h2>
                            <p className="text-[16px] text-[#45464d]">
                                {pendingCount > 0 ? `${pendingCount} nhắc nhở đang chờ` : 'Không có nhắc nhở nào đang chờ'}
                            </p>
                        </div>
                        <button onClick={() => setShowModal(true)}
                            className="flex items-center gap-[8px] bg-[#8455ef] text-white px-[16px] py-[8px] rounded-lg text-[14px] font-bold shadow-sm hover:shadow-md transition-all">
                            <span className="material-symbols-outlined">add</span>
                            Tạo nhắc nhở
                        </button>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-[8px]">
                        {[
                            { key: 'all', label: `Tất cả (${reminders.length})` },
                            { key: 'pending', label: `⏰ Chờ (${pendingCount})` },
                            { key: 'sent', label: `✅ Đã gửi (${reminders.filter(r => r.status === 'sent').length})` }
                        ].map(({ key, label }) => (
                            <button key={key} onClick={() => setFilter(key)}
                                className={`px-[14px] py-[6px] rounded-full text-[13px] font-medium border transition-colors
                                    ${filter === key ? 'bg-[#6b38d4] text-white border-[#6b38d4]' : 'bg-white text-[#45464d] border-[#c6c6cd] hover:border-[#6b38d4]'}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-[#6b38d4] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-[12px] text-[#45464d]">
                            <span className="material-symbols-outlined text-[48px] text-[#c6c6cd]">notifications_off</span>
                            <p className="text-[14px] font-medium">Không có nhắc nhở nào</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-[8px] max-w-2xl">
                            {paginated.map(r => (
                                <ReminderCard key={r.id} reminder={r} onDelete={handleDelete} />
                            ))}
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                totalItems={filtered.length}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </div>
            </main>

            {showModal && (
                <CreateReminderModal onClose={() => setShowModal(false)} onCreated={fetchReminders} />
            )}
        </div>
    )
}
