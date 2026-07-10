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

function cleanSenderName(value: string): string {
  const withoutAngle = value.replace(/<[^>]*>/g, '').trim();
  const withoutParenEmail = withoutAngle.replace(/\([^\)]*@[\w.\-+]+\)/g, '').trim();
  return withoutParenEmail || value.trim();
}

function getSender(email: any): string {
  if (typeof email.sender === 'string' && email.sender.trim()) return cleanSenderName(email.sender);
  if (typeof email.from === 'string' && email.from.trim()) return cleanSenderName(email.from);
  if (email.from?.value) return cleanSenderName(String(email.from.value));
  if (email.from?.name) return cleanSenderName(String(email.from.name));
  if (Array.isArray(email.from) && email.from.length > 0) return cleanSenderName(String(email.from[0]));
  if (typeof email.address === 'string' && email.address.trim()) return email.address.trim();
  return 'Người gửi không xác định';
}

function getFromHeader(email: any): string {
  if (typeof email.sender === 'string' && email.sender.trim()) return email.sender.trim();
  if (typeof email.from === 'string' && email.from.trim()) return email.from.trim();
  if (email.from?.value) return String(email.from.value).trim();
  if (email.from?.name && email.from?.email) return `${String(email.from.name).trim()} <${String(email.from.email).trim()}>`;
  if (email.from?.name) return String(email.from.name).trim();
  if (Array.isArray(email.from) && email.from.length > 0) return String(email.from[0]).trim();
  if (typeof email.address === 'string' && email.address.trim()) return email.address.trim();
  return 'Người gửi không xác định';
}

function getContent(email: any): string {
  return (
    email.content ??
    email.body ??
    email.snippet ??
    email.preview ??
    email.text ??
    email.textBody ??
    email.htmlBody ??
    ''
  );
}

function getRecipient(email: any): string {
  if (typeof email.recipient === 'string' && email.recipient.trim()) return email.recipient;
  if (typeof email.to === 'string' && email.to.trim()) return email.to;
  if (typeof email.toAddress === 'string' && email.toAddress.trim()) return email.toAddress;
  if (typeof email.toEmail === 'string' && email.toEmail.trim()) return email.toEmail;
  if (Array.isArray(email.to) && email.to.length > 0) return String(email.to[0]);
  if (Array.isArray(email.recipients) && email.recipients.length > 0) return String(email.recipients[0]);
  if (typeof email.address === 'string' && email.address.trim()) return email.address;
  return '';
}

function getReceivedAt(email: any): string {
  if (typeof email.receivedAt === 'string' && email.receivedAt.trim()) {
    return email.receivedAt;
  }
  if (typeof email.date === 'string' && email.date.trim()) {
    return email.date;
  }
  if (email.internalDate) {
    return String(email.internalDate);
  }
  if (email.timestamp) {
    return String(email.timestamp);
  }
  if (email.receivedDate) {
    return String(email.receivedDate);
  }
  return new Date().toISOString();
}

function normalizeGmailEmail(email: any): GmailEmail {
  const rawContent = getContent(email);
  const subject = typeof email.subject === 'string' ? email.subject : undefined;
  const aiSummary =
    typeof email.aiAnalysis?.summary === 'string'
      ? email.aiAnalysis.summary
      : subject ?? rawContent.slice(0, 120);

  return {
    id: String(
      email.id ?? email.messageId ?? email._id ?? email.uid ?? email.threadId ?? Math.random().toString(36).slice(2),
    ),
    sender: getSender(email),
    fromHeader: getFromHeader(email),
    recipient: getRecipient(email),
    subject,
    content: rawContent,
    receivedAt: getReceivedAt(email),
    isRead: Boolean(email.isRead ?? email.read ?? false),
    aiAnalysis: {
      summary: aiSummary,
      keyPoints: typeof email.aiAnalysis?.keyPoints === 'string' ? email.aiAnalysis.keyPoints : '',
      actionItems: typeof email.aiAnalysis?.actionItems === 'string' ? email.aiAnalysis.actionItems : '',
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
