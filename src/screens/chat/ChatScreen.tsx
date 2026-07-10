import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  View,
  Animated,
  Modal,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatComposer from '../../components/chat/ChatComposer';
import { TopAppBar } from '../../components/navigation';
import ChatMessageList from '../../components/chat/ChatMessageList';
import ChatStatusBanner from '../../components/chat/ChatStatusBanner';
import {
  CHAT_COMPOSER_BOTTOM_GAP,
  CHAT_COMPOSER_HEIGHT,
  getBottomNavReservedHeight,
  getTopAppBarHeight,
  SCROLL_CONTENT_GAP,
} from '../../constants/layout';
import {
  CHAT_BRAND,
} from '../../data/chatMock';
import { useTheme } from '../../hooks/useTheme';
import { getTypography } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import type { ChatMessage, QuickAction, ChatActionMessage } from '../../types/chat';
import { useOpenSettings } from '../../hooks/useOpenSettings';
import { MaterialIcons } from '@expo/vector-icons';
import { RADIUS } from '../../constants/theme';
import { 
  chat as chatService, 
  getSessions, 
  getSessionMessages, 
  deleteSession,
  createNewSession
} from '../../services/chat';

type ChatScreenProps = {
  onOpenVoice?: () => void;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 300);

export default function ChatScreen({ onOpenVoice }: ChatScreenProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);
  
  const insets = useSafeAreaInsets();
  const openSettings = useOpenSettings();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // ─── Hai session ID với vai trò KHÁC NHAU ─────────────────────────────────
  // 1. currentChatSessionRef: sessionId thực sự đang dùng để gửi/nhận tin nhắn.
  //    Là REF để tránh trigger useEffect — chỉ cập nhật khi BE assign sessionId mới.
  const currentChatSessionRef = useRef<string | undefined>(undefined);
  // 2. activeSessionId: sessionId dùng ĐỂ LOAD TỪ API — chỉ set khi user
  //    chủ động chọn session từ sidebar. Không bao giờ set từ AI response.
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);

  // Timer tự động reset sau action
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // -- Sidebar State --
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  const headerHeight = getTopAppBarHeight(insets);
  const bottomNavReserved = getBottomNavReservedHeight(insets);
  const composerBottom = bottomNavReserved + CHAT_COMPOSER_BOTTOM_GAP;
  const keyboardOffset = useRef(new Animated.Value(composerBottom)).current;

  // -- Cleanup timer khi unmount --
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  // -- Load tin nhắn KHI USER CHỌN SESSION TỪ SIDEBAR --
  // useEffect này KHÔNG bao giờ chạy sau AI response bình thường
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    getSessionMessages(activeSessionId)
      .then(msgs => {
        // Guard: đảm bảo activeSessionId chưa thay đổi trong lúc fetch
        const mapped = msgs.map((m: any) => {
          if (m.type === 'action' || m.Type === 'action') {
            return {
              id: m.id || m.Id || Math.random().toString(),
              role: 'action',
              content: m.answer || m.Answer || '',
              actionId: m.actionId || m.ActionId || '',
              appName: m.appName || m.AppName || '',
              deepLink: m.deepLink || m.DeepLink,
              fallbackUrl: m.fallbackUrl || m.FallbackUrl || ''
            } as ChatActionMessage;
          }
          const rawRole = (m.role || m.Role || '').toLowerCase();
          const mappedRole = (rawRole === 'model' || rawRole === 'assistant' || rawRole === 'system') ? 'ai' : rawRole;
          return {
            id: m.id || m.Id || Math.random().toString(),
            role: mappedRole,
            content: m.content || m.Content || m.answer || m.Answer || ''
          } as ChatMessage;
        });
        setMessages(mapped);
        // Đồng bộ currentChatSessionRef với session đang được xem
        currentChatSessionRef.current = activeSessionId;
      })
      .catch(console.error);
  }, [activeSessionId]);

  // -- Bàn phím --
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      Animated.timing(keyboardOffset, {
        toValue: e.endCoordinates.height - insets.bottom,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    const hide = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(keyboardOffset, {
        toValue: composerBottom,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, [composerBottom, insets.bottom, keyboardOffset]);

  // -- Gửi tin nhắn --
  // Dùng currentChatSessionRef (ref) — không bao giờ set activeSessionId (state) tại đây
  // để tránh trigger useEffect và gây fetch messages cũ
  const handleSend = useCallback(async (text: string) => {
    // Hủy timer reset nếu user đang gửi tin mới
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    const tempId = `u-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { id: tempId, role: 'user', content: text },
      { id: 'typing', role: 'typing' },
    ]);

    try {
      let targetSessionId = currentChatSessionRef.current;

      // Nếu chưa có session (tin nhắn đầu tiên của cuộc trò chuyện mới), tạo session trước
      if (!targetSessionId) {
        const { sessionId } = await createNewSession();
        targetSessionId = sessionId;
        currentChatSessionRef.current = sessionId;
      }

      // Gọi API với targetSessionId
      const result = await chatService(text, targetSessionId);
      
      // Cập nhật lại nếu BE có thay đổi
      if (result.sessionId) {
        currentChatSessionRef.current = result.sessionId;
      }

      if (result.kind === 'action') {
        // 1. Hiển thị tin nhắn action thành công
        setMessages(prev => [
          ...prev.filter(m => m.role !== 'typing'),
          {
            id: `a-${Date.now()}`,
            role: 'action',
            content: result.answer,
            actionId: result.actionId,
            appName: result.appName,
            deepLink: result.deepLink,
            fallbackUrl: result.fallbackUrl
          }
        ]);
        // We no longer automatically reset the session after an action message.
        // The action message will stay in the chat history.
      } else {
        setMessages(prev => [
          ...prev.filter(m => m.role !== 'typing'),
          { id: `ai-${Date.now()}`, role: 'ai', content: result.answer }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev.filter(m => m.role !== 'typing'),
        { id: `err-${Date.now()}`, role: 'ai', content: err?.message || 'Có lỗi xảy ra' }
      ]);
    }
  // handleSend không còn phụ thuộc vào activeSessionId — loại bỏ dependency vòng lặp
  }, []);

  const handleQuickAction = useCallback((action: QuickAction) => {
    handleSend(action.label);
  }, [handleSend]);

  const handleNewChat = useCallback(() => {
    // Hủy timer nếu đang chạy
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    // Reset cả ref và state, không gọi API
    currentChatSessionRef.current = undefined;
    setActiveSessionId(undefined);
    setMessages([]);
  }, []);

  // -- Sidebar Logic --
  const openSidebar = () => {
    setIsSidebarOpen(true);
    setLoadingSessions(true);
    getSessions().then(setSessions).finally(() => setLoadingSessions(false));
    Animated.timing(sidebarAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(sidebarAnim, {
      toValue: -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsSidebarOpen(false));
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id);
      if (id === currentChatSessionRef.current) {
        currentChatSessionRef.current = undefined;
      }
      if (id === activeSessionId) {
        setActiveSessionId(undefined);
        setMessages([]);
      }
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.log('Error deleting session', err);
    }
  };

  return (
    <View style={styles.root}>
      <TopAppBar 
        onSettingsPress={openSettings} 
        leftActions={
          <MaterialIcons 
            name="menu" 
            size={24} 
            color={COLORS.primary} 
            onPress={openSidebar} 
          />
        }
      />

      <View style={styles.flex}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: headerHeight + SCROLL_CONTENT_GAP,
              paddingBottom: CHAT_COMPOSER_HEIGHT + composerBottom + SCROLL_CONTENT_GAP,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && (
            <ChatStatusBanner
              label={CHAT_BRAND.statusLabel}
              greeting={CHAT_BRAND.greeting}
            />
          )}
          <ChatMessageList messages={messages} />
        </ScrollView>

        <Animated.View style={[styles.composer, { bottom: keyboardOffset }]}>
          <ChatComposer
            placeholder={CHAT_BRAND.inputPlaceholder}
            onSend={handleSend}
            onVoicePress={onOpenVoice}
            onNewChat={handleNewChat}
          />
        </Animated.View>
      </View>
    
      {/* Sidebar Modal */}
      <Modal visible={isSidebarOpen} transparent animationType="none" onRequestClose={closeSidebar}>
        <View style={styles.sidebarOverlay}>
          <TouchableWithoutFeedback onPress={closeSidebar}>
            <View style={styles.sidebarBackdrop} />
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.sidebarContent, { transform: [{ translateX: sidebarAnim }] }]}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Lịch sử trò chuyện</Text>
              <TouchableOpacity onPress={handleNewChat} style={styles.sidebarNewBtn}>
                <MaterialIcons name="add" size={20} color={COLORS.onPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sidebarList}>
              {loadingSessions ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
              ) : (
                sessions.map(s => (
                  <TouchableOpacity 
                    key={s.id} 
                    style={[styles.sidebarItem, activeSessionId === s.id && styles.sidebarItemActive]}
                    onPress={() => {
                      // Hủy timer reset nếu đang chạy
                      if (resetTimerRef.current) {
                        clearTimeout(resetTimerRef.current);
                        resetTimerRef.current = null;
                      }
                      // Đồng bộ cả state (trigger useEffect fetch) và ref (để gửi tiếp)
                      setActiveSessionId(s.id);
                      closeSidebar();
                    }}
                  >
                    <View style={styles.sidebarItemTextWrap}>
                      <Text style={[styles.sidebarItemTitle, activeSessionId === s.id && styles.sidebarItemTitleActive]} numberOfLines={1}>
                        {s.title || 'Đoạn chat mới'}
                      </Text>
                      <Text style={styles.sidebarItemDate}>
                        {new Date(s.createdAt || s.CreatedAt).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteSession(s.id)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                      <MaterialIcons name="delete-outline" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.containerMobile,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 60,
    elevation: 60,
  },
  // Sidebar Styles
  sidebarOverlay: { flex: 1, flexDirection: 'row' },
  sidebarBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebarContent: { 
    width: SIDEBAR_WIDTH, height: '100%', backgroundColor: COLORS.surface,
    paddingTop: 48, shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 
  },
  sidebarHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant 
  },
  sidebarTitle: { ...typography.headlineMd, fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  sidebarNewBtn: { backgroundColor: COLORS.primary, padding: 6, borderRadius: RADIUS.md },
  sidebarList: { flex: 1 },
  sidebarItem: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant 
  },
  sidebarItemActive: { backgroundColor: COLORS.primaryContainer },
  sidebarItemTextWrap: { flex: 1, paddingRight: 8 },
  sidebarItemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface, marginBottom: 2 },
  sidebarItemTitleActive: { color: COLORS.primary },
  sidebarItemDate: { fontSize: 11, color: COLORS.outline },
});
