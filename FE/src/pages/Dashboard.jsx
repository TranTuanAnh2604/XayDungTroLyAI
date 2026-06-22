import { useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Sidebar from "../components/Sidebar";
export default function Dashboard() {
    const searchWrapperRef = useRef(null);
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Alex';
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

    return (
        <>
            {/* Tailwind custom config via CDN — only works if using CDN in index.html */}
            {/* If using Vite + Tailwind installed, configure tailwind.config.js instead */}

            <body
                className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex antialiased"
                style={{ fontFamily: "Inter, sans-serif" }}
            >
                {/* SideNavBar */}
                < Sidebar />

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-w-0 md:ml-[280px]">
                    {/* TopAppBar */}
                    <header className="flex justify-between items-center w-full px-[24px] py-[8px] sticky top-0 z-30 bg-[#f8f9ff]/70 backdrop-blur-xl border-b border-[#c6c6cd] shadow-sm">
                        <div className="flex items-center gap-[16px] flex-1">
                            {/* Mobile Menu Toggle */}
                            <button className="md:hidden text-[#45464d] hover:text-[#000000] transition-colors p-[4px] rounded-full hover:bg-[#dce9ff]">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <div className="text-[24px] font-extrabold leading-[1.3] text-[#000000] hidden md:block">
                                Dashboard
                            </div>
                            {/* Search Bar */}
                            <div
                                ref={searchWrapperRef}
                                className="relative w-full max-w-md ml-auto md:ml-[24px] mr-[24px] group"
                            >
                                <span className="material-symbols-outlined absolute left-[8px] top-1/2 -translate-y-1/2 text-[#45464d] group-focus-within:text-[#6b38d4] transition-colors">
                                    search
                                </span>
                                <input
                                    className="w-full bg-white border border-[#c6c6cd] rounded-full py-2 pl-[40px] pr-[16px] text-[16px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#6b38d4] focus:border-transparent transition-all shadow-sm"
                                    placeholder="Ask AI or search..."
                                    type="text"
                                    onFocus={handleSearchFocus}
                                    onBlur={handleSearchBlur}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-[16px]">
                            <button className="text-[#45464d] hover:text-[#000000] transition-colors p-[4px] rounded-full hover:bg-[#d3e4fe] relative">
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full"></span>
                            </button>
                            <button className="text-[#45464d] hover:text-[#000000] transition-colors p-[4px] rounded-full hover:bg-[#d3e4fe]">
                                <span className="material-symbols-outlined">history</span>
                            </button>
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#c6c6cd] cursor-pointer hover:ring-2 hover:ring-[#6b38d4] transition-all">
                                <img
                                    alt="User Profile"
                                    className="w-full h-full object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDalTmS4lP-znYQVVwIfhlq3ARxhy15ES8PiwoVB3RiPnPv29H7FKppFiOYX8jKXjUIISJRJuUbqu9GBmKqltt35L2l_6tlMXNHQXcoBOX364FUqu92Rht4KwajGiTUNWSpurJT-XS4IcshO6-ZHqHPIni8bJFvHaEAKnFPiIyNWtMST_PF2qdO6TEPKXvJWXHjrcGApRjQ99dFl_MDp5Nl77BRZqOfkP5hfFNJ5XiMo3wuD7iEGLZQ829mSQ1QwRvRunSHqsItxOQ"
                                />
                            </div>
                        </div>
                    </header>

                    {/* Dashboard Canvas */}
                    <div className="p-[16px] md:p-[24px] lg:p-[40px] max-w-[1440px] mx-auto w-full flex flex-col gap-[24px] md:gap-[40px] overflow-y-auto">
                        {/* Welcome Header */}
                        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-[16px]">
                            <div>
                                <h2
                                    className="text-[28px] md:text-[48px] font-bold leading-[1.1] tracking-[-0.02em] mb-[4px]"
                                    style={{
                                        background: "linear-gradient(135deg, #000000 0%, #6b38d4 100%)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text",
                                    }}
                                >
                                    Good morning, {userName}.
                                </h2>
                                <p className="text-[18px] leading-[1.6] text-[#45464d]">
                                    Here is your productivity overview for today.
                                </p>
                            </div>
                            <div className="flex gap-[8px]">
                                <button className="px-[16px] py-[8px] bg-white border border-[#c6c6cd] rounded-full text-[14px] font-medium hover:bg-[#eff4ff] transition-colors shadow-sm flex items-center gap-[4px]">
                                    <span className="material-symbols-outlined text-[18px]">calendar_month</span> Today
                                </button>
                            </div>
                        </section>

                        {/* Bento Grid Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-[16px] md:gap-[24px]">
                            {/* AI Suggestions Card */}
                            <div
                                className="col-span-1 md:col-span-2 lg:col-span-2 rounded-xl p-[24px] border border-[#dce9ff] relative overflow-hidden group"
                                style={{
                                    background: "rgba(255, 255, 255, 0.7)",
                                    backdropFilter: "blur(12px)",
                                    WebkitBackdropFilter: "blur(12px)",
                                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
                                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow = "0 12px 30px -5px rgba(0,0,0,0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "none";
                                    e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(0,0,0,0.05)";
                                }}
                            >
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#d0bcff]/20 rounded-full blur-3xl group-hover:bg-[#d0bcff]/30 transition-colors"></div>
                                <div className="flex items-center gap-[8px] mb-[16px] relative z-10">
                                    <span
                                        className="material-symbols-outlined text-[#6b38d4]"
                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                    >
                                        auto_awesome
                                    </span>
                                    <h3 className="text-[24px] font-semibold leading-[1.3] text-[#0b1c30]">
                                        AI Suggestions
                                    </h3>
                                </div>
                                <div className="space-y-[8px] relative z-10">
                                    {[
                                        {
                                            icon: "drafts",
                                            title: "Draft reply to Marketing Team",
                                            desc: "Based on recent thread about Q3 campaign launch...",
                                        },
                                        {
                                            icon: "summarize",
                                            title: "Summarize 'Project Phoenix' docs",
                                            desc: "3 new documents uploaded by Sarah yesterday.",
                                        },
                                    ].map(({ icon, title, desc }) => (
                                        <div
                                            key={title}
                                            className="flex items-start gap-[16px] p-[8px] rounded-lg bg-white/50 border border-[#c6c6cd]/30 hover:bg-white transition-colors cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[#191c1e] mt-1">{icon}</span>
                                            <div>
                                                <p className="text-[14px] font-semibold text-[#0b1c30]">{title}</p>
                                                <p className="text-[16px] text-[#45464d] text-sm line-clamp-1">{desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Daily Summary Widget */}
                            <div
                                className="col-span-1 md:col-span-1 lg:col-span-1 bg-white rounded-xl p-[24px] border border-[#c6c6cd]/50 shadow-sm flex flex-col justify-between"
                                style={{ transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow = "0 12px 30px -5px rgba(0,0,0,0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "none";
                                    e.currentTarget.style.boxShadow = "";
                                }}
                            >
                                <div>
                                    <h3 className="text-[18px] font-semibold text-[#0b1c30] mb-[8px]">Tasks Today</h3>
                                    <div className="text-[48px] font-bold leading-none text-[#000000]">12</div>
                                    <p className="text-[16px] text-[#45464d] mt-[4px]">4 high priority</p>
                                </div>
                                <div className="mt-[16px] w-full bg-[#e5eeff] h-2 rounded-full overflow-hidden">
                                    <div className="bg-[#6b38d4] h-full rounded-full" style={{ width: "65%" }}></div>
                                </div>
                            </div>

                            {/* Quick Actions Widget */}
                            <div className="col-span-1 md:col-span-3 lg:col-span-1 bg-white rounded-xl p-[24px] border border-[#c6c6cd]/50 shadow-sm flex flex-col justify-center gap-[16px]">
                                <h3 className="text-[18px] font-semibold text-[#0b1c30]">Quick Access</h3>
                                <div className="grid grid-cols-2 gap-[8px]">
                                    {[
                                        { icon: "chat_bubble", label: "Chat", path: "/chat" },
                                        { icon: "mail", label: "Email", path: "/gmail" },
                                        { icon: "mic", label: "Voice", path: "/voice" },
                                        { icon: "note_add", label: "Task", path: "/tasks" },
                                    ].map(({ icon, label, path }) => (
                                        <button
                                            key={label}
                                            onClick={() => navigate(path)}
                                            className="flex flex-col items-center justify-center p-[16px] rounded-lg bg-[#eff4ff] hover:bg-[#d3e4fe] transition-colors border border-transparent hover:border-[#d0bcff]"
                                        >
                                            <span
                                                className="material-symbols-outlined text-[#000000] mb-[4px]"
                                                style={{ fontVariationSettings: "'FILL' 1" }}
                                            >
                                                {icon}
                                            </span>
                                            <span className="text-[12px] font-medium">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="col-span-1 md:col-span-3 lg:col-span-4 bg-white rounded-xl border border-[#c6c6cd]/50 shadow-sm overflow-hidden">
                                <div className="p-[24px] border-b border-[#c6c6cd]/30 flex justify-between items-center">
                                    <h3 className="text-[24px] font-semibold leading-[1.3] text-[#0b1c30]">
                                        Recent Activity
                                    </h3>
                                    <button className="text-[14px] font-medium text-[#6b38d4] hover:text-[#000000] transition-colors">
                                        View All
                                    </button>
                                </div>
                                <div>
                                    <ul className="divide-y divide-[#c6c6cd]/20">
                                        {[
                                            {
                                                icon: "description",
                                                title: "Q2 Financial Report Analysis",
                                                sub: "Generated by AI • 2 hours ago",
                                                tag: null,
                                            },
                                            {
                                                icon: "group",
                                                title: "Meeting Transcript: Product Sync",
                                                sub: "Voice recorded • Yesterday",
                                                tag: "Action Items",
                                            },
                                            {
                                                icon: "mail",
                                                title: "Drafted gmail to Client Services",
                                                sub: "Draft saved • Yesterday",
                                                tag: null,
                                            },
                                        ].map(({ icon, title, sub, tag }) => (
                                            <li
                                                key={title}
                                                className="p-[16px] hover:bg-[#eff4ff] transition-colors flex items-center gap-[16px] cursor-pointer"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-[#dce9ff] flex items-center justify-center text-[#000000]">
                                                    <span className="material-symbols-outlined">{icon}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[16px] font-medium text-[#0b1c30]">{title}</p>
                                                    <p className="text-[16px] text-[#45464d] text-sm">{sub}</p>
                                                </div>
                                                {tag && (
                                                    <div className="hidden md:flex gap-[4px]">
                                                        <span className="px-2 py-1 rounded-full bg-[#d0bcff]/30 text-[#8455ef] text-[10px] font-medium">
                                                            {tag}
                                                        </span>
                                                    </div>
                                                )}
                                                <span className="material-symbols-outlined text-[#45464d] hidden md:block ml-[8px]">
                                                    chevron_right
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </body>
        </>
    );
}
