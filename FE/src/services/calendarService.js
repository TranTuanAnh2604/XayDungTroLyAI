const BASE_URL = 'http://localhost:5283/api/calendar'

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(localStorage.getItem('accessToken')
        ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        : {}),
})

// Đọc lỗi trả về từ backend. Nếu là 409 (trùng giờ), gắn cờ isConflict +
// danh sách conflicts vào Error để FE hiển thị popup xác nhận riêng.
async function parseErrorResponse(res, fallbackMessage) {
    let body = {}
    try { body = await res.json() } catch { /* body không phải JSON */ }

    if (res.status === 409 && body?.conflict) {
        const err = new Error(body.message || 'Trùng giờ với lịch/task khác')
        err.isConflict = true
        err.conflicts = body.conflicts || []
        return err
    }

    return new Error(body?.message || fallbackMessage)
}

export const getCalendarEvents = async (year, month) => {
    const res = await fetch(`${BASE_URL}?year=${year}&month=${month}`, {
        headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Không tải được sự kiện')
    return res.json()
}

export const createCalendarEvent = async (data) => {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    })
    if (!res.ok) throw await parseErrorResponse(res, 'Tạo sự kiện thất bại')
    return res.json()
}

export const updateCalendarEvent = async (id, data) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    })
    if (!res.ok) throw await parseErrorResponse(res, 'Cập nhật thất bại')
}

export const deleteCalendarEvent = async (id) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Xóa thất bại')
}

export const getAiSuggestions = async () => {
    const res = await fetch(`${BASE_URL}/ai-suggestions`, {
        headers: getAuthHeaders(),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Không lấy được gợi ý AI')
    }

    return await res.json()
}