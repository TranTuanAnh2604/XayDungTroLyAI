import type { ComponentProps } from 'react';
import type { MaterialIcons } from '@expo/vector-icons';

export type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export type TaskPriority = 'high' | 'normal' | 'low';

export type TaskFilterId = 'all' | 'today' | 'project' | 'priority';

export type TaskItem = {
  id: string;
  title: string;
  meta: string;
  priority: TaskPriority;
  completed: boolean;
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
