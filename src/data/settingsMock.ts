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
    {
      id: '2fa',
      icon: 'verified-user',
      label: 'Xác thực hai yếu tố (2FA)',
      subtitle: 'Đang bật',
      type: 'link',
    },
  ],
};

export const PREFERENCES_SECTION: SettingsListSection = {
  id: 'preferences',
  title: 'Tùy chỉnh',
  items: [
    // {
    //   id: 'dark',
    //   icon: 'dark-mode',
    //   label: 'Chế độ tối',
    //   type: 'toggle',
    //   toggleDefault: false,
    // },
    {
      id: 'language',
      icon: 'language',
      label: 'Ngôn ngữ',
      value: 'Tiếng Việt',
      type: 'link',
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
