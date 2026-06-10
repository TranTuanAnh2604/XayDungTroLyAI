import type { ComponentProps } from 'react';
import type { MaterialIcons } from '@expo/vector-icons';

export type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export type VoiceCommand = {
  id: string;
  icon: MaterialIconName;
  iconColor: 'primary' | 'secondary';
  title: string;
  subtitle: string;
};

export type VoiceInsight = {
  label: string;
  body: string;
  primaryAction: string;
  secondaryAction: string;
};
