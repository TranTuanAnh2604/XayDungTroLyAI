export type ChatTextMessage = {
  id: string;
  role: 'ai' | 'user';
  content: string;
};

export type ChatSummaryMessage = {
  id: string;
  role: 'summary';
  title: string;
  bullets: string[];
  primaryAction: string;
  secondaryAction: string;
};

export type ChatTypingMessage = {
  id: string;
  role: 'typing';
};

export type ChatMessage =
  | ChatTextMessage
  | ChatSummaryMessage
  | ChatTypingMessage;

export type QuickAction = {
  id: string;
  label: string;
};
