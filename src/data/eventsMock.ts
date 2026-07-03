import { APP_NAME_SHORT } from '../constants/brand';
import type { EventsInsight } from '../types/events';

export const EVENTS_INSIGHT: EventsInsight = {
  title: `Gợi ý từ ${APP_NAME_SHORT}`,
  highlight: 'Review Dự Án',
  body:
    `Lịch trình của bạn vào buổi chiều đang khá dày. ${APP_NAME_SHORT} gợi ý dời cuộc họp sang 10:00 sáng mai để đảm bảo thời gian nghỉ ngơi.`,
  primaryAction: 'Áp dụng',
  secondaryAction: 'Bỏ qua',
};
