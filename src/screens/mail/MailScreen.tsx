import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ComposeFAB, { useComposeFabScroll } from '../../components/mail/ComposeFAB';
import GmailConnectBanner from '../../components/mail/GmailConnectBanner';
import MailDetailModal from '../../components/mail/MailDetailModal';
import MailAiSummaryCard from '../../components/mail/MailAiSummaryCard';
import MailCategorySection from '../../components/mail/MailCategorySection';
import MailFilterBar from '../../components/mail/MailFilterBar';
import { TabScreenLayout, TopAppBar } from '../../components/navigation';
import {
  getBottomNavReservedHeight,
  SCROLL_BOTTOM_EXTRA,
} from '../../constants/layout';
import {
  MAIL_AI_SUMMARY,
  MAIL_FILTERS,
} from '../../data/mailMock';
import type { MailCategory, MailFilterId, MailItem } from '../../types/mail';
import { useOpenSettings } from '../../hooks/useOpenSettings';
import {
  autoSyncGmail,
  fetchGmailEmails,
  GmailEmail,
  markGmailEmailAsRead,
} from '../../services/gmail';

export default function MailScreen() {
  const insets = useSafeAreaInsets();
  const openSettings = useOpenSettings();
  const [activeFilter, setActiveFilter] = useState<MailFilterId>('all');
  const [isConnecting, setIsConnecting] = useState(false);
  const [gmailEmails, setGmailEmails] = useState<GmailEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const isFocused = useIsFocused();
  const fabAnim = useComposeFabScroll();
  const bottomChrome = getBottomNavReservedHeight(insets);

  const formatGmailTime = (receivedAt: string) => {
    try {
      const date = new Date(receivedAt);
      if (Number.isNaN(date.getTime())) {
        return receivedAt;
      }
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return receivedAt;
    }
  };

  const mapGmailToMailItem = (email: GmailEmail): MailItem => ({
    id: email.id,
    sender: email.sender,
    time: formatGmailTime(email.receivedAt),
    subject: email.subject ?? email.aiAnalysis.summary,
    preview: email.content.slice(0, 100),
    icon: email.isRead ? 'drafts' : 'email',
    tone: email.isRead ? 'secondary' : 'primary',
  });

  const isImportantEmail = (email: GmailEmail) => {
    if (!email.isRead) {
      return true;
    }

    const importantKeywords = [
      'cảnh báo',
      'quan trọng',
      'bảo mật',
      'xác thực',
      'yêu cầu',
      'mời',
      'họp',
      'invoice',
      'payment',
      'urgent',
      'alert',
      'verify',
      'thông báo',
      'ếk',
      'nộp',
      'hạn',
      'thanh toán',
      'refund',
    ];

    const text = [
      email.sender,
      email.subject ?? '',
      email.content,
      email.aiAnalysis.summary,
      email.aiAnalysis.keyPoints,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return importantKeywords.some((keyword) => text.includes(keyword));
  };

  const filteredGmailEmails = useMemo(() => {
    if (gmailEmails.length === 0) return [];

    const now = Date.now();
    const recentThreshold = 1000 * 60 * 60 * 24 * 2; // 2 days

    return gmailEmails.filter((email) => {
      if (activeFilter === 'all') {
        return true;
      }
      if (activeFilter === 'unread') {
        return !email.isRead;
      }
      if (activeFilter === 'recent') {
        const date = new Date(email.receivedAt).getTime();
        return !Number.isNaN(date) && now - date <= recentThreshold;
      }
      if (activeFilter === 'important') {
        return isImportantEmail(email);
      }
      return true;
    });
  }, [activeFilter, gmailEmails]);

  const gmailCategory = useMemo<MailCategory | null>(() => {
    if (filteredGmailEmails.length === 0) return null;
    return {
      id: 'gmail',
      title: 'Gmail của bạn',
      tone: 'primary',
      emails: filteredGmailEmails.map(mapGmailToMailItem),
    };
  }, [filteredGmailEmails]);

  const handleEmailPress = async (emailId: string) => {
    const email = gmailEmails.find((item) => item.id === emailId);
    if (!email) return;

    try {
      await markGmailEmailAsRead(emailId);
      setGmailEmails((prev) =>
        prev.map((item) =>
          item.id === emailId ? { ...item, isRead: true } : item,
        ),
      );
    } catch (error: any) {
      console.error('❌ MailScreen: Lỗi đánh dấu email là đã đọc', error);
    }

    setSelectedEmail(email);
    setIsDetailOpen(true);
  };

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const syncOnFocus = async () => {
      setIsConnecting(true);
      setSyncMessage('Đang đồng bộ Gmail...');
      try {
        const syncResult = await autoSyncGmail();
        console.log('📧 MailScreen: Gmail auto-sync result', syncResult);
        if (!syncResult.success) {
          setSyncMessage(syncResult.message || 'Đồng bộ Gmail thất bại.');
        } else {
          setSyncMessage(syncResult.message || 'Đã đồng bộ Gmail.');
          setIsConnected(true);
        }
        await loadGmailEmails();
      } catch (error: any) {
        console.error('❌ MailScreen: Lỗi auto-sync Gmail', error);
        setSyncMessage(error?.message || 'Không thể đồng bộ Gmail.');
      } finally {
        setIsConnecting(false);
      }
    };

    syncOnFocus();
  }, [isFocused]);

  const loadGmailEmails = async (page = 1, limit = 20) => {
    setSyncMessage('Đang tải email Gmail...');
    try {
      const emails = await fetchGmailEmails(page, limit);
      setGmailEmails(emails);
      if (emails.length > 0) {
        setIsConnected(true);
      }
      setSyncMessage(emails.length > 0 ? `Đã tải ${emails.length} email Gmail.` : 'Chưa có email Gmail.');
    } catch (error: any) {
      console.error('❌ MailScreen: Lỗi lấy email Gmail', error);
      setSyncMessage(error?.message || 'Không thể tải email Gmail.');
    }
  };

  return (
    <TabScreenLayout
      topBar={<TopAppBar onSettingsPress={openSettings} />}
      bottomExtra={SCROLL_BOTTOM_EXTRA + 48}
      scrollViewProps={{
        onScroll: fabAnim.onScroll,
        scrollEventThrottle: 16,
      }}
      footer={
        <ComposeFAB
          bottomOffset={bottomChrome + 32}
          translateY={fabAnim.translateY}
          scale={fabAnim.scale}
          spin={fabAnim.spin}
          opacity={fabAnim.opacity}
        />
      }
    >
      <GmailConnectBanner visible={isConnecting} />

      <MailFilterBar
        filters={MAIL_FILTERS}
        activeId={activeFilter}
        onChange={setActiveFilter}
      />

      <MailAiSummaryCard summary={MAIL_AI_SUMMARY} />

      <View style={styles.gmailStatusContainer}>
        <Text style={styles.gmailStatusText}>{syncMessage || 'Đang chờ Gmail...'}</Text>
      </View>

      <MailDetailModal
        visible={isDetailOpen}
        email={selectedEmail}
        onClose={() => setIsDetailOpen(false)}
      />

      {gmailCategory ? (
        <MailCategorySection
          key={gmailCategory.id}
          category={gmailCategory}
          onEmailPress={handleEmailPress}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateTitle}>Không có email để hiển thị</Text>
          <Text style={styles.emptyStateSubtitle}>
            {isConnected
              ? 'Gmail đã được kết nối nhưng hiện tại chưa có email nào để hiển thị.'
              : 'Vui lòng kết nối Gmail hoặc thử lại sau khi đồng bộ xong.'}
          </Text>
        </View>
      )}
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  gmailStatusContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  gmailStatusText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyStateContainer: {
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginHorizontal: 4,
    marginTop: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});
