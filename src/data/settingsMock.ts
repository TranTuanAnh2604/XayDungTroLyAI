import { SETTINGS_ASSETS } from '../constants/settingsAssets';
import type {
  AiMemoryItem,
  SettingsListSection,
  UserProfile,
} from '../types/settings';

export const SETTINGS_USER: UserProfile = {
  name: 'Nguyễn Văn Sánh',
  badge: 'Professional',
  avatarUri: SETTINGS_ASSETS.avatar,
};

export const AI_MEMORY_ITEMS: AiMemoryItem[] = [
  {
    id: 'm1',
    title: 'Giao tiếp',
    description:
      'Ưu tiên phong cách email chuyên nghiệp, ngắn gọn cho đối tác nước ngoài.',
    icon: 'mail',
  },
  {
    id: 'm2',
    title: 'Lịch trình',
    description: 'Họp dự án hàng tuần vào lúc 14:00 Thứ Ba hàng tuần.',
    icon: 'calendar-today',
  },
  {
    id: 'm3',
    title: 'Kích hoạt',
    description: 'Sử dụng khẩu lệnh "Hivic, bắt đầu" để kích hoạt chế độ ghi chú.',
    icon: 'settings-voice',
  },
];

export const ACCOUNT_SECTION: SettingsListSection = {
  id: 'account',
  title: 'Tài khoản & Bảo mật',
  items: [
    { id: 'password', icon: 'lock', label: 'Mật khẩu', type: 'link' },
  ],
};

export const PREFERENCES_SECTION: SettingsListSection = {
  id: 'preferences',
  title: 'Tùy chỉnh',
  items: [
    {
      id: 'appearance',
      icon: 'palette',
      label: 'Giao diện',
      type: 'segmented',
      segments: [
        { label: 'Hệ thống', value: 'system' },
        { label: 'Sáng', value: 'light' },
        { label: 'Tối', value: 'dark' },
      ],
    },
    {
      id: 'push',
      icon: 'notifications-active',
      label: 'Thông báo đẩy',
      type: 'toggle',
      toggleDefault: true,
    },
  ],
};
