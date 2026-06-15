import { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import { register } from '../services/authService'

export default function SignUp() {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState('')

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')
        try {
            await register(name, email, password)
            setIsSuccess(true)
            // Đăng ký xong chuyển về login sau 1.5 giây
            setTimeout(() => navigate('/login'), 1500)
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng ký thất bại!')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-[#f8f9ff] text-[#0b1c30] font-sans min-h-screen flex flex-col relative overflow-hidden">
            {/* Khối CSS tuỳ chỉnh tích hợp thẳng vào Component */}
            <style>{`
        .glass-morphism {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 1);
        }
        .bg-pattern {
          background-color: #f8f9ff;
          background-image: radial-gradient(#8455ef 0.5px, transparent 0.5px), radial-gradient(#8455ef 0.5px, #f8f9ff 0.5px);
          background-size: 20px 20px;
          background-position: 0 0, 10px 10px;
          opacity: 0.05;
        }
        .floating-blob {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(132, 85, 239, 0.15) 0%, rgba(255, 255, 255, 0) 70%);
          filter: blur(60px);
          z-index: -1;
        }
      `}</style>

            {/* Background Decoration */}
            <div className="fixed inset-0 bg-pattern z-[-2]"></div>
            <div className="floating-blob top-[-10%] right-[-5%]"></div>
            <div
                className="floating-blob bottom-[-10%] left-[-5%]"
                style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(255, 255, 255, 0) 70%)' }}
            ></div>

            {/* Main Content */}
            <main className="flex-grow flex items-center justify-center p-4 ">
                <div className="w-full max-w-[460px] scale-[0.92] lg:scale-100 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Logo Section */}
                    <div className="flex flex-col items-center mb-3">
                        <div className="w-12 h-12 bg-[#8455ef] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#6b38d4]/20">
                            <span className="material-symbols-outlined text-[#fffbff] !text-[24px]">bolt</span>
                        </div>
                        <h2 className="text-2xl font-semibold text-black tracking-tight">AI Assistant</h2>
                        <p className="text-sm font-medium text-[#45464d] mt-1">Hệ sinh thái trí tuệ nhân tạo tương lai</p>
                    </div>

                    {/* Signup Card */}
                    <div className="glass-morphism rounded-2xl p-6 shadow-xl transition-all hover:shadow-2xl">
                        <div className="mb-6">
                            <h1 className="text-3xl font-semibold text-black mb-1">Tạo tài khoản mới</h1>
                            <p className="text-base text-[#45464d]">Bắt đầu hành trình tối ưu hóa năng suất cùng AI</p>
                        </div>

                        <form id="signupForm" className="space-y-3" onSubmit={handleSubmit}>
                            {/* Name Input */}
                            <div className="space-y-1">
                                <label htmlFor="fullName" className="block text-sm font-medium text-[#45464d] ml-1">Họ và tên</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#76777d] group-focus-within:text-[#6b38d4] transition-colors">person</span>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        required
                                        className="w-full bg-white border border-[#c6c6cd] rounded-xl py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-[#6b38d4]/20 focus:border-[#6b38d4] outline-none transition-all placeholder:text-[#76777d]"
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>
                            </div>

                            {/* Email Input */}
                            <div className="space-y-1">
                                <label htmlFor="email" className="block text-sm font-medium text-[#45464d] ml-1">Địa chỉ email</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#76777d] group-focus-within:text-[#6b38d4] transition-colors">mail</span>
                                    <input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        className="w-full bg-white border border-[#c6c6cd] rounded-xl py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-[#6b38d4]/20 focus:border-[#6b38d4] outline-none transition-all placeholder:text-[#76777d]"
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-1">
                                <label htmlFor="password" className="block text-sm font-medium text-[#45464d] ml-1">Mật khẩu</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#76777d] group-focus-within:text-[#6b38d4] transition-colors">lock</span>
                                    <input
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        required
                                        className="w-full bg-white border border-[#c6c6cd] rounded-xl py-2.5 pl-12 pr-12 focus:ring-2 focus:ring-[#6b38d4]/20 focus:border-[#6b38d4] outline-none transition-all placeholder:text-[#76777d]"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#76777d] hover:text-[#45464d] transition-colors"
                                    >
                                        <span className="material-symbols-outlined !text-[20px]">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                                <p className="hidden md:block text-[12px] text-[#45464d] ml-1">Ít nhất 8 ký tự, bao gồm chữ cái và số.</p>
                            </div>

                            {/* Terms checkbox */}
                            <div className="flex items-center space-x-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    name="terms"
                                    required
                                    className="w-4 h-4 rounded border-[#c6c6cd] text-[#6b38d4] focus:ring-[#6b38d4] cursor-pointer"
                                />
                                <label htmlFor="terms" className="text-sm font-medium text-[#45464d] select-none cursor-pointer">
                                    Tôi đồng ý với <a href="#" className="text-[#6b38d4] hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="text-[#6b38d4] hover:underline">Chính sách bảo mật</a>.
                                </label>
                            </div>

                            {/* CTA Button */}
                            {error && <p className="text-[#ba1a1a] text-sm text-center">{error}</p>}

                            <button
                                type="submit"
                                disabled={isSubmitting || isSuccess}
                                className="w-full bg-[#6b38d4] text-white text-sm font-medium py-3 rounded-xl shadow-lg shadow-[#6b38d4]/25 hover:shadow-xl hover:shadow-[#6b38d4]/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-3 group disabled:opacity-80 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">progress_activity</span> Đang xử lý...
                                    </>
                                ) : isSuccess ? (
                                    <>
                                        <span className="material-symbols-outlined text-green-400">check_circle</span> Thành công
                                    </>
                                ) : (
                                    <>
                                        Đăng ký
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#c6c6cd]"></div>
                            </div>
                            <div className="relative flex justify-center text-sm font-medium">
                                <span className="bg-[#f8f9ff]/50 px-4 text-[#45464d]">Hoặc đăng ký bằng</span>
                            </div>
                        </div>

                        {/* Social Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex items-center justify-center gap-2 bg-[#eff4ff] border border-[#c6c6cd] rounded-xl py-2.5 px-4 hover:bg-[#dce9ff] transition-colors active:scale-95">
                                <img
                                    src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                                    className="w-5 h-5"
                                    alt="Google"
                                />
                                <span className="text-sm font-medium text-[#0b1c30]">Google</span>
                            </button>
                            <button className="flex items-center justify-center gap-2 bg-[#eff4ff] border border-[#c6c6cd] rounded-xl py-2.5 px-4 hover:bg-[#dce9ff] transition-colors active:scale-95">
                                <span className="material-symbols-outlined text-[#1877F2]">facebook</span>
                                <span className="text-sm font-medium text-[#0b1c30]">Facebook</span>
                            </button>
                        </div>
                    </div>

                    {/* Footer Link */}
                    <div className="text-center">
                        <p className="text-base text-[#45464d]">
                            Đã có tài khoản?
                            <a href="/login" className="text-[#6b38d4] font-bold hover:underline ml-1">Đăng nhập</a>
                        </p>
                    </div>
                </div>
            </main>

            {/* Visual Accents */}
            <div className="fixed bottom-6 right-6 opacity-40 hover:opacity-100 transition-opacity hidden md:block">
                <div className="bg-[#e5eeff] border border-[#c6c6cd] rounded-full py-2 px-6 flex items-center gap-2 backdrop-blur-md">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-[#45464d]">System Online: v2.4.0</span>
                </div>
            </div>
        </div>
    );
}