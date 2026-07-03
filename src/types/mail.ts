import type { MaterialIconName } from './common';

export type MailFilterId = 'all' | 'unread' | 'recent' | 'important' | 'archived';

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
