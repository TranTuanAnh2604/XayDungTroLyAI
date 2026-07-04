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
  createNewSession, 
  deleteSession 
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
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);
  
  // -- Sidebar State --
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  const headerHeight = getTopAppBarHeight(insets);
  const bottomNavReserved = getBottomNavReservedHeight(insets);
  const composerBottom = bottomNavReserved + CHAT_COMPOSER_BOTTOM_GAP;
  const keyboardOffset = useRef(new Animated.Value(composerBottom)).current;

  // -- Load tin nhắn khi đổi session --
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    getSessionMessages(activeSessionId)
      .then(msgs => {
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
          return {
            id: m.id || m.Id || Math.random().toString(),
            role: m.role || m.Role,
            content: m.content || m.Content || m.answer || m.Answer || ''
          } as ChatMessage;
        });
        setMessages(mapped);
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
  const handleSend = useCallback(async (text: string) => {
    const tempId = `u-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { id: tempId, role: 'user', content: text },
      { id: 'typing', role: 'typing' },
    ]);

    try {
      const result = await chatService(text, activeSessionId);
      
      if (result.sessionId && result.sessionId !== activeSessionId) {
        setActiveSessionId(result.sessionId);
      }

      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.role !== 'typing');
        if (result.kind === 'action') {
          return [
            ...withoutTyping,
            {
              id: `a-${Date.now()}`,
              role: 'action',
              content: result.answer,
              actionId: result.actionId,
              appName: result.appName,
              deepLink: result.deepLink,
              fallbackUrl: result.fallbackUrl
            }
          ];
        } else {
          return [
            ...withoutTyping,
            { id: `ai-${Date.now()}`, role: 'ai', content: result.answer }
          ];
        }
      });
    } catch (err: any) {
      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.role !== 'typing');
        return [
          ...withoutTyping,
          { id: `err-${Date.now()}`, role: 'ai', content: err?.message || 'Có lỗi xảy ra' }
        ];
      });
    }
  }, [activeSessionId]);

  const handleQuickAction = useCallback((action: QuickAction) => {
    handleSend(action.label);
  }, [handleSend]);

  const handleNewChat = useCallback(async () => {
    try {
      const res = await createNewSession();
      setActiveSessionId(res.sessionId);
      setMessages([]);
    } catch (err) {
      console.log('Error creating new session', err);
    }
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
      if (id === activeSessionId) {
        setActiveSessionId(undefined);
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
