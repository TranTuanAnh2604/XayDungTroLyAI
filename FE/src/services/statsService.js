import api from './api'

// Gọi API GET /api/stats/weekly
// Tự động xử lý cả 2 trường hợp: response bọc trong ApiResponse ({ data, messenger })
// hoặc trả thẳng object (tuỳ backend đã cấu hình serialize kiểu nào).
export const getWeeklyStats = async () => {
    const res = await api.get('/stats/weekly')
    const body = res.data
    if (body && typeof body === 'object' && 'data' in body) {
        return body.data
    }
    return body
}