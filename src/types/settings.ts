import type { MaterialIconName } from './common';

export type AiMemoryItem = {
  id: string;
  title: string;
  description: string;
  icon: MaterialIconName;
};

export type SettingsListItem = {
  id: string;
  icon: MaterialIconName;
  label: string;
  subtitle?: string;
  value?: string;
  type: 'link' | 'toggle';
  toggleDefault?: boolean;
};

export type SettingsListSection = {
  id: string;
  title: string;
  items: SettingsListItem[];
};

export type UserProfile = {
  name: string;
  badge: string;
  avatarUri: string;
};
