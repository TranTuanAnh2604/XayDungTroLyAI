import { APP_NAME, APP_NAME_SHORT } from '../constants/brand';
import { EVENTS_ASSETS } from '../constants/eventsAssets';
import type {
  CalendarDateItem,
  EventsInsight,
  TimelineEvent,
} from '../types/events';

export const EVENTS_BRAND = {
  title: APP_NAME,
  monthLabel: 'Tháng 10, 2023',
  todayLabel: 'Hôm nay',
};

export const CALENDAR_DATES: CalendarDateItem[] = [
  { id: 'd23', weekday: 'T2', day: 23 },
  { id: 'd24', weekday: 'T3', day: 24 },
  { id: 'd25', weekday: 'T4', day: 25 },
  { id: 'd26', weekday: 'T5', day: 26 },
  { id: 'd27', weekday: 'T6', day: 27 },
  { id: 'd28', weekday: 'T7', day: 28 },
  { id: 'd29', weekday: 'CN', day: 29 },
];

export const DEFAULT_SELECTED_DATE_ID = 'd24';

export const EVENTS_INSIGHT: EventsInsight = {
  title: `Gợi ý từ ${APP_NAME_SHORT}`,
  highlight: 'Review Dự Án',
  body:
    `Lịch trình của bạn vào buổi chiều đang khá dày. ${APP_NAME_SHORT} gợi ý dời cuộc họp sang 10:00 sáng mai để đảm bảo thời gian nghỉ ngơi.`,
  primaryAction: 'Áp dụng',
  secondaryAction: 'Bỏ qua',
};

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'e1',
    type: 'urgent',
    time: '09:00',
    title: 'Báo cáo Q3 khẩn cấp',
    description:
      'Hoàn thành bảng tính doanh thu và dự báo tăng trưởng cho hội đồng quản trị.',
    badge: 'Quan trọng',
    avatars: [EVENTS_ASSETS.attendee1, EVENTS_ASSETS.attendee2],
    expandedDetail: 'Địa điểm: Văn phòng chính - Phòng họp 402',
  },
  {
    id: 'e2',
    type: 'meeting',
    time: '11:30',
    title: 'Họp nhóm Marketing',
    description: 'Thảo luận về chiến dịch "Glow in the Dark" cho cuối năm.',
    badge: 'Trực tuyến',
    joinLabel: 'Tham gia Zoom',
    expandedDetail: '5 người tham gia • 45 phút',
  },
  {
    id: 'e3',
    type: 'break',
    time: '13:00',
    title: 'Giờ nghỉ trưa & Tái tạo năng lượng',
  },
  {
    id: 'e4',
    type: 'task',
    time: '15:00',
    title: 'Gửi bản thảo thiết kế cho khách hàng',
    tags: ['#UI/UX', 'Dự án Alpha'],
    expandedDetail: 'File đính kèm: Prototype_v2.fig',
  },
];
