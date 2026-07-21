import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ComposeFAB, { useComposeFabScroll } from '../../components/mail/ComposeFAB';
import GmailConnectBanner from '../../components/mail/GmailConnectBanner';
import MailDetailModal from '../../components/mail/MailDetailModal';
import MailCategorySection from '../../components/mail/MailCategorySection';
import MailFilterBar from '../../components/mail/MailFilterBar';
import GmailDashboard from '../../components/mail/GmailDashboard';
import { TabScreenLayout, TopAppBar } from '../../components/navigation';
import { useTheme } from '../../hooks/useTheme';
import IosGlassView from '../../components/ui/IosGlassView';
import PrimaryButton from '../../components/ui/PrimaryButton';
import {
  getBottomNavReservedHeight,
  getTopAppBarHeight,
  SCROLL_BOTTOM_EXTRA,
} from '../../constants/layout';
import type { MailCategory, MailFilterId, MailItem } from '../../types/mail';
import { useOpenSettings } from '../../hooks/useOpenSettings';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import {
  archiveGmailEmail,
  autoSyncGmail,
  fetchGmailEmails,
  fetchGmailInbox,
  GmailEmail,
  GmailInboxResult,
  GmailInboxTab,
  markGmailEmailAsRead,
  pinGmailEmail,
  connectGmailForCurrentUser,
} from '../../services/gmail';

const CACHE_KEY = '@app:mail:cached_inbox';
const LAST_SYNC_KEY = '@app:mail:last_sync';

const EMPTY_INBOX: GmailInboxResult = {
  tabs: { Primary: [], Social: [], Promotions: [], Spam: [] },
  counts: { Primary: 0, Social: 0, Promotions: 0, Spam: 0 },
};

// Map filter đang chọn trên UI -> tab tương ứng trả về từ BE.
// 'archived' không nằm trong /inbox nên xử lý riêng bên dưới.
const FILTER_TO_TAB: Partial<Record<MailFilterId, GmailInboxTab>> = {
  primary: 'Primary',
  social: 'Social',
  promotions: 'Promotions',
  spam: 'Spam',
};

const FILTER_OPTIONS: { id: MailFilterId; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'this_week', label: 'Tuần này' },
  { id: 'primary', label: 'Quan trọng' },
  { id: 'social', label: 'Xã hội' },
  { id: 'promotions', label: 'Quảng cáo' },
  { id: 'spam', label: 'Rác' },
  { id: 'archived', label: 'Đã lưu trữ' },
];

const CATEGORY_TITLES: Record<MailFilterId, string> = {
  all: 'Tất cả email',
  this_week: 'Email tuần này',
  primary: 'Hộp thư chính',
  social: 'Mạng xã hội',
  promotions: 'Quảng cáo',
  spam: 'Thư rác',
  archived: 'Đã lưu trữ',
};

// Những category KHÔNG được tính là "quan trọng" — dùng để quyết định có
// hiện box tóm tắt AI hay không, kể cả khi đang xem tab "Tất cả" (nơi mail
// từ mọi category trộn chung với nhau).
const NON_IMPORTANT_CATEGORIES = new Set(['Promotion', 'Social', 'Spam']);

const isImportantEmail = (email: GmailEmail) =>
  !email.category || !NON_IMPORTANT_CATEGORIES.has(email.category);

export default function MailScreen() {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const openSettings = useOpenSettings();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [activeFilter, setActiveFilter] = useState<MailFilterId>('all');
  const [viewMode, setViewMode] = useState<'inbox' | 'dashboard'>('inbox');
  const [isConnecting, setIsConnecting] = useState(false);
  const [inboxResult, setInboxResult] = useState<GmailInboxResult>(EMPTY_INBOX);
  const [archivedEmails, setArchivedEmails] = useState<GmailEmail[]>([]);
  const [isArchivedLoaded, setIsArchivedLoaded] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isActionBusy, setIsActionBusy] = useState(false);
  const isFocused = useIsFocused();
  const fabAnim = useComposeFabScroll();
  const bottomChrome = getBottomNavReservedHeight(insets);
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [viewMode]);

  // Stop any running FAB animation when the screen unmounts to avoid native
  // animated node leaks after navigation.
  useEffect(() => fabAnim.cleanup, []);

  const formatGmailTime = (receivedAt: string) => {
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
  };

  const mapGmailToMailItem = (email: GmailEmail): MailItem => {
    const important = isImportantEmail(email);
    // Chỉ tóm tắt (hiện box AI summary) cho mail quan trọng. Mail Social/
    // Promotion/Spam — kể cả khi đang xem chung trong tab "Tất cả" — luôn
    // hiện preview từ nội dung gốc, không hiện tóm tắt AI.
    const preview = important && email.aiAnalysis.summary
      ? email.aiAnalysis.summary
      : email.content;

    return {
      id: email.id,
      sender: email.sender,
      time: formatGmailTime(email.receivedAt),
      subject: email.subject || (important ? email.aiAnalysis.summary : '') || '(Không có tiêu đề)',
      preview: preview.slice(0, 100),
      icon: email.isRead ? 'drafts' : 'email',
      tone: email.isRead ? 'secondary' : 'primary',
      isPinned: email.isPinned,
      importance: important ? email.importance : null,
    };
  };

  // Danh sách email đang hiển thị theo tab đang chọn — pin luôn lên đầu.
  const currentTabEmails = useMemo<GmailEmail[]>(() => {
    let raw: GmailEmail[];
    if (activeFilter === 'archived') {
      raw = archivedEmails;
    } else if (activeFilter === 'all' || activeFilter === 'this_week') {
      raw = [
        ...inboxResult.tabs.Primary,
        ...inboxResult.tabs.Social,
        ...inboxResult.tabs.Promotions,
        ...inboxResult.tabs.Spam,
      ];
      if (activeFilter === 'this_week') {
        const now = new Date();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);
        raw = raw.filter(e => new Date(e.receivedAt) >= startOfWeek);
      }
    } else {
      raw = inboxResult.tabs[FILTER_TO_TAB[activeFilter] as GmailInboxTab] ?? [];
    }

    return [...raw].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
    });
  }, [activeFilter, inboxResult, archivedEmails]);

  const gmailCategory = useMemo<MailCategory | null>(() => {
    if (currentTabEmails.length === 0) return null;
    return {
      id: activeFilter,
      title: CATEGORY_TITLES[activeFilter],
      tone: 'primary',
      emails: currentTabEmails.map(mapGmailToMailItem),
    };
  }, [currentTabEmails, activeFilter]);

  const dynamicFilters = useMemo(() => {
    return FILTER_OPTIONS.map((f) => {
      if (f.id === 'archived') {
        return { ...f, count: isArchivedLoaded ? archivedEmails.length : undefined };
      }
      if (f.id === 'all') {
        const total = Object.values(inboxResult.counts).reduce((a, b) => a + b, 0);
        return { ...f, count: total };
      }
      if (f.id === 'this_week') {
        const raw = [
          ...inboxResult.tabs.Primary,
          ...inboxResult.tabs.Social,
          ...inboxResult.tabs.Promotions,
          ...inboxResult.tabs.Spam,
        ];
        const now = new Date();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);
        const count = raw.filter(e => new Date(e.receivedAt) >= startOfWeek).length;
        return { ...f, count };
      }
      const tab = FILTER_TO_TAB[f.id] as GmailInboxTab;
      return { ...f, count: inboxResult.counts[tab] };
    });
  }, [inboxResult, archivedEmails, isArchivedLoaded]);

  // Tìm 1 email theo id, bất kể đang nằm ở tab nào (kể cả archived) — dùng
  // cho các hành động (đọc/ghim/lưu trữ) không phụ thuộc filter đang chọn.
  const findEmailById = (emailId: string): GmailEmail | undefined => {
    for (const tab of Object.values(inboxResult.tabs)) {
      const found = tab.find((e) => e.id === emailId);
      if (found) return found;
    }
    return archivedEmails.find((e) => e.id === emailId);
  };

  // Cập nhật 1 field của email tại chỗ trong cả 2 nguồn state (inbox +
  // archived), tránh phải refetch cho những thay đổi nhỏ như "đã đọc".
  const patchEmailLocally = (emailId: string, patch: Partial<GmailEmail>) => {
    setInboxResult((prev) => {
      const next: GmailInboxResult = { ...prev, tabs: { ...prev.tabs } };
      (Object.keys(next.tabs) as GmailInboxTab[]).forEach((tab) => {
        next.tabs[tab] = next.tabs[tab].map((e) => (e.id === emailId ? { ...e, ...patch } : e));
      });
      return next;
    });
    setArchivedEmails((prev) => prev.map((e) => (e.id === emailId ? { ...e, ...patch } : e)));
  };

  const handleEmailPress = async (emailId: string) => {
    const email = findEmailById(emailId);
    if (!email) return;

    // Mở popup ngay lập tức để không bị lag/delay
    setSelectedEmail(email);
    setIsDetailOpen(true);

    if (email.isRead) return;

    // Optimistic update
    patchEmailLocally(emailId, { isRead: true });

    markGmailEmailAsRead(emailId).catch((error: any) => {
      console.error('❌ MailScreen: Lỗi đánh dấu email là đã đọc', error);
    });
  };

  const loadInboxData = async () => {
    try {
      const result = await fetchGmailInbox(30);
      setInboxResult(result);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(result));
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      const total = Object.values(result.counts).reduce((a, b) => a + b, 0);
      setSyncMessage(total > 0 ? `Đã tải ${total} email Gmail.` : 'Chưa có email Gmail.');
      if (total > 0) setIsConnected(true);
    } catch (error: any) {
      console.error('❌ MailScreen: Lỗi lấy hộp thư Gmail', error);
      setSyncMessage(error?.message || 'Không thể tải email Gmail.');
    }
  };

  const loadArchivedEmails = async () => {
    try {
      const emails = await fetchGmailEmails(1, 50, { includeArchived: true });
      const archived = emails.filter((e) => e.isArchived);
      setArchivedEmails(archived);
      setIsArchivedLoaded(true);
    } catch (error: any) {
      console.error('❌ MailScreen: Lỗi lấy email đã lưu trữ', error);
    }
  };

  // Load tab "Đã lưu trữ" theo kiểu lười — chỉ gọi khi người dùng thực sự
  // bấm vào tab đó lần đầu, đỡ tốn 1 lượt gọi API không cần thiết.
  useEffect(() => {
    if (activeFilter === 'archived' && !isArchivedLoaded) {
      loadArchivedEmails();
    }
  }, [activeFilter, isArchivedLoaded]);

  // On mount: load cache và quyết định có cần đồng bộ lại không
  useEffect(() => {
    let mounted = true;

    async function loadCacheAndMaybeSync() {
      try {
        setSyncMessage('Đang tải cache email...');
        const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw) as GmailInboxResult;
            if (cached?.tabs && mounted) {
              setInboxResult(cached);
              setSyncMessage('Hiển thị email từ cache.');
            }
          } catch (err) {
            console.warn('Failed to parse cached gmail inbox', err);
          }
        }

        const lastRaw = await AsyncStorage.getItem(LAST_SYNC_KEY);
        const last = lastRaw ? new Date(lastRaw) : null;
        const now = new Date();
        const fiveMinutes = 5 * 60 * 1000;
        if (last && now.getTime() - last.getTime() < fiveMinutes) {
          setSyncMessage('Đã đồng bộ gần đây, bỏ qua đồng bộ.');
          return;
        }

        setIsConnecting(true);
        setSyncMessage('Đang đồng bộ Gmail...');

        try {
          const syncResult = await autoSyncGmail();
          console.log('Auto-sync result (initial load):', syncResult);
          if (!syncResult.success) {
            setSyncMessage(syncResult.message || 'Đồng bộ Gmail thất bại.');
            if (syncResult.message?.includes('Chưa liên kết Gmail') || syncResult.message?.includes('Không tìm thấy serverAuthCode')) {
              handleConnectGmail();
            }
          } else {
            setSyncMessage(syncResult.message || 'Đã đồng bộ Gmail.');
            setIsConnected(true);
          }
        } catch (err: any) {
          console.warn('Auto-sync failed on startup', err);
          if (err?.message?.includes('Chưa liên kết Gmail') || err?.message?.includes('Không tìm thấy serverAuthCode')) {
            handleConnectGmail();
          }
        }

        if (mounted) {
          await loadInboxData();
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

  const handlePinEmail = async (emailId: string) => {
    if (!emailId || isActionBusy) return;

    const email = findEmailById(emailId);
    const wasPinned = email?.isPinned ?? false;

    setIsActionBusy(true);
    try {
      // Backend toggle theo mỗi lần gọi
      const result = await pinGmailEmail(emailId);
      if (result.success) {
        patchEmailLocally(emailId, { isPinned: !wasPinned });
        setSelectedEmail(prev => prev && prev.id === emailId ? { ...prev, isPinned: !wasPinned } : prev);
        setSyncMessage(wasPinned ? 'Đã bỏ pin email này.' : 'Đã đánh dấu email này là pin.');
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

    const email = findEmailById(emailId);
    const wasArchived = email?.isArchived ?? (activeFilter === 'archived');

    setIsActionBusy(true);
    try {
      const result = await archiveGmailEmail(emailId);
      if (result.success) {
        setSyncMessage(wasArchived ? 'Đã bỏ lưu trữ email này.' : 'Đã lưu trữ email này.');
        setSelectedEmail(prev => prev && prev.id === emailId ? { ...prev, isArchived: !wasArchived } : prev);
        
        // Optimistic UI: Xóa ngay khỏi list hiện tại để UI phản hồi mượt mà
        if (wasArchived) {
          setArchivedEmails(prev => prev.filter(e => e.id !== emailId));
        } else {
          setInboxResult(prev => {
            const next: GmailInboxResult = { ...prev, tabs: { ...prev.tabs } };
            (Object.keys(next.tabs) as GmailInboxTab[]).forEach(tab => {
              next.tabs[tab] = next.tabs[tab].filter(e => e.id !== emailId);
            });
            return next;
          });
        }
        
        setIsDetailOpen(false);

        // Archive/unarchive đổi hẳn tab của email (biến mất khỏi /inbox hoặc
        // biến mất khỏi archived) -> refetch để đồng bộ đúng với backend
        // thay vì tự suy luận tab mới sẽ về đâu.
        await Promise.all([
          loadInboxData(),
          isArchivedLoaded ? loadArchivedEmails() : Promise.resolve(),
        ]);
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
          if (syncResult.message?.includes('Chưa liên kết Gmail') || syncResult.message?.includes('Không tìm thấy serverAuthCode')) {
            handleConnectGmail();
          }
        } else {
          setSyncMessage(syncResult.message || 'Đã đồng bộ Gmail.');
          setIsConnected(true);
        }
        await loadInboxData();
        if (isArchivedLoaded) await loadArchivedEmails();
      } catch (error: any) {
        console.error('❌ MailScreen: Lỗi auto-sync Gmail', error);
        setSyncMessage(error?.message || 'Không thể đồng bộ Gmail.');
        if (error?.message?.includes('Chưa liên kết Gmail') || error?.message?.includes('Không tìm thấy serverAuthCode')) {
          handleConnectGmail();
        }
      } finally {
        setIsConnecting(false);
      }
    };

    syncOnFocus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const handleConnectGmail = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setSyncMessage('Đang chờ bạn đăng nhập Google...');
    try {
      const emailHint = profile?.email || user?.email;
      const res = await connectGmailForCurrentUser(emailHint);
      if (res.success) {
        setIsConnected(true);
        setSyncMessage('Liên kết Gmail thành công! Đang tải dữ liệu...');
        await autoSyncGmail();
        await loadInboxData();
      } else {
        setSyncMessage(res.message || 'Liên kết Gmail thất bại.');
        Alert.alert('Lỗi', res.message || 'Liên kết Gmail thất bại.');
      }
    } catch (err: any) {
      console.warn('handleConnectGmail error', err);
      setSyncMessage(err?.message || 'Không thể liên kết Gmail.');
    } finally {
      setIsConnecting(false);
    }
  };

  const topChrome = getTopAppBarHeight(insets);

  return (
    <TabScreenLayout
      scrollRef={scrollRef}
      topBar={
        <>
          <TopAppBar onSettingsPress={openSettings} />
          <IosGlassView variant="chrome" style={[styles.viewModeContainer, { top: topChrome, position: 'absolute', left: 0, right: 0, zIndex: 40, borderWidth: 0, elevation: 0, shadowOpacity: 0 }]}>
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
          </IosGlassView>
        </>
      }
      bottomExtra={SCROLL_BOTTOM_EXTRA + 48}
      contentContainerStyle={viewMode === 'dashboard' ? { flex: 1, paddingTop: topChrome + 70 + 16 } : { paddingTop: topChrome + 70 + 16 }}
      innerStyle={viewMode === 'dashboard' ? { flex: 1 } : undefined}
      disableScrollWrapper={viewMode === 'dashboard'}
      scrollViewProps={{
        onScroll: fabAnim.onScroll,
        scrollEventThrottle: 16,
      }}
    >
      {viewMode === 'dashboard' ? (
        <View style={{ flex: 1 }}>
          <GmailDashboard contentContainerStyle={{ paddingTop: topChrome + 70 + 16, paddingBottom: SCROLL_BOTTOM_EXTRA + 48 }} />
        </View>
      ) : (
        <>
          <GmailConnectBanner visible={isConnecting} />

          <View style={styles.listSection}>
            <MailFilterBar
              filters={dynamicFilters}
              activeId={activeFilter}
              onChange={setActiveFilter}
            />

            <View style={styles.gmailStatusContainer}>
              <Text style={styles.gmailStatusText}>{syncMessage || 'Đang chờ Gmail...'}</Text>
            </View>

            <MailDetailModal
              visible={isDetailOpen}
              email={selectedEmail}
              onClose={() => setIsDetailOpen(false)}
              onPinPress={handlePinEmail}
              onArchivePress={handleArchiveEmail}
              isPinned={selectedEmail?.isPinned ?? false}
              isArchived={selectedEmail?.isArchived ?? false}
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
                    ? `Không có email nào trong mục "${CATEGORY_TITLES[activeFilter]}".`
                    : 'Vui lòng kết nối Gmail hoặc thử lại sau khi đồng bộ xong.'}
                </Text>
                {!isConnected && (
                  <PrimaryButton
                    label="Liên kết Gmail ngay"
                    onPress={handleConnectGmail}
                    style={{ marginTop: 16 }}
                    loading={isConnecting}
                  />
                )}
              </View>
            )}
          </View>
        </>
      )}
    </TabScreenLayout>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  listSection: {
    gap: 16,
  },
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