import api from './api'

export const getSessions = async () => {
    const res = await api.get('/chat/sessions')
    return res.data
}

export const createSession = async () => {
    const res = await api.post('/chat/sessions')
    return res.data
}

export const getMessages = async (sessionId) => {
    const res = await api.get(`/chat/sessions/${sessionId}/messages`)
    return res.data
}

// Thêm tham số history để gửi context lên BE
export const sendMessage = async (sessionId, content, history = []) => {
    const res = await api.post(`/chat/sessions/${sessionId}/messages`, {
        content,
        history: history.map(msg => ({
            role: msg.role,
            content: msg.content,
        })),
    })
    return res.data
}

export const deleteSession = async (sessionId) => {
    const res = await api.delete(`/chat/sessions/${sessionId}`)
    return res.data
}

export const deleteMessage = async (sessionId, messageId) => {
    const res = await api.delete(`/chat/sessions/${sessionId}/messages/${messageId}`)
    return res.data
}