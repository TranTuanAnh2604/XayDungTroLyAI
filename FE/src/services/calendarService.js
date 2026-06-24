const BASE_URL = 'http://localhost:5283/api/calendar'

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(localStorage.getItem('accessToken')
        ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        : {}),
})

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
    if (!res.ok) throw new Error('Tạo sự kiện thất bại')
    return res.json()
}

export const updateCalendarEvent = async (id, data) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Cập nhật thất bại')
}

export const deleteCalendarEvent = async (id) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Xóa thất bại')
}

export async function getAiSuggestions() {
    const res = await fetch('/api/scheduling/suggestions')
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Không lấy được gợi ý AI')
    }
    return res.json()
}