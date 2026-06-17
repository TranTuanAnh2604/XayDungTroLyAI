import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { getProfile, updateProfile, changePassword } from '../services/userService'
export default function Settings() {
    const [twoFactor, setTwoFactor] = useState(false)
    const [emailAlerts, setEmailAlerts] = useState(true)
    const [showPassword, setShowPassword] = useState(false)

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [timezone, setTimezone] = useState('')
    const [saving, setSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState('')
    const [saveError, setSaveError] = useState('')

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [savingPassword, setSavingPassword] = useState(false)
    const [passwordMsg, setPasswordMsg] = useState('')
    const [passwordError, setPasswordError] = useState('')
    // Lấy profile khi vào trang
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getProfile()
                setName(res.data.name)
                setEmail(res.data.email)
                setTimezone(res.data.timezone)
            } catch (err) {
                console.error('Lấy profile thất bại', err)
            }
        }
        fetchProfile()
    }, [])

    // Lưu profile
    const handleSaveProfile = async () => {
        // Validate tên không được để trống
        if (!name.trim()) {
            setSaveError('Vui lòng nhập tên!')
            return
        }

        setSaving(true)
        setSaveMsg('')
        setSaveError('')
        try {
            await updateProfile(name, timezone)
            // Cập nhật lại tên trong localStorage
            localStorage.setItem('userName', name)
            setSaveMsg('Cập nhật thành công!')
        } catch (err) {
            setSaveError(err.response?.data?.messenger || 'Cập nhật thất bại!')
        } finally {
            setSaving(false)
        }
    }
    //Cập nhật mật khẩu
    const handleChangePassword = async () => {
        setSavingPassword(true)
        setPasswordMsg('')
        setPasswordError('')
        try {
            await changePassword(currentPassword, newPassword, confirmPassword)
            setPasswordMsg('Đổi mật khẩu thành công!')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err) {
            console.log('Full error response:', err.response?.data)
            setPasswordError(err.response?.data?.messenger || 'Đổi mật khẩu thất bại!')
        } finally {
            setSavingPassword(false)
        }
    }
    return (
        <div
            className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen overflow-x-hidden"
            style={{ fontFamily: "Inter, sans-serif" }}
        >
            <style>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid #E2E8F0;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
                }
                .cognitive-flow-bg {
                    background-color: #F8FAFC;
                    background-image:
                        radial-gradient(at 0% 0%, rgba(107, 56, 212, 0.05) 0px, transparent 50%),
                        radial-gradient(at 100% 100%, rgba(132, 85, 239, 0.05) 0px, transparent 50%);
                }
            `}</style>

            {/* Sidebar dùng chung */}
            <Sidebar />

            {/* TopBar */}
            <header className="flex justify-between items-center w-full px-[24px] py-[8px] sticky top-0 z-30 ml-[280px] max-w-[calc(100%-280px)] bg-[#f8f9ff]/70 backdrop-blur-xl border-b border-[#c6c6cd] shadow-sm">
                <div className="flex items-center gap-[24px]">
                    <div className="relative focus-within:ring-2 focus-within:ring-[#6b38d4] rounded-lg">
                        <span className="material-symbols-outlined absolute left-[16px] top-1/2 -translate-y-1/2 text-[#76777d]">search</span>
                        <input
                            className="pl-[48px] pr-[24px] py-[8px] bg-[#eff4ff] border-none rounded-lg w-[320px] text-[14px] font-medium focus:ring-0 focus:outline-none"
                            placeholder="Search settings..."
                            type="text"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-[24px]">
                    <button className="text-[#45464d] hover:text-[#000000] transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <button className="text-[#45464d] hover:text-[#000000] transition-colors">
                        <span className="material-symbols-outlined">history</span>
                    </button>
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#8455ef] p-[2px]">
                        <img
                            alt="User Profile"
                            className="w-full h-full object-cover rounded-full"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEC2c76nlaHeBZbWof9wFO45uddnIJ6GUL8xGo25DUrMw7I7p8mwgxPquMVWrJyZQVmL6Flo8cE0Kfqt2Ru0YhHk4Gae0S9mKHDcYUxFtgD8PyuGCcUiLnegNmro1_26HJ61Rqfjr1G6BEIBuP-FIRXeWhSH5Ylvem4AAa3cLGCC3tIqpYqtEEUVGH7paG-Lwp6wdl4VEzcopTmmyLwIW6H1iPtlfFh2Zrj541mtYw9Z6zbPY-pzUXwyCeZrQdKI8rpfqzd2eRUAY"
                        />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="ml-[280px] min-h-[calc(100vh-64px)] cognitive-flow-bg p-[24px]">
                <div className="max-w-4xl mx-auto space-y-[24px]">

                    {/* Page Header */}
                    <header className="mb-[40px]">
                        <h2 className="text-[32px] font-semibold leading-[1.2] tracking-[-0.01em] text-[#000000] mb-[4px]">Settings</h2>
                        <p className="text-[#45464d] text-[16px]">Manage your account preferences and security configuration.</p>
                    </header>

                    {/* Profile Section */}
                    <section className="glass-card rounded-xl p-[40px]">
                        <div className="flex items-center gap-[16px] mb-[24px]">
                            <div className="w-12 h-12 rounded-lg bg-[#131b2e] flex items-center justify-center text-[#7c839b]">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                            </div>
                            <div>
                                <h3 className="text-[24px] font-semibold text-[#000000]">Profile Information</h3>
                                <p className="text-[14px] text-[#45464d]">Update your personal details and avatar.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-[40px]">
                            {/* Avatar */}
                            <div className="flex flex-col items-center gap-[16px]">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full border-4 border-[#dce9ff] overflow-hidden shadow-sm">
                                        <img
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3awqcUNJ6GIHU-9HUgRnB0AWUtb8vxCCpwOggUOxQUrJngethTk-Ul11cEQMinDv7yt6rXbUUE1Xzx8framr72MMMu8R2Xd_5hSmqe-copVBXnQgKFU3QFJBwx-uCldOL4B6iy-MxqZ7rg4HszDTX2ZADMqLUba30jda0Yf5xsCgXhHaAAMKlMBCACvMb3svJg_a39zZOG9ajjbULjTLPmYYfoaXo8hzTfvC71B6k5B6BA09XKMd3cKOSrqT-osbox5p0e9pP8s4"
                                        />
                                    </div>
                                    <button className="absolute bottom-0 right-0 p-[8px] bg-[#6b38d4] text-white rounded-full shadow-lg group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                                    </button>
                                </div>
                                <p className="text-xs text-[#45464d] font-medium uppercase tracking-wider">Change Photo</p>
                            </div>

                            {/* Fields */}
                            <div className="md:col-span-2 space-y-[16px]">
                                <div className="space-y-[4px]">
                                    <label className="text-[14px] font-medium text-[#45464d]">Full Name</label>
                                    <input
                                        className="w-full px-[16px] py-[8px] bg-white border border-[#c6c6cd] rounded-lg focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] outline-none transition-all text-[16px]"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-[4px]">
                                    <label className="text-[14px] font-medium text-[#45464d]">Email Address</label>
                                    <input
                                        className="w-full px-[16px] py-[8px] bg-white border border-[#c6c6cd] rounded-lg outline-none text-[16px] opacity-60 cursor-not-allowed"
                                        type="email"
                                        value={email}
                                        disabled  // email không cho sửa
                                    />
                                </div>
                                <div className="space-y-[4px]">
                                    <label className="text-[14px] font-medium text-[#45464d]">Timezone</label>
                                    <input
                                        className="w-full px-[16px] py-[8px] bg-white border border-[#c6c6cd] rounded-lg focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] outline-none transition-all text-[16px]"
                                        type="text"
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                    />
                                </div>

                                {/* Thông báo */}
                                {saveMsg && <p className="text-green-600 text-sm">{saveMsg}</p>}
                                {saveError && <p className="text-[#ba1a1a] text-sm">{saveError}</p>}

                                <div className="pt-[8px] flex justify-end">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="px-[40px] py-[8px] bg-[#000000] text-white rounded-lg text-[14px] font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {saving ? 'Đang lưu...' : 'Save Profile'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Security Section */}
                    <section className="glass-card rounded-xl p-[40px]">
                        <div className="flex items-center gap-[16px] mb-[24px]">
                            <div className="w-12 h-12 rounded-lg bg-[#e9ddff] text-[#23005c] flex items-center justify-center">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                            </div>
                            <div>
                                <h3 className="text-[24px] font-semibold text-[#000000]">Security</h3>
                                <p className="text-[14px] text-[#45464d]">Manage your account password and security settings.</p>
                            </div>
                        </div>

                        <div className="max-w-2xl space-y-[24px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">

                                {/* Current Password */}
                                <div className="space-y-[4px] md:col-span-2">
                                    <label className="text-[14px] font-medium text-[#45464d]">Current Password</label>
                                    <div className="relative">
                                        <input
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            type={showPassword ? "text" : "password"}
                                            className="w-full px-[16px] py-[8px] bg-white border border-[#c6c6cd] rounded-lg focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] outline-none transition-all text-[16px]"
                                        />
                                        <span
                                            className="material-symbols-outlined absolute right-[16px] top-1/2 -translate-y-1/2 text-[#76777d] cursor-pointer hover:text-[#000000]"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? "visibility" : "visibility_off"}
                                        </span>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div className="space-y-[4px]">
                                    <label className="text-[14px] font-medium text-[#45464d]">New Password</label>
                                    <input
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        type="password"
                                        className="w-full px-[16px] py-[8px] bg-white border border-[#c6c6cd] rounded-lg focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] outline-none transition-all text-[16px]"
                                    />
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-[4px]">
                                    <label className="text-[14px] font-medium text-[#45464d]">Confirm New Password</label>
                                    <input
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        type="password"
                                        className="w-full px-[16px] py-[8px] bg-white border border-[#c6c6cd] rounded-lg focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] outline-none transition-all text-[16px]"
                                    />
                                </div>

                            </div> {/* ← đóng grid */}

                            {/* Thông báo + Nút */}
                            <div className="flex items-center justify-between pt-[16px] border-t border-[#c6c6cd]/30">
                                <div className="flex flex-col gap-[4px]">
                                    <div className="flex items-center gap-[8px]">
                                        <span className="material-symbols-outlined text-[#6b38d4] text-[20px]">info</span>
                                        <p className="text-xs text-[#45464d]">Password must be at least 8 characters long.</p>
                                    </div>
                                    {passwordMsg && <p className="text-green-600 text-sm ml-[28px]">{passwordMsg}</p>}
                                    {passwordError && <p className="text-[#ba1a1a] text-sm ml-[28px]">{passwordError}</p>}
                                </div>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={savingPassword}
                                    className="px-[40px] py-[8px] bg-[#6b38d4] text-white rounded-lg text-[14px] font-medium hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50"
                                >
                                    {savingPassword ? 'Đang lưu...' : 'Update Password'}
                                </button>
                            </div>

                        </div> {/* ← đóng space-y */}
                    </section>

                    {/* Toggle Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                        {/* Two Factor */}
                        <div
                            className="glass-card rounded-xl p-[24px] flex items-center justify-between cursor-pointer hover:bg-[#eff4ff] transition-colors"
                            onClick={() => setTwoFactor(!twoFactor)}
                        >
                            <div className="flex items-center gap-[16px]">
                                <div>
                                    <p className="text-[14px] font-bold text-[#000000]">Two-Factor Auth</p>
                                    <p className="text-xs text-[#45464d]">Highly recommended for data safety.</p>
                                </div>
                            </div>
                            {/* Toggle */}
                            <div className={`w-12 h-6 rounded-full p-[4px] relative transition-colors duration-200 ${twoFactor ? "bg-[#8455ef]" : "bg-[#c6c6cd]"}`}>
                                <div className={`absolute top-[4px] w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${twoFactor ? "right-[4px]" : "left-[4px]"}`}></div>
                            </div>
                        </div>

                        {/* Email Alerts */}
                        <div
                            className="glass-card rounded-xl p-[24px] flex items-center justify-between cursor-pointer hover:bg-[#eff4ff] transition-colors"
                            onClick={() => setEmailAlerts(!emailAlerts)}
                        >
                            <div className="flex items-center gap-[16px]">
                                <div className="w-10 h-10 rounded-full bg-[#d3e4fe] flex items-center justify-center text-[#000000]">
                                    <span className="material-symbols-outlined">notifications_active</span>
                                </div>
                                <div>
                                    <p className="text-[14px] font-bold text-[#000000]">Email Alerts</p>
                                    <p className="text-xs text-[#45464d]">Get notified of suspicious activity.</p>
                                </div>
                            </div>
                            {/* Toggle */}
                            <div className={`w-12 h-6 rounded-full p-[4px] relative transition-colors duration-200 ${emailAlerts ? "bg-[#8455ef]" : "bg-[#c6c6cd]"}`}>
                                <div className={`absolute top-[4px] w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${emailAlerts ? "right-[4px]" : "left-[4px]"}`}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}