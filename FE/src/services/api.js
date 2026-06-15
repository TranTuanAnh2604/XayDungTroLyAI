import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:5283/api', // địa chỉ BE của bạn
    headers: { 'Content-Type': 'application/json' }
})

// Tự động gắn token vào mọi request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

export default api