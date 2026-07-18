import type { MaterialIconName } from './common';

// Đổi từ (all/unread/recent/important/archived) sang tab kiểu Gmail điện
// thoại, khớp với 4 nhóm mà backend trả về ở GET /api/Gmail/inbox
// (Primary/Social/Promotions/Spam), cộng thêm tab archived riêng
// (được lấy qua GET /api/Gmail/emails?includeArchived=true).
export type MailFilterId = 'all' | 'primary' | 'social' | 'promotions' | 'spam' | 'archived';

export type MailCategoryTone = 'emerald' | 'primary' | 'secondary';

export type MailItem = {
  id: string;
  sender: string;
  time: string;
  subject: string;
  preview: string;
  icon: MaterialIconName;
  tone: MailCategoryTone;
  isPinned?: boolean;
  // Optional — chỉ có ở mail Primary/Social, dùng để hiện badge độ khẩn cấp
  // nếu UI muốn (component cũ có thể bỏ qua field này an toàn).
  importance?: number | null;
};

export type MailCategory = {
  id: string;
  title: string;
  tone: MailCategoryTone;
  emails: MailItem[];
};

export type MailAiSummary = {
  label: string;
  body: string;
  highlight: string;
  primaryAction: string;
  secondaryAction: string;
};