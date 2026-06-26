import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { googleLogin, sendOtp} from '../services/authService'

export default function Login() {
    const navigate = useNavigate()
    const [gmail, setGmail] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleContinue = async () => {
        if (!gmail.trim()) {
            setError('Vui lòng nhập địa chỉ Gmail.')
            return
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(gmail)) {
            setError('Địa chỉ email không hợp lệ.')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await sendOtp(gmail)

            if (res.data.requireOtp === false) {
                // User đã verify trước đó -> vào thẳng dashboard, không cần OTP
                localStorage.setItem('accessToken', res.data.data.accessToken)
                localStorage.setItem('refreshToken', res.data.data.refreshToken)
                localStorage.setItem('userName', res.data.data.name)
                navigate('/dashboard')
            } else {
                // Lần đầu hoặc chưa verify -> qua trang nhập OTP
                navigate('/verify-otp', { state: { gmail } })
            }
        } catch (otpErr) {
            console.log('OTP Error:', otpErr.response?.status, otpErr.response?.data)
            setError(otpErr.response?.data?.message || 'Không thể gửi mã xác thực. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleContinue()
    }

    const handleGoogleLogin = useGoogleLogin({
        flow: 'auth-code',
        scope: 'openid profile email https://www.googleapis.com/auth/gmail.readonly',
        onSuccess: async (tokenResponse) => {
            setLoading(true)
            setError('')
            try {
                const res = await googleLogin(tokenResponse.code)
                localStorage.setItem('accessToken', res.data.accessToken)
                localStorage.setItem('refreshToken', res.data.refreshToken)
                localStorage.setItem('userName', res.data.name)
                navigate('/dashboard')
            } catch (err) {
                setError(err.response?.data?.message || 'Đăng nhập Google thất bại!')
            } finally {
                setLoading(false)
            }
        },
        onError: () => setError('Đăng nhập Google thất bại!'),
    })

    return (
        <div
            className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen relative overflow-hidden flex items-center justify-center p-[16px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
        >
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <img
                    alt="Background"
                    className="w-full h-full object-cover opacity-30 mix-blend-multiply"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYCfR8jN9lrlCBolLXjIJWIm6qI1c5By5mbTOPUjafAxXYfQURu8mXS2O7LXaFSRe7XFdiY5Q7PrDY4vSzIIqAqGCrqxemh7YRiB_DCKXSRpmbORG5_EKyPARvivmOxMqPBY3GE-TNCHN4sDeedxJqKkCB36XhKSALpaQS3OG413OVgnzuLNgJ6u-bERXH1juttc5HRdICUbF6Mm5GT3-pXq04wFl5bHIVXg77i-nDBnzth4Q7KxpaeoD3ILxBX5kOZgsowoyQXIA"
                />
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#d3e4fe]/60 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#e9ddff]/40 blur-[100px]" />
            </div>

            {/* Card */}
            <div className="relative z-10 w-full max-w-[420px] bg-white/80 backdrop-blur-xl border border-[#c6c6cd] rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] p-[40px] flex flex-col gap-[24px]">

                {/* Header */}
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-lg bg-[#e5eeff] flex items-center justify-center mb-[8px] shadow-sm border border-[#c6c6cd]/50">
                        <span
                            className="material-symbols-outlined text-[#6b38d4] text-2xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            smart_toy
                        </span>
                    </div>
                    <h1 className="text-[24px] font-semibold leading-[1.3] text-[#0b1c30] mb-[4px]">
                        Welcome back
                    </h1>
                    <p className="text-[16px] leading-[1.5] text-[#45464d]">
                        Log in or sign up to your AI Assistant workspace.
                    </p>
                </div>

                {/* Google OAuth */}
                <button
                    onClick={() => handleGoogleLogin()}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-[8px] py-2.5 px-4 bg-white border border-[#c6c6cd] rounded-lg text-[14px] font-medium text-[#0b1c30] hover:bg-[#eff4ff] transition-colors duration-200 disabled:opacity-60"
                    type="button"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-[16px]">
                    <div className="flex-1 h-px bg-[#c6c6cd]" />
                    <span className="text-[14px] font-medium text-[#45464d]">or email</span>
                    <div className="flex-1 h-px bg-[#c6c6cd]" />
                </div>

                {/* Email Form */}
                <div className="flex flex-col gap-[16px]">
                    <div className="flex flex-col gap-[4px]">
                        <label className="text-[14px] font-medium text-[#0b1c30]" htmlFor="gmail">
                            Email address
                        </label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] pointer-events-none text-[20px]">
                                mail
                            </span>
                            <input
                                className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9ff] border border-[#c6c6cd] rounded-lg text-[16px] text-[#0b1c30] focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] transition-all placeholder:text-[#45464d]/50"
                                id="gmail"
                                placeholder="name@example.com"
                                value={gmail}
                                onChange={(e) => {
                                    setGmail(e.target.value)
                                    if (error) setError('')
                                }}
                                onKeyDown={handleKeyDown}
                                type="email"
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-[#ba1a1a] text-sm text-center flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">error</span>
                            {error}
                        </p>
                    )}

                    <button
                        onClick={handleContinue}
                        disabled={loading}
                        className="w-full mt-2 py-2.5 px-4 bg-[#6b38d4] text-white rounded-lg text-[14px] font-semibold hover:bg-[#5a2ab3] transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-[8px] disabled:opacity-60 disabled:cursor-not-allowed"
                        type="button"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                Continue
                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                            </>
                        )}
                    </button>

                    <p className="text-center text-[12px] text-[#45464d]">
                        Chưa có tài khoản? Nhập email để đăng ký — mã xác thực sẽ được gửi cho bạn.
                    </p>
                </div>
            </div>
        </div>
    )
}
