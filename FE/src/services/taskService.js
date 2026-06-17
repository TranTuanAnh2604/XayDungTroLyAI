import api from './api'

export const getTasks = async () => {
    const response = await api.get('/tasks')
    return response.data.data
}

export const createTask = async (task) => {
    const response = await api.post('/tasks', task)
    return response.data
}

export const updateTask = async (id, task) => {
    const response = await api.put(`/tasks/${id}`, task)
    return response.data
}

export const deleteTask = async (id) => {
    const response = await api.delete(`/tasks/${id}`)
    return response.data
}

export const updateStatus = async (id, status) => {
    const response = await api.put(`/tasks/${id}/status`, {
        status
    })
    return response.data
}