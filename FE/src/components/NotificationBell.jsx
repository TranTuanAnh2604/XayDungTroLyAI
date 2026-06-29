import { useState, useEffect, useRef } from 'react'
import { getNotifications, deleteNotification, markNotificationSent } from '../services/notificationService'
import { useNavigate } from 'react-router-dom'

export default function NotificationBell() {
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef(null)
    const navigate = useNavigate()

    // Đóng khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Fetch khi mở dropdown
    useEffect(() => {
        if (open) fetchNotifications()
    }, [open])

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const data = await getNotifications()
            setNotifications(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkSent = async (id, e) => {
        e.stopPropagation()
        try {
            await markNotificationSent(id)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'sent' } : n))
        } catch (e) { }
    }

    const handleDelete = async (id, e) => {
        e.stopPropagation()
        try {
            await deleteNotification(id)
            setNotifications(prev => prev.filter(n => n.id !== id))
        } catch (e) { }
    }

    const pendingCount = notifications.filter(n => n.status === 'pending').length

    const formatTime = (isoStr) => {
        const d = new Date(isoStr)
        const now = new Date()
        const diffMs = now - d
        const diffMin = Math.floor(diffMs / 60000)
        const diffHour = Math.floor(diffMs / 3600000)
        const diffDay = Math.floor(diffMs / 86400000)

        if (diffMs < 0) {
            // Tương lai
            const absDiffMin = Math.abs(diffMin)
            const absDiffHour = Math.abs(diffHour)
            if (absDiffMin < 60) return `sau ${absDiffMin} phút`
            if (absDiffHour < 24) return `sau ${absDiffHour} giờ`
            return d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        }
        if (diffMin < 1) return 'Vừa xong'
        if (diffMin < 60) return `${diffMin} phút trước`
        if (diffHour < 24) return `${diffHour} giờ trước`
        if (diffDay < 7) return `${diffDay} ngày trước`
        return d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    }

    const isOverdue = (n) => new Date(n.scheduledAt) < new Date() && n.status === 'pending'

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Nút chuông */}
            <button
                onClick={() => setOpen(v => !v)}
                className="relative text-[#45464d] hover:text-[#000000] transition-colors p-[4px]"
            >
                <span className="material-symbols-outlined" style={open ? { fontVariationSettings: "'FILL' 1", color: '#6b38d4' } : {}}>
                    notifications
                </span>
                {/* Badge đỏ số lượng pending */}
                {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#ba1a1a] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-[3px]">
                        {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] w-[360px] bg-white rounded-2xl shadow-2xl border border-[#e0e0e0] z-50 overflow-hidden"
                    style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>

                    {/* Header */}
                    <div className="flex items-center justify-between px-[16px] py-[12px] border-b border-[#f0f0f0]">
                        <h3 className="text-[18px] font-bold text-[#000000]">Thông báo</h3>
                        <button
                            onClick={() => { setOpen(false); navigate('/reminders') }}
                            className="text-[13px] text-[#6b38d4] font-medium hover:underline"
                        >
                            Xem tất cả
                        </button>
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-[32px]">
                                <div className="w-6 h-6 border-3 border-[#6b38d4] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-[40px] gap-[8px]">
                                <span className="material-symbols-outlined text-[40px] text-[#c6c6cd]">notifications_off</span>
                                <p className="text-[14px] text-[#45464d]">Không có thông báo nào</p>
                            </div>
                        ) : (
                            <div>
                                {/* Pending trước */}
                                {notifications.filter(n => n.status === 'pending').length > 0 && (
                                    <div>
                                        <p className="px-[16px] py-[8px] text-[12px] font-bold text-[#45464d] uppercase tracking-wider bg-[#f8f9ff]">
                                            Chưa đọc
                                        </p>
                                        {notifications.filter(n => n.status === 'pending').map(n => (
                                            <NotifItem key={n.id} n={n} isOverdue={isOverdue(n)}
                                                formatTime={formatTime}
                                                onMarkSent={handleMarkSent}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                )}
                                {/* Sent sau */}
                                {notifications.filter(n => n.status === 'sent').length > 0 && (
                                    <div>
                                        <p className="px-[16px] py-[8px] text-[12px] font-bold text-[#45464d] uppercase tracking-wider bg-[#f8f9ff]">
                                            Đã đọc
                                        </p>
                                        {notifications.filter(n => n.status === 'sent').map(n => (
                                            <NotifItem key={n.id} n={n} isOverdue={false}
                                                formatTime={formatTime}
                                                onMarkSent={handleMarkSent}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-[16px] py-[10px] border-t border-[#f0f0f0] text-center">
                            <button
                                onClick={() => { setOpen(false); navigate('/reminders') }}
                                className="text-[13px] text-[#6b38d4] font-medium hover:underline"
                            >
                                Quản lý nhắc nhở
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function NotifItem({ n, isOverdue, formatTime, onMarkSent, onDelete }) {
    return (
        <div className={`flex items-start gap-[12px] px-[16px] py-[12px] hover:bg-[#f8f9ff] transition-colors group
            ${n.status === 'pending' ? 'bg-[#f0ebff]/40' : ''}`}>

            {/* Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                ${isOverdue ? 'bg-[#ffdad6]' : n.status === 'pending' ? 'bg-[#e9ddff]' : 'bg-[#f0f0f0]'}`}>
                <span className="material-symbols-outlined text-[18px]"
                    style={{
                        color: isOverdue ? '#ba1a1a' : n.status === 'pending' ? '#6b38d4' : '#45464d',
                        fontVariationSettings: n.status === 'pending' ? "'FILL' 1" : "'FILL' 0"
                    }}>
                    {isOverdue ? 'warning' : 'notifications'}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className={`text-[14px] leading-[1.4] ${n.status === 'pending' ? 'font-semibold text-[#000]' : 'text-[#45464d]'}`}>
                    {n.title}
                </p>
                {n.body && <p className="text-[13px] text-[#45464d] mt-[2px] line-clamp-1">{n.body}</p>}
                <p className={`text-[12px] mt-[4px] ${isOverdue ? 'text-[#ba1a1a] font-medium' : 'text-[#6b38d4]'}`}>
                    {isOverdue ? '⚠️ Quá hạn · ' : ''}{formatTime(n.scheduledAt)}
                </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-[4px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {n.status === 'pending' && (
                    <button onClick={(e) => onMarkSent(n.id, e)}
                        title="Đánh dấu đã đọc"
                        className="w-7 h-7 rounded-full bg-[#e9ddff] text-[#6b38d4] flex items-center justify-center hover:bg-[#d0bcff]">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                    </button>
                )}
                <button onClick={(e) => onDelete(n.id, e)}
                    title="Xoá"
                    className="w-7 h-7 rounded-full bg-[#f0f0f0] text-[#45464d] flex items-center justify-center hover:bg-[#ffdad6] hover:text-[#ba1a1a]">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
            </div>

            {/* Dot pending */}
            {n.status === 'pending' && (
                <div className="w-2 h-2 rounded-full bg-[#6b38d4] shrink-0 mt-[4px]"></div>
            )}
        </div>
    )
}
