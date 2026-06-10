import { APP_NAME } from '../constants/brand';
import type { ChatMessage, QuickAction } from '../types/chat';

export const CHAT_BRAND = {
  title: APP_NAME,
  statusLabel: 'Trợ lý đang trực tuyến',
  greeting: 'Hôm nay tôi có thể hỗ trợ gì cho bạn?',
  inputPlaceholder: 'Nhập tin nhắn của bạn...',
};

export const CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    role: 'ai',
    content:
      'Chào buổi sáng! Tôi đã phân tích lịch trình của bạn. Bạn có một cuộc họp quan trọng vào lúc 10 giờ sáng. Bạn có muốn tôi chuẩn bị bản tóm tắt tài liệu liên quan không?',
  },
  {
    id: 'm2',
    role: 'user',
    content:
      'Có, hãy tóm tắt các điểm chính từ email của đối tác gửi chiều qua nhé.',
  },
  {
    id: 'm3',
    role: 'summary',
    title: 'Dự án Alpha - Điểm chính',
    bullets: [
      'Thời hạn hoàn thành được dời sang ngày 15/10.',
      'Cần xác nhận ngân sách cho giai đoạn phát triển UI.',
    ],
    primaryAction: 'Xác nhận ngân sách',
    secondaryAction: 'Xem chi tiết',
  },
  {
    id: 'm4',
    role: 'typing',
  },
];

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'q1', label: 'Tạo lịch hẹn mới' },
  { id: 'q2', label: 'Viết lại email này' },
  { id: 'q3', label: 'Phân tích dữ liệu chi tiêu' },
];
