import { apiGet, apiPost, apiPut } from './api';
import { getGoogleIdToken } from './googleAuth';

export type GmailConnectRequest = {
  googleRefreshToken: string;
};

export type GmailConnectResponse = {
  success?: boolean;
  message?: string;
};

export type GmailAutoSyncResponse = {
  success?: boolean;
  message?: string;
  data?: {
    addedEmails: number;
    addedSummaries: number;
  };
};

export type GmailEmail = {
  id: string;
  sender: string;
  fromHeader: string;
  recipient?: string;
  subject?: string;
  content: string;
  receivedAt: string;
  isRead: boolean;
  isPinned: boolean;
  isArchived: boolean;
  aiStatus?: string | number;
  // Category do AI phân loại: Work | Personal | Finance | Promotion | Social |
  // Education | Health | Travel | Security | Spam | Other
  category: string | null;
  // 1 (thấp) → 5 (khẩn cấp)
  importance: number | null;
  deadline: string | null;
  aiAnalysis: {
    summary: string;
    keyPoints: string;
    actionItems: string;
  };
};

export type GmailEmailsResponse = {
  success?: boolean;
  message?: string;
  data?: {
    total?: number;
    page?: number;
    emails?: GmailEmail[];
  };
};

// ─────────────────────────────────────────────────────────────
// Kiểu dữ liệu cho GET /api/Gmail/inbox — gom nhóm kiểu tab Gmail
// điện thoại: Primary / Social / Promotions / Spam
// ─────────────────────────────────────────────────────────────
export type GmailInboxTab = 'Primary' | 'Social' | 'Promotions' | 'Spam';

export type GmailInboxResult = {
  tabs: Record<GmailInboxTab, GmailEmail[]>;
  counts: Record<GmailInboxTab, number>;
};

function cleanSenderName(value: string): string {
  const withoutAngle = value.replace(/<[^>]*>/g, '').trim();
  const withoutParenEmail = withoutAngle.replace(/\([^\)]*@[\w.\-+]+\)/g, '').trim();
  return withoutParenEmail || value.trim();
}

function getSender(email: any): string {
  if (typeof email.sender === 'string' && email.sender.trim()) return cleanSenderName(email.sender);
  if (typeof email.Sender === 'string' && email.Sender.trim()) return cleanSenderName(email.Sender);
  if (typeof email.from === 'string' && email.from.trim()) return cleanSenderName(email.from);
  if (typeof email.From === 'string' && email.From.trim()) return cleanSenderName(email.From);
  if (email.from?.value) return cleanSenderName(String(email.from.value));
  if (email.from?.name) return cleanSenderName(String(email.from.name));
  if (Array.isArray(email.from) && email.from.length > 0) return cleanSenderName(String(email.from[0]));
  if (typeof email.address === 'string' && email.address.trim()) return email.address.trim();
  if (typeof email.Address === 'string' && email.Address.trim()) return email.Address.trim();
  return 'Người gửi không xác định';
}

function getFromHeader(email: any): string {
  if (typeof email.sender === 'string' && email.sender.trim()) return email.sender.trim();
  if (typeof email.Sender === 'string' && email.Sender.trim()) return email.Sender.trim();
  if (typeof email.from === 'string' && email.from.trim()) return email.from.trim();
  if (typeof email.From === 'string' && email.From.trim()) return email.From.trim();
  if (email.from?.value) return String(email.from.value).trim();
  if (email.from?.name && email.from?.email) return `${String(email.from.name).trim()} <${String(email.from.email).trim()}>`;
  if (email.from?.name) return String(email.from.name).trim();
  if (Array.isArray(email.from) && email.from.length > 0) return String(email.from[0]).trim();
  if (typeof email.address === 'string' && email.address.trim()) return email.address.trim();
  if (typeof email.Address === 'string' && email.Address.trim()) return email.Address.trim();
  return 'Người gửi không xác định';
}

function getContent(email: any): string {
  const content = (
    email.content ?? email.Content ??
    email.body ?? email.Body ??
    email.snippet ?? email.Snippet ??
    email.preview ?? email.Preview ??
    email.text ?? email.Text ??
    email.textBody ?? email.TextBody ??
    email.htmlBody ?? email.HtmlBody ??
    email.bodyContent ?? email.BodyContent ??
    email.textContent ?? email.TextContent ??
    email.originalContent ?? email.OriginalContent ??
    email.rawContent ?? email.RawContent ??
    ''
  );

  return typeof content === 'string' ? content : '';
}

function getAiAnalysis(email: any): any {
  let analysis = email.aiAnalysis ?? email.AiAnalysis;
  if (typeof analysis === 'string') {
    try {
      analysis = JSON.parse(analysis);
    } catch (e) {
      // ignore
    }
  }
  return analysis ?? {};
}

function getHeaderValue(headers: any[], name: string): string | undefined {
  if (!Array.isArray(headers)) return undefined;
  const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return header?.value;
}

function getRecipient(email: any): string {
  if (typeof email.recipient === 'string' && email.recipient.trim()) return email.recipient;
  if (typeof email.Recipient === 'string' && email.Recipient.trim()) return email.Recipient;
  if (typeof email.to === 'string' && email.to.trim()) return email.to;
  if (typeof email.To === 'string' && email.To.trim()) return email.To;
  if (typeof email.toAddress === 'string' && email.toAddress.trim()) return email.toAddress;
  if (typeof email.toEmail === 'string' && email.toEmail.trim()) return email.toEmail;
  if (Array.isArray(email.to) && email.to.length > 0) return String(email.to[0]);
  if (Array.isArray(email.recipients) && email.recipients.length > 0) return String(email.recipients[0]);
  if (typeof email.address === 'string' && email.address.trim()) return email.address;
  if (typeof email.Address === 'string' && email.Address.trim()) return email.Address;
  return '';
}

function getReceivedAt(email: any): string {
  if (typeof email.receivedAt === 'string' && email.receivedAt.trim()) {
    return email.receivedAt;
  }
  if (typeof email.ReceivedAt === 'string' && email.ReceivedAt.trim()) {
    return email.ReceivedAt;
  }
  if (typeof email.date === 'string' && email.date.trim()) {
    return email.date;
  }
  if (typeof email.Date === 'string' && email.Date.trim()) {
    return email.Date;
  }
  if (email.internalDate || email.InternalDate) {
    return String(email.internalDate || email.InternalDate);
  }
  if (email.timestamp || email.Timestamp) {
    return String(email.timestamp || email.Timestamp);
  }
  if (email.receivedDate || email.ReceivedDate) {
    return String(email.receivedDate || email.ReceivedDate);
  }
  return new Date().toISOString();
}

function normalizeGmailEmail(email: any): GmailEmail {
  const rawContent = getContent(email);
  const subject = typeof email.subject === 'string' ? email.subject : typeof email.Subject === 'string' ? email.Subject : undefined;
  const analysisObj = getAiAnalysis(email);

  // `/inbox` trả field Summary phẳng (không lồng trong aiAnalysis) cho các
  // mail Primary/Social, còn Promotions/Spam trả "" (xem GmailAiWorker BE).
  // `/emails` (cũ) trả lồng trong AiAnalysis.Summary. Hỗ trợ cả hai.
  const flatSummary = typeof email.summary === 'string' ? email.summary : typeof email.Summary === 'string' ? email.Summary : undefined;
  const nestedSummary =
    typeof analysisObj.summary === 'string' ? analysisObj.summary : undefined;
  const nestedSummaryCapitalized =
    typeof analysisObj.Summary === 'string' ? analysisObj.Summary : undefined;

  let aiSummary = flatSummary ?? nestedSummary ?? nestedSummaryCapitalized ?? '';
  
  if (!aiSummary || aiSummary.trim() === subject?.trim()) {
      aiSummary = rawContent ? rawContent.slice(0, 150) + (rawContent.length > 150 ? '...' : '') : '';
  }

  const flatActionItems = typeof email.actionItems === 'string' ? email.actionItems : typeof email.ActionItems === 'string' ? email.ActionItems : undefined;
  const nestedActionItems =
    typeof email.aiAnalysis?.actionItems === 'string' ? email.aiAnalysis.actionItems : typeof email.AiAnalysis?.ActionItems === 'string' ? email.AiAnalysis.ActionItems : undefined;

  const flatKeyPoints = typeof email.keyPoints === 'string' ? email.keyPoints : typeof email.KeyPoints === 'string' ? email.KeyPoints : undefined;
  const nestedKeyPoints =
    typeof email.aiAnalysis?.keyPoints === 'string' ? email.aiAnalysis.keyPoints : typeof email.AiAnalysis?.KeyPoints === 'string' ? email.AiAnalysis.KeyPoints : undefined;

  const category =
    typeof email.category === 'string'
      ? email.category
      : typeof email.Category === 'string'
      ? email.Category
      : typeof email.aiAnalysis?.category === 'string'
      ? email.aiAnalysis.category
      : typeof email.AiAnalysis?.Category === 'string'
      ? email.AiAnalysis.Category
      : null;

  const importance =
    typeof email.importance === 'number'
      ? email.importance
      : typeof email.Importance === 'number'
      ? email.Importance
      : typeof email.aiAnalysis?.importance === 'number'
      ? email.aiAnalysis.importance
      : typeof email.AiAnalysis?.Importance === 'number'
      ? email.AiAnalysis.Importance
      : null;

  const deadline =
    typeof email.deadline === 'string'
      ? email.deadline
      : typeof email.Deadline === 'string'
      ? email.Deadline
      : typeof email.aiAnalysis?.deadline === 'string'
      ? email.aiAnalysis.deadline
      : typeof email.AiAnalysis?.Deadline === 'string'
      ? email.AiAnalysis.Deadline
      : null;

  return {
    id: String(
      email.id ?? email.Id ?? email.messageId ?? email.MessageId ?? email._id ?? email.uid ?? email.threadId ?? Math.random().toString(36).slice(2),
    ),
    sender: getSender(email),
    fromHeader: getFromHeader(email),
    recipient: getRecipient(email),
    subject,
    content: rawContent,
    receivedAt: getReceivedAt(email),
    isRead: Boolean(email.isRead ?? email.IsRead ?? email.read ?? false),
    isPinned: Boolean(email.isPinned ?? email.IsPinned ?? false),
    isArchived: Boolean(email.isArchived ?? email.IsArchived ?? false),
    aiStatus: email.aiStatus ?? email.AiStatus,
    category,
    importance,
    deadline,
    aiAnalysis: {
      summary: aiSummary || subject || rawContent.slice(0, 120),
      keyPoints: flatKeyPoints ?? nestedKeyPoints ?? '',
      actionItems: flatActionItems ?? nestedActionItems ?? '',
    },
  };
}

export async function connectGmail(
  serverAuthCode?: string,
): Promise<GmailConnectResponse> {
  const response = await apiPost<GmailConnectResponse>('/api/Gmail/connect', {

    googleRefreshToken: serverAuthCode,
  });

  return {
    success: response.success ?? true,
    message: response.message,
  };
}

async function resolveGoogleServerAuthCode(loginHint?: string): Promise<string> {
  const{serverAuthCode} = await getGoogleIdToken(loginHint);
  if (serverAuthCode) {
    console.log('📧 resolveGoogleServerAuthCode: using serverAuthCode length =', serverAuthCode.length);
    return serverAuthCode;
  }

  throw new Error('Không tìm thấy serverAuthCode để gửi lên Gmail.');
}

export async function connectGmailForCurrentUser(loginHint?: string): Promise<GmailConnectResponse> {
  const serverAuthCode = await resolveGoogleServerAuthCode(loginHint);
  return connectGmail(serverAuthCode );
}

export async function autoSyncGmail(): Promise<{
  success: boolean;
  message: string;
  addedEmails: number;
  addedSummaries: number;
}> {
  try {
    const response = await apiPost<GmailAutoSyncResponse>('/api/Gmail/auto-sync', {});

    console.log('📧 autoSyncGmail response', JSON.stringify(response, null, 2));

    return {
      success: response.success ?? true,
      message: response.message ?? 'Đã đồng bộ Gmail.',
      addedEmails: response.data?.addedEmails ?? 0,
      addedSummaries: response.data?.addedSummaries ?? 0,
    };
  } catch (error: any) {
    const isNoNewMail = error?.message?.includes('Không có email mới');

    if (isNoNewMail) {
      console.log('📧 autoSyncGmail:', error.message);
    } else {
      console.error('Gmail auto-sync failed:', error);
    }

    return {
      success: isNoNewMail ? true : false,
      message: error?.message || 'Đồng bộ Gmail thất bại.',
      addedEmails: 0,
      addedSummaries: 0,
    };
  }
}

export async function fetchGmailEmails(
  page = 1,
  limit = 20,
  options?: {
    includeArchived?: boolean;
    minImportance?: number;
    category?: string;
  },
): Promise<GmailEmail[]> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (options?.includeArchived !== undefined) params.set('includeArchived', String(Boolean(options.includeArchived)));
  if (options?.minImportance !== undefined) params.set('minImportance', String(Number(options.minImportance)));
  if (options?.category) params.set('category', String(options.category));

  const response = await apiGet<GmailEmailsResponse>(
    `/api/Gmail/emails?${params.toString()}`,
  );

  console.log('📧 fetchGmailEmails response', JSON.stringify(response, null, 2));

  const rawEmails =
    Array.isArray(response)
      ? response
      : Array.isArray((response as any)?.data)
      ? (response as any).data
      : Array.isArray((response as any)?.data?.emails)
      ? (response as any).data.emails
      : Array.isArray((response as any).emails)
      ? (response as any).emails
      : Array.isArray((response as any)?.data?.data?.emails)
      ? (response as any).data.data.emails
      : [];

  return rawEmails.map(normalizeGmailEmail);
}

// ─────────────────────────────────────────────────────────────
// GET /api/Gmail/inbox — endpoint mới, gom nhóm sẵn theo tab
// (Primary/Social/Promotions/Spam). Dùng cái này thay cho
// fetchGmailEmails() ở màn hình hộp thư chính.
// ─────────────────────────────────────────────────────────────
export async function fetchGmailInbox(limit = 30): Promise<GmailInboxResult> {
  // Bỏ qua /api/Gmail/inbox vì API này bị Backend cắt mất trường content.
  // Thay vào đó, gọi /api/Gmail/emails để lấy danh sách đầy đủ (có content),
  // sau đó tự phân loại thành các Tab ở Frontend.
  const emails = await fetchGmailEmails(1, limit * 4, { includeArchived: false });
  
  const tabKeys: GmailInboxTab[] = ['Primary', 'Social', 'Promotions', 'Spam'];
  const tabs = { Primary: [], Social: [], Promotions: [], Spam: [] } as Record<GmailInboxTab, GmailEmail[]>;
  
  emails.forEach(email => {
    let cat = email.category as GmailInboxTab;
    if (!tabKeys.includes(cat)) {
      cat = 'Primary';
    }
    if (tabs[cat].length < limit) {
      tabs[cat].push(email);
    }
  });

  const counts = {
    Primary: tabs['Primary'].length,
    Social: tabs['Social'].length,
    Promotions: tabs['Promotions'].length,
    Spam: tabs['Spam'].length,
  };

  return { tabs, counts };
}

export async function markGmailEmailAsRead(
  emailId: string,
): Promise<{ success: boolean; message?: string }> {
  const response = await apiPut<{ success?: boolean; message?: string }>(
    `/api/Gmail/emails/${emailId}/read`,
    {},
  );

  return {
    success: response.success ?? true,
    message: response.message,
  };
}

export async function pinGmailEmail(
  emailId: string,
): Promise<{ success: boolean; message?: string }> {
  const response = await apiPut<{ success?: boolean; message?: string }>(
    `/api/Gmail/emails/${emailId}/pin`,
    {},
  );

  return {
    success: response.success ?? true,
    message: response.message,
  };
}

export async function archiveGmailEmail(
  emailId: string,
): Promise<{ success: boolean; message?: string }> {
  const response = await apiPut<{ success?: boolean; message?: string }>(
    `/api/Gmail/emails/${emailId}/archive`,
    {},
  );

  return {
    success: response.success ?? true,
    message: response.message,
  };
}
// Note: backend toggles archive/pin state when calling the same endpoint twice.

export async function getGmailDashboard(): Promise<Record<string, any>> {
  try {
    const response = await apiGet<Record<string, any>>('/api/Gmail/dashboard');
    return response || {};
  } catch (error) {
    console.error('Failed to fetch Gmail dashboard:', error);
    throw error;
  }
}

export async function getGmailPreferences(): Promise<Record<string, any>> {
  try {
    const response = await apiGet<Record<string, any>>('/api/Gmail/preferences');
    return response || {};
  } catch (error) {
    console.error('Failed to fetch Gmail preferences:', error);
    throw error;
  }
}