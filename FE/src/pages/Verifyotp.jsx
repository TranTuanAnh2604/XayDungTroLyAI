import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { verifyOtp, sendOtp } from '../services/authService'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60 // seconds

export default function VerifyOTP() {
    const navigate = useNavigate()
    const location = useLocation()
    const gmail = location.state?.gmail

    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
    const [resending, setResending] = useState(false)

    const inputRefs = useRef([])

    // Redirect if no email in state
    useEffect(() => {
        if (!gmail) navigate('/login', { replace: true })
    }, [gmail, navigate])

    // Countdown timer for resend
    useEffect(() => {
        if (countdown <= 0) return
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [countdown])

    // Auto-focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus()
    }, [])

    const handleChange = (index, value) => {
        // Accept only single digit
        const digit = value.replace(/\D/g, '').slice(-1)
        const next = [...otp]
        next[index] = digit
        setOtp(next)
        if (error) setError('')

        // Move forward
        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (otp[index]) {
                const next = [...otp]
                next[index] = ''
                setOtp(next)
            } else if (index > 0) {
                inputRefs.current[index - 1]?.focus()
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus()
        } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus()
        } else if (e.key === 'Enter') {
            handleVerify()
        }
    }

    // Handle paste: fill all boxes at once
    const handlePaste = (e) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
        if (!pasted) return
        const next = [...otp]
        pasted.split('').forEach((char, i) => { next[i] = char })
        setOtp(next)
        const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
        inputRefs.current[focusIndex]?.focus()
    }

    const handleVerify = async () => {
        const code = otp.join('')
        if (code.length < OTP_LENGTH) {
            setError('Vui lòng nhập đủ 6 chữ số.')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await verifyOtp(gmail, code)
            localStorage.setItem('accessToken', res.data.data.accessToken)
            localStorage.setItem('refreshToken', res.data.data.refreshToken)
            localStorage.setItem('userName', res.data.data.name)
            setSuccess(true)
            setTimeout(() => navigate('/dashboard'), 1200)
        } catch (err) {
            setError(err.response?.data?.message || 'Mã xác thực không đúng hoặc đã hết hạn.')
            // Shake + clear inputs on error
            setOtp(Array(OTP_LENGTH).fill(''))
            inputRefs.current[0]?.focus()
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (countdown > 0 || resending) return
        setResending(true)
        setError('')
        try {
            await sendOtp(gmail)
            setCountdown(RESEND_COOLDOWN)
            setOtp(Array(OTP_LENGTH).fill(''))
            inputRefs.current[0]?.focus()
        } catch {
            setError('Không thể gửi lại mã. Vui lòng thử lại.')
        } finally {
            setResending(false)
        }
    }

    const maskedEmail = gmail
        ? gmail.replace(/(.{2})[^@]+(@.+)/, '$1***$2')
        : ''

    return (
        <div
            className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen relative overflow-hidden flex items-center justify-center p-[16px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
        >
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#d3e4fe]/60 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#e9ddff]/40 blur-[100px]" />
            </div>

            {/* Card */}
            <div className="relative z-10 w-full max-w-[420px] bg-white/80 backdrop-blur-xl border border-[#c6c6cd] rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] p-[40px] flex flex-col gap-[28px]">

                {/* Back button */}
                <button
                    onClick={() => navigate('/login')}
                    className="self-start flex items-center gap-1 text-[13px] text-[#45464d] hover:text-[#6b38d4] transition-colors"
                    type="button"
                >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Quay lại
                </button>

                {/* Header */}
                <div className="flex flex-col items-center text-center gap-[8px]">
                    {success ? (
                        <>
                            <div className="w-14 h-14 rounded-full bg-[#e6f4ea] flex items-center justify-center mb-1 border border-[#a8d5b5]">
                                <span
                                    className="material-symbols-outlined text-[#2e7d32] text-3xl"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                    check_circle
                                </span>
                            </div>
                            <h1 className="text-[22px] font-semibold text-[#0b1c30]">Xác thực thành công!</h1>
                            <p className="text-[14px] text-[#45464d]">Đang chuyển hướng tới dashboard…</p>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-lg bg-[#e5eeff] flex items-center justify-center mb-1 shadow-sm border border-[#c6c6cd]/50">
                                <span
                                    className="material-symbols-outlined text-[#6b38d4] text-2xl"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                    mark_email_read
                                </span>
                            </div>
                            <h1 className="text-[22px] font-semibold text-[#0b1c30]">
                                Kiểm tra hộp thư
                            </h1>
                            <p className="text-[14px] text-[#45464d] leading-[1.6]">
                                Chúng tôi đã gửi mã xác thực 6 chữ số đến{' '}
                                <span className="font-semibold text-[#0b1c30]">{maskedEmail}</span>.
                                Nhập mã bên dưới để hoàn tất đăng ký.
                            </p>
                        </>
                    )}
                </div>

                {!success && (
                    <>
                        {/* OTP Inputs */}
                        <div
                            className="flex justify-center gap-[10px]"
                            onPaste={handlePaste}
                        >
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => (inputRefs.current[i] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    className={`
                                        w-[48px] h-[56px] text-center text-[22px] font-semibold rounded-lg border-2 
                                        bg-[#f8f9ff] text-[#0b1c30] transition-all duration-150
                                        focus:outline-none focus:border-[#6b38d4] focus:ring-2 focus:ring-[#6b38d4]/20
                                        ${digit ? 'border-[#6b38d4] bg-[#eff4ff]' : 'border-[#c6c6cd]'}
                                        ${error ? 'border-[#ba1a1a] bg-[#fff0f0]' : ''}
                                    `}
                                />
                            ))}
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-[#ba1a1a] text-sm text-center flex items-center justify-center gap-1 -mt-2">
                                <span className="material-symbols-outlined text-[16px]">error</span>
                                {error}
                            </p>
                        )}

                        {/* Verify Button */}
                        <button
                            onClick={handleVerify}
                            disabled={loading || otp.join('').length < OTP_LENGTH}
                            className="w-full py-2.5 px-4 bg-[#6b38d4] text-white rounded-lg text-[14px] font-semibold hover:bg-[#5a2ab3] transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-[8px] disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Đang xác thực...
                                </>
                            ) : (
                                <>
                                    Xác nhận
                                    <span className="material-symbols-outlined text-[18px]">verified</span>
                                </>
                            )}
                        </button>

                        {/* Resend */}
                        <div className="text-center text-[13px] text-[#45464d]">
                            Không nhận được mã?{' '}
                            {countdown > 0 ? (
                                <span className="text-[#6b38d4] font-medium">
                                    Gửi lại sau {countdown}s
                                </span>
                            ) : (
                                <button
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="text-[#6b38d4] font-semibold hover:underline disabled:opacity-60"
                                    type="button"
                                >
                                    {resending ? 'Đang gửi...' : 'Gửi lại mã'}
                                </button>
                            )}
                        </div>

                        {/* Info note */}
                        <p className="text-center text-[11px] text-[#45464d]/70 leading-[1.5]">
                            Mã có hiệu lực trong <strong>10 phút</strong>. Kiểm tra thư mục Spam nếu không thấy trong hộp thư đến.
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}