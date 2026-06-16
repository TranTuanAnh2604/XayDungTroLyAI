import Sidebar from '../components/Sidebar';

export default function Calendar() {
    const days = [
        { num: "1", dim: true, events: [] },
        { num: "2", events: [{ label: "Weekly Sync", style: "bg-[#e9ddff]/50 text-[#23005c] border border-[#d0bcff]/30", icon: null }] },
        { num: "3", events: [] },
        { num: "4", events: [] },
        { num: "5", events: [{ label: "Design Review", style: "bg-[#d3e4fe] text-[#0b1c30] border border-[#c6c6cd]/30", icon: null, dot: true }] },
        { num: "6", events: [] },
        { num: "7", events: [] },
        { num: "8", events: [] },
        { num: "9", events: [] },
        { num: "10", events: [{ label: "Q3 Planning", style: "bg-[#8455ef]/20 text-[#5516be] border border-[#8455ef]/40", icon: "auto_awesome" }] },
        { num: "11", events: [] },
        {
            num: "12", today: true, events: [
                { label: "All-Hands Meeting", style: "bg-[#000000] text-white shadow-sm" },
                { label: "Dentist", style: "bg-[#ffdad6]/50 text-[#93000a] border border-[#ffdad6]" },
            ]
        },
        { num: "13", events: [] },
        { num: "14", events: [] },
        ...[15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map(n => ({ num: String(n), events: [] })),
        { num: "1", dim: true, events: [] },
        { num: "2", dim: true, events: [] },
        { num: "3", dim: true, events: [] },
        { num: "4", dim: true, events: [] },
    ];

    return (
        <div
            className="flex h-screen overflow-hidden antialiased"
            style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#f8f9ff", color: "#0b1c30" }}
        >
            {/* Sidebar */}
            < Sidebar />

            {/* Main */}
            <div className="ml-[280px] flex-1 flex flex-col min-w-0">
                {/* TopBar */}
                <header className="flex justify-between items-center w-full px-[24px] py-[8px] sticky top-0 z-30 bg-[#f8f9ff]/70 backdrop-blur-xl border-b border-[#c6c6cd] shadow-sm h-[72px]">
                    <div className="relative w-96 flex items-center bg-white border border-[#c6c6cd]/50 rounded-full px-[16px] py-[4px] focus-within:ring-2 focus-within:ring-[#6b38d4] focus-within:border-transparent transition-all shadow-sm">
                        <span className="material-symbols-outlined text-[#45464d] mr-[8px] text-sm">search</span>
                        <input
                            className="w-full bg-transparent border-none focus:ring-0 text-[16px] placeholder-[#45464d]/70 text-[#0b1c30] py-1 focus:outline-none"
                            placeholder="Search events, emails, or ask AI..."
                            type="text"
                        />
                        <div className="absolute right-2 px-2 py-0.5 rounded-md bg-[#eff4ff] border border-[#c6c6cd] text-[10px] text-[#45464d] font-bold">⌘K</div>
                    </div>
                    <div className="flex items-center gap-[16px]">
                        <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#45464d] hover:bg-[#e5eeff] hover:text-[#000000] transition-colors relative">
                            <span className="material-symbols-outlined">history</span>
                        </button>
                        <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#45464d] hover:bg-[#e5eeff] hover:text-[#000000] transition-colors relative">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full border border-white"></span>
                        </button>
                        <div className="w-px h-6 bg-[#c6c6cd]/50 mx-[4px]"></div>
                        <button className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-[#6b38d4] transition-colors">
                            <img
                                alt="User Profile"
                                className="w-full h-full object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiVgdQM7Ps1HbC3ZmnSmfDE3Tk36tNE_59xt-B6UjlCNiCBHFypXLjcGqAzCQb8ayX2_SrWBQAgOYNgxePfiJp0Hd2D653n0529ToQm8NslboXV5ANB8G8gBdMKjo7zbBRogtlYSQV_rYEWXRmPPaG-cKfhmULPl5r0fJpbqthA1o-w3hnuSUc7oshvj-sIR_TeKdPeimuCm5EKrp_pgU2QFwIPZpp8ZdZd_6p9OT9vdkl7Amx5Tmw4iwjSz7KQI1wLzk-tFTZfKA"
                            />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-[24px] flex gap-[24px] bg-[#f8f9ff]">
                    {/* Calendar Grid */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-[#c6c6cd]/40 shadow-sm overflow-hidden">
                        {/* Toolbar */}
                        <div className="px-[24px] py-[16px] border-b border-[#c6c6cd]/30 flex items-center justify-between bg-[#f8f9ff]">
                            <div className="flex items-center gap-[16px]">
                                <h2 className="text-[32px] font-semibold leading-[1.2] tracking-tight text-[#000000]">October 2023</h2>
                                <div className="flex items-center bg-[#e5eeff] rounded-lg p-0.5 border border-[#c6c6cd]/20">
                                    <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#d3e4fe] text-[#45464d] transition-colors">
                                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                                    </button>
                                    <button className="px-3 h-8 flex items-center justify-center rounded-md hover:bg-[#d3e4fe] text-[14px] font-medium text-[#45464d] transition-colors">Today</button>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#d3e4fe] text-[#45464d] transition-colors">
                                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-[8px]">
                                <div className="flex bg-[#e5eeff] rounded-lg p-1 border border-[#c6c6cd]/20">
                                    <button className="px-[16px] py-1 rounded-md bg-white shadow-sm text-[14px] font-bold text-[#000000]">Month</button>
                                    <button className="px-[16px] py-1 rounded-md text-[#45464d] hover:text-[#000000] text-[14px] font-medium transition-colors">Week</button>
                                    <button className="px-[16px] py-1 rounded-md text-[#45464d] hover:text-[#000000] text-[14px] font-medium transition-colors">Day</button>
                                </div>
                                <button className="ml-[8px] bg-[#000000] text-white px-[16px] py-1.5 rounded-lg text-[14px] font-medium flex items-center gap-[4px] hover:bg-[#565e74] transition-colors shadow-sm">
                                    <span className="material-symbols-outlined text-sm">add</span> Event
                                </button>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="flex-1 flex flex-col bg-[#c6c6cd]/20">
                            {/* Weekday Headers */}
                            <div className="grid grid-cols-7 gap-px bg-[#c6c6cd]/20 border-b border-[#c6c6cd]/20">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                                    <div key={d} className="bg-[#f8f9ff] py-2 text-center text-[#45464d]/70 uppercase text-[11px] tracking-wider font-medium">{d}</div>
                                ))}
                            </div>
                            {/* Days */}
                            <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-[#c6c6cd]/20 overflow-hidden text-sm">
                                {days.map((day, i) => (
                                    <div
                                        key={i}
                                        className={`p-2 min-h-[100px] flex flex-col group hover:bg-[#eff4ff] transition-colors relative overflow-hidden ${day.today ? "bg-[#eff4ff]" : "bg-white"
                                            }`}
                                    >
                                        {day.today && <div className="absolute top-0 left-0 w-full h-1 bg-[#8455ef]"></div>}
                                        <div className="flex items-center justify-between mb-2 mt-1">
                                            {day.today ? (
                                                <span className="w-6 h-6 flex items-center justify-center bg-[#8455ef] text-white rounded-full font-bold text-sm shadow-sm">{day.num}</span>
                                            ) : (
                                                <span className={`${day.dim ? "text-[#45464d]/30" : "text-[#45464d]"} mb-1`}>{day.num}</span>
                                            )}
                                        </div>
                                        {day.events?.map((ev, j) => (
                                            <div key={j} className={`px-2 py-1 rounded text-xs font-medium truncate mb-1 cursor-pointer transition-colors flex items-center gap-1 ${ev.style}`}>
                                                {ev.icon && <span className="material-symbols-outlined text-[12px] text-[#6b38d4]">{ev.icon}</span>}
                                                <span>{ev.label}</span>
                                                {ev.dot && <div className="w-1.5 h-1.5 rounded-full bg-[#bec6e0] ml-auto"></div>}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="w-[340px] flex flex-col gap-[16px] shrink-0">
                        {/* AI Scheduling */}
                        <div className="bg-white rounded-xl border border-[#c6c6cd]/40 shadow-sm overflow-hidden flex flex-col">
                            <div className="px-[16px] py-[8px] border-b border-[#c6c6cd]/20 bg-[#6b38d4]/5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[#6b38d4]">
                                    <span className="material-symbols-outlined text-[20px] animate-pulse">auto_awesome</span>
                                    <h3 className="text-[16px] font-semibold tracking-tight">AI Scheduling</h3>
                                </div>
                                <span className="bg-[#8455ef] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">2 Pending</span>
                            </div>
                            <div className="p-[16px] flex flex-col gap-[8px] overflow-y-auto max-h-[400px]">
                                <p className="text-sm text-[#45464d] mb-2">I analyzed your recent emails and chats. Here are suggested calendar events:</p>

                                {[
                                    {
                                        iconBg: "bg-[#dae2fd]", iconColor: "text-[#131b2e]", icon: "mail",
                                        title: "Client Kickoff: Acme Corp",
                                        desc: '"Let\'s aim for next Tuesday at 10 AM EST to discuss the project scope." - Sarah Jenkins',
                                        time: "Tue, Oct 17 • 10:00 AM - 11:00 AM",
                                    },
                                    {
                                        iconBg: "bg-[#d3e4fe]", iconColor: "text-[#0b1c30]", icon: "chat",
                                        title: "Quick Sync with Dev Team",
                                        desc: 'Mentioned in #general channel: "Can we huddle tomorrow afternoon to unblock the API issue?"',
                                        time: "AI suggests: Oct 13 • 2:00 PM",
                                    },
                                ].map((item, i) => (
                                    <div key={i} className="bg-[#eff4ff] rounded-lg p-[8px] border border-[#c6c6cd]/30 relative group">
                                        <div className="absolute top-2 right-2 text-[#45464d]/50 group-hover:text-[#000000] transition-colors cursor-pointer">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </div>
                                        <div className="flex items-start gap-3 mb-2">
                                            <div className={`w-8 h-8 rounded-full ${item.iconBg} flex items-center justify-center shrink-0`}>
                                                <span className={`material-symbols-outlined ${item.iconColor} text-[16px]`}>{item.icon}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-[#0b1c30]">{item.title}</h4>
                                                <p className="text-[12px] text-[#45464d]/80 line-clamp-2 mt-0.5">{item.desc}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3 bg-white p-2 rounded border border-[#c6c6cd]/20">
                                            <span className="material-symbols-outlined text-sm text-[#45464d]">schedule</span>
                                            <span className="text-[12px] font-medium text-[#0b1c30]">{item.time}</span>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button className="flex-1 bg-[#8455ef] text-white text-[13px] font-medium py-1.5 rounded-md hover:bg-[#d0bcff] hover:text-[#5516be] transition-colors shadow-sm">Add to Calendar</button>
                                            <button className="px-3 bg-[#d3e4fe] text-[#45464d] text-[13px] font-medium py-1.5 rounded-md hover:bg-[#d3e4fe] transition-colors">Edit</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mini Calendar */}
                        <div className="bg-white rounded-xl border border-[#c6c6cd]/40 shadow-sm p-[16px]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[14px] font-bold text-[#0b1c30]">October 2023</h3>
                                <div className="flex gap-1">
                                    <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#dce9ff] text-[#45464d]">
                                        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                                    </button>
                                    <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#dce9ff] text-[#45464d]">
                                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-[12px] font-medium">
                                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                                    <div key={i} className="text-[#45464d]/60 py-1">{d}</div>
                                ))}
                                <div className="text-[#45464d]/30 py-1 hover:bg-[#e5eeff] rounded cursor-pointer">1</div>
                                {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                    <div key={n} className="text-[#0b1c30] py-1 hover:bg-[#e5eeff] rounded cursor-pointer">{n}</div>
                                ))}
                                <div className="text-[#6b38d4] py-1 hover:bg-[#e5eeff] rounded cursor-pointer font-bold">10</div>
                                <div className="text-[#0b1c30] py-1 hover:bg-[#e5eeff] rounded cursor-pointer">11</div>
                                <div className="bg-[#8455ef] text-white py-1 rounded cursor-pointer font-bold shadow-sm">12</div>
                                <div className="text-[#0b1c30] py-1 hover:bg-[#e5eeff] rounded cursor-pointer">13</div>
                                <div className="text-[#0b1c30] py-1 hover:bg-[#e5eeff] rounded cursor-pointer">14</div>
                            </div>
                        </div>

                        {/* Protected Time */}
                        <div className="bg-gradient-to-br from-[#eff4ff] to-white rounded-xl border border-[#c6c6cd]/40 shadow-sm p-[16px]">
                            <h3 className="text-[14px] font-bold text-[#0b1c30] mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-[#191c1e]">psychology</span>
                                Protected Time
                            </h3>
                            <div className="bg-[#d3e4fe]/50 rounded-lg p-3 text-sm">
                                <p className="text-[#45464d] mb-2 leading-relaxed">
                                    AI has blocked <strong className="text-[#0b1c30]">2 hours</strong> of deep work time tomorrow afternoon based on your task load.
                                </p>
                                <button className="text-[#6b38d4] font-medium text-[13px] hover:underline">Review schedule</button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
