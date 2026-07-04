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

export type ChatActionMessage = {
  id: string;
  role: 'action';
  content: string;
  actionId: string;
  appName: string;
  deepLink?: string;
  fallbackUrl: string;
};

export type ChatMessage =
  | ChatTextMessage
  | ChatSummaryMessage
  | ChatTypingMessage
  | ChatActionMessage;

export type QuickAction = {
  id: string;
  label: string;
};

export type ChatResult = {
  kind: 'chat';
  answer: string;
  taskCreated: boolean;
  memorySaved: boolean;
  ragUsed: boolean;
  sessionId: string;
  intent: {
    needsTask: boolean;
    needsMemory: boolean;
  };
};

export type ActionResult = {
  kind: 'action';
  answer: string;
  actionId: string;
  appName: string;
  deepLink?: string;
  fallbackUrl: string;
  sessionId: string;
};

export type ChatOrActionResult = ChatResult | ActionResult;

export type ChatSessionDto = {
  id: string;
  title: string;
  createdAt: string;
  lastActivity: string;
};
