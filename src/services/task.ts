import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api';
import { DeviceEventEmitter } from 'react-native';
import { syncOrchestrator } from './syncOrchestrator';

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
  // CẬP NHẬT: Nhận tham số tab lọc động từ màn hình để gửi lên C# TasksController
  async getTasks(tab: 'all' | 'today' | 'priority' | 'overdue' = 'all'): Promise<TaskDto[]> {
    return apiGet<TaskDto[]>(`/api/Tasks?tab=${tab}&_t=${Date.now()}`);
  },

  async toggleTaskComplete(id: string): Promise<boolean> {
    const result = await apiPut<boolean>(`/api/Tasks/${id}/complete`, {});
    DeviceEventEmitter.emit('tasks_changed');
    return result;
  },

  async createTask(title: string, description?: string, priority: string = 'normal', dueDate?: string, skipSync: boolean = false): Promise<string> {
    let priorityLevel = 2;
    if (priority === 'high') priorityLevel = 3;
    if (priority === 'low') priorityLevel = 1;

    const payload: any = {
      Title: title,
      Description: description || '',
      Priority: priorityLevel,
    };
    if (dueDate) payload.DueDate = dueDate;

    const result = await apiPost<string>('/api/Tasks', payload);
    DeviceEventEmitter.emit('tasks_changed');
    DeviceEventEmitter.emit('events_changed');
    if (!skipSync) {
      await syncOrchestrator.onTaskCreated(result, title, description, dueDate, false);
    }
    return result;
  },

  async updateTask(id: string, data: { title?: string; description?: string; priority?: string; dueDate?: string }, skipSync: boolean = false): Promise<string> {
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

    const result = await apiPut<string>(`/api/Tasks/${id}`, payload);
    DeviceEventEmitter.emit('tasks_changed');
    DeviceEventEmitter.emit('events_changed');
    if (!skipSync) {
      await syncOrchestrator.onTaskUpdated(id, data, false);
    }
    return result;
  },

  async deleteTask(id: string, skipSync: boolean = false, taskItem?: any): Promise<string> {
    try {
      const { deleteCalendarEvent, fetchCalendarEvents } = require('./sync');
      const events = await fetchCalendarEvents();

      let eventToDelete = events.find((e: any) => e.externalId === id || e.id === id);

      if (!eventToDelete && taskItem && taskItem.title) {
        eventToDelete = events.find((e: any) => {
          if (e.title !== taskItem.title) return false;
          if (taskItem.dueDate && e.startTime) {
            const tDate = new Date(taskItem.dueDate).toISOString().slice(0, 10);
            const eDate = new Date(e.startTime).toISOString().slice(0, 10);
            return tDate === eDate;
          }
          return true;
        });
      }

      if (eventToDelete && eventToDelete.id) {
        await deleteCalendarEvent(eventToDelete.id, true);
      } else {
        await deleteCalendarEvent(id, true);
      }
    } catch (e) {
      console.log('Ignored error when deleting calendar event before task:', e);
    }

    let result: string = '';
    try {
      result = await apiDelete<string>(`/api/Tasks/${id}`);
    } catch (apiErr: any) {
      const msg = apiErr?.message?.toLowerCase() || '';
      if (msg.includes('404') || msg.includes('không tìm thấy')) {
        console.log('Task already deleted (likely cascaded from event or already gone). Ignoring.');
      } else {
        throw apiErr;
      }
    }

    DeviceEventEmitter.emit('tasks_changed');
    DeviceEventEmitter.emit('events_changed');
    if (!skipSync) {
      await syncOrchestrator.onTaskDeleted(id);
    }
    return result;
  },

  // TODOS
  // CẬP NHẬT: Đổi tên tham số 'status' thành 'tab' cho đồng bộ tuyệt đối với TodosController
  async getTodos(tab: 'all' | 'today' | 'priority' | 'overdue' = 'all', search?: string): Promise<TodoDto[]> {
    let path = `/api/Todos?tab=${tab}&_t=${Date.now()}`;
    if (search?.trim()) path += `&search=${encodeURIComponent(search.trim())}`;
    return apiGet<TodoDto[]>(path);
  },

  async toggleTodoComplete(id: string): Promise<any> {
    const result = await apiPatch<any>(`/api/Todos/${id}/complete`);
    DeviceEventEmitter.emit('tasks_changed');
    return result;
  },

  async createTodo(title: string, description?: string, dueDate?: string, skipSync: boolean = false): Promise<any> {
    const payload: any = {
      Title: title,
      Description: description || '',
      Completed: false
    };
    if (dueDate) {
      payload.DueDate = dueDate;
    } else {
      const now = new Date();
      payload.DueDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();
    }

    const result = await apiPost<any>('/api/Todos', payload);
    DeviceEventEmitter.emit('tasks_changed');
    return result;
  },

  async updateTodo(id: string, data: { title?: string; description?: string; dueDate?: string; completed?: boolean; source?: string }, skipSync: boolean = false): Promise<string> {
    const result = await apiPut<string>(`/api/Todos/${id}`, {
      Title: data.title,
      Description: data.description,
      DueDate: data.dueDate,
      Completed: data.completed ?? false,
      Source: data.source || 'todo',
    });
    DeviceEventEmitter.emit('tasks_changed');
    return result;
  },

  async deleteTodo(id: string, skipSync: boolean = false, taskItem?: any): Promise<string> {
    let result: string = '';
    try {
      result = await apiDelete<string>(`/api/Todos/${id}`);
    } catch (apiErr: any) {
      const msg = apiErr?.message?.toLowerCase() || '';
      if (msg.includes('404') || msg.includes('không tìm thấy')) {
        console.log('Todo already deleted (likely cascaded from event or already gone). Ignoring.');
      } else {
        throw apiErr;
      }
    }

    DeviceEventEmitter.emit('tasks_changed');
    return result;
  },
};