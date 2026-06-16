import api from './api'

export const getProfile = async () => {
    const res = await api.get('/users/me')
    return res.data
}

export const updateProfile = async (name, timezone) => {
    const res = await api.put('/users/me', { name, timezone })
    return res.data
}
export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    const res = await api.put('/users/me/password', {
        currentPassword,
        newPassword,
        confirmPassword
    })
    return res.data
}