import type {
  DaySummary,
  EmailSummary,
  TaskItem,
  UpcomingMeeting,
} from '../types/home';
import { HOME_ASSETS } from '../constants/homeAssets';

export const HOME_USER = {
  name: 'Sánh',
  greeting: 'Chào buổi sáng',
  subtitle: 'Hôm nay là một ngày tuyệt vời để bắt đầu.',
  brand: 'Synthesis',
  avatarUri: HOME_ASSETS.userAvatar,
};

export const DAY_SUMMARY: DaySummary = {
  priorityTasks: 3,
  meetings: 1,
  progressStep: 1,
};

export const EMAIL_SUMMARIES: EmailSummary[] = [
  {
    id: '1',
    project: 'Helios Project',
    title: 'Cập nhật dự án Helios',
    summary:
      'Khách hàng đã phê duyệt bản thiết kế Concept. Cần bắt đầu chuẩn bị prototype cho tuần tới.',
    iconColor: 'primary',
  },
  {
    id: '2',
    project: 'Frontend Team',
    title: 'Phản hồi từ team Frontend',
    summary:
      'Team đã hoàn thành tích hợp API. Có một số lỗi nhỏ về layout trên trình duyệt Safari cần được xử lý.',
    iconColor: 'secondary',
  },
];

export const UPCOMING_MEETING: UpcomingMeeting = {
  id: '1',
  badge: 'Trực tuyến',
  title: 'Brainstorming: Hivic Interface Redesign',
  time: '14:00 - 15:00 • Google Meet',
  attendees: [
    { id: 'a1', avatarUri: HOME_ASSETS.attendee1 },
    { id: 'a2', avatarUri: HOME_ASSETS.attendee2 },
    { id: 'a3', avatarUri: HOME_ASSETS.attendee3 },
  ],
  extraAttendees: 2,
};

export const DAILY_TASKS: TaskItem[] = [
  {
    id: 't1',
    title: 'Review PR: Màn hình Dashboard',
    meta: 'Dự án Hivic',
  },
  {
    id: 't2',
    title: 'Gửi báo cáo tuần cho khách hàng',
    meta: 'Gửi lúc 17:00',
  },
  {
    id: 't3',
    title: 'Check in với team design',
    meta: 'Hằng ngày',
  },
];
