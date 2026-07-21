import type { GmailEmail } from '../services/gmail';
import type { MailItem } from '../types/mail';

export function formatGmailTime(receivedAt: string): string {
  try {
    const date = new Date(receivedAt);
    if (Number.isNaN(date.getTime())) {
      return receivedAt;
    }

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  } catch {
    return receivedAt;
  }
}

export function mapGmailToMailItem(email: GmailEmail, pinnedEmailIds: string[]): MailItem {
  return {
    id: email.id,
    sender: email.sender,
    time: formatGmailTime(email.receivedAt),
    subject: email.subject ?? email.aiAnalysis.summary,
    preview: email.content.slice(0, 100),
    icon: email.isRead ? 'drafts' : 'email',
    tone: email.isRead ? 'secondary' : 'primary',
    isPinned: pinnedEmailIds.includes(email.id),
  };
}
