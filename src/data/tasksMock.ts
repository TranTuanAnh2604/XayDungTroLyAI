import { APP_NAME } from '../constants/brand';
import { TASKS_ASSETS } from '../constants/tasksAssets';
import type {
  ProjectCard,
  TaskFilterId,
  TaskItem,
  TasksProgress,
} from '../types/tasks';

export const TASKS_BRAND = {
  title: APP_NAME,
};

export const TASKS_PROGRESS: TasksProgress = {
  completed: 3,
  total: 8,
  subtitle: '3/8 Hoàn thành • Năng suất tốt',
};

export const TASK_FILTERS: { id: TaskFilterId; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'today', label: 'Hôm nay' },
  { id: 'priority', label: 'Ưu tiên' },
];

export const TASK_ITEMS: TaskItem[] = [
  {
    id: 't1',
    title: 'Báo cáo phân tích quý 3',
    meta: 'Deadline: 14:00 PM',
    priority: 'high',
    completed: false,
  },
  {
    id: 't2',
    title: 'Họp thiết kế Product UI',
    meta: 'Trong 45 phút',
    priority: 'normal',
    completed: false,
  },
  {
    id: 't3',
    title: 'Gửi email cho đối tác',
    meta: 'Hoàn thành lúc 09:12',
    priority: 'normal',
    completed: true,
  },
];

export const PROJECT_CARDS: ProjectCard[] = [
  {
    id: 'p1',
    title: 'App Redesign',
    icon: 'rocket-launch',
    iconTone: 'secondary',
    type: 'team',
    teamAvatars: [TASKS_ASSETS.team1, TASKS_ASSETS.team2],
    extraMembers: 3,
  },
  {
    id: 'p2',
    title: 'Marketing Q4',
    icon: 'analytics',
    iconTone: 'primary',
    type: 'progress',
    taskCount: 12,
    progressPercent: 60,
  },
];
