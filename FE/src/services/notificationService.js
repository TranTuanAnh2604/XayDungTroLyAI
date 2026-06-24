import api from './api'

// Lấy tất cả reminders
export const getNotifications = async () => {
    const res = await api.get('/notifications')
    return res.data.data
}

// Lấy notifications đã đến giờ (pending)
export const getPendingNotifications = async () => {
    const res = await api.get('/notifications/pending')
    return res.data.data
}

// Tạo reminder mới
export const createNotification = async (data) => {
    const res = await api.post('/notifications', data)
    return res.data
}

// Đánh dấu đã hiển thị
export const markNotificationSent = async (id) => {
    const res = await api.put(`/notifications/${id}/sent`)
    return res.data
}

// Xoá reminder
export const deleteNotification = async (id) => {
    const res = await api.delete(`/notifications/${id}`)
    return res.data
}

// Dùng Claude AI để đề xuất thời gian nhắc nhở phù hợp
export const suggestReminderTime = async (task) => {
    const res = await api.post('/notifications/ai-suggest', {
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate || null,
    })
    return res.data.data // { scheduledAt, reason }
}