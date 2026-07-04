import { apiPost, apiGet, apiDelete } from './api';
import type { ChatOrActionResult, ChatSessionDto, ActionResult, ChatResult } from '../types/chat';

// Khớp với Object nặc danh trả về từ BE (chat thường)
type ChatRawDto = {
  answer?: string;
  Answer?: string;
  taskCreated?: boolean;
  TaskCreated?: boolean;
  memorySaved?: boolean;
  MemorySaved?: boolean;
  ragUsed?: boolean;
  RagUsed?: boolean;
  sessionId?: string;
  SessionId?: string;
  intent?: {
    needsTask?: boolean;
    NeedsTask?: boolean;
    needsMemory?: boolean;
    NeedsMemory?: boolean;
  };
  Intent?: {
    needsTask?: boolean;
    NeedsTask?: boolean;
    needsMemory?: boolean;
    NeedsMemory?: boolean;
  };
};

// Khớp với Object nặc danh trả về từ BE khi Type = "action"
type ActionRawDto = {
  type?: string;
  Type?: string;
  answer?: string;
  Answer?: string;
  actionId?: string;
  ActionId?: string;
  appName?: string;
  AppName?: string;
  deepLink?: string;
  DeepLink?: string;
  fallbackUrl?: string;
  FallbackUrl?: string;
  sessionId?: string;
  SessionId?: string;
};

// ─────────────────────────────────────────────────────────────
// POST /api/Ai/chat — Endpoint chính xử lý hội thoại (Voice + Text)
// Trả về ChatResult (trả lời thường) hoặc ActionResult (lệnh mở app)
// ─────────────────────────────────────────────────────────────
export async function chat(message: string, sessionId?: string): Promise<ChatOrActionResult> {
  const data = await apiPost<ActionRawDto & ChatRawDto>('/api/Ai/chat', {
    Message: message,
    SessionId: sessionId ?? null,
  });

  const type = data?.type ?? data?.Type;

  if (type === 'action') {
    return {
      kind: 'action',
      answer: data?.answer ?? data?.Answer ?? '',
      actionId: data?.actionId ?? data?.ActionId ?? '',
      appName: data?.appName ?? data?.AppName ?? '',
      deepLink: data?.deepLink ?? data?.DeepLink,
      fallbackUrl: data?.fallbackUrl ?? data?.FallbackUrl ?? '',
      sessionId: data?.sessionId ?? data?.SessionId ?? '',
    };
  }

  const intent = data?.intent || data?.Intent || {};
  return {
    kind: 'chat',
    answer: data?.answer ?? data?.Answer ?? '',
    taskCreated: data?.taskCreated ?? data?.TaskCreated ?? false,
    memorySaved: data?.memorySaved ?? data?.MemorySaved ?? false,
    ragUsed: data?.ragUsed ?? data?.RagUsed ?? false,
    sessionId: data?.sessionId ?? data?.SessionId ?? '',
    intent: {
      needsTask: intent.needsTask ?? intent.NeedsTask ?? false,
      needsMemory: intent.needsMemory ?? intent.NeedsMemory ?? false,
    },
  };
}

export async function chatWithRag(message: string): Promise<string> {
  const data = await apiPost<{ answer?: string }>('/api/Ai/chat-rag', { Message: message });
  return data?.answer ?? '';
}

export async function learnFact(message: string): Promise<string> {
  return await apiPost<string>('/api/Ai/learn-fact', { Message: message });
}

export async function smartAddTask(message: string): Promise<string> {
  return await apiPost<string>('/api/Ai/smart-add-task', { Message: message });
}

export async function rebuildIndex(): Promise<void> {
  await apiPost<string>('/api/Ai/rebuild-index', {});
}

export async function getSessionMessages(sessionId: string): Promise<any[]> {
  try {
    const res = await apiGet<any>(`/api/Ai/sessions/${sessionId}/messages`);
    if (Array.isArray(res)) return res;
    if (res && typeof res === 'object') {
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.messages)) return res.messages;
      if (Array.isArray(res.items)) return res.items;
      if (Array.isArray(res.result)) return res.result;
      if (Array.isArray(res.value)) return res.value;
    }
    console.warn(`getSessionMessages received unexpected format for session ${sessionId}:`, res);
    return [];
  } catch (error) {
    console.error(`getSessionMessages error for session ${sessionId}:`, error);
    return [];
  }
}

export async function getSessions(): Promise<ChatSessionDto[]> {
  try {
    const res = await apiGet<any>('/api/Ai/sessions');
    if (Array.isArray(res)) return res;
    if (res && typeof res === 'object') {
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.sessions)) return res.sessions;
      if (Array.isArray(res.items)) return res.items;
      if (Array.isArray(res.result)) return res.result;
      if (Array.isArray(res.value)) return res.value;
    }
    console.warn('getSessions received unexpected format:', res);
    return [];
  } catch (error) {
    console.error('getSessions error:', error);
    return [];
  }
}

export async function createNewSession(): Promise<{ sessionId: string }> {
  return await apiPost<{ sessionId: string }>('/api/Ai/new-session', {});
}

export async function deleteSession(sessionId: string): Promise<string> {
  return await apiDelete<string>(`/api/Ai/sessions/${sessionId}`);
}

/** POST /api/Ai/actions/{id}/mark-executed — Báo BE đã mở app xong */
export async function markActionExecuted(actionId: string): Promise<void> {
  await apiPost<string>(`/api/Ai/actions/${actionId}/mark-executed`, {});
}
