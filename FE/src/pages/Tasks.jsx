import { useNavigate, useLocation } from 'react-router-dom';

export default function Tasks() {
    const navigate = useNavigate();
    const location = useLocation();
    return (
        <div
            className="flex h-screen overflow-hidden"
            style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#f8f9ff", color: "#0b1c30" }}
        >
            {/* Sidebar */}
            <nav className="hidden md:flex w-[280px] h-full flex-col bg-[#eff4ff] border-r border-[#c6c6cd] fixed left-0 top-0 bottom-0 z-40">
                {/* Header */}
                <div className="p-[24px] flex items-center gap-[16px]">
                    <div className="w-10 h-10 rounded-full bg-[#8455ef] flex items-center justify-center text-white">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    </div>
                    <div>
                        <h1 className="text-[24px] font-bold leading-[1.3] text-[#000000]">AI Assistant</h1>
                        <p className="text-[14px] font-medium text-[#45464d]">Enterprise Edition</p>
                    </div>
                </div>

                {/* New Chat */}
                <div className="px-[16px] pb-[16px]">
                    <button onClick={() => navigate('/chat')} className="w-full flex items-center justify-center gap-[8px] py-[8px] px-[16px] bg-[#000000] text-white rounded-xl text-[14px] font-medium hover:bg-[#0b1c30] transition-colors shadow-sm">
                        <span className="material-symbols-outlined">add</span>
                        New Chat
                    </button>
                </div>

                {/* Nav Links */}
                <div className="flex-1 overflow-y-auto px-[16px] flex flex-col gap-[4px]">
                    {[
                        { icon: "dashboard", label: "Dashboard", path: "/dashboard" },
                        { icon: "chat", label: "Chat", path: "/chat" },
                        { icon: "assignment", label: "Tasks", path: "/tasks" },
                        { icon: "calendar_today", label: "Calendar", path: "/calendar" },
                        { icon: "email", label: "Email", path: "/email" },
                        { icon: "mic", label: "Voice", path: "/voice" },
                    ].map(({ icon, label, path }) => {
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
                <div className="p-[16px] border-t border-[#c6c6cd] flex flex-col gap-[4px]">
                    {[{ icon: "settings", label: "Settings" }, { icon: "help", label: "Help" }].map(({ icon, label }) => (
                        <a key={label} href="#" className="flex items-center gap-[16px] px-[16px] py-[8px] rounded-lg text-[14px] font-medium text-[#45464d] hover:bg-[#dce9ff] transition-colors duration-200">
                            <span className="material-symbols-outlined">{icon}</span>
                            <span>{label}</span>
                        </a>
                    ))}
                    {/* User */}
                    <div className="mt-[8px] pt-[8px] border-t border-[#c6c6cd] flex items-center gap-[8px]">
                        <img
                            alt="User Avatar"
                            className="w-8 h-8 rounded-full border border-[#c6c6cd] object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdvzeO1uV1avKtMdHxh7QwZw-Arqe4qclFBZY7tE1Rgf-RDjtwyiAikDnrNXGNwMgyyrf6FU66U3pPp1WxtoVvY8p_aQUiel17mkRSvSOyRagipgrVuZgNonIIw6j4MKYr4DR_-mUNV0v_qXDYgdBNs5mrxGqvpQ8moF2nOx1wVq7Ur1z9cgxrMpq7Qnf6wG4bzmflq1KjqZ2UCVJGCyKdXPJL_CcElQi3D_ZDO8nVgC-FfKeM57t9_DpO775PjmeVNongK4RtqkA"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium text-[#000000] truncate">Alex Mercer</p>
                            <p className="text-[12px] text-[#45464d] truncate">alex@enterprise.ai</p>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main */}
            <main className="flex-1 flex flex-col md:ml-[280px] w-full h-full relative">
                {/* TopBar */}
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

                    <div className="flex-1 max-w-md mx-[16px] hidden sm:block">
                        <div className="relative focus-within:ring-2 focus-within:ring-[#6b38d4] rounded-full bg-[#eff4ff] transition-all">
                            <span className="material-symbols-outlined absolute left-[8px] top-1/2 -translate-y-1/2 text-[#45464d]">search</span>
                            <input
                                className="w-full bg-transparent border-none pl-[40px] pr-[8px] py-[8px] rounded-full text-[16px] text-[#000000] placeholder:text-[#45464d] focus:outline-none"
                                placeholder="Search tasks, docs, or ask AI..."
                                type="text"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-[16px]">
                        <button className="text-[#45464d] hover:text-[#000000] transition-colors relative">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-0 right-0 w-2 h-2 bg-[#ba1a1a] rounded-full"></span>
                        </button>
                        <button className="hidden sm:block text-[#45464d] hover:text-[#000000] transition-colors">
                            <span className="material-symbols-outlined">history</span>
                        </button>
                        <img
                            alt="User Profile"
                            className="w-8 h-8 rounded-full border border-[#c6c6cd] md:hidden object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHr_SEQV9n4slEAtZZLJssPDq9IqIOdma2IsNxKnQ9ymMnf1sY1QAxK83UEBGLxRei2NITY1g5z9t1CmjzSiUyEwB4fWlR25Q0fbAknlyKkpUFZWlH_hqdBog9OEHnl54yxMGKinWeX94uePmNrQ22upH1ZHMzAiMnwyIqohi8TUH62qTGcK2sMYgQfnwm7hNFF6cxx9BcIy2RiqOWjlT_HpZg5QFjwPkav4VK6nRAIJ_3y7jzWZdQfS_UK4lhDDVKBHEdm0FNAOE"
                        />
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-[16px] md:p-[24px] flex flex-col gap-[24px] bg-[#f8f9ff]">
                    {/* Page Header */}
                    <div className="flex flex-col gap-[16px]">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-[#000000] mb-[4px]">Active Tasks</h2>
                                <p className="text-[16px] leading-[1.5] text-[#45464d]">AI has prioritized 3 items needing your attention today.</p>
                            </div>
                            <div className="flex gap-[8px]">
                                <div className="bg-white border border-[#c6c6cd] rounded-lg p-[4px] flex shadow-sm">
                                    <button className="p-[8px] bg-[#eff4ff] text-[#000000] rounded-md flex items-center justify-center">
                                        <span className="material-symbols-outlined">view_kanban</span>
                                    </button>
                                    <button className="p-[8px] text-[#45464d] hover:text-[#000000] rounded-md flex items-center justify-center transition-colors">
                                        <span className="material-symbols-outlined">format_list_bulleted</span>
                                    </button>
                                </div>
                                <button className="flex items-center gap-[8px] bg-[#8455ef] text-white px-[16px] py-[8px] rounded-lg text-[14px] font-bold shadow-sm hover:shadow-md transition-all">
                                    <span className="material-symbols-outlined">add</span>
                                    New Task
                                </button>
                            </div>
                        </div>

                        {/* AI Insight Card */}
                        <div className="bg-white/70 backdrop-blur-md border border-[#d0bcff] rounded-xl p-[16px] flex items-start gap-[16px] relative overflow-hidden"
                            style={{ boxShadow: "0 10px 25px -5px rgba(107,56,212,0.05)" }}>
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#6b38d4]"></div>
                            <div className="w-10 h-10 rounded-full bg-[#e9ddff] flex items-center justify-center text-[#6b38d4] shrink-0">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[14px] font-bold text-[#000000] mb-[4px]">AI Priority Suggestion</h3>
                                <p className="text-[16px] leading-[1.5] text-[#45464d] mb-[8px]">
                                    Based on recent emails, "Q3 Marketing Deck" is due tomorrow. I've drafted a skeletal outline for you to review.
                                </p>
                                <div className="flex gap-[8px]">
                                    <button className="px-[8px] py-[4px] bg-[#e9ddff] text-[#6b38d4] text-[14px] font-medium rounded-md hover:bg-[#d0bcff] transition-colors">Review Draft</button>
                                    <button className="px-[8px] py-[4px] border border-[#c6c6cd] text-[#45464d] text-[14px] font-medium rounded-md hover:bg-[#eff4ff] transition-colors">Dismiss</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kanban Board */}
                    <div className="flex-1 min-h-0 flex gap-[24px] overflow-x-auto pb-[8px]"
                        style={{ scrollbarWidth: "thin", scrollbarColor: "#c6c6cd transparent" }}>

                        {/* Column: To Do */}
                        <div className="flex flex-col w-[320px] shrink-0 gap-[8px]">
                            <div className="flex items-center justify-between pb-[4px] border-b-2 border-[#c6c6cd]">
                                <h3 className="text-[18px] font-semibold text-[#000000]">To Do</h3>
                                <span className="bg-[#dce9ff] text-[#45464d] px-[8px] py-[2px] rounded-full text-[13px]">5</span>
                            </div>
                            <div className="flex flex-col gap-[8px] overflow-y-auto pr-[4px] flex-1">
                                {/* Task Card: Normal */}
                                <div className="bg-white border border-[#c6c6cd] rounded-xl p-[16px] shadow-sm hover:shadow-md transition-shadow cursor-grab group">
                                    <div className="flex justify-between items-start mb-[8px]">
                                        <span className="px-[4px] py-[2px] bg-[#eff4ff] text-[#45464d] rounded text-[13px]">Design</span>
                                        <button className="text-[#45464d] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                                        </button>
                                    </div>
                                    <h4 className="text-[14px] font-semibold text-[#000000] mb-[4px]">Update Component Library</h4>
                                    <p className="text-[13px] text-[#45464d] line-clamp-2 mb-[16px]">
                                        Ensure all new shared components reflect the latest JSON specification rules.
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <div className="flex -space-x-2">
                                            <img alt="Assignee" className="w-6 h-6 rounded-full border-2 border-white object-cover"
                                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTg2lNrMOVWmaKkEEVIZ6vR7URSSIyOTi4L436l8ruvrgDbZf7DAcNuJD5lJeOdSJm8Uvq9M2HLWujEjTkJRD2WnNlLRxzaaOP7S0d4tHpoRxNcqUi6IiZfx1Wm8QRGWV_ANCWKkYjKeAjRj-MkA3yi6h2C6CQWNvcbYgpQ7QRc0dvh8P1rYsKSFXgB32B33q2mvMSYUdZRaeDjT4iFrq-9vP6zl_OWp6Kuv7z0gOB5MYyNmGu094HwsmDRn003SeyMBewYMptc-4"
                                            />
                                        </div>
                                        <div className="flex items-center gap-[4px] text-[#45464d]">
                                            <span className="material-symbols-outlined text-[14px]">chat_bubble_outline</span>
                                            <span className="text-[13px]">2</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Task Card: AI Tagged */}
                                <div className="bg-white border border-[#c6c6cd] rounded-xl p-[16px] shadow-sm hover:shadow-md transition-shadow cursor-grab group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-8 h-8 bg-[#e9ddff] flex items-start justify-end rounded-bl-xl p-1">
                                        <span className="material-symbols-outlined text-[14px] text-[#6b38d4]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                    </div>
                                    <div className="flex justify-between items-start mb-[8px] pr-[32px]">
                                        <span className="px-[4px] py-[2px] bg-[#eff4ff] text-[#45464d] rounded text-[13px]">Engineering</span>
                                    </div>
                                    <h4 className="text-[14px] font-semibold text-[#000000] mb-[4px]">Refactor Auth Flow</h4>
                                    <p className="text-[13px] text-[#45464d] line-clamp-2 mb-[16px]">
                                        Implement new OAuth providers as suggested by recent security audit.
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <div className="flex -space-x-2">
                                            <div className="w-6 h-6 rounded-full border-2 border-white bg-[#dce9ff] flex items-center justify-center text-[#45464d] text-[10px] font-bold">AJ</div>
                                        </div>
                                        <div className="flex items-center gap-[4px] text-[#45464d]">
                                            <span className="material-symbols-outlined text-[14px]">attach_file</span>
                                            <span className="text-[13px]">1</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Add Task */}
                                <button className="w-full py-[8px] border border-dashed border-[#c6c6cd] rounded-xl text-[#45464d] text-[14px] font-medium flex items-center justify-center gap-[4px] hover:bg-[#eff4ff] transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    Add Task
                                </button>
                            </div>
                        </div>

                        {/* Column: In Progress */}
                        <div className="flex flex-col w-[320px] shrink-0 gap-[8px]">
                            <div className="flex items-center justify-between pb-[4px] border-b-2 border-[#6b38d4]">
                                <div className="flex items-center gap-[4px]">
                                    <span className="w-2 h-2 rounded-full bg-[#6b38d4]"></span>
                                    <h3 className="text-[18px] font-semibold text-[#000000]">In Progress</h3>
                                </div>
                                <span className="bg-[#dce9ff] text-[#45464d] px-[8px] py-[2px] rounded-full text-[13px]">2</span>
                            </div>
                            <div className="flex flex-col gap-[8px] overflow-y-auto pr-[4px] flex-1">
                                {/* Urgent Task Card */}
                                <div className="bg-white border-l-4 border-l-[#ba1a1a] border-y border-r border-[#c6c6cd] rounded-xl p-[16px] shadow-sm hover:shadow-md transition-shadow cursor-grab group">
                                    <div className="flex justify-between items-start mb-[8px]">
                                        <div className="flex gap-[4px]">
                                            <span className="px-[4px] py-[2px] bg-[#ffdad6] text-[#93000a] rounded text-[13px] font-bold flex items-center gap-[4px]">
                                                <span className="material-symbols-outlined text-[12px]">keyboard_double_arrow_up</span> Urgent
                                            </span>
                                            <span className="px-[4px] py-[2px] bg-[#eff4ff] text-[#45464d] rounded text-[13px]">Marketing</span>
                                        </div>
                                        <button className="text-[#45464d] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                                        </button>
                                    </div>
                                    <h4 className="text-[14px] font-semibold text-[#000000] mb-[4px]">Q3 Marketing Deck</h4>
                                    <p className="text-[13px] text-[#45464d] line-clamp-2 mb-[16px]">
                                        Finalize slides for tomorrow's all-hands meeting. Ensure AI drafted content is reviewed.
                                    </p>
                                    {/* Progress Bar */}
                                    <div className="mb-[16px]">
                                        <div className="flex justify-between text-[10px] text-[#45464d] mb-1">
                                            <span>Progress</span>
                                            <span>65%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-[#dce9ff] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#6b38d4] w-[65%] rounded-full relative">
                                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex -space-x-2">
                                            <img alt="Assignee" className="w-6 h-6 rounded-full border-2 border-white object-cover"
                                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFADxISvbKXOxcpBHnplFYKHaxJnrqOcjTEx-utGLNEhT_Ooz1kTPS-JGhf2yDFwAoaAgXsulx-mphj_f_xbFD2RWVoIcAEzHmIml83HsfzK2KeMxWZzdWyoSMpCwVyH3mD5uZEMDBy0WjHvxWQkXCHkJuprO938lAm8TdC4NqE0EhzDqGw_ws_joYnUHRTVGHKUK68kUEbjj_lJWYKjWQgvV6MUlqoWmdnoubI6lcHnCFtpCry7O3d0WXzlv3FM7ZGOXwgDnC87A"
                                            />
                                        </div>
                                        <span className="flex items-center gap-[4px] text-[#ba1a1a] text-[13px]">
                                            <span className="material-symbols-outlined text-[14px]">schedule</span> Tomorrow
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column: In Review */}
                        <div className="flex flex-col w-[320px] shrink-0 gap-[8px] opacity-80">
                            <div className="flex items-center justify-between pb-[4px] border-b-2 border-[#565e74]">
                                <h3 className="text-[18px] font-semibold text-[#000000]">In Review</h3>
                                <span className="bg-[#dce9ff] text-[#45464d] px-[8px] py-[2px] rounded-full text-[13px]">0</span>
                            </div>
                            <div className="flex flex-col gap-[8px] overflow-y-auto pr-[4px] flex-1 items-center justify-center border-2 border-dashed border-[#c6c6cd] rounded-xl bg-[#f8f9ff]/50">
                                <span className="material-symbols-outlined text-[#c6c6cd] text-[32px] mb-[8px]">fact_check</span>
                                <p className="text-[14px] font-medium text-[#45464d]">Drop tasks here</p>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
