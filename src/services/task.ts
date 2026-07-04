// Thêm chữ apiPatch vào hàng import
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api'; 

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

// --- MOCK NOTIFICATION HELPERS ---
// Trích xuất các hàm này từ doan/service/task.ts, vì chúng chưa được định nghĩa
async function getNotificationIdsBySource(source: { taskId?: string; todoId?: string }): Promise<string[]> {
  // Placeholder: In a real app, we'd query local storage or the OS for notification IDs tied to this task/todo
  return [];
}

async function cancelLocalNotifications(ids: string[]): Promise<void> {
  // Placeholder: loop through ids and cancel
  // for (const id of ids) { await Notifications.cancelScheduledNotificationAsync(id); }
}

async function syncAndScheduleReminders(): Promise<void> {
  // Placeholder: sync tasks and schedule new reminders
}


// --- XUẤT API ---
export const tasksApi = {
  async getTasks(): Promise<TaskDto[]> {
    return apiGet<TaskDto[]>('/api/tasks');
  },

  async toggleTaskComplete(id: string): Promise<boolean> {
    const result = await apiPut<boolean>(`/api/tasks/${id}/complete`, {});
    // Task done thì BE đã xóa notification pending trong DB, giờ hủy local theo
    const ids = await getNotificationIdsBySource({ taskId: id });
    if (ids.length > 0) await cancelLocalNotifications(ids);
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
    await syncAndScheduleReminders(); // lên lịch reminder ngay nếu có dueDate
    return result;
  },

  async updateTask(id: string, data: { title?: string; description?: string; priority?: string; dueDate?: string }): Promise<string> {
    // Hủy local trước khi BE tạo lại reminder mới
    const oldIds = await getNotificationIdsBySource({ taskId: id });
    if (oldIds.length > 0) await cancelLocalNotifications(oldIds);

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
    await syncAndScheduleReminders(); // lên lịch lại reminder mới nếu còn dueDate
    return result;
  },

  async deleteTask(id: string): Promise<string> {
    const ids = await getNotificationIdsBySource({ taskId: id });
    if (ids.length > 0) await cancelLocalNotifications(ids);
    return apiDelete<string>(`/api/tasks/${id}`);
  },

  // TODOS
  async getTodos(status: 'all' | 'pending' | 'completed' = 'all', search?: string): Promise<TodoDto[]> {
    let path = `/api/todos?status=${status}`;
    if (search?.trim()) path += `&search=${encodeURIComponent(search.trim())}`;
    return apiGet<TodoDto[]>(path);
  },

  async toggleTodoComplete(id: string): Promise<any> {
    const result = await apiPatch<any>(`/api/todos/${id}/complete`);
    const ids = await getNotificationIdsBySource({ todoId: id });
    if (ids.length > 0) await cancelLocalNotifications(ids);
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
    await syncAndScheduleReminders();
    return result;
  },

  async updateTodo(id: string, data: { title?: string; description?: string; dueDate?: string; completed?: boolean; source?: string }): Promise<string> {
    const oldIds = await getNotificationIdsBySource({ todoId: id });
    if (oldIds.length > 0) await cancelLocalNotifications(oldIds);

    const result = await apiPut<string>(`/api/todos/${id}`, {
      Title: data.title,
      Description: data.description,
      DueDate: data.dueDate,
      Completed: data.completed ?? false,
      Source: data.source,
    });

    await syncAndScheduleReminders();
    return result;
  },

  async deleteTodo(id: string): Promise<string> {
    const ids = await getNotificationIdsBySource({ todoId: id });
    if (ids.length > 0) await cancelLocalNotifications(ids);
    return apiDelete<string>(`/api/todos/${id}`);
  },
};
