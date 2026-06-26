import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import { getProfile, updateProfile } from '../services/userService'
import api from '../services/api'

const BASE_URL = 'http://localhost:5283'

export default function Settings() {
    const [twoFactor, setTwoFactor] = useState(false)
    const [emailAlerts, setEmailAlerts] = useState(true)

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [timezone, setTimezone] = useState('')
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)

    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [saveMsg, setSaveMsg] = useState('')
    const [saveError, setSaveError] = useState('')

    const fileInputRef = useRef(null)

    // ─── Load profile ─────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getProfile()
                const profile = res.data.data ?? res.data
                setName(profile.name ?? '')
                setEmail(profile.email ?? '')
                setTimezone(profile.timezone ?? '')
                if (profile.avatarUrl) {
                    setAvatarUrl(profile.avatarUrl)
                    setPreviewUrl(`${BASE_URL}${profile.avatarUrl}`)
                }
            } catch (err) {
                console.error('Lấy profile thất bại', err)
            }
        }
        fetchProfile()
    }, [])

    // ─── Chọn ảnh → preview tức thì + upload ─────────────────────────────────
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setPreviewUrl(URL.createObjectURL(file))
        setSaveMsg('')
        setSaveError('')
        setUploading(true)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await api.post('/users/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            const newUrl = res.data.data.avatarUrl
            setAvatarUrl(newUrl)
            setPreviewUrl(`${BASE_URL}${newUrl}?t=${Date.now()}`)
            setSaveMsg('Cập nhật ảnh đại diện thành công!')
        } catch (err) {
            setSaveError(err.response?.data?.messenger || 'Upload ảnh thất bại!')
            setPreviewUrl(avatarUrl ? `${BASE_URL}${avatarUrl}` : null)
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    // ─── Lưu Name & Timezone ─────────────────────────────────────────────────
    const handleSaveProfile = async () => {
        if (!name.trim()) {
            setSaveError('Vui lòng nhập tên!')
            return
        }
        setSaving(true)
        setSaveMsg('')
        setSaveError('')
        try {
            await updateProfile(name, timezone)
            localStorage.setItem('userName', name)
            setSaveMsg('Cập nhật thành công!')
        } catch (err) {
            setSaveError(err.response?.data?.messenger || 'Cập nhật thất bại!')
        } finally {
            setSaving(false)
        }
    }

    const avatarSrc = previewUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=6b38d4&color=fff&size=128`

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

            <Sidebar />

            <main className="ml-[280px] min-h-[calc(100vh-64px)] cognitive-flow-bg p-[24px]">
                <div className="max-w-4xl mx-auto space-y-[24px]">

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
                            <div className="flex flex-col items-center gap-[12px]">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full border-4 border-[#dce9ff] overflow-hidden shadow-sm">
                                        <img
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                            src={avatarSrc}
                                        />
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                                                <svg className="animate-spin w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="absolute bottom-0 right-0 p-[8px] bg-[#6b38d4] text-white rounded-full shadow-lg group-hover:scale-110 transition-transform disabled:opacity-60"
                                        title="Thay ảnh đại diện"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                                    </button>
                                </div>

                                {/* Input file ẩn */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                <p className="text-xs text-[#45464d] font-medium uppercase tracking-wider">
                                    {uploading ? 'Đang tải lên...' : 'Change Photo'}
                                </p>
                                <p className="text-[11px] text-[#45464d]/60">JPG, PNG, WebP · Tối đa 10MB</p>
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
                                        disabled
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

                                {saveMsg && <p className="text-green-600 text-sm flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">check_circle</span>{saveMsg}</p>}
                                {saveError && <p className="text-[#ba1a1a] text-sm flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">error</span>{saveError}</p>}

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

                    {/* Toggle Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                        <div
                            className="glass-card rounded-xl p-[24px] flex items-center justify-between cursor-pointer hover:bg-[#eff4ff] transition-colors"
                            onClick={() => setTwoFactor(!twoFactor)}
                        >
                            <div>
                                <p className="text-[14px] font-bold text-[#000000]">Two-Factor Auth</p>
                                <p className="text-xs text-[#45464d]">Highly recommended for data safety.</p>
                            </div>
                            <div className={`w-12 h-6 rounded-full p-[4px] relative transition-colors duration-200 ${twoFactor ? "bg-[#8455ef]" : "bg-[#c6c6cd]"}`}>
                                <div className={`absolute top-[4px] w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${twoFactor ? "right-[4px]" : "left-[4px]"}`}></div>
                            </div>
                        </div>

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