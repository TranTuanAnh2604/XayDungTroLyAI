import api from './api'

// Bóc dữ liệu từ response, tự động xử lý cả 2 trường hợp: response bọc trong
// ApiResponse ({ data, messenger }) hoặc trả thẳng object (tuỳ backend serialize).
const unwrap = (body) => {
    if (body && typeof body === 'object' && 'data' in body) {
        return body.data
    }
    return body
}

// Gọi API GET /api/stats/weekly
export const getWeeklyStats = async () => {
    const res = await api.get('/stats/weekly')
    return unwrap(res.data)
}

// Gọi API GET /api/stats/monthly
// year, month là optional (number). Không truyền thì backend tự lấy tháng hiện tại (giờ VN).
export const getMonthlyStats = async (year, month) => {
    const params = {}
    if (year) params.year = year
    if (month) params.month = month

    const res = await api.get('/stats/monthly', { params })
    return unwrap(res.data)
}