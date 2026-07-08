import { apiPost } from './api';
import { DeviceEventEmitter } from 'react-native';

export interface ParsedTask {
  type: 'task' | 'todo';
  title: string;
  description: string;
  priority: number;
  dueDate: string | null;
}

export const voiceTaskApi = {
  async parse(text: string): Promise<ParsedTask> {
    // apiPost đã tự unwrap ApiResponse<T>.data → trả thẳng ParsedTask
    return await apiPost<ParsedTask>('/api/voicetask/parse', { text });
  },

  async save(task: ParsedTask): Promise<void> {
    await apiPost<void>('/api/voicetask/save', task);
    DeviceEventEmitter.emit('tasks_changed');
    DeviceEventEmitter.emit('events_changed');
  }
};
