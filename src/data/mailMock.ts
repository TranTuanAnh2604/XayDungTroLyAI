import { APP_NAME } from '../constants/brand';
import type { MailCategory, MailFilterId, MailAiSummary } from '../types/mail';

export const MAIL_BRAND = {
  title: APP_NAME,
};

export const MAIL_FILTERS: { id: MailFilterId; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'this_week', label: 'Tuần này' },
  { id: 'primary', label: 'Chính' },
  { id: 'social', label: 'Mạng xã hội' },
  { id: 'promotions', label: 'Quảng cáo' },
];

export const MAIL_AI_SUMMARY: MailAiSummary = {
  label: 'Tóm tắt bởi AI',
  highlight: '3 email quan trọng',
  body:
    'Một yêu cầu ngân sách từ bộ phận Tài chính, cập nhật tiến độ dự án Alpha, và 2 thư mời họp vào chiều nay. Tất cả các nội dung rác đã được lọc tự động.',
  primaryAction: 'Xử lý ngay',
  secondaryAction: 'Bỏ qua',
};

export const MAIL_CATEGORIES: MailCategory[] = [
  {
    id: 'finance',
    title: 'Tài chính & Giao dịch',
    tone: 'emerald',
    emails: [
      {
        id: 'e1',
        sender: 'Ngân hàng Techcombank',
        time: '08:30',
        subject: 'Sao kê tài khoản tháng 10',
        preview:
          'Chi tiết các giao dịch trong tháng vừa qua đã sẵn sàng để tải về...',
        icon: 'account-balance',
        tone: 'emerald',
      },
    ],
  },
  {
    id: 'projects',
    title: 'Cập nhật dự án',
    tone: 'primary',
    emails: [
      {
        id: 'e2',
        sender: 'Lê Minh (Alpha Team)',
        time: 'Hôm qua',
        subject: 'Cập nhật Milestone 3',
        preview:
          'Chúng ta đã hoàn thành 90% khối lượng công việc cho giai đoạn 3...',
        icon: 'rocket-launch',
        tone: 'primary',
      },
      {
        id: 'e3',
        sender: 'Slack Notifications',
        time: 'Hôm qua',
        subject: 'Đề cập mới từ @hangnt',
        preview:
          '"Mọi người xem qua bản thảo UI mới này nhé, cần feedback sớm..."',
        icon: 'group',
        tone: 'primary',
      },
    ],
  },
  {
    id: 'events',
    title: 'Sự kiện & Lịch họp',
    tone: 'secondary',
    emails: [
      {
        id: 'e4',
        sender: 'Google Calendar',
        time: '2 ngày trước',
        subject: 'Thư mời: Sync-up Design',
        preview:
          'Thứ Sáu, ngày 27 tháng 10 · 14:00 – 15:00. Địa điểm: Google Meet',
        icon: 'event',
        tone: 'secondary',
      },
    ],
  },
];
