import type { ComponentProps } from 'react';
import type { MaterialIcons } from '@expo/vector-icons';

export type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

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
