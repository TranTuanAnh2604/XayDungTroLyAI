import api from './api'

export const processVoice = async (text) => {
    const res = await api.post('/voice/process', { text })
    return res.data
}

export const saveTranscript = async (transcript, aiResponse) => {
    const res = await api.post('/voice/save', { transcript, aiResponse })
    return res.data
}