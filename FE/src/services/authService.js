import api from './api'

export const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    return res.data // { accessToken, refreshToken, userId, name }
}

export const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    return res.data
}

export const googleLogin = async (code) => {
    const res = await api.post('/auth/google-login', { idToken: code })
    return res.data
}

// Gửi OTP tới email mới
export const sendOtp = (gmail) =>
    api.post('/auth/send-otp', { gmail })

// Xác thực OTP + đăng ký tài khoản mới
export const verifyOtp = (gmail, otp) =>
    api.post('/auth/verify-otp', { gmail, otp })