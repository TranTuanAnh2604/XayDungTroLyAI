import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getSessions, deleteSession } from '../services/chatService'
import NotificationBell from './NotificationBell'

export default function Sidebar({ onNewChat, currentSessionId, onSelectSession }) {
    const navigate = useNavigate()
    const location = useLocation()
    const [sessions, setSessions] = useState([])
    const [loadingSessions, setLoadingSessions] = useState(false)

    const fetchSessions = async () => {
        setLoadingSessions(true)
        try {
            const res = await getSessions()
            setSessions(res.data || [])
        } catch (e) {
            console.error('Không tải được sessions', e)
        } finally {
            setLoadingSessions(false)
        }
    }

    useEffect(() => {
        if (location.pathname !== '/chat') return
        let isMounted = true
        const load = async () => {
            setLoadingSessions(true)
            try {
                const res = await getSessions()
                if (isMounted) setSessions(
                    (res.data || []).filter(s => s.messageCount > 0 || s.lastMessage || s.title)
                )
            } catch (e) {
                console.error('Không tải được sessions', e)
            } finally {
                if (isMounted) setLoadingSessions(false)
            }
        }
        load()
        return () => { isMounted = false }
    }, [location.pathname, currentSessionId])

    const handleNewChatClick = async () => {
        if (location.pathname === '/chat' && onNewChat) {
            await onNewChat()
            fetchSessions()
        } else {
            navigate('/chat')
        }
    }

    const handleSelectSession = (sessionId) => {
        if (onSelectSession) onSelectSession(sessionId)
    }

    const handleDeleteSession = async (e, sessionId) => {
        e.stopPropagation()
        try {
            await deleteSession(sessionId)
            setSessions(prev => prev.filter(s => s.id !== sessionId))
        } catch (err) {
            console.error('Xóa session thất bại', err)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('userName')
        localStorage.removeItem('googleAccessToken')
        navigate('/login')
    }

    const navItems = [
        { icon: "dashboard", label: "Dashboard", path: "/dashboard" },
        { icon: "chat", label: "Chat", path: "/chat" },
        { icon: "assignment", label: "Tasks", path: "/tasks" },
        { icon: "calendar_today", label: "Calendar", path: "/calendar" },
        { icon: "email", label: "Gmail", path: "/gmail" },
        { icon: "mic", label: "Voice", path: "/voice" },
        { icon: "notifications", label: "Reminders", path: "/reminders" },
    ]

    const footerItems = [
        { icon: "settings", label: "Settings", path: "/settings" },
    ]

    const formatTime = (dateStr) => {
        if (!dateStr) return ''
        const normalized = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
        const date = new Date(normalized)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / (1000 * 60))
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        if (diffMins < 1) return 'Vừa xong'
        if (diffMins < 60) return `${diffMins} phút trước`
        if (diffHours < 24) return `${diffHours} giờ trước`
        if (diffDays < 7) return `${diffDays} ngày trước`
        return date.toLocaleDateString('vi-VN')
    }

    return (
        <nav className="hidden md:flex w-[280px] h-full flex-col bg-[#eff4ff] border-r border-[#c6c6cd] fixed left-0 top-0 bottom-0 z-40">
            {/* Header */}
            <div className="p-[24px] flex items-center gap-[16px]">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm"
                    style={{ background: "linear-gradient(135deg, #000000 0%, #6b38d4 100%)" }}
                >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>robot_2</span>
                </div>
                <div className="flex-1">
                    <h1 className="text-[24px] font-bold leading-[1.3] text-[#000000]">AI Assistant</h1>
                    <p className="text-[14px] leading-[1.4] tracking-[0.01em] font-medium text-[#45464d]">Enterprise Edition</p>
                </div>
                {/* 🔔 NotificationBell ở header sidebar */}
                <NotificationBell />
            </div>

            {/* New Chat Button */}
            <div className="px-[16px] mb-[16px]">
                <button
                    onClick={handleNewChatClick}
                    className="w-full flex items-center justify-center gap-[8px] bg-[#000000] text-white rounded-lg py-[8px] text-[14px] font-medium tracking-[0.01em] hover:bg-[#565e74] active:scale-95 transition-transform"
                >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
                    New Chat
                </button>
            </div>

            {/* Nav Items */}
            <div className="px-[16px] flex flex-col gap-[4px] flex-1 overflow-y-auto min-h-0">
                {navItems.map(({ icon, label, path }) => {
                    const active = location.pathname === path
                    return (
                        <>
                            <button
                                key={label}
                                onClick={() => navigate(path)}
                                className={`flex items-center gap-[8px] px-[8px] py-[8px] rounded-lg text-[14px] font-medium transition-colors duration-200 w-full text-left ${active ? "bg-[#8455ef] text-white" : "text-[#45464d] hover:bg-[#d3e4fe]"}`}
                            >
                                <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                    {icon}
                                </span>
                                {label}
                            </button>

                            {path === '/chat' && location.pathname === '/chat' && (
                                <div className="ml-[8px] flex flex-col gap-[2px] mt-[2px] max-h-[35vh] overflow-y-auto">
                                    {loadingSessions ? (
                                        <div className="flex justify-center py-2">
                                            <span className="material-symbols-outlined animate-spin text-[#6b38d4] text-[18px]">progress_activity</span>
                                        </div>
                                    ) : sessions.length === 0 ? (
                                        <p className="text-[12px] text-[#76777d] px-[8px] py-[4px]">Chưa có hội thoại nào</p>
                                    ) : (
                                        sessions.map((session) => {
                                            const isActive = session.id === currentSessionId
                                            return (
                                                <div
                                                    key={session.id}
                                                    onClick={() => handleSelectSession(session.id)}
                                                    className={`group flex items-center justify-between gap-[8px] px-[10px] py-[7px] rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-[#8455ef]/20 text-[#6b38d4]' : 'text-[#45464d] hover:bg-[#d3e4fe]'}`}
                                                >
                                                    <div className="flex items-center gap-[8px] min-w-0">
                                                        <span className={`material-symbols-outlined text-[15px] flex-shrink-0 ${isActive ? 'text-[#6b38d4]' : 'text-[#76777d]'}`}>
                                                            chat_bubble
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="text-[12px] font-medium truncate">
                                                                {session.title || session.name || `Hội thoại ${session.id.slice(0, 6)}`}
                                                            </p>
                                                            <p className="text-[11px] text-[#76777d] truncate">
                                                                {formatTime(session.lastActivity || session.updatedAt || session.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleDeleteSession(e, session.id)}
                                                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-[2px] rounded hover:bg-black/10 text-[#45464d]"
                                                        title="Xóa"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">delete</span>
                                                    </button>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            )}
                        </>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="p-[16px] mt-auto border-t border-[#c6c6cd]/30 flex flex-col gap-[4px]">
                {footerItems.map(({ icon, label, path }) => {
                    const active = location.pathname === path
                    return (
                        <button
                            key={label}
                            onClick={() => navigate(path)}
                            className={`flex items-center gap-[16px] px-[16px] py-[8px] rounded-lg text-[14px] font-medium transition-colors duration-200 w-full text-left ${active ? "bg-[#8455ef] text-white" : "text-[#45464d] hover:bg-[#dce9ff]"}`}
                        >
                            <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                {icon}
                            </span>
                            {label}
                        </button>
                    )
                })}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-[16px] px-[16px] py-[8px] rounded-lg text-[14px] font-medium transition-colors duration-200 w-full text-left text-[#ba1a1a] hover:bg-[#ffdad6]"
                >
                    <span className="material-symbols-outlined">logout</span>
                    Đăng xuất
                </button>
            </div>
        </nav>
    )
}
