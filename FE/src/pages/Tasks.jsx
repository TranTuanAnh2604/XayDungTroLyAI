import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Sidebar from "../components/Sidebar";
import { getTasks, createTask, updateTask, updateStatus, deleteTask } from "../services/taskService";
import { createNotification, suggestReminderTime } from "../services/notificationService";

const COLUMNS = [
    { key: "pending", label: "To Do", borderColor: "#c6c6cd", dot: false },
    { key: "in_progress", label: "In Progress", borderColor: "#6b38d4", dot: true },
    { key: "in_review", label: "In Review", borderColor: "#565e74", dot: false },
    { key: "done", label: "Done", borderColor: "#1a6b38", dot: false },
];

// ─── Custom DateTime Picker ───────────────────────────────────────────────────
const PICKER_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const PICKER_MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']

function buildPickerGrid(year, month) {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()
    const cells = []
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ num: daysInPrev - i, dim: true, month: month - 1, year })
    for (let d = 1; d <= daysInMonth; d++) cells.push({ num: d, dim: false, month, year })
    const totalRows = cells.length > 35 ? 42 : 35
    for (let d = 1; d <= totalRows - cells.length; d++) cells.push({ num: d, dim: true, month: month + 1, year })
    return cells
}

function parsePickerValue(value) {
    if (!value) { const now = new Date(); now.setHours(8, 0, 0, 0); return now }
    const [datePart, timePart] = value.split('T')
    const [y, m, d] = datePart.split('-').map(Number)
    const [hh, mm] = (timePart || '00:00').split(':').map(Number)
    return new Date(y, m - 1, d, hh, mm)
}

function formatDateForInput(date) {
    const pad = n => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateForDisplay(date) {
    const pad = n => String(n).padStart(2, '0')
    const weekday = date.toLocaleDateString('vi-VN', { weekday: 'short' })
    return `${weekday}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} • ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function DateTimePicker({ value, onChange, hasError, placeholder = "Chọn thời gian", minNow = false }) {
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState(parsePickerValue(value))
    const [viewYear, setViewYear] = useState(draft.getFullYear())
    const [viewMonth, setViewMonth] = useState(draft.getMonth())
    const [hasValue, setHasValue] = useState(!!value)
    const [popupStyle, setPopupStyle] = useState({})
    const btnRef = useRef(null)
    const popupRef = useRef(null)
    const hourListRef = useRef(null)
    const minuteListRef = useRef(null)

    useEffect(() => {
        const d = parsePickerValue(value)
        setDraft(d); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setHasValue(!!value)
    }, [value])

    const openPicker = () => {
        if (!btnRef.current) return
        const rect = btnRef.current.getBoundingClientRect()
        const popupH = 520
        const spaceBelow = window.innerHeight - rect.bottom - 8
        const top = spaceBelow >= popupH ? rect.bottom + 8 : rect.top - popupH - 8
        setPopupStyle({ position: 'fixed', top: Math.max(8, top), left: Math.min(rect.left, window.innerWidth - 308), width: 300, zIndex: 9999 })
        setOpen(true)
    }

    useEffect(() => {
        if (!open) return
        const handleClickOutside = (e) => {
            if (btnRef.current && !btnRef.current.contains(e.target) && popupRef.current && !popupRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    useEffect(() => {
        if (!open) return
        requestAnimationFrame(() => {
            hourListRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'center' })
            minuteListRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'center' })
        })
    }, [open])

    const commit = (next) => { setDraft(next); setHasValue(true); onChange(formatDateForInput(next)) }
    const clear = (e) => { e.stopPropagation(); setHasValue(false); onChange("") }
    const grid = buildPickerGrid(viewYear, viewMonth)
    const now = new Date()

    const prevMonthView = () => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) } else setViewMonth(m => m - 1) }
    const nextMonthView = () => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) } else setViewMonth(m => m + 1) }

    const pickDay = (cell) => {
        let m = cell.month, y = cell.year
        if (m < 0) { m = 11; y -= 1 } if (m > 11) { m = 0; y += 1 }
        const next = new Date(draft); next.setFullYear(y, m, cell.num)
        // Nếu minNow: không cho chọn ngày trong quá khứ
        if (minNow) {
            const picked = new Date(y, m, cell.num, next.getHours(), next.getMinutes())
            if (picked < now) return
        }
        commit(next)
    }

    const isPastDay = (cell) => {
        if (!minNow || cell.dim) return false
        let m = cell.month, y = cell.year
        if (m < 0) { m = 11; y -= 1 } if (m > 11) { m = 0; y += 1 }
        const d = new Date(y, m, cell.num, 23, 59)
        return d < now
    }

    const popup = open ? (
        <div ref={popupRef} style={popupStyle} className="bg-white rounded-xl shadow-2xl border border-[#c6c6cd]/40 p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#0b1c30]">{PICKER_MONTHS[viewMonth]} {viewYear}</span>
                <div className="flex items-center gap-1">
                    <button onClick={prevMonthView} type="button" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#e5eeff] text-[#45464d]">
                        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                    <button onClick={nextMonthView} type="button" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#e5eeff] text-[#45464d]">
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 text-center">
                {PICKER_WEEKDAYS.map(d => <div key={d} className="text-[10px] font-semibold text-[#45464d]/60 py-1">{d}</div>)}
                {grid.map((cell, i) => {
                    const past = isPastDay(cell)
                    const isSelected = hasValue && !cell.dim && cell.num === draft.getDate() && viewMonth === draft.getMonth() && viewYear === draft.getFullYear()
                    return (
                        <button type="button" key={i} onClick={() => !past && pickDay(cell)}
                            className={`text-[12px] py-1.5 rounded-full transition-colors
                                ${past ? 'text-[#45464d]/20 cursor-not-allowed' : cell.dim ? 'text-[#45464d]/30 hover:bg-[#f0f0f5]' : 'text-[#0b1c30] hover:bg-[#e5eeff]'}
                                ${isSelected ? 'bg-[#8455ef] !text-white font-bold hover:bg-[#6b38d4]' : ''}`}>
                            {cell.num}
                        </button>
                    )
                })}
            </div>
            <div className="h-px bg-[#c6c6cd]/30" />
            <div>
                <p className="text-[11px] font-semibold text-[#45464d] mb-1.5">Giờ (24h) · Phút</p>
                <div className="grid grid-cols-2 gap-2">
                    <div ref={hourListRef} className="h-[110px] overflow-y-auto border border-[#c6c6cd]/40 rounded-lg flex flex-col">
                        {Array.from({ length: 24 }, (_, h) => h).map(h => {
                            const active = hasValue && h === draft.getHours()
                            return (
                                <button type="button" key={h} data-active={active}
                                    onClick={() => { const next = new Date(draft); next.setHours(h); commit(next) }}
                                    className={`text-[13px] py-1.5 text-center transition-colors ${active ? 'bg-[#8455ef] text-white font-bold' : 'text-[#0b1c30] hover:bg-[#eff4ff]'}`}>
                                    {String(h).padStart(2, '0')}
                                </button>
                            )
                        })}
                    </div>
                    <div ref={minuteListRef} className="h-[110px] overflow-y-auto border border-[#c6c6cd]/40 rounded-lg flex flex-col">
                        {Array.from({ length: 60 }, (_, m) => m).map(mn => {
                            const active = hasValue && mn === draft.getMinutes()
                            return (
                                <button type="button" key={mn} data-active={active}
                                    onClick={() => { const next = new Date(draft); next.setMinutes(mn); commit(next) }}
                                    className={`text-[13px] py-1.5 text-center transition-colors ${active ? 'bg-[#8455ef] text-white font-bold' : 'text-[#0b1c30] hover:bg-[#eff4ff]'}`}>
                                    {String(mn).padStart(2, '0')}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
            <div className="flex justify-between items-center pt-1">
                <button type="button" onClick={() => commit(new Date())} className="text-[12px] font-medium text-[#6b38d4] hover:underline">Hôm nay, bây giờ</button>
                <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[#8455ef] text-white hover:bg-[#6b38d4] transition-colors">Xong</button>
            </div>
        </div>
    ) : null

    return (
        <div className="relative flex-1 min-w-0">
            <button ref={btnRef} type="button" onClick={openPicker}
                className={`w-full flex items-center justify-between border rounded-lg px-3 py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4] transition-all bg-white
                    ${hasError ? 'border-[#ba1a1a]' : 'border-[#c6c6cd]'} ${hasValue ? 'text-[#0b1c30]' : 'text-[#45464d]'}`}>
                <span className="truncate">{hasValue ? formatDateForDisplay(draft) : placeholder}</span>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    {hasValue && <span onClick={clear} className="material-symbols-outlined text-[14px] text-[#45464d] hover:text-[#ba1a1a]">close</span>}
                    <span className="material-symbols-outlined text-[16px] text-[#45464d]">calendar_month</span>
                </div>
            </button>
            {open && createPortal(popup, document.body)}
        </div>
    )
}

// ─── Priority Badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }) {
    if (priority === 3) return <span className="px-[6px] py-[3px] bg-[#ffdad6] text-[#93000a] rounded text-[12px] font-bold flex items-center gap-[4px]"><span className="material-symbols-outlined text-[13px]">keyboard_double_arrow_up</span>Urgent</span>
    if (priority === 2) return <span className="px-[6px] py-[3px] bg-[#fff3cd] text-[#7d5a00] rounded text-[12px] font-bold flex items-center gap-[4px]"><span className="material-symbols-outlined text-[13px]">remove</span>Normal</span>
    if (priority === 1) return <span className="px-[6px] py-[3px] bg-[#e6f4ea] text-[#1a6b38] rounded text-[12px] font-bold flex items-center gap-[4px]"><span className="material-symbols-outlined text-[13px]">keyboard_double_arrow_down</span>Low</span>
    return null
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onStatusChange, onDelete, onEdit }) {
    const isUrgent = task.priority === 3
    const isNormal = task.priority === 2
    const isLow = task.priority === 1
    const [menuOpen, setMenuOpen] = useState(false)
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done"

    return (
        <div className={`bg-white rounded-xl p-[16px] shadow-sm hover:shadow-md transition-shadow cursor-grab group relative
            ${isUrgent ? "border-l-4 border-l-[#ba1a1a] border-y border-r border-[#c6c6cd]" : isNormal ? "border-l-4 border-l-[#f59e0b] border-y border-r border-[#c6c6cd]" : isLow ? "border-l-4 border-l-[#22c55e] border-y border-r border-[#c6c6cd]" : "border border-[#c6c6cd]"}`}>
            <div className="flex justify-between items-start mb-[8px]">
                <div className="flex gap-[4px] flex-wrap"><PriorityBadge priority={task.priority} /></div>
                <div className="relative">
                    <button onClick={() => setMenuOpen(v => !v)} className="text-[#45464d] opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                            <div className="absolute right-0 top-6 bg-white border border-[#c6c6cd] rounded-lg shadow-xl z-20 min-w-[160px]">
                                <button onClick={() => { onEdit(task); setMenuOpen(false) }} className="w-full text-left px-[12px] py-[8px] text-[13px] text-[#45464d] hover:bg-[#eff4ff] rounded-t-lg flex items-center gap-[6px]">
                                    <span className="material-symbols-outlined text-[14px]">edit</span>Sửa task
                                </button>
                                {COLUMNS.filter(c => c.key !== task.status).map(col => (
                                    <button key={col.key} onClick={() => { onStatusChange(task.id, col.key); setMenuOpen(false) }} className="w-full text-left px-[12px] py-[8px] text-[13px] text-[#45464d] hover:bg-[#eff4ff]">→ {col.label}</button>
                                ))}
                                <button onClick={() => { onDelete(task.id); setMenuOpen(false) }} className="w-full text-left px-[12px] py-[8px] text-[13px] text-[#ba1a1a] hover:bg-[#ffdad6] rounded-b-lg border-t border-[#c6c6cd] flex items-center gap-[6px]">
                                    <span className="material-symbols-outlined text-[14px]">delete</span>Xoá task
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <h4 className="text-[14px] font-semibold text-[#000000] mb-[4px] cursor-pointer hover:text-[#6b38d4] transition-colors" onClick={() => onEdit(task)}>{task.title}</h4>
            {task.description && <p className="text-[13px] text-[#45464d] line-clamp-2 mb-[16px]">{task.description}</p>}
            <div className="flex justify-between items-center mt-[8px]">
                <div className="flex items-center gap-[4px] text-[#45464d] text-[13px]">
                    {task.estimated_minutes && <span className="flex items-center gap-[2px]"><span className="material-symbols-outlined text-[14px]">timer</span>{task.estimated_minutes}m</span>}
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
    )
}

// ─── Conflict Warning ─────────────────────────────────────────────────────────
function ConflictWarning({ conflicts }) {
    if (!conflicts.length) return null
    return (
        <div className="bg-[#fff3cd] border border-[#f59e0b] rounded-lg p-[12px] flex items-start gap-[8px]">
            <span className="material-symbols-outlined text-[#7d5a00] text-[18px] shrink-0">warning</span>
            <div>
                <p className="text-[13px] font-bold text-[#7d5a00] mb-[4px]">⚠️ Phát hiện xung đột thời gian!</p>
                {conflicts.map((c, i) => (
                    <p key={i} className="text-[12px] text-[#7d5a00]">• "{c.title}" — deadline cách nhau dưới 1 tiếng</p>
                ))}
                <p className="text-[11px] text-[#7d5a00] mt-[4px]">Bạn vẫn có thể tạo task, nhưng hãy cân nhắc điều chỉnh deadline.</p>
            </div>
        </div>
    )
}

// ─── Task Modal ───────────────────────────────────────────────────────────────
function TaskModal({ task, onClose, onSaved, existingTasks }) {
    const isEdit = !!task && !task.__isNew
    const defaultStatus = task?.__isNew ? task.defaultStatus : (task?.status ?? "pending")

    const toLocalDatetimeValue = (isoStr) => {
        if (!isoStr) return ""
        const d = new Date(isoStr)
        const pad = n => String(n).padStart(2, "0")
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }

    const [form, setForm] = useState({
        title: isEdit ? task.title : "",
        description: isEdit ? (task.description ?? "") : "",
        priority: isEdit ? task.priority : 2,
        status: defaultStatus,
        due_date: isEdit && task.dueDate ? toLocalDatetimeValue(task.dueDate) : "",
        estimated_minutes: isEdit ? (task.estimated_minutes ?? "") : "",
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [dateError, setDateError] = useState("")
    const [conflicts, setConflicts] = useState([])
    const [aiReminderLoading, setAiReminderLoading] = useState(false)

    // Kiểm tra deadline quá khứ và xung đột khi đổi due_date
    useEffect(() => {
        setDateError("")
        setConflicts([])
        if (!form.due_date) return

        const picked = new Date(form.due_date)
        const now = new Date()

        // 1. Kiểm tra quá khứ
        if (picked <= now) {
            setDateError("Deadline không được nhỏ hơn hoặc bằng thời gian hiện tại!")
            return
        }

        // 2. Kiểm tra xung đột (cách nhau < 1 tiếng với task khác có deadline)
        const ONE_HOUR = 60 * 60 * 1000
        const conflicted = existingTasks.filter(t => {
            if (!t.dueDate || t.status === 'done') return false
            if (isEdit && t.id === task.id) return false
            const diff = Math.abs(new Date(t.dueDate) - picked)
            return diff < ONE_HOUR
        })
        setConflicts(conflicted)
    }, [form.due_date])

    const handleSubmit = async () => {
        if (!form.title.trim()) { setError("Tiêu đề không được để trống"); return }
        if (dateError) { setError("Vui lòng sửa deadline trước khi lưu"); return }
        setLoading(true)
        try {
            const basePayload = {
                title: form.title,
                description: form.description || null,
                priority: Number(form.priority),
                dueDate: form.due_date ? form.due_date + ":00+07:00" : null,
                status: form.status,
            }

            if (isEdit) {
                await updateTask(task.id, basePayload)
            } else {
                await createTask(basePayload)
            }

            // AI tự động tạo reminder sau khi tạo/sửa task
            if (!isEdit) {
                setAiReminderLoading(true)
                try {
                    const taskForAI = { ...basePayload, title: form.title, description: form.description }
                    const suggestion = await suggestReminderTime(taskForAI)
                    await createNotification({
                        title: `Nhắc nhở: ${form.title}`,
                        body: suggestion.reason,
                        scheduledAt: suggestion.scheduledAt, 

                    })
                } catch (e) {
                    console.warn("Không tạo được reminder tự động:", e.message)
                } finally {
                    setAiReminderLoading(false)
                }
            }

            onSaved()
            onClose()
        } catch (e) {
            setError(`${isEdit ? "Sửa" : "Tạo"} task thất bại: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-[24px] w-full max-w-md shadow-xl flex flex-col gap-[16px]">
                <div className="flex items-center justify-between px-6 py-5 -mx-6 -mt-6 mb-6 bg-gradient-to-r from-[#8455ef] to-[#6b38d4] rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[22px]">
                                {isEdit ? "edit_note" : "task_alt"}
                            </span>
                        </div>

                        <div>
                            <h3 className="text-[22px] font-bold text-white leading-none">
                                {isEdit ? "Chỉnh sửa công việc" : "Tạo công việc mới"}
                            </h3>

                            <p className="text-[13px] text-white/80 mt-1">
                                {isEdit
                                    ? "Cập nhật thông tin công việc"
                                    : "Thêm một công việc mới vào danh sách"}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/15 transition-all duration-200"
                    >
                        <span className="material-symbols-outlined text-[22px]">
                            close
                        </span>
                    </button>
                </div>

                {error && <p className="text-[#ba1a1a] text-[13px]">{error}</p>}

                {/* Cảnh báo xung đột */}
                <ConflictWarning conflicts={conflicts} />

                <input className="border border-[#c6c6cd] rounded-lg px-[12px] py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]"
                    placeholder="Tiêu đề *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <textarea className="border border-[#c6c6cd] rounded-lg px-[12px] py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4] resize-none h-[80px]"
                    placeholder="Mô tả (tùy chọn)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <div className="flex gap-[8px]">
                    <select className="flex-1 border border-[#c6c6cd] rounded-lg px-[12px] py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]"
                        value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                        <option value={1}>Ưu tiên thấp</option>
                        <option value={2}>Bình thường</option>
                        <option value={3}>Khẩn cấp</option>
                    </select>
                    <select className="flex-1 border border-[#c6c6cd] rounded-lg px-[12px] py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]"
                        value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                        {COLUMNS.map(col => <option key={col.key} value={col.key}>{col.label}</option>)}
                    </select>
                </div>

                {/* Deadline với ràng buộc minNow */}
                <div>
                    <label className="block text-[13px] font-semibold text-[#45464d] mb-1">Deadline</label>
                    <div className="flex gap-[8px] items-center">
                        <DateTimePicker
                            value={form.due_date}
                            onChange={v => setForm({ ...form, due_date: v })}
                            placeholder="Chọn deadline..."
                            hasError={!!dateError}
                            minNow={true}
                        />
                        <input type="number"
                            className="w-[130px] shrink-0 border border-[#c6c6cd] rounded-lg px-[12px] py-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]"
                            placeholder="Ước tính (ph)"
                            value={form.estimated_minutes}
                            onChange={e => setForm({ ...form, estimated_minutes: e.target.value })} />
                    </div>
                    {dateError && (
                        <p className="text-[12px] text-[#ba1a1a] mt-[4px] flex items-center gap-[4px]">
                            <span className="material-symbols-outlined text-[14px]">error</span>{dateError}
                        </p>
                    )}
                </div>

                {/* AI reminder notice */}
                {!isEdit && (
                    <div className="bg-[#e9ddff]/50 border border-[#d0bcff] rounded-lg px-[12px] py-[8px] flex items-center gap-[8px]">
                        <span className="material-symbols-outlined text-[#6b38d4] text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        <p className="text-[12px] text-[#45464d]">AI sẽ <span className="font-medium text-[#6b38d4]">tự động tạo nhắc nhở</span> phù hợp sau khi bạn tạo task.</p>
                    </div>
                )}

                <div className="flex gap-[8px] justify-end">
                    <button onClick={onClose} className="px-[16px] py-[8px] border border-[#c6c6cd] rounded-lg text-[14px] text-[#45464d] hover:bg-[#eff4ff]">Hủy</button>
                    <button onClick={handleSubmit} disabled={loading || !!dateError}
                        className="px-[16px] py-[8px] bg-[#8455ef] text-white rounded-lg text-[14px] font-bold hover:shadow-md disabled:opacity-50 flex items-center gap-[6px]">
                        {(loading || aiReminderLoading) && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        {loading ? "Đang lưu..." : aiReminderLoading ? "AI đang tạo nhắc nhở..." : isEdit ? "Lưu thay đổi" : "Tạo Task"}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
function FilterBar({ filters, setFilters, totalFiltered, totalAll }) {
    const hasActiveFilter = filters.search || filters.priority !== "all" || filters.dueDate !== "all"
    return (
        <div className="flex flex-col gap-[8px]">
            <div className="flex gap-[8px] items-center flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-xs focus-within:ring-2 focus-within:ring-[#6b38d4] rounded-lg bg-white border border-[#c6c6cd] transition-all">
                    <span className="material-symbols-outlined absolute left-[8px] top-1/2 -translate-y-1/2 text-[#45464d] text-[18px]">search</span>
                    <input className="w-full bg-transparent border-none pl-[36px] pr-[28px] py-[8px] text-[14px] text-[#000000] placeholder:text-[#45464d] focus:outline-none rounded-lg"
                        placeholder="Tìm kiếm task..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
                    {filters.search && (
                        <button onClick={() => setFilters(f => ({ ...f, search: "" }))} className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#45464d] hover:text-[#000]">
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    )}
                </div>
                <select className="border border-[#c6c6cd] bg-white rounded-lg px-[10px] py-[8px] text-[13px] text-[#45464d] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]"
                    value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}>
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="priority_high">Ưu tiên cao nhất</option>
                    <option value="priority_low">Ưu tiên thấp nhất</option>
                    <option value="due_soon">Deadline gần nhất</option>
                </select>
                {hasActiveFilter && (
                    <>
                        <button onClick={() => setFilters(f => ({ ...f, search: "", priority: "all", dueDate: "all" }))}
                            className="flex items-center gap-[4px] px-[10px] py-[8px] text-[13px] text-[#ba1a1a] border border-[#ba1a1a] rounded-lg hover:bg-[#ffdad6] transition-colors">
                            <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>Xoá lọc
                        </button>
                        <span className="text-[13px] text-[#45464d]">{totalFiltered}/{totalAll} task</span>
                    </>
                )}
            </div>
            <div className="flex gap-[8px] flex-wrap items-center">
                {[{ val: "all", label: "Tất cả" }, { val: "3", label: "🔴 Urgent" }, { val: "2", label: "🟡 Normal" }, { val: "1", label: "🟢 Low" }].map(({ val, label }) => (
                    <button key={val} onClick={() => setFilters(f => ({ ...f, priority: val }))}
                        className={`px-[10px] py-[4px] rounded-full text-[12px] font-medium border transition-colors ${filters.priority === val ? "bg-[#6b38d4] text-white border-[#6b38d4]" : "bg-white text-[#45464d] border-[#c6c6cd] hover:border-[#6b38d4]"}`}>
                        {label}
                    </button>
                ))}
                <div className="w-px h-[20px] bg-[#c6c6cd] mx-[4px]" />
                {[{ val: "all", label: "Tất cả ngày" }, { val: "overdue", label: "⚠️ Quá hạn" }, { val: "today", label: "📅 Hôm nay" }, { val: "week", label: "📆 Tuần này" }].map(({ val, label }) => (
                    <button key={val} onClick={() => setFilters(f => ({ ...f, dueDate: val }))}
                        className={`px-[10px] py-[4px] rounded-full text-[12px] font-medium border transition-colors ${filters.dueDate === val ? "bg-[#6b38d4] text-white border-[#6b38d4]" : "bg-white text-[#45464d] border-[#c6c6cd] hover:border-[#6b38d4]"}`}>
                        {label}
                    </button>
                ))}
            </div>
        </div>
    )
}

function parseDate(str) {
    if (!str) return null
    const d = str.split("T")[0]
    const [y, m, day] = d.split("-").map(Number)
    return new Date(y, m - 1, day)
}

function applyFiltersAndSort(tasks, filters) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(today); endOfWeek.setDate(today.getDate() + (6 - today.getDay()))
    let result = [...tasks]
    if (filters.search.trim()) {
        const q = filters.search.toLowerCase()
        result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    }
    if (filters.priority !== "all") result = result.filter(t => t.priority === Number(filters.priority))
    if (filters.dueDate !== "all") {
        result = result.filter(t => {
            const due = parseDate(t.dueDate)
            if (!due) return false
            if (filters.dueDate === "overdue") return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
            if (filters.dueDate === "today") return due.getTime() === today.getTime()
            if (filters.dueDate === "week") return due >= today && due <= endOfWeek
            return true
        })
    }
    result.sort((a, b) => {
        if (filters.sort === "newest") return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
        if (filters.sort === "oldest") return new Date(a.createdAt ?? 0) - new Date(b.createdAt ?? 0)
        if (filters.sort === "priority_high") return b.priority - a.priority
        if (filters.sort === "priority_low") return a.priority - b.priority
        if (filters.sort === "due_soon") {
            const da = parseDate(a.dueDate), db = parseDate(b.dueDate)
            if (!da) return 1; if (!db) return -1; return da - db
        }
        return 0
    })
    return result
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Tasks() {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [filters, setFilters] = useState({ search: "", priority: "all", dueDate: "all", sort: "newest" })
    const [modalTask, setModalTask] = useState(undefined)
    const openCreateModal = (defaultStatus = "pending") => setModalTask({ __isNew: true, defaultStatus })

    const fetchTasks = async () => {
        setLoading(true); setError("")
        try {
            const data = await getTasks()
            setTasks(Array.isArray(data) ? data : [])
        } catch (e) { setError("Không thể tải tasks: " + e.message) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchTasks() }, [])

    const handleStatusChange = async (id, newStatus) => {
        try { await updateStatus(id, newStatus); await fetchTasks() }
        catch (e) { alert("Cập nhật thất bại: " + e.message) }
    }

    const handleDelete = async (id) => {
        if (!confirm("Bạn chắc chắn muốn xoá task này?")) return
        try { await deleteTask(id); await fetchTasks() }
        catch (e) { alert("Xoá thất bại: " + e.message) }
    }

    const handleSaved = async () => { await fetchTasks() }

    // Chỉ hiển thị task có deadline trong vòng 7 ngày tới (kể cả đã quá hạn).
    // Task không có deadline luôn hiển thị. Task deadline > 7 ngày sẽ tự ẩn
    // và hiện lại khi deadline lùi vào trong khoảng 7 ngày.
    const visibleTasks = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const limit = new Date(today); limit.setDate(today.getDate() + 7)
        return tasks.filter(t => {
            const due = parseDate(t.dueDate)
            if (!due) return true
            return due <= limit
        })
    }, [tasks])

    const filteredTasks = useMemo(() => applyFiltersAndSort(visibleTasks, filters), [visibleTasks, filters])
    const getTasksByStatus = statusKey => filteredTasks.filter(t => t.status === statusKey)

    const urgentCount = tasks.filter(t => t.priority === 3 && t.status !== "done").length
    const overdueCount = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length

    return (
        <div className="flex h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#f8f9ff", color: "#0b1c30" }}>
            <Sidebar />
            <main className="flex-1 min-w-0 flex flex-col ml-[280px] h-full relative">
                <header className="flex justify-between items-center w-full px-[24px] py-[8px] sticky top-0 z-30 bg-[#f8f9ff]/70 backdrop-blur-xl border-b border-[#c6c6cd] shadow-sm">
                    <div className="hidden md:flex items-center gap-[8px] text-[#45464d] text-[14px] font-medium">
                        <span>Workspace</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        <span className="text-[#000000] font-bold">Project Alpha</span>
                    </div>
                    <button className="hidden sm:block text-[#45464d] hover:text-[#000000] transition-colors ml-auto" onClick={fetchTasks}>
                        <span className="material-symbols-outlined">refresh</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-[16px] md:p-[24px] flex flex-col gap-[16px] bg-[#f8f9ff]">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-[#000000] mb-[4px]">Active Tasks</h2>
                            <p className="text-[16px] leading-[1.5] text-[#45464d]">
                                {loading ? "Đang tải..." : `${tasks.filter(t => t.status !== "done").length} tasks đang hoạt động`}
                            </p>
                        </div>
                        <button onClick={() => openCreateModal()}
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
                        <div className="flex-1 min-h-0 flex gap-[16px]">
                            {COLUMNS.map(col => {
                                const colTasks = getTasksByStatus(col.key)
                                return (
                                    <div key={col.key} className="flex flex-col flex-1 min-w-0 gap-[8px]">
                                        <div className="flex items-center justify-between pb-[4px] border-b-2" style={{ borderColor: col.borderColor }}>
                                            <div className="flex items-center gap-[4px]">
                                                {col.dot && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.borderColor }}></span>}
                                                <h3 className="text-[18px] font-semibold text-[#000000]">{col.label}</h3>
                                            </div>
                                            <span className="bg-[#dce9ff] text-[#45464d] px-[8px] py-[2px] rounded-full text-[13px]">{colTasks.length}</span>
                                            <button onClick={() => openCreateModal(col.key)}
                                                className="w-[24px] h-[24px] flex items-center justify-center rounded-full text-[#45464d] hover:bg-[#e9ddff] hover:text-[#6b38d4] transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">add</span>
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-[8px] overflow-y-auto pr-[4px] flex-1">
                                            {colTasks.length === 0 ? (
                                                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#c6c6cd] rounded-xl bg-[#f8f9ff]/50 py-[32px]">
                                                    <span className="material-symbols-outlined text-[#c6c6cd] text-[32px] mb-[8px]">inbox</span>
                                                    <p className="text-[14px] font-medium text-[#45464d]">{filteredTasks.length < tasks.length ? "Không khớp bộ lọc" : "Không có task"}</p>
                                                </div>
                                            ) : (
                                                colTasks.map(task => (
                                                    <TaskCard key={task.id} task={task}
                                                        onStatusChange={handleStatusChange}
                                                        onDelete={handleDelete}
                                                        onEdit={setModalTask} />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>

            {modalTask !== undefined && (
                <TaskModal
                    task={modalTask}
                    onClose={() => setModalTask(undefined)}
                    onSaved={handleSaved}
                    existingTasks={tasks}
                />
            )}
        </div>
    )
}
