import { useRef } from "react";
import Sidebar from "../components/Sidebar";

export default function Chat() {
    const textareaRef = useRef(null);
    const handleInput = () => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = "";
            el.style.height = el.scrollHeight + "px";
        }
    };

    return (
        <div
            className="flex h-screen w-full overflow-hidden text-[#0b1c30]"
            style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#f8f9ff" }}
        >
            {/* Sidebar */}
            < Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:ml-[280px] w-full relative bg-[#f8f9ff]">
                {/* Top Bar */}
                <header className="flex justify-between items-center w-full px-[24px] py-[8px] sticky top-0 z-30 bg-[#f8f9ff]/70 backdrop-blur-xl border-b border-[#c6c6cd] shadow-sm">
                    <div className="flex items-center gap-[16px] w-full max-w-[600px]">
                        <div className="relative w-full max-w-md focus-within:ring-2 focus-within:ring-[#6b38d4] rounded-lg transition-all">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d]">
                                search
                            </span>
                            <input
                                className="w-full pl-[40px] pr-[8px] py-[8px] bg-white border border-[#c6c6cd] rounded-lg text-[16px] text-[#0b1c30] placeholder:text-[#76777d] focus:outline-none focus:border-[#6b38d4]"
                                placeholder="Search chats, prompts, or files..."
                                type="text"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-[8px]">
                        <button className="p-[8px] rounded-full text-[#45464d] hover:text-[#000000] hover:bg-[#dce9ff] transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <button className="p-[8px] rounded-full text-[#45464d] hover:text-[#000000] hover:bg-[#dce9ff] transition-colors">
                            <span className="material-symbols-outlined">history</span>
                        </button>
                        <div className="ml-[8px] pl-[8px] border-l border-[#c6c6cd]">
                            <img
                                alt="User Profile"
                                className="w-9 h-9 rounded-full border border-[#c6c6cd] shadow-sm cursor-pointer hover:ring-2 hover:ring-[#6b38d4] transition-all"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB__r4eEtkYNDnDuAP4BAtDM5aJKLGMsUkAKk3_pXI9FqeJqpk74eYyZ-86xfiGW_e_lKUbgJQTni6Qn3M0tf1xzeNdZ2F3DWl4lxiyqdgHhF4s9rx7PqBOPKzXTB5QSMgBKvG2k9Abdhs9ffyH44oPI7qLTrl1gVI-3ESPBMwDSG9yJWh-Y0MUaE8MpcLXuiKSt4thEkvF87i-9KnEikCsjO_Zcx7_7G4j5fTnKk8EkBPnoJQ9lxdopo7xR219ssRToAndckcbdQo"
                            />
                        </div>
                    </div>
                </header>

                {/* Chat Canvas */}
                <main className="flex-1 overflow-y-auto p-[24px] flex flex-col gap-[40px] pb-[140px]">
                    <div className="w-full max-w-[900px] mx-auto flex flex-col gap-[24px]">
                        {/* Date Separator */}
                        <div className="flex justify-center">
                            <span className="px-[16px] py-[4px] rounded-full bg-[#eff4ff] text-[#45464d] text-[12px] font-medium">
                                Today, 10:24 AM
                            </span>
                        </div>

                        {/* User Message */}
                        <div className="flex gap-[16px] justify-end max-w-[85%] self-end">
                            <div className="bg-[#131b2e] text-[#7c839b] rounded-2xl rounded-tr-sm p-[16px] shadow-sm border border-[#c6c6cd]/20">
                                <p className="text-[16px] leading-[1.5]">
                                    Can you help me write a Python script to parse a JSON file containing user data and
                                    extract all email addresses? The JSON structure has an array of user objects, each
                                    with a 'contact_info' nested object.
                                </p>
                            </div>
                            <img
                                alt="User"
                                className="w-8 h-8 rounded-full mt-auto mb-1"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7H_O_ofbbJA8S0e7wLsQEpoZ84JMr5LcmXABn6PvpLTu8BG647Eg3jm0BzfJup86VaiihqQf2nX99O839buAlmgomH6sk9vE7C9Xx54b2ZEzkZeAKOZXnvhSTSaCgAaet4biaZt3gxgjB4pSP5QZox-_2YcD06OnJFTfAjYuLULLna-wgj5gr0VEKRGjweqV3y133vl4v9xtXRgNn1EmV7Rpns-lqfPN2lU1kvoagVbqtlhl-FdJQcxHKQFMF3lohTbmjkbo-7ig"
                            />
                        </div>

                        {/* AI Message */}
                        <div className="flex gap-[16px] max-w-[95%]">
                            <div className="w-8 h-8 rounded-full bg-[#6b38d4] flex-shrink-0 flex items-center justify-center text-white mt-1">
                                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    robot_2
                                </span>
                            </div>
                            <div className="bg-white text-[#0b1c30] border border-[#c6c6cd]/50 rounded-2xl rounded-tl-sm p-[16px] shadow-sm flex flex-col gap-[16px] w-full">
                                <p className="text-[16px] leading-[1.5]">
                                    Certainly. Here is a Python script using the built-in <code>json</code> module to
                                    parse your file and extract the email addresses.
                                </p>

                                {/* Code Block */}
                                <div className="bg-[#191c1e] rounded-lg overflow-hidden border border-[#c4c7c9]/30">
                                    <div className="flex justify-between items-center px-[16px] py-[4px] bg-[#c4c7c9]/10 border-b border-[#c4c7c9]/20">
                                        <span className="text-[12px] font-medium text-[#818486] uppercase tracking-wider">Python</span>
                                        <button className="flex items-center gap-[4px] text-[#818486] hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                            <span className="text-[12px] font-medium">Copy code</span>
                                        </button>
                                    </div>
                                    <div className="p-[16px] overflow-x-auto">
                                        <pre className="text-[13px] leading-relaxed" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                                            {`import json

def extract_emails(filepath):
    emails = []
    try:
        with open(filepath, 'r') as file:
            data = json.load(file)
            for user in data:
                contact_info = user.get('contact_info', {})
                email = contact_info.get('email')
                if email:
                    emails.append(email)
    except FileNotFoundError:
        print(f"Error: File not found at {filepath}")
    except json.JSONDecodeError:
        print("Error: Invalid JSON format.")
        
    return emails

# Example usage:
# extracted = extract_emails('users.json')
# print(extracted)`}
                                        </pre>
                                    </div>
                                </div>

                                <p className="text-[16px] leading-[1.5] text-[#45464d]">
                                    This script safely handles potential <code>FileNotFoundError</code> and{" "}
                                    <code>JSONDecodeError</code>. It iterates through the list and safely retrieves
                                    nested keys using the <code>.get()</code> method to avoid <code>KeyError</code>{" "}
                                    exceptions.
                                </p>

                                {/* AI Actions */}
                                <div className="flex items-center gap-[8px] mt-[8px] pt-[8px] border-t border-[#c6c6cd]/20">
                                    {[
                                        { icon: "thumb_up", title: "Good response" },
                                        { icon: "thumb_down", title: "Bad response" },
                                        { icon: "refresh", title: "Regenerate" },
                                    ].map(({ icon, title }) => (
                                        <button
                                            key={icon}
                                            title={title}
                                            className="p-[4px] rounded text-[#45464d] hover:bg-[#dce9ff] transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">{icon}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Input Area */}
                <div className="absolute bottom-0 w-full px-[24px] pb-[24px] pt-[40px] bg-gradient-to-t from-[#f8f9ff] via-[#f8f9ff] to-transparent pointer-events-none">
                    <div className="w-full max-w-[900px] mx-auto pointer-events-auto">
                        {/* Suggestion Chips */}
                        <div className="flex gap-[8px] mb-[16px] overflow-x-auto pb-[4px]">
                            {["Explain this code", "Optimize performance", "Write unit tests"].map((label) => (
                                <button
                                    key={label}
                                    className="px-[16px] py-[4px] rounded-full bg-[#e9ddff] text-[#5516be] text-[13px] font-medium whitespace-nowrap hover:bg-[#d0bcff] transition-colors border border-[#d0bcff]/50"
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Input Box */}
                        <div className="rounded-xl border border-[#c6c6cd]/50 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] flex flex-col focus-within:ring-2 focus-within:ring-[#6b38d4]/50 focus-within:border-[#6b38d4] transition-all bg-white"
                            style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
                        >
                            <textarea
                                ref={textareaRef}
                                className="w-full bg-transparent border-none focus:ring-0 resize-none p-[16px] text-[16px] text-[#0b1c30] placeholder:text-[#c6c6cd] focus:outline-none"
                                style={{ maxHeight: "150px", minHeight: "56px" }}
                                placeholder="Message AI Assistant..."
                                rows={1}
                                onInput={handleInput}
                            />
                            <div className="flex justify-between items-center p-[8px] bg-[#eff4ff]/50 rounded-b-xl border-t border-[#c6c6cd]/20">
                                <div className="flex items-center gap-[4px]">
                                    {[
                                        { icon: "attach_file", title: "Attach file" },
                                        { icon: "mic", title: "Voice input" },
                                    ].map(({ icon, title }) => (
                                        <button
                                            key={icon}
                                            title={title}
                                            className="p-[8px] rounded-lg text-[#45464d] hover:bg-[#dce9ff] hover:text-[#000000] transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">{icon}</span>
                                        </button>
                                    ))}
                                    <button className="flex items-center gap-[4px] px-[8px] py-[4px] ml-[8px] rounded-md border border-[#c6c6cd]/50 text-[#45464d] hover:bg-[#dce9ff] transition-colors">
                                        <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                        <span className="text-[12px] font-medium">Project Context</span>
                                    </button>
                                </div>
                                <button className="p-[8px] rounded-lg bg-[#000000] text-white hover:bg-[#000000]/90 transition-all shadow-sm active:scale-95 flex items-center justify-center h-10 w-10">
                                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        send
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="text-center mt-[4px]">
                            <span className="text-[11px] text-[#76777d]">
                                AI Assistant may produce inaccurate information about people, places, or facts.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
