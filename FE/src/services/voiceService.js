import api from './api'

export const processVoice = async (text) => {
    const res = await api.post('/voice/process', { text })
    return res.data
}