import type { ComponentProps } from 'react';
import type { MaterialIcons } from '@expo/vector-icons';

export type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export type MailFilterId = 'all' | 'unread' | 'recent' | 'important';

export type MailCategoryTone = 'emerald' | 'primary' | 'secondary';

export type MailItem = {
  id: string;
  sender: string;
  time: string;
  subject: string;
  preview: string;
  icon: MaterialIconName;
  tone: MailCategoryTone;
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
