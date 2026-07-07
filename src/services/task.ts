// Thêm chữ apiPatch vào hàng import
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api'; 
import { DeviceEventEmitter } from 'react-native';

// --- DTOs ---
export type TaskDto = {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'normal' | 'low' | string;
  status: 'pending' | 'done' | string;
  dueDate?: string;
};

export type TodoDto = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  source?: string;
  createdAt?: string;
};


// --- XUẤT API ---
export const tasksApi = {
  async getTasks(): Promise<TaskDto[]> {
    return apiGet<TaskDto[]>('/api/tasks');
  },

  async toggleTaskComplete(id: string): Promise<boolean> {
    const result = await apiPut<boolean>(`/api/tasks/${id}/complete`, {});
    DeviceEventEmitter.emit('tasks_changed');
    return result;
  },

  async createTask(title: string, description?: string, priority: string = 'normal', dueDate?: string): Promise<string> {
    let priorityLevel = 2;
    if (priority === 'high') priorityLevel = 3;
    if (priority === 'low') priorityLevel = 1;

    const payload: any = {
      Title: title,
      Description: description || '',
      Priority: priorityLevel,
    };
    if (dueDate) payload.DueDate = dueDate;

    const result = await apiPost<string>('/api/tasks', payload);
    DeviceEventEmitter.emit('tasks_changed');
    return result;
  },

  async updateTask(id: string, data: { title?: string; description?: string; priority?: string; dueDate?: string }): Promise<string> {
    let priorityLevel: number | undefined;
    if (data.priority === 'high') priorityLevel = 3;
    if (data.priority === 'normal') priorityLevel = 2;
    if (data.priority === 'low') priorityLevel = 1;

    const payload: any = {
      Title: data.title,
      Description: data.description,
      Priority: priorityLevel,
      DueDate: data.dueDate,
    };

    const result = await apiPut<string>(`/api/tasks/${id}`, payload);
    DeviceEventEmitter.emit('tasks_changed');
    return result;
  },

  async deleteTask(id: string): Promise<string> {
    const result = await apiDelete<string>(`/api/tasks/${id}`);
    DeviceEventEmitter.emit('tasks_changed');
    return result;
  },

  // TODOS
  async getTodos(status: 'all' | 'pending' | 'completed' = 'all', search?: string): Promise<TodoDto[]> {
    let path = `/api/todos?status=${status}`;
    if (search?.trim()) path += `&search=${encodeURIComponent(search.trim())}`;
    return apiGet<TodoDto[]>(path);
  },

  async toggleTodoComplete(id: string): Promise<any> {
    const result = await apiPatch<any>(`/api/todos/${id}/complete`);
    DeviceEventEmitter.emit('tasks_changed');
    return result;
  },

  async createTodo(title: string, description?: string, dueDate?: string): Promise<any> {
    const result = await apiPost<any>('/api/todos', {
      Title: title,
      Description: description || '',
      DueDate: dueDate || new Date().toISOString(),
      Completed: false,
      Source: 'manual',
    });
    DeviceEventEmitter.emit('tasks_changed');
    return result;
  },

  async updateTodo(id: string, data: { title?: string; description?: string; dueDate?: string; completed?: boolean; source?: string }): Promise<string> {
    const result = await apiPut<string>(`/api/todos/${id}`, {
      Title: data.title,
      Description: data.description,
      DueDate: data.dueDate,
      Completed: data.completed ?? false,
      Source: data.source,
    });
    DeviceEventEmitter.emit('tasks_changed');
    return result;
  },

  async deleteTodo(id: string): Promise<string> {
    const result = await apiDelete<string>(`/api/todos/${id}`);
    DeviceEventEmitter.emit('tasks_changed');
    return result;
  },
};
