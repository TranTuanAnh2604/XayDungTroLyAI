import type { MaterialIconName } from './common';

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
