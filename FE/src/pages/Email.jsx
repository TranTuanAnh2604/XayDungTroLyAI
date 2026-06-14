import { useNavigate, useLocation } from 'react-router-dom';
export default function Email() {
    const navigate = useNavigate();
    const location = useLocation();
    return (
        <div
            className="flex h-screen overflow-hidden antialiased"
            style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#f8f9ff", color: "#0b1c30" }}
        >
            {/* Sidebar */}
            <aside className="w-[280px] h-full flex flex-col bg-[#eff4ff] border-r border-[#c6c6cd] fixed left-0 top-0 bottom-0 z-40 hidden md:flex shrink-0">
                <div className="p-[24px] border-b border-[#c6c6cd] flex items-center gap-[16px]">
                    <div className="w-10 h-10 rounded-full bg-[#8455ef] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white">smart_toy</span>
                    </div>
                    <div>
                        <h1 className="text-[24px] font-bold text-[#000000]">AI Assistant</h1>
                        <p className="text-[14px] font-medium text-[#45464d]">Enterprise Edition</p>
                    </div>
                </div>

                <div className="p-[16px]">
                    <button
                        onClick={() => navigate('/chat')}
                        className="w-full text-white py-[8px] px-[16px] rounded-lg text-[14px] font-semibold flex items-center justify-center gap-[8px] hover:opacity-90 transition-opacity shadow-sm"
                        style={{ background: "linear-gradient(135deg, #6b38d4, #8455ef)" }}
                    >
                        <span className="material-symbols-outlined text-[20px]">edit_square</span>
                        <span>New Chat</span>
                    </button>
                </div>

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

                <div className="p-[16px] border-t border-[#c6c6cd] flex flex-col gap-[4px] mt-auto">
                    {[{ icon: "settings", label: "Settings" }, { icon: "help", label: "Help" }].map(({ icon, label }) => (
                        <a key={label} href="#" className="flex items-center gap-[16px] px-[16px] py-[8px] rounded-lg text-[14px] font-medium text-[#45464d] hover:bg-[#d3e4fe] transition-colors duration-200">
                            <span className="material-symbols-outlined text-[20px]">{icon}</span>
                            <span>{label}</span>
                        </a>
                    ))}
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col ml-0 md:ml-[280px] h-screen overflow-hidden bg-[#f8f9ff]">
                {/* TopBar */}
                <header className="flex justify-between items-center w-full px-[24px] py-[8px] sticky top-0 z-30 bg-[#f8f9ff]/70 backdrop-blur-xl shadow-sm border-b border-[#c6c6cd] shrink-0">
                    <button className="md:hidden p-[8px] rounded-full hover:bg-[#d3e4fe] transition-colors text-[#45464d]">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div className="flex-1 max-w-md mx-[16px] relative group">
                        <div className="absolute inset-y-0 left-0 pl-[8px] flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-[#45464d] group-focus-within:text-[#6b38d4] transition-colors">search</span>
                        </div>
                        <input
                            className="w-full pl-[40px] pr-[16px] py-[8px] bg-white border border-[#c6c6cd] rounded-full text-[16px] text-[#0b1c30] focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] transition-all"
                            placeholder="Search emails, contacts, or ask AI..."
                            type="text"
                        />
                        <div className="absolute inset-y-0 right-0 pr-[8px] flex items-center">
                            <button className="p-[4px] rounded-full hover:bg-[#dce9ff] text-[#8455ef] flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined text-[20px]">temp_preferences_custom</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-[8px] shrink-0">
                        <button className="p-[8px] rounded-full hover:bg-[#d3e4fe] transition-colors text-[#45464d] hover:text-[#000000] relative">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full"></span>
                        </button>
                        <button className="p-[8px] rounded-full hover:bg-[#d3e4fe] transition-colors text-[#45464d] hover:text-[#000000]">
                            <span className="material-symbols-outlined">history</span>
                        </button>
                        <div className="ml-[8px] w-10 h-10 rounded-full border border-[#c6c6cd] overflow-hidden cursor-pointer hover:border-[#6b38d4] transition-colors">
                            <img
                                alt="User Profile"
                                className="w-full h-full object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0ITh_LXqcYaQdZi21Q10R-FVj_H_v4Fu4BNriURPpDro4qevTYKxcDqd_l_pSyXTpy_X7t_Z4azQOjHXrf_sET3Esx9M_2BY_Y-_Zcmv_zOeEyPcx1zYAdOtPW5VRjreEMDEjvJJpciMchrHr2b_7cLOOT9XqTv-LSquD6pf5UtXXE7OOlDdZqD4XmwKdE4CDpyziiwU_kFNtVGgkXmZKWnDmm-cOERpDUisHiRXdw7eWjmn-4xPDd957Y3OCwgMTXS2DVbR3b_Y"
                            />
                        </div>
                    </div>
                </header>

                {/* Inbox Canvas */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Email List */}
                    <div className="w-full md:w-[400px] flex flex-col border-r border-[#c6c6cd] bg-white shrink-0">
                        <div className="p-[16px] border-b border-[#c6c6cd] flex items-center justify-between bg-white sticky top-0 z-10">
                            <h2 className="text-[24px] font-semibold text-[#000000]">Inbox</h2>
                            <button className="px-[8px] py-[4px] rounded-full bg-[#dce9ff] text-[#0b1c30] text-[14px] font-medium flex items-center gap-[4px]">
                                <span>All</span>
                                <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {/* Email 1 - Selected */}
                            <div className="p-[16px] border-l-4 border-[#6b38d4] bg-[#eff4ff] cursor-pointer hover:bg-[#dce9ff] transition-colors relative">
                                <div className="flex justify-between items-start mb-[4px]">
                                    <span className="text-[14px] font-bold text-[#0b1c30]">Sarah Jenkins</span>
                                    <span className="text-[14px] font-semibold text-[#8455ef]">10:42 AM</span>
                                </div>
                                <h3 className="text-[16px] font-semibold text-[#000000] truncate mb-[4px]">Q3 Product Roadmap Review & Align...</h3>
                                <p className="text-[16px] text-[#45464d] line-clamp-2 leading-tight">Hi team, please find attached the revised Q3 roadmap. We need to align on the AI integration timeline before Friday's all-hands. I've highlighted the critical paths.</p>
                                <div className="mt-[8px] flex gap-[4px]">
                                    <span className="px-[8px] py-[4px] rounded-full bg-[#d3e4fe] text-[#45464d] text-[13px] flex items-center gap-[4px]">
                                        <span className="material-symbols-outlined text-[14px]">label</span> Urgent
                                    </span>
                                    <span className="px-[8px] py-[4px] rounded-full bg-[#d3e4fe] text-[#8455ef] text-[13px] flex items-center gap-[4px] border border-[#6b38d4]/20">
                                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span> AI Summary Ready
                                    </span>
                                </div>
                            </div>

                            {/* Email 2 */}
                            <div className="p-[16px] border-b border-[#c6c6cd] bg-white cursor-pointer hover:bg-[#eff4ff] transition-colors">
                                <div className="flex justify-between items-start mb-[4px]">
                                    <span className="text-[14px] font-medium text-[#0b1c30]">Design System Team</span>
                                    <span className="text-[14px] text-[#45464d]">Yesterday</span>
                                </div>
                                <h3 className="text-[16px] text-[#000000] truncate mb-[4px]">New Component Library Updates v2.4</h3>
                                <p className="text-[16px] text-[#45464d] line-clamp-2 leading-tight">We've just pushed the new glassmorphism tokens to the staging environment. Please review the updated Figma files and let us know if the contrast ratios hold up in dark mode.</p>
                            </div>

                            {/* Email 3 */}
                            <div className="p-[16px] border-b border-[#c6c6cd] bg-white cursor-pointer hover:bg-[#eff4ff] transition-colors opacity-70">
                                <div className="flex justify-between items-start mb-[4px]">
                                    <span className="text-[14px] font-medium text-[#0b1c30]">Cloud Infrastructure</span>
                                    <span className="text-[14px] text-[#45464d]">Oct 12</span>
                                </div>
                                <h3 className="text-[16px] text-[#000000] truncate mb-[4px]">Automated: Weekly Usage Report</h3>
                                <p className="text-[16px] text-[#45464d] line-clamp-2 leading-tight">Your compute usage for the week of Oct 5 - Oct 11 is attached. No anomalies detected. Overall efficiency up 4%.</p>
                            </div>
                        </div>
                    </div>

                    {/* Email Detail */}
                    <div className="hidden md:flex flex-1 flex-col bg-[#f8f9ff] relative">
                        {/* Detail Header */}
                        <div className="p-[24px] border-b border-[#c6c6cd] flex justify-between items-center bg-white shrink-0">
                            <div className="flex items-center gap-[16px]">
                                <div className="w-12 h-12 rounded-full bg-[#d3e4fe] flex items-center justify-center text-[24px] font-bold text-[#000000]">SJ</div>
                                <div>
                                    <h2 className="text-[24px] font-semibold text-[#000000]">Q3 Product Roadmap Review & Alignment</h2>
                                    <div className="flex items-center gap-[8px] mt-[4px]">
                                        <span className="text-[14px] font-medium text-[#0b1c30]">Sarah Jenkins</span>
                                        <span className="text-[14px] text-[#45464d]">&lt;sarah.j@enterprise.co&gt;</span>
                                        <span className="w-1 h-1 rounded-full bg-[#c6c6cd]"></span>
                                        <span className="text-[14px] text-[#45464d]">To: Product Team</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-[8px]">
                                {[{ icon: "reply", title: "Reply" }, { icon: "forward", title: "Forward" }, { icon: "more_vert", title: "More options" }].map(({ icon, title }) => (
                                    <button key={icon} title={title} className="p-[8px] rounded-full hover:bg-[#eff4ff] text-[#45464d] transition-colors">
                                        <span className="material-symbols-outlined">{icon}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* AI Summary */}
                        <div className="p-[24px] shrink-0">
                            <div
                                className="border border-[#6b38d4]/20 rounded-xl p-[16px] relative overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-[#6b38d4] opacity-50"></div>
                                <div className="flex items-center gap-[8px] mb-[8px]">
                                    <span className="material-symbols-outlined text-[#8455ef]">auto_awesome</span>
                                    <span
                                        className="text-[14px] font-bold"
                                        style={{ background: "linear-gradient(135deg, #6b38d4, #8455ef)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                    >
                                        AI Summary
                                    </span>
                                </div>
                                <ul className="list-disc list-inside text-[16px] text-[#0b1c30] space-y-[4px] ml-[8px]">
                                    <li>Roadmap updated with revised Q3 goals.</li>
                                    <li>Critical dependency: <strong>AI Integration Timeline</strong> needs alignment.</li>
                                    <li>Action required before <strong>Friday's all-hands meeting</strong>.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Email Body */}
                        <div className="p-[24px] flex-1 overflow-y-auto text-[18px] leading-[1.6] text-[#0b1c30]">
                            <p className="mb-[16px]">Hi team,</p>
                            <p className="mb-[16px]">Please find attached the revised Q3 roadmap. We've made some significant adjustments based on last week's feedback from the engineering directors.</p>
                            <p className="mb-[16px]">Crucially, we need to align on the AI integration timeline. The current estimates seem a bit optimistic, and I want to ensure we have a solid, realistic plan before presenting at Friday's all-hands.</p>
                            <p className="mb-[16px]">I've highlighted the critical paths in the document. Please review and add your comments by EOD tomorrow.</p>
                            <p className="mt-[40px]">Best,<br />Sarah</p>

                            {/* Attachment */}
                            <div className="mt-[24px] p-[8px] border border-[#c6c6cd] rounded-lg inline-flex items-center gap-[16px] hover:bg-white cursor-pointer transition-colors">
                                <div className="w-10 h-10 rounded bg-[#ffdad6] text-[#93000a] flex items-center justify-center">
                                    <span className="material-symbols-outlined">picture_as_pdf</span>
                                </div>
                                <div>
                                    <span className="block text-[14px] font-medium text-[#0b1c30]">Q3_Roadmap_Draft_v2.pdf</span>
                                    <span className="block text-[13px] text-[#45464d]">2.4 MB</span>
                                </div>
                                <button className="ml-[8px] p-[4px] rounded-full hover:bg-[#d3e4fe] text-[#45464d]">
                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                </button>
                            </div>
                        </div>

                        {/* Reply Bar */}
                        <div className="p-[24px] border-t border-[#c6c6cd] bg-white shrink-0">
                            {/* Quick Replies */}
                            <div className="flex gap-[8px] mb-[16px] overflow-x-auto pb-[4px]">
                                {[
                                    '"I\'ll review the highlighted paths today."',
                                    '"Can we push the alignment meeting to Thursday?"',
                                    '"Looks good, no concerns on the timeline."',
                                ].map((text) => (
                                    <button
                                        key={text}
                                        className="px-[16px] py-[8px] rounded-full bg-[#eff4ff] border border-[#6b38d4]/30 text-[#8455ef] text-[14px] font-medium whitespace-nowrap hover:bg-[#6b38d4] hover:text-white transition-all shadow-sm"
                                    >
                                        {text}
                                    </button>
                                ))}
                            </div>

                            {/* Input */}
                            <div
                                className="relative rounded-xl border border-[#c6c6cd] focus-within:border-[#6b38d4] focus-within:ring-2 focus-within:ring-[#6b38d4]/20 transition-all p-[4px] flex flex-col"
                                style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
                            >
                                <textarea
                                    className="w-full bg-transparent border-none resize-none text-[16px] text-[#0b1c30] p-[8px] min-h-[80px] focus:ring-0 focus:outline-none placeholder:text-[#45464d]/50"
                                    placeholder="Reply or ask AI to draft a response..."
                                    rows={2}
                                />
                                <div className="flex justify-between items-center mt-[4px] px-[8px] pb-[8px]">
                                    <div className="flex gap-[8px]">
                                        <button className="p-[4px] rounded text-[#45464d] hover:bg-[#dce9ff] transition-colors" title="Attach file">
                                            <span className="material-symbols-outlined text-[20px]">attach_file</span>
                                        </button>
                                        <button className="p-[4px] rounded text-[#8455ef] hover:bg-[#dce9ff] transition-colors flex items-center gap-[4px]" title="Draft with AI">
                                            <span className="material-symbols-outlined text-[20px]">edit_note</span>
                                            <span className="text-[14px] font-medium">Draft with AI</span>
                                        </button>
                                    </div>
                                    <button
                                        className="px-[16px] py-[8px] rounded-lg text-white text-[14px] font-semibold flex items-center gap-[4px] hover:shadow-md transition-shadow"
                                        style={{ background: "linear-gradient(135deg, #6b38d4, #8455ef)" }}
                                    >
                                        <span>Send</span>
                                        <span className="material-symbols-outlined text-[18px]">send</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
