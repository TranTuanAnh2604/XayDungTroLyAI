import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';

export default function Voice() {
    const barsRef = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        const interval = setInterval(() => {
            barsRef.current.forEach((bar) => {
                if (bar) {
                    const randomScale = 0.5 + Math.random();
                    bar.style.transform = `scaleY(${randomScale})`;
                }
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const waveformBars = [
        { h: "h-8", delay: "0.1s" },
        { h: "h-12", delay: "0.3s" },
        { h: "h-20", delay: "0.2s" },
        { h: "h-24", delay: "0.5s" },
        { h: "h-16", delay: "0.4s" },
        { h: "h-20", delay: "0.1s" },
        { h: "h-10", delay: "0.6s" },
        { h: "h-14", delay: "0.3s" },
        { h: "h-8", delay: "0.2s" },
    ];

    return (
        <>
            <style>{`
        .waveform-bar {
          animation: bounce 1s infinite ease-in-out;
          transform-origin: bottom;
          transition: transform 0.4s ease;
        }
        @keyframes bounce {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .pulse-ring {
          animation: pulse-anim 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-anim {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .5; transform: scale(1.1); }
        }
        .typing-cursor::after {
          content: '|';
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>

            <div
                className="flex h-screen w-full overflow-hidden"
                style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#f8f9ff", color: "#0b1c30" }}
            >
                {/* Sidebar */}
                <nav className="w-[280px] h-full flex flex-col border-r border-[#c6c6cd] bg-[#eff4ff] fixed left-0 top-0 bottom-0 z-40 hidden md:flex">
                    <div className="p-[24px] flex items-center gap-[8px]">
                        <div className="w-10 h-10 rounded-full bg-[#8455ef] flex items-center justify-center text-white">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>robot_2</span>
                        </div>
                        <div>
                            <h1 className="text-[24px] font-bold text-[#000000]">AI Assistant</h1>
                            <span className="text-[14px] font-medium text-[#45464d] block">Enterprise Edition</span>
                        </div>
                    </div>

                    <div className="px-[16px] mb-[16px]">
                        <button onClick={() => navigate('/chat')} className="w-full bg-[#000000] text-white rounded-full py-[8px] flex items-center justify-center gap-[4px] text-[14px] font-medium hover:bg-[#565e74] transition-colors">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            New Chat
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

                    <div className="p-[16px] mt-auto flex flex-col gap-[4px] border-t border-[#c6c6cd]">
                        {[{ icon: "settings", label: "Settings" }, { icon: "help", label: "Help" }].map(({ icon, label }) => (
                            <a key={label} href="#" className="flex items-center gap-[8px] px-[8px] py-[8px] text-[#45464d] hover:bg-[#d3e4fe] transition-colors rounded-lg text-[14px] font-medium">
                                <span className="material-symbols-outlined">{icon}</span>
                                {label}
                            </a>
                        ))}
                    </div>
                </nav>

                {/* Main */}
                <div className="flex-1 ml-0 md:ml-[280px] flex flex-col h-full bg-[#f8f9ff] relative overflow-hidden">
                    {/* Ambient glow */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#6b38d4] opacity-5 blur-[120px] rounded-full mix-blend-multiply"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#000000] opacity-5 blur-[100px] rounded-full mix-blend-multiply"></div>
                    </div>

                    {/* TopBar */}
                    <header className="flex justify-between items-center w-full px-[24px] py-[8px] sticky top-0 z-30 bg-[#f8f9ff]/70 backdrop-blur-xl border-b border-[#c6c6cd] shadow-sm mx-auto">
                        <div className="flex items-center gap-[16px]">
                            <span className="text-[24px] font-extrabold text-[#000000] md:hidden">AI Assistant</span>
                            <div className="hidden md:flex focus-within:ring-2 focus-within:ring-[#6b38d4] rounded-full bg-[#e5eeff] px-[8px] py-[4px] items-center max-w-xs transition-all">
                                <span className="material-symbols-outlined text-[#45464d] ml-[4px]">search</span>
                                <input
                                    className="bg-transparent border-none focus:ring-0 focus:outline-none text-[#0b1c30] text-[16px] placeholder:text-[#45464d] w-full"
                                    placeholder="Search..."
                                    type="text"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-[8px]">
                            <button className="p-[4px] text-[#45464d] hover:text-[#000000] transition-colors rounded-full hover:bg-[#e5eeff]">
                                <span className="material-symbols-outlined">notifications</span>
                            </button>
                            <button className="p-[4px] text-[#45464d] hover:text-[#000000] transition-colors rounded-full hover:bg-[#e5eeff]">
                                <span className="material-symbols-outlined">history</span>
                            </button>
                            <button className="w-8 h-8 rounded-full bg-[#e0e3e5] flex items-center justify-center overflow-hidden border border-[#c6c6cd] ml-[4px] hover:ring-2 hover:ring-[#6b38d4] transition-all">
                                <span className="material-symbols-outlined text-[#45464d]">person</span>
                            </button>
                        </div>
                    </header>

                    {/* Voice Canvas */}
                    <main className="flex-1 flex flex-col items-center justify-between p-[24px] md:p-[64px] relative z-10 max-w-[1000px] w-full mx-auto">
                        <div className="flex-1"></div>

                        {/* Transcription */}
                        <div className="w-full max-w-3xl text-center mb-[40px]">
                            <p className="text-[14px] font-semibold text-[#6b38d4] uppercase tracking-widest mb-[16px]">Listening...</p>
                            <h2
                                className="text-[48px] font-light leading-tight text-[#0b1c30] min-h-[120px] typing-cursor"
                            >
                                Prepare the quarterly financial report and summarize the key metrics for the executive meeting...
                            </h2>
                        </div>

                        {/* Waveform */}
                        <div className="flex items-end justify-center gap-1 h-24 mb-[64px] w-full">
                            {waveformBars.map((bar, i) => (
                                <div
                                    key={i}
                                    ref={(el) => (barsRef.current[i] = el)}
                                    className={`w-2 bg-[#6b38d4] rounded-full ${bar.h} waveform-bar`}
                                    style={{ animationDelay: bar.delay }}
                                ></div>
                            ))}
                        </div>

                        {/* Control Bar */}
                        <div className="bg-[#f8f9ff]/80 backdrop-blur-xl border border-[#c6c6cd] shadow-sm rounded-full px-[24px] py-[8px] flex items-center justify-center gap-[24px] mb-[24px]">
                            {/* Mute */}
                            <button className="w-12 h-12 rounded-full flex items-center justify-center text-[#45464d] hover:bg-[#e5eeff] hover:text-[#000000] transition-all">
                                <span className="material-symbols-outlined">mic_off</span>
                            </button>

                            {/* Main Mic */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#6b38d4] rounded-full pulse-ring opacity-50"></div>
                                <button className="w-16 h-16 rounded-full bg-[#6b38d4] text-white shadow-md flex items-center justify-center relative z-10 hover:opacity-90 transition-transform active:scale-95">
                                    <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
                                </button>
                            </div>

                            {/* End Call */}
                            <button className="w-12 h-12 rounded-full flex items-center justify-center bg-[#ffdad6] text-[#93000a] hover:bg-[#ba1a1a] hover:text-white transition-all active:scale-95">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>call_end</span>
                            </button>
                        </div>

                        <div className="flex-1"></div>
                    </main>
                </div>
            </div>
        </>
    );
}
