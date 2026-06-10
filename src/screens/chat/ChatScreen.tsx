import React, { useCallback, useEffect, useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  View,
  Animated,
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
  CHAT_MESSAGES,
} from '../../data/chatMock';
import { COLORS } from '../../constants/theme';
import { SPACING } from '../../constants/spacing';
import type { ChatMessage, QuickAction } from '../../types/chat';
import { useOpenSettings } from '../../hooks/useOpenSettings';

type ChatScreenProps = {
  onOpenVoice?: () => void;
};

export default function ChatScreen({ onOpenVoice }: ChatScreenProps) {
  const insets = useSafeAreaInsets();
  const openSettings = useOpenSettings();
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_MESSAGES);
  // const [keyboardHeight, setKeyboardHeight] = useState(0);


  const headerHeight = getTopAppBarHeight(insets);
  const bottomNavReserved = getBottomNavReservedHeight(insets);
  const composerBottom = bottomNavReserved + CHAT_COMPOSER_BOTTOM_GAP;
  const keyboardOffset = React.useRef(
    new Animated.Value(composerBottom)
  ).current;
// useEffect(() => {
//   const show = Keyboard.addListener(
//     'keyboardDidShow',
//     e => setKeyboardHeight(e.endCoordinates.height)
//   );

//   const hide = Keyboard.addListener(
//     'keyboardDidHide',
//     () => setKeyboardHeight(0)
//   );

//   return () => {
//     show.remove();
//     hide.remove();
//   };
// }, []);
  useEffect(() => {
    const show = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        Animated.timing(keyboardOffset, {
          toValue:
            e.endCoordinates.height - insets.bottom,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    const hide = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        Animated.timing(keyboardOffset, {
          toValue: composerBottom,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, [composerBottom, insets.bottom, keyboardOffset]);

const handleSend = useCallback((text: string) => {
    setMessages((prev) => {
      const withoutTyping = prev.filter((m) => m.role !== 'typing');
      return [
        ...withoutTyping,
        { id: `u-${Date.now()}`, role: 'user', content: text },
        { id: 'typing', role: 'typing' },
      ];
    });
    // TODO: call AI API and append response
  }, []);

  const handleQuickAction = useCallback((action: QuickAction) => {
    handleSend(action.label);
  }, [handleSend]);

  return (
    <View style={styles.root}>
      <TopAppBar onSettingsPress={openSettings} />

      <View style={styles.flex}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: headerHeight + SCROLL_CONTENT_GAP,
              paddingBottom:
                CHAT_COMPOSER_HEIGHT + composerBottom + SCROLL_CONTENT_GAP,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ChatStatusBanner
            label={CHAT_BRAND.statusLabel}
            greeting={CHAT_BRAND.greeting}
          />
          <ChatMessageList messages={messages} />
        </ScrollView>

        {/* <View style={[styles.composer, { bottom:keyboardHeight > 0? keyboardHeight - insets.bottom: composerBottom }]}> */}
        <Animated.View
          style={[
            styles.composer,
             {
              bottom: keyboardOffset,
            },
          ]}>
          <ChatComposer
            placeholder={CHAT_BRAND.inputPlaceholder}
            onSend={handleSend}
            onVoicePress={onOpenVoice}
          />
          </Animated.View>
        </View>
        
      </View>
    
  );
}

const styles = StyleSheet.create({
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
