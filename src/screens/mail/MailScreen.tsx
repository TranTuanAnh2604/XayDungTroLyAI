import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ComposeFAB, { useComposeFabScroll } from '../../components/mail/ComposeFAB';
import GmailConnectBanner from '../../components/mail/GmailConnectBanner';
import MailDetailModal from '../../components/mail/MailDetailModal';
import MailAiSummaryCard from '../../components/mail/MailAiSummaryCard';
import MailCategorySection from '../../components/mail/MailCategorySection';
import MailFilterBar from '../../components/mail/MailFilterBar';
import GmailDashboard from '../../components/mail/GmailDashboard';
import { TabScreenLayout, TopAppBar } from '../../components/navigation';
import { useTheme } from '../../hooks/useTheme';
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
  archiveGmailEmail,
  autoSyncGmail,
  fetchGmailEmails,
  GmailEmail,
  markGmailEmailAsRead,
  pinGmailEmail,
} from '../../services/gmail';

const CACHE_KEY = '@app:mail:cached_emails';
const LAST_SYNC_KEY = '@app:mail:last_sync';

export default function MailScreen() {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const openSettings = useOpenSettings();
  const [activeFilter, setActiveFilter] = useState<MailFilterId>('all');
  const [viewMode, setViewMode] = useState<'inbox' | 'dashboard'>('inbox');
  const [isConnecting, setIsConnecting] = useState(false);
  const [gmailEmails, setGmailEmails] = useState<GmailEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [pinnedEmailIds, setPinnedEmailIds] = useState<string[]>([]);
  const [archivedEmailIds, setArchivedEmailIds] = useState<string[]>([]);
  const hasLoadedPersistedIds = useRef(false);
  const PINNED_KEY = '@app:mail:pinned_ids';
  const ARCHIVED_KEY = '@app:mail:archived_ids';
  const isFocused = useIsFocused();
  const fabAnim = useComposeFabScroll();
  const bottomChrome = getBottomNavReservedHeight(insets);

  // Stop any running FAB animation when the screen unmounts to avoid native
  // animated node leaks after navigation.
  useEffect(() => fabAnim.cleanup, []);


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
      if (activeFilter === 'archived') {
        return archivedEmailIds.includes(email.id);
      }
      return true;
    });
  }, [activeFilter, gmailEmails, archivedEmailIds]);

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

  // Load persisted pinned/archived IDs on mount
  useEffect(() => {
    (async () => {
      try {
        const pinnedRaw = await AsyncStorage.getItem(PINNED_KEY);
        const archivedRaw = await AsyncStorage.getItem(ARCHIVED_KEY);
        if (pinnedRaw) {
          const parsed = JSON.parse(pinnedRaw);
          if (Array.isArray(parsed)) setPinnedEmailIds(parsed);
        }
        if (archivedRaw) {
          const parsed = JSON.parse(archivedRaw);
          if (Array.isArray(parsed)) setArchivedEmailIds(parsed);
        }
      } catch (err) {
        console.warn('MailScreen: Failed to load pinned/archived IDs', err);
      } finally {
        hasLoadedPersistedIds.current = true;
      }
    })();
  }, []);

  // On mount: load cached emails and decide whether to sync
  useEffect(() => {
    let mounted = true;

    async function loadCacheAndMaybeSync() {
      try {
        setSyncMessage('Đang tải cache email...');
        const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw) as GmailEmail[];
            if (Array.isArray(cached) && mounted) {
              setGmailEmails(cached);
              setSyncMessage('Hiển thị email từ cache.');
            }
          } catch (err) {
            console.warn('Failed to parse cached gmail emails', err);
          }
        }

        const lastRaw = await AsyncStorage.getItem(LAST_SYNC_KEY);
        const last = lastRaw ? new Date(lastRaw) : null;
        const now = new Date();
        const fiveMinutes = 5 * 60 * 1000;
        if (last && now.getTime() - last.getTime() < fiveMinutes) {
          // skip sync
          setSyncMessage('Đã đồng bộ gần đây, bỏ qua đồng bộ.');
          return;
        }

        // perform auto-sync and fetch fresh emails
        setIsConnecting(true);
        setSyncMessage('Đang đồng bộ Gmail...');

        try {
          const syncResult = await autoSyncGmail();
          console.log('Auto-sync result (initial load):', syncResult);
          if (!syncResult.success) {
            setSyncMessage(syncResult.message || 'Đồng bộ Gmail thất bại.');
          } else {
            setSyncMessage(syncResult.message || 'Đã đồng bộ Gmail.');
            setIsConnected(true);
          }
        } catch (err) {
          console.warn('Auto-sync failed on startup', err);
        }

        // Fetch with params from UI attachment (defaults)
        try {
          const emails = await fetchGmailEmails(1, 20, {
            includeArchived: false,
            minImportance: 1,
            category: '',
          });
          if (mounted) {
            setGmailEmails(emails);
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(emails));
            await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
            setSyncMessage(emails.length > 0 ? `Đã tải ${emails.length} email Gmail.` : 'Chưa có email Gmail.');
            if (emails.length > 0) setIsConnected(true);
          }
        } catch (err: any) {
          console.error('Failed to fetch gmail emails on startup', err);
          if (mounted) setSyncMessage(err?.message || 'Không thể tải email Gmail.');
        }
      } catch (err) {
        console.warn('loadCacheAndMaybeSync error', err);
      } finally {
        setIsConnecting(false);
      }
    }

    loadCacheAndMaybeSync();

    return () => {
      mounted = false;
    };
  }, []);

  // Persist pinned IDs
  useEffect(() => {
    if (!hasLoadedPersistedIds.current) return;
    AsyncStorage.setItem(PINNED_KEY, JSON.stringify(pinnedEmailIds)).catch(() => { });
  }, [pinnedEmailIds]);

  // Persist archived IDs
  useEffect(() => {
    if (!hasLoadedPersistedIds.current) return;
    AsyncStorage.setItem(ARCHIVED_KEY, JSON.stringify(archivedEmailIds)).catch(() => { });
  }, [archivedEmailIds]);

  const handlePinEmail = async (emailId: string) => {
    if (!emailId || isActionBusy) return;

    const isPinned = pinnedEmailIds.includes(emailId);
    setIsActionBusy(true);
    try {
      // Call pin endpoint — backend toggles the boolean state when called multiple times
      const result = await pinGmailEmail(emailId);
      if (result.success) {
        // Toggle local state according to previous value
        setPinnedEmailIds((prev) => (isPinned ? prev.filter((id) => id !== emailId) : prev.includes(emailId) ? prev : [...prev, emailId]));
        setSyncMessage(isPinned ? 'Đã bỏ pin email này.' : 'Đã đánh dấu email này là pin.');
      } else {
        Alert.alert('Thông báo', result.message || 'Không thể cập nhật trạng thái pin cho email này.');
      }
    } catch (error: any) {
      console.error('❌ MailScreen: Lỗi pin email', error);
      Alert.alert('Lỗi', error?.message || 'Không thể cập nhật trạng thái pin.');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleArchiveEmail = async (emailId: string) => {
    if (!emailId || isActionBusy) return;

    const isArchived = archivedEmailIds.includes(emailId);
    setIsActionBusy(true);
    try {
      const result = await archiveGmailEmail(emailId);
      if (result.success) {
        setArchivedEmailIds((prev) => (isArchived ? prev.filter((id) => id !== emailId) : prev.includes(emailId) ? prev : [...prev, emailId]));
        setSyncMessage(isArchived ? 'Đã bỏ lưu trữ email này.' : 'Đã lưu trữ email này.');
        if (!isArchived) setIsDetailOpen(false);
      } else {
        Alert.alert('Thông báo', result.message || 'Không thể cập nhật trạng thái lưu trữ cho email này.');
      }
    } catch (error: any) {
      console.error('❌ MailScreen: Lỗi archive email', error);
      Alert.alert('Lỗi', error?.message || 'Không thể cập nhật trạng thái lưu trữ.');
    } finally {
      setIsActionBusy(false);
    }
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
    >
      <View style={styles.viewModeContainer}>
        <View style={styles.segmentedControl}>
          <Text
            onPress={() => setViewMode('inbox')}
            style={[styles.segmentButton, viewMode === 'inbox' && styles.segmentActive, viewMode === 'inbox' ? { color: COLORS.onPrimary, backgroundColor: COLORS.primary } : { color: COLORS.onSurfaceVariant }]}
          >
            Hộp thư
          </Text>
          <Text
            onPress={() => setViewMode('dashboard')}
            style={[styles.segmentButton, viewMode === 'dashboard' && styles.segmentActive, viewMode === 'dashboard' ? { color: COLORS.onPrimary, backgroundColor: COLORS.primary } : { color: COLORS.onSurfaceVariant }]}
          >
            Dashboard
          </Text>
        </View>
      </View>

      {viewMode === 'dashboard' ? (
        <GmailDashboard />
      ) : (
        <>
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
            onPinPress={handlePinEmail}
            onArchivePress={handleArchiveEmail}
            isPinned={selectedEmail ? pinnedEmailIds.includes(selectedEmail.id) : false}
            isArchived={selectedEmail ? archivedEmailIds.includes(selectedEmail.id) : false}
            isBusy={isActionBusy}
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
        </>
      )}
    </TabScreenLayout>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  viewModeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 8,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    fontWeight: '600',
    fontSize: 14,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gmailStatusContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  gmailStatusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyStateContainer: {
    padding: 20,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    marginHorizontal: 4,
    marginTop: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
});
