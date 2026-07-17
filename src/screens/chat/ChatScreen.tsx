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
  PanResponder,
  Linking,
  DeviceEventEmitter,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatComposer from '../../components/chat/ChatComposer';
import { TopAppBar } from '../../components/navigation';
import ChatMessageList from '../../components/chat/ChatMessageList';
import ChatStatusBanner from '../../components/chat/ChatStatusBanner';
import ChatSidebar, { SIDEBAR_WIDTH } from '../../components/chat/ChatSidebar';
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
  createNewSession,
  markActionExecuted
} from '../../services/chat';

type ChatScreenProps = {
  onOpenVoice?: () => void;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

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

  // Cờ đánh dấu cần load lại danh sách session khi mở sidebar
  const shouldReloadSessionsRef = useRef(true);

  // Ref cho ScrollView để cuộn xuống cuối
  const scrollViewRef = useRef<ScrollView>(null);

  // Track trạng thái animation bàn phím để fix lỗi giật khựng
  const isKeyboardAnimating = useRef(false);

  // -- Sidebar State --
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

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
      isKeyboardAnimating.current = true;
      Animated.timing(keyboardOffset, {
        toValue: e.endCoordinates.height - insets.bottom,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        isKeyboardAnimating.current = false;
      });
    });

    const hide = Keyboard.addListener('keyboardDidHide', () => {
      isKeyboardAnimating.current = true;
      Animated.timing(keyboardOffset, {
        toValue: composerBottom,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        isKeyboardAnimating.current = false;
      });
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
        shouldReloadSessionsRef.current = true; // Đánh dấu cần load lại khi tạo session mới
      }

      // Gọi API với targetSessionId
      const result = await chatService(text, targetSessionId);

      // Cập nhật lại nếu BE có thay đổi
      if (result.sessionId) {
        currentChatSessionRef.current = result.sessionId;
      }

      if (result.kind === 'action') {
        // Tự động chạy action ngầm
        const executeSilentAction = async () => {
          try {
            if (result.deepLink) {
              const canOpen = await Linking.canOpenURL(result.deepLink);
              if (canOpen) {
                await Linking.openURL(result.deepLink);
                await markActionExecuted(result.actionId);
                return;
              }
            }
            if (result.fallbackUrl) {
              await Linking.openURL(result.fallbackUrl);
              await markActionExecuted(result.actionId);
            }
          } catch (err) {
            console.log('Không thể mở app:', err);
          }
        };
        executeSilentAction();

        // 1. Hiển thị tin nhắn dạng bình thường
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
        if (result.taskCreated) {
          DeviceEventEmitter.emit('tasks_changed');
          DeviceEventEmitter.emit('events_changed');
        }
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

  const closeSidebar = useCallback(() => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => setIsSidebarOpen(false));
  }, [sidebarAnim, backdropAnim]);

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
    closeSidebar();
  }, [closeSidebar]);

  // -- Sidebar Logic --
  const openSidebar = () => {
    setIsSidebarOpen(true);

    if (shouldReloadSessionsRef.current) {
      setLoadingSessions(true);
      getSessions()
        .then(data => {
          setSessions(data);
          shouldReloadSessionsRef.current = false;
        })
        .finally(() => setLoadingSessions(false));
    }

    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
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

  // Dùng ref để đảm bảo luôn gọi hàm openSidebar mới nhất mà không bị kẹt closure
  const openSidebarRef = useRef(openSidebar);
  openSidebarRef.current = openSidebar;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        // Tăng độ nhạy bằng cách giảm ngưỡng dx
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        const isSwipeRight = gestureState.dx > 5;
        return isHorizontalSwipe && isSwipeRight;
      },
      onPanResponderTerminationRequest: () => false, // Không nhường quyền điều khiển gesture cho view khác (vd: ScrollView)
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 20 || gestureState.vx > 0.3) {
          openSidebarRef.current();
        }
      },
      onPanResponderTerminate: (evt, gestureState) => {
        if (gestureState.dx > 20 || gestureState.vx > 0.3) {
          openSidebarRef.current();
        }
      },
    })
  ).current;

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
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
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: headerHeight + SCROLL_CONTENT_GAP,
              paddingBottom: CHAT_COMPOSER_HEIGHT + SCROLL_CONTENT_GAP,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({ animated: !isKeyboardAnimating.current });
          }}
        >
          {messages.length === 0 && (
            <ChatStatusBanner
              label={CHAT_BRAND.statusLabel}
              greeting={CHAT_BRAND.greeting}
            />
          )}
          <ChatMessageList messages={messages} />
          {/* Spacer bù không gian cho bàn phím/composer */}
          <Animated.View style={{ height: keyboardOffset }} />
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

      <ChatSidebar
        visible={isSidebarOpen}
        onClose={closeSidebar}
        sidebarAnim={sidebarAnim}
        backdropAnim={backdropAnim}
        onNewChat={handleNewChat}
        loadingSessions={loadingSessions}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
            resetTimerRef.current = null;
          }
          setActiveSessionId(id);
          closeSidebar();
        }}
        onDeleteSession={handleDeleteSession}
      />

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
});
