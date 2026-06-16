import { useNavigate, useLocation } from 'react-router-dom'

export default function Sidebar() {
    const navigate = useNavigate()
    const location = useLocation()

    const navItems = [
        { icon: "dashboard", label: "Dashboard", path: "/dashboard" },
        { icon: "chat", label: "Chat", path: "/chat" },
        { icon: "assignment", label: "Tasks", path: "/tasks" },
        { icon: "calendar_today", label: "Calendar", path: "/calendar" },
        { icon: "email", label: "Email", path: "/email" },
        { icon: "mic", label: "Voice", path: "/voice" },
    ]

    const footerItems = [
        { icon: "settings", label: "Settings", path: "/settings" },
        { icon: "help", label: "Help", path: "/help" },
    ]

    return (
        <nav className="hidden md:flex w-[280px] h-full flex-col bg-[#eff4ff] border-r border-[#c6c6cd] fixed left-0 top-0 bottom-0 z-40">
            {/* Header */}
            <div className="p-[24px] flex items-center gap-[16px]">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm"
                    style={{ background: "linear-gradient(135deg, #000000 0%, #6b38d4 100%)" }}
                >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        robot_2
                    </span>
                </div>
                <div>
                    <h1 className="text-[24px] font-bold leading-[1.3] text-[#000000]">AI Assistant</h1>
                    <p className="text-[14px] leading-[1.4] tracking-[0.01em] font-medium text-[#45464d]">
                        Enterprise Edition
                    </p>
                </div>
            </div>

            {/* New Chat Button */}
            <div className="px-[16px] mb-[16px]">
                <button
                    onClick={() => navigate('/chat')}
                    className="w-full flex items-center justify-center gap-[8px] bg-[#000000] text-white rounded-lg py-[8px] text-[14px] font-medium tracking-[0.01em] hover:bg-[#565e74] active:scale-95 transition-transform"
                >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        add
                    </span>
                    New Chat
                </button>
            </div>

            {/* Nav Items */}
            <div className="flex-1 overflow-y-auto px-[16px] flex flex-col gap-[4px]">
                {navItems.map(({ icon, label, path }) => {
                    const active = location.pathname === path
                    return (
                        <button
                            key={label}
                            onClick={() => navigate(path)}
                            className={`flex items-center gap-[8px] px-[8px] py-[8px] rounded-lg text-[14px] font-medium transition-colors duration-200 w-full text-left ${active ? "bg-[#8455ef] text-white" : "text-[#45464d] hover:bg-[#d3e4fe]"
                                }`}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                            >
                                {icon}
                            </span>
                            {label}
                        </button>
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
                            className={`flex items-center gap-[16px] px-[16px] py-[8px] rounded-lg text-[14px] font-medium transition-colors duration-200 w-full text-left ${active ? "bg-[#8455ef] text-white" : "text-[#45464d] hover:bg-[#dce9ff]"
                                }`}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                            >
                                {icon}
                            </span>
                            {label}
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}