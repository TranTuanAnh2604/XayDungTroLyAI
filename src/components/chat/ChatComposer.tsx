import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import QuickActionChips from './QuickActionChips';
import { COLORS, RADIUS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import type { QuickAction } from '../../types/chat';
import IosGlassView from '../ui/IosGlassView';

type ChatComposerProps = {
  placeholder: string;
  quickActions?: QuickAction[]; 
  onSend?: (text: string) => void;
  onQuickAction?: (action: QuickAction) => void;
  onVoicePress?: () => void;
};

export default function ChatComposer({
  placeholder,
  quickActions,
  onSend,
  onQuickAction,
  onVoicePress,
}: ChatComposerProps) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend?.(trimmed);
    setText('');
  };

  return (
    <View style={styles.wrapper}>
      {/* <LinearGradient
        colors={['transparent', COLORS.background, COLORS.background]}
        style={styles.fade}
        pointerEvents="none"
      /> */}
      <View style={styles.inner}>
      <IosGlassView
          variant="regular"
          fillOpacity={0.12}
          style={[styles.inputBar, focused && styles.inputBarFocused]}
        >
          <Pressable hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
            <MaterialIcons name="attach-file" size={24} color={COLORS.outline} />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.outline}
            style={styles.input}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          {onVoicePress ? (
            <Pressable
              onPress={onVoicePress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Chuyển sang chế độ giọng nói"
              style={({ pressed }) => [
                styles.voiceBtn,
                pressed && styles.iconPressed,
              ]}
            >
              <MaterialIcons name="mic" size={22} color={COLORS.primary} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={handleSend}
            style={({ pressed }) => [
              styles.sendBtn,
              pressed && styles.sendPressed,
            ]}
          >
            <MaterialIcons name="send" size={22} color={COLORS.onPrimary} />
          </Pressable>
        </IosGlassView>
        {quickActions?.length ? (
          <QuickActionChips actions={quickActions} onPress={onQuickAction} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  fade: {
    position: 'absolute',
    top: -32,
    left: 0,
    right: 0,
    height: 32,
  },
  inner: {
    paddingHorizontal: SPACING.containerMobile,
    paddingTop: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  inputBarFocused: {
    borderColor: `${COLORS.primary}66`,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    transform: [{ scale: 1.01 }],
  },
  input: {
    flex: 1,
    ...typography.bodyLg,
    color: COLORS.onSurface,
    paddingVertical: 8,
  },
  voiceBtn: {
    padding: 8,
    borderRadius: RADIUS.md,
    backgroundColor: `${COLORS.primary}14`,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: RADIUS.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 4,
  },
  sendPressed: {
    transform: [{ scale: 0.9 }],
  },
  iconPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.9 }],
  },
});
