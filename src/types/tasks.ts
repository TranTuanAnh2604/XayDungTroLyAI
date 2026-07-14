import type { MaterialIconName } from './common';

export type TaskPriority = 'high' | 'normal' | 'low';

export type TaskFilterId = 'all' | 'today' | 'priority';

export type TaskItem = {
  id: string;
  title: string;
  meta: string;
  priority: TaskPriority;
  completed: boolean;
};

export type ExtendedTaskItem = TaskItem & {
  itemType: 'task' | 'todo';
  createdAt?: string;
  dueDate?: string;
  completedAt?: string;
  description?: string;
};

export type ProjectCard = {
  id: string;
  title: string;
  icon: MaterialIconName;
  iconTone: 'primary' | 'secondary';
  type: 'team' | 'progress';
  teamAvatars?: string[];
  extraMembers?: number;
  taskCount?: number;
  progressPercent?: number;
};

export type TasksProgress = {
  completed: number;
  total: number;
  subtitle: string;
};

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
