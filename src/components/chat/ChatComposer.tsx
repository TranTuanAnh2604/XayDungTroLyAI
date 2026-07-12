import React, { useState, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import QuickActionChips from './QuickActionChips';
import { RADIUS } from '../../constants/theme';
import { getTypography } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import type { QuickAction } from '../../types/chat';
import IosGlassView from '../ui/IosGlassView';
import { useTheme } from '../../hooks/useTheme';

type ChatComposerProps = {
  placeholder: string;
  quickActions?: QuickAction[];
  onSend?: (text: string) => void;
  onQuickAction?: (action: QuickAction) => void;
  onVoicePress?: () => void;
  onNewChat?: () => void;
  editable?: boolean;
};

export default function ChatComposer({
  placeholder,
  quickActions,
  onSend,
  onQuickAction,
  onVoicePress,
  onNewChat,
  editable = true,
}: ChatComposerProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSend = () => {
    if (!editable) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend?.(trimmed);
    setText('');
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.inner}>
        {quickActions?.length ? (
          <View style={{ marginBottom: 4 }}>
            <QuickActionChips actions={quickActions} onPress={onQuickAction} />
          </View>
        ) : null}
        <IosGlassView
          variant="regular"
          fillOpacity={0.12}
          style={[styles.inputBar, focused && styles.inputBarFocused]}
        >
          <Pressable
            onPress={onNewChat}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cuộc trò chuyện mới"
            style={({ pressed }) => [styles.newChatBtn, pressed && styles.iconPressed]}
          >
            <MaterialIcons name="add" size={24} color={COLORS.primary} />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.outline}
            style={[styles.input, !editable && styles.inputDisabled]}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={editable}
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
            disabled={!editable}
            style={({ pressed }) => [
              styles.sendBtn,
              pressed && styles.sendPressed,
              !editable && styles.sendBtnDisabled,
            ]}
          >
            <MaterialIcons name="send" size={22} color={COLORS.onPrimary} />
          </Pressable>
        </IosGlassView>
      </View>
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  wrapper: {
    width: '100%',
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
  inputDisabled: {
    opacity: 0.5,
  },
  newChatBtn: {
    padding: 8,
    borderRadius: RADIUS.md,
    backgroundColor: `${COLORS.primary}14`,
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
  sendBtnDisabled: {
    opacity: 0.5,
  },
  iconPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.9 }],
  },
});
