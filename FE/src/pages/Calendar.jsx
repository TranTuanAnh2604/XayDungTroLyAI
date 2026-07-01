import { useState, useEffect, useReducer, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import {
    getCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    getAiSuggestions, // <-- thêm hàm này vào services/calendarService.js (xem cuối file)
} from '../services/calendarService'

// ─── Helpers ────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

function buildGrid(year, month) {
    // month: 0-indexed
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()
    const cells = []

    for (let i = firstDay - 1; i >= 0; i--)
        cells.push({ num: daysInPrev - i, dim: true, month: month - 1, year })

    for (let d = 1; d <= daysInMonth; d++)
        cells.push({ num: d, dim: false, month, year })

    const totalRows = cells.length > 35 ? 42 : 35
    const remaining = totalRows - cells.length
    for (let d = 1; d <= remaining; d++)
        cells.push({ num: d, dim: true, month: month + 1, year })

    return cells
}

function toLocalInput(date) {
    const d = new Date(date)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function inputToISO(localStr) {
    return localStr;
}

function formatSuggestedTime(startISO, endISO) {
    if (!startISO) return 'Chưa rõ thời gian'
    const start = new Date(startISO)
    const datePart = start.toLocaleDateString('vi-VN', { weekday: 'short', month: 'short', day: 'numeric' })
    const startTime = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    if (!endISO) return `${datePart} • ${startTime}`
    const end = new Date(endISO)
    const endTime = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    return `${datePart} • ${startTime} - ${endTime}`
}

const SOURCE_ICON = {
    email: { icon: 'mail', iconBg: 'bg-[#dae2fd]', iconColor: 'text-[#131b2e]' },
    task: { icon: 'task_alt', iconBg: 'bg-[#d3e4fe]', iconColor: 'text-[#0b1c30]' },
    voice: { icon: 'mic', iconBg: 'bg-[#e9ddff]', iconColor: 'text-[#5516be]' },
    chat: { icon: 'chat', iconBg: 'bg-[#d3e4fe]', iconColor: 'text-[#0b1c30]' },
}

const EVENT_STYLES = [
    { style: 'bg-white text-red-600 border border-gray-200', dot: 'bg-red-500', label: 'Urgent' },
    { style: 'bg-white text-yellow-600 border border-gray-200', dot: 'bg-yellow-400', label: 'Normal' },
    { style: 'bg-white text-green-600 border border-gray-200', dot: 'bg-green-400', label: 'Low' },
]

const EMPTY_FORM = {
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    isAllDay: false,
    styleIndex: 0,
}

// ─── Custom DateTime Picker ───────────────────────────────────────────────
// Thay cho input type="datetime-local" mặc định của trình duyệt (không style
// được phần lịch/giờ do trình duyệt vẽ). Component này tự vẽ UI, vẫn giữ
// nguyên format giá trị "YYYY-MM-DDTHH:mm" để không ảnh hưởng phần lưu DB.

const PICKER_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const PICKER_MONTHS = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
]

function parseLocalValue(value) {
    if (!value) {
        const now = new Date()
        now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5, 0, 0)
        return now
    }
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

function DateTimePicker({ value, onChange, hasError }) {
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState(parseLocalValue(value))
    const [viewYear, setViewYear] = useState(draft.getFullYear())
    const [viewMonth, setViewMonth] = useState(draft.getMonth())
    const wrapRef = useRef(null)
    const hourListRef = useRef(null)
    const minuteListRef = useRef(null)

    useEffect(() => {
        const d = parseLocalValue(value)
        setDraft(d)
        setViewYear(d.getFullYear())
        setViewMonth(d.getMonth())
    }, [value])

    useEffect(() => {
        if (!open) return
        const handleClickOutside = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    useEffect(() => {
        if (!open) return
        // tự scroll tới giờ/phút đang chọn khi mở popover
        requestAnimationFrame(() => {
            hourListRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'center' })
            minuteListRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'center' })
        })
    }, [open])

    const commit = (next) => {
        setDraft(next)
        onChange(formatDateForInput(next))
    }

    const grid = buildGrid(viewYear, viewMonth)
    const minuteOptions = Array.from({ length: 60 }, (_, m) => m)

    const prevMonthView = () => {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
        else setViewMonth(m => m - 1)
    }
    const nextMonthView = () => {
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
        else setViewMonth(m => m + 1)
    }

    const pickDay = (cell) => {
        let m = cell.month, y = cell.year
        if (m < 0) { m = 11; y -= 1 }
        if (m > 11) { m = 0; y += 1 }
        const next = new Date(draft)
        next.setFullYear(y, m, cell.num)
        commit(next)
    }

    const pickHour = (h) => {
        const next = new Date(draft)
        next.setHours(h)
        commit(next)
    }

    const pickMinute = (mn) => {
        const next = new Date(draft)
        next.setMinutes(mn)
        commit(next)
    }

    return (
        <div className="relative" ref={wrapRef}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#6b38d4] transition-all bg-white ${hasError ? 'border-[#ba1a1a]' : 'border-[#c6c6cd]'}`}
            >
                <span className="truncate">{formatDateForDisplay(draft)}</span>
                <span className="material-symbols-outlined text-[16px] text-[#45464d] shrink-0 ml-2">calendar_month</span>
            </button>

            {open && (
                <div className="absolute z-20 mt-2 left-0 bg-white rounded-xl shadow-xl border border-[#c6c6cd]/40 p-3 w-[320px] flex flex-col gap-3">
                    {/* Header lịch */}
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

                    {/* Lưới ngày */}
                    <div className="grid grid-cols-7 text-center">
                        {PICKER_WEEKDAYS.map(d => (
                            <div key={d} className="text-[10px] font-semibold text-[#45464d]/60 py-1">{d}</div>
                        ))}
                        {grid.map((cell, i) => {
                            const isSelected =
                                !cell.dim &&
                                cell.num === draft.getDate() &&
                                viewMonth === draft.getMonth() &&
                                viewYear === draft.getFullYear()
                            return (
                                <button
                                    type="button"
                                    key={i}
                                    onClick={() => pickDay(cell)}
                                    className={`text-[12px] py-1.5 rounded-full transition-colors
                                        ${cell.dim ? 'text-[#45464d]/30 hover:bg-[#f0f0f5]' : 'text-[#0b1c30] hover:bg-[#e5eeff]'}
                                        ${isSelected ? 'bg-[#8455ef] text-white font-bold hover:bg-[#6b38d4]' : ''}`}
                                >
                                    {cell.num}
                                </button>
                            )
                        })}
                    </div>

                    <div className="h-px bg-[#c6c6cd]/30" />

                    {/* Giờ / Phút — 24h, 0-23 chuẩn */}
                    <div>
                        <p className="text-[11px] font-semibold text-[#45464d] mb-1.5">Giờ (24h)</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div ref={hourListRef} className="h-[140px] overflow-y-auto border border-[#c6c6cd]/40 rounded-lg flex flex-col">
                                {Array.from({ length: 24 }, (_, h) => h).map(h => {
                                    const active = h === draft.getHours()
                                    return (
                                        <button
                                            type="button"
                                            key={h}
                                            data-active={active}
                                            onClick={() => pickHour(h)}
                                            className={`text-[13px] py-1.5 text-center transition-colors ${active ? 'bg-[#8455ef] text-white font-bold' : 'text-[#0b1c30] hover:bg-[#eff4ff]'}`}
                                        >
                                            {String(h).padStart(2, '0')}
                                        </button>
                                    )
                                })}
                            </div>
                            <div ref={minuteListRef} className="h-[140px] overflow-y-auto border border-[#c6c6cd]/40 rounded-lg flex flex-col">
                                {minuteOptions.map(mn => {
                                    const active = mn === draft.getMinutes()
                                    return (
                                        <button
                                            type="button"
                                            key={mn}
                                            data-active={active}
                                            onClick={() => pickMinute(mn)}
                                            className={`text-[13px] py-1.5 text-center transition-colors ${active ? 'bg-[#8455ef] text-white font-bold' : 'text-[#0b1c30] hover:bg-[#eff4ff]'}`}
                                        >
                                            {String(mn).padStart(2, '0')}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                        <button
                            type="button"
                            onClick={() => commit(new Date())}
                            className="text-[12px] font-medium text-[#6b38d4] hover:underline"
                        >
                            Hôm nay, bây giờ
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[#8455ef] text-white hover:bg-[#6b38d4] transition-colors"
                        >
                            Xong
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Event Modal ─────────────────────────────────────────────────────────────

function EventModal({ mode, initialData, onClose, onSave, onDelete, saving }) {
    const [form, setForm] = useState(initialData)
    const [errors, setErrors] = useState({})

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

    const validate = () => {
        const e = {}
        if (!form.title.trim()) e.title = 'Tiêu đề không được để trống'
        if (!form.startTime) e.startTime = 'Chọn thời gian bắt đầu'
        if (!form.endTime) e.endTime = 'Chọn thời gian kết thúc'
        if (form.startTime && form.endTime && new Date(form.startTime) >= new Date(form.endTime))
            e.endTime = 'Thời gian kết thúc phải sau bắt đầu'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSubmit = () => {
        if (!validate()) return
        onSave(form)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#c6c6cd]/30 bg-[#f8f9ff]">
                    <h2 className="text-[18px] font-bold text-[#0b1c30]">
                        {mode === 'create' ? 'Thêm sự kiện' : 'Chỉnh sửa sự kiện'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e5eeff] text-[#45464d] transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                <div className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="block text-[13px] font-semibold text-[#0b1c30] mb-1">
                            Tiêu đề <span className="text-[#ba1a1a]">*</span>
                        </label>
                        <input
                            className={`w-full border rounded-lg px-3 py-2 text-[14px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#6b38d4] transition-all ${errors.title ? 'border-[#ba1a1a]' : 'border-[#c6c6cd]'}`}
                            placeholder="Tên sự kiện"
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                        />
                        {errors.title && <p className="text-[11px] text-[#ba1a1a] mt-1">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-[#0b1c30] mb-1">Mô tả</label>
                        <textarea
                            className="w-full border border-[#c6c6cd] rounded-lg px-3 py-2 text-[14px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#6b38d4] resize-none transition-all"
                            placeholder="Ghi chú thêm..."
                            rows={2}
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-[#0b1c30] mb-1">Địa điểm</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[#45464d]">location_on</span>
                            <input
                                className="w-full border border-[#c6c6cd] rounded-lg pl-9 pr-3 py-2 text-[14px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#6b38d4] transition-all"
                                placeholder="Phòng họp, Google Meet..."
                                value={form.location}
                                onChange={e => set('location', e.target.value)}
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div
                            className={`w-10 h-6 rounded-full transition-colors relative ${form.isAllDay ? 'bg-[#8455ef]' : 'bg-[#c6c6cd]'}`}
                            onClick={() => set('isAllDay', !form.isAllDay)}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isAllDay ? 'left-5' : 'left-1'}`} />
                        </div>
                        <span className="text-[13px] font-medium text-[#0b1c30]">Cả ngày</span>
                    </label>

                    {!form.isAllDay && (
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="block text-[13px] font-semibold text-[#0b1c30] mb-1">
                                    Bắt đầu <span className="text-[#ba1a1a]">*</span>
                                </label>
                                <DateTimePicker
                                    value={form.startTime}
                                    onChange={(v) => set('startTime', v)}
                                    hasError={!!errors.startTime}
                                />
                                {errors.startTime && <p className="text-[11px] text-[#ba1a1a] mt-1">{errors.startTime}</p>}
                            </div>
                            <div>
                                <label className="block text-[13px] font-semibold text-[#0b1c30] mb-1">
                                    Kết thúc <span className="text-[#ba1a1a]">*</span>
                                </label>
                                <DateTimePicker
                                    value={form.endTime}
                                    onChange={(v) => set('endTime', v)}
                                    hasError={!!errors.endTime}
                                />
                                {errors.endTime && <p className="text-[11px] text-[#ba1a1a] mt-1">{errors.endTime}</p>}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-[13px] font-semibold text-[#0b1c30] mb-2">Mức độ ưu tiên</label>
                        <div className="flex gap-2">
                            {EVENT_STYLES.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => set('styleIndex', i)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${s.style} ${form.styleIndex === i ? 'ring-2 ring-offset-1 ring-[#6b38d4]' : ''}`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t border-[#c6c6cd]/30 bg-[#f8f9ff]">
                    {mode === 'edit' ? (
                        <button
                            onClick={onDelete}
                            disabled={saving}
                            className="flex items-center gap-1 text-[#ba1a1a] text-[13px] font-medium hover:bg-[#ffdad6] px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Xóa
                        </button>
                    ) : <div />}
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-[13px] font-medium text-[#45464d] hover:bg-[#e5eeff] transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-4 py-2 rounded-lg text-[13px] font-medium bg-[#8455ef] text-white hover:bg-[#6b38d4] transition-colors disabled:opacity-60 flex items-center gap-1 shadow-sm"
                        >
                            {saving && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                            {mode === 'create' ? 'Thêm' : 'Lưu'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ title, onCancel, onConfirm, saving }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#ffdad6] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#ba1a1a] text-[24px]">delete</span>
                    </div>
                    <h3 className="text-[16px] font-bold text-[#0b1c30]">Xóa sự kiện?</h3>
                    <p className="text-[13px] text-[#45464d]">
                        "<strong>{title}</strong>" sẽ bị xóa vĩnh viễn.
                    </p>
                </div>
                <div className="flex gap-2 mt-5">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2 rounded-lg text-[13px] font-medium text-[#45464d] border border-[#c6c6cd] hover:bg-[#e5eeff] transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={saving}
                        className="flex-1 py-2 rounded-lg text-[13px] font-medium bg-[#ba1a1a] text-white hover:bg-[#93000a] transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                    >
                        {saving && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }) {
    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-[13px] font-medium transition-all
            ${type === 'success' ? 'bg-[#0b1c30] text-white' : 'bg-[#ffdad6] text-[#93000a]'}`}>
            <span className="material-symbols-outlined text-[16px]">
                {type === 'success' ? 'check_circle' : 'error'}
            </span>
            {message}
        </div>
    )
}

// ─── Main Calendar ────────────────────────────────────────────────────────────

export default function Calendar() {
    const today = new Date()
    const [currentYear, setCurrentYear] = useState(today.getFullYear())
    const [currentMonth, setCurrentMonth] = useState(today.getMonth())

    const [eventsState, dispatch] = useReducer((state, action) => {
        switch (action.type) {
            case 'LOADING': return { ...state, loading: true, error: null }
            case 'LOADED': return { loading: false, error: null, data: action.data }
            case 'ERROR': return { ...state, loading: false, error: action.error }
            default: return state
        }
    }, { loading: false, error: null, data: [] })

    const events = eventsState.data
    const loading = eventsState.loading

    // priority được lưu trong DB qua field `priority` của event

    const [modal, setModal] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

    // ── AI Scheduling state ─────────────────────────────────────────────────
    const [suggestions, setSuggestions] = useState([])        // tổng hợp Calendar + Task gần tới ngày nhất
    const [aiRecommendations, setAiRecommendations] = useState([]) // AI tự gợi ý (nghỉ ngơi, chuẩn bị họp, tập thể dục...)
    const [suggestionsLoading, setSuggestionsLoading] = useState(false)

    // ── Toast helper ───────────────────────────────────────────────────────
    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 2500)
    }

    const showToastRef = useRef(showToast)
    useEffect(() => { showToastRef.current = showToast })

    // ── Fetch events (auto, on month change) ───────────────────────────────
    useEffect(() => {
        let cancelled = false
        dispatch({ type: 'LOADING' })
        getCalendarEvents(currentYear, currentMonth + 1)
            .then(data => { if (!cancelled) dispatch({ type: 'LOADED', data }) })
            .catch(() => {
                if (!cancelled) {
                    dispatch({ type: 'ERROR', error: 'load_failed' })
                    showToastRef.current('Không tải được sự kiện', 'error')
                }
            })
        return () => { cancelled = true }
    }, [currentYear, currentMonth])

    const fetchEvents = async () => {
        dispatch({ type: 'LOADING' })
        try {
            const data = await getCalendarEvents(currentYear, currentMonth + 1)
            dispatch({ type: 'LOADED', data })
        } catch {
            dispatch({ type: 'ERROR', error: 'load_failed' })
            showToast('Không tải được sự kiện', 'error')
        }
    }

    // ── Lấy gợi ý AI (tự động đọc Calendar + Task có sẵn) ────────────────────
    const fetchAiSuggestions = async () => {
        setSuggestionsLoading(true)
        try {
            const data = await getAiSuggestions()
            // Luôn ép về array, bất kể backend trả về cấu trúc gì,
            // để không bao giờ bị crash trắng màn hình do .map() trên non-array.
            let nextSuggestions = []
            let nextRecommendations = []

            if (Array.isArray(data)) {
                nextSuggestions = data
            } else if (data && typeof data === 'object') {
                nextSuggestions = Array.isArray(data.suggestions) ? data.suggestions : []
                nextRecommendations = Array.isArray(data.aiRecommendations) ? data.aiRecommendations : []
                if (data.warning) showToast(data.warning, 'error')
            }

            setSuggestions(nextSuggestions)
            setAiRecommendations(nextRecommendations)
        } catch {
            showToastRef.current('Không tải được gợi ý AI', 'error')
        } finally {
            setSuggestionsLoading(false)
        }
    }

    // ── Navigation ─────────────────────────────────────────────────────────
    const prevMonth = () => {
        if (currentMonth === 0) { setCurrentYear(y => y - 1); setCurrentMonth(11) }
        else setCurrentMonth(m => m - 1)
    }
    const nextMonth = () => {
        if (currentMonth === 11) { setCurrentYear(y => y + 1); setCurrentMonth(0) }
        else setCurrentMonth(m => m + 1)
    }
    const goToday = () => {
        setCurrentYear(today.getFullYear())
        setCurrentMonth(today.getMonth())
    }

    // ── Open modal ─────────────────────────────────────────────────────────
    const openCreate = (cell) => {
        const dateStr = new Date(cell.year, cell.month < 0 ? currentMonth - 1 : cell.month > 11 ? currentMonth + 1 : cell.month, cell.num)
        const start = toLocalInput(dateStr)
        const end = toLocalInput(new Date(dateStr.getTime() + 60 * 60 * 1000))
        setModal({
            mode: 'create',
            data: { ...EMPTY_FORM, startTime: start, endTime: end },
        })
    }

    const openEdit = (ev, e) => {
        e.stopPropagation()
        setModal({
            mode: 'edit',
            data: {
                id: ev.id,
                title: ev.title,
                description: ev.description || '',
                location: ev.location || '',
                startTime: toLocalInput(ev.startTime),
                endTime: toLocalInput(ev.endTime),
                isAllDay: ev.isAllDay,
                styleIndex: ev.priority ?? 0,
            },
        })
    }

    // ── CRUD handlers ──────────────────────────────────────────────────────
    const handleSave = async (form) => {
        setSaving(true)
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || null,
                location: form.location.trim() || null,
                startTime: inputToISO(form.startTime),
                endTime: inputToISO(form.endTime),
                isAllDay: form.isAllDay,
                priority: form.styleIndex, // 0=Urgent, 1=Normal, 2=Low — lưu vào DB
                source: 'manual',
            }

            if (modal.mode === 'create') {
                await createCalendarEvent(payload)
                showToast('Đã thêm sự kiện')
            } else {
                await updateCalendarEvent(form.id, payload)
                showToast('Đã cập nhật sự kiện')
            }

            setModal(null)
            await fetchEvents()
        } catch (e) {
            showToast(e.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteConfirm = async () => {
        setSaving(true)
        try {
            await deleteCalendarEvent(deleteTarget.id)
            // priority đã được xóa cùng event trong DB, không cần dọn gì thêm ở FE
            setDeleteTarget(null)
            setModal(null)
            showToast('Đã xóa sự kiện')
            await fetchEvents()
        } catch (e) {
            showToast(e.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    // ── AI Scheduling: chỉ hiển thị gợi ý, không tạo/sửa event từ đây ────────
    const dismissSuggestion = (id) => {
        setSuggestions(prev => prev.filter(x => x.id !== id))
    }

    // ── Map events → by day key ────────────────────────────────────────────
    const eventsByDay = {}
    events.forEach(ev => {
        const d = new Date(ev.startTime)
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        if (!eventsByDay[key]) eventsByDay[key] = []
        eventsByDay[key].push(ev)
    })

    const grid = buildGrid(currentYear, currentMonth)

    return (
        <div className="flex h-screen overflow-hidden antialiased" style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f8f9ff', color: '#0b1c30' }}>
            <Sidebar />

            <div className="ml-[280px] flex-1 flex flex-col min-w-0">
                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 flex gap-6 bg-[#f8f9ff]">
                    {/* Calendar Grid */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-[#c6c6cd]/40 shadow-sm overflow-hidden min-h-0">
                        {/* Toolbar */}
                        <div className="px-6 py-4 border-b border-[#c6c6cd]/30 flex items-center justify-between bg-[#f8f9ff]">
                            <div className="flex items-center gap-3">
                                <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#e5eeff] text-[#45464d] transition-colors">
                                    <span className="material-symbols-outlined text-base">chevron_left</span>
                                </button>

                                <h2 className="text-[32px] font-semibold leading-tight tracking-tight text-[#000000] min-w-[220px] text-center">
                                    {MONTH_NAMES[currentMonth]} {currentYear}
                                </h2>

                                <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#e5eeff] text-[#45464d] transition-colors">
                                    <span className="material-symbols-outlined text-base">chevron_right</span>
                                </button>

                                <button onClick={goToday} className="ml-2 px-3 h-8 flex items-center justify-center rounded-md bg-[#e5eeff] hover:bg-[#d3e4fe] text-[13px] font-medium text-[#45464d] transition-colors">
                                    Hôm nay
                                </button>

                                {loading && <span className="material-symbols-outlined animate-spin text-[#6b38d4] text-[20px] ml-1">progress_activity</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setModal({ mode: 'create', data: { ...EMPTY_FORM } })}
                                    className="ml-2 bg-[#000000] text-white px-4 py-1.5 rounded-lg text-[14px] font-medium flex items-center gap-1 hover:bg-[#565e74] transition-colors shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span> Event
                                </button>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="flex-1 flex flex-col bg-[#c6c6cd]/20 overflow-y-auto min-h-0">
                            <div className="grid grid-cols-7 gap-px bg-[#c6c6cd]/20 border-b border-[#c6c6cd]/20">
                                {WEEKDAYS.map(d => (
                                    <div key={d} className="bg-[#f8f9ff] py-2 text-center text-[#45464d]/70 uppercase text-[11px] tracking-wider font-medium">{d}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-px bg-[#c6c6cd]/20 text-sm">
                                {grid.map((cell, i) => {
                                    const isToday =
                                        !cell.dim &&
                                        cell.num === today.getDate() &&
                                        currentMonth === today.getMonth() &&
                                        currentYear === today.getFullYear()

                                    const key = `${cell.year}-${cell.month}-${cell.num}`
                                    const dayEvents = eventsByDay[key] || []

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => openCreate(cell)}
                                            className={`p-2 min-h-[100px] flex flex-col group hover:bg-[#eff4ff] transition-colors relative cursor-pointer ${isToday ? 'bg-[#eff4ff]' : 'bg-white'}`}
                                        >
                                            {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-[#8455ef]" />}
                                            <div className="flex items-center justify-between mb-2 mt-1">
                                                {isToday ? (
                                                    <span className="w-6 h-6 flex items-center justify-center bg-[#8455ef] text-white rounded-full font-bold text-sm shadow-sm">{cell.num}</span>
                                                ) : (
                                                    <span className={cell.dim ? 'text-[#45464d]/30 mb-1' : 'text-[#45464d] mb-1'}>{cell.num}</span>
                                                )}
                                            </div>

                                            {dayEvents.map((ev, j) => {
                                                const priority = EVENT_STYLES[ev.priority ?? 0] || EVENT_STYLES[0]
                                                return (
                                                    <div
                                                        key={j}
                                                        onClick={(e) => openEdit(ev, e)}
                                                        className={`px-2 py-1 rounded text-xs font-medium truncate mb-1 cursor-pointer transition-colors flex items-center gap-1 ${priority.style}`}
                                                        title={ev.title}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priority.dot}`} />
                                                        <span className="truncate">{ev.title}</span>
                                                    </div>
                                                )
                                            })}

                                            {dayEvents.length === 0 && (
                                                <div className="opacity-0 group-hover:opacity-100 mt-auto flex items-center gap-1 text-[#8455ef] text-[11px] transition-opacity">
                                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                                    <span>Thêm</span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="w-[340px] flex flex-col gap-4 shrink-0">
                        {/* AI Scheduling — nối Groq thật, chỉ hiện ở trang Lịch */}
                        <div className="bg-white rounded-xl border border-[#c6c6cd]/40 shadow-sm overflow-hidden flex flex-col">
                            <div className="px-4 py-2 border-b border-[#c6c6cd]/20 bg-[#6b38d4]/5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[#6b38d4]">
                                    <span className="material-symbols-outlined text-[20px] animate-pulse">auto_awesome</span>
                                    <h3 className="text-[16px] font-semibold tracking-tight">AI Scheduling</h3>
                                </div>
                                {suggestionsLoading ? (
                                    <span className="material-symbols-outlined animate-spin text-[#8455ef] text-[18px]">progress_activity</span>
                                ) : (
                                    <span className="bg-[#8455ef] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {(Array.isArray(suggestions) ? suggestions.length : 0)} Pending
                                    </span>
                                )}
                            </div>
                            <div className="p-4 flex flex-col gap-2 overflow-y-auto h-screen">
                                <button
                                    onClick={fetchAiSuggestions}
                                    disabled={suggestionsLoading}
                                    className="w-full bg-[#6b38d4] text-white text-[13px] font-medium py-2 rounded-lg hover:bg-[#5516be] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm mb-2"
                                >
                                    {suggestionsLoading
                                        ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                        : <span className="material-symbols-outlined text-[16px]">auto_awesome</span>}
                                    Phân tích bằng AI
                                </button>

                                {/* Thông báo 1: tổng hợp Calendar + Task gần tới ngày nhất */}
                                <p className="text-sm text-[#45464d] mb-2">Tôi đã tổng hợp lịch và công việc gần tới ngày nhất của bạn:</p>

                                {!suggestionsLoading && (!Array.isArray(suggestions) || suggestions.length === 0) && (
                                    <p className="text-[13px] text-[#45464d]/60 italic py-4 text-center">
                                        Không có sự kiện hoặc công việc nào sắp tới.
                                    </p>
                                )}

                                {(Array.isArray(suggestions) ? suggestions : []).map((s) => {
                                    const src = SOURCE_ICON[s.sourceType] || SOURCE_ICON.email

                                    // Phân loại: lấy từ dữ liệu có sẵn hay AI tự đề xuất
                                    const isFromData = ['task', 'calendar'].includes(s.sourceType)
                                    const sourceLabel = {
                                        task: 'Từ Task',
                                        calendar: 'Từ Lịch',
                                        email: 'Từ Email',
                                        voice: 'Từ Ghi âm',
                                        manual: 'AI gợi ý',
                                    }[s.sourceType] || 'AI gợi ý'

                                    return (
                                        <div key={s.id} className={`rounded-lg p-2 border relative group ${isFromData ? 'bg-[#f0fdf4] border-green-200' : 'bg-[#eff4ff] border-[#c6c6cd]/30'}`}>
                                            {/* Badge nguồn gốc */}
                                            <div className="flex items-center justify-between mb-2 pr-6">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isFromData
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-[#8455ef]/10 text-[#6b38d4]'
                                                    }`}>
                                                    <span className="material-symbols-outlined text-[11px]">
                                                        {isFromData ? 'link' : 'auto_awesome'}
                                                    </span>
                                                    {sourceLabel}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => dismissSuggestion(s.id)}
                                                className="absolute top-2 right-2 text-[#45464d]/50 hover:text-[#000000] cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>

                                            <div className="flex items-start gap-3 mb-2">
                                                <div className={`w-8 h-8 rounded-full ${src.iconBg} flex items-center justify-center shrink-0`}>
                                                    <span className={`material-symbols-outlined ${src.iconColor} text-[16px]`}>{src.icon}</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-[#0b1c30]">{s.title}</h4>
                                                    {s.description && (
                                                        <p className="text-[12px] text-[#45464d]/80 line-clamp-2 mt-0.5">"{s.description}"</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-3 bg-white p-2 rounded border border-[#c6c6cd]/20">
                                                <span className="material-symbols-outlined text-sm text-[#45464d]">schedule</span>
                                                <span className="text-[12px] font-medium text-[#0b1c30]">
                                                    {formatSuggestedTime(s.startTime, s.endTime)}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* Thông báo 2: AI gợi ý theo prompt (nghỉ ngơi, chuẩn bị họp, tập thể dục...) */}
                                {Array.isArray(aiRecommendations) && aiRecommendations.length > 0 && (
                                    <>
                                        <p className="text-sm text-[#45464d] mt-4 mb-2">AI gợi ý cho bạn:</p>
                                        {aiRecommendations.map((rec, i) => (
                                            <div key={i} className="bg-[#f3eaff] rounded-lg p-3 border border-[#8455ef]/20 flex items-start gap-2">
                                                <span className="material-symbols-outlined text-[#6b38d4] text-[16px] mt-0.5">tips_and_updates</span>
                                                <p className="text-[13px] text-[#0b1c30] leading-relaxed">
                                                    {typeof rec === 'string' ? rec : rec.content || rec.title}
                                                </p>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modals */}
            {modal && (
                <EventModal
                    mode={modal.mode}
                    initialData={modal.data}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                    onDelete={() => setDeleteTarget(modal.data)}
                    saving={saving}
                />
            )}

            {deleteTarget && (
                <DeleteConfirm
                    title={deleteTarget.title}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteConfirm}
                    saving={saving}
                />
            )}

            {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
    )
}