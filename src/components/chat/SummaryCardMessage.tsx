import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import MessageLabel from './MessageLabel';
import { COLORS, RADIUS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import type { ChatSummaryMessage } from '../../types/chat';

type SummaryCardMessageProps = {
  message: ChatSummaryMessage;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
};

export default function SummaryCardMessage({
  message,
  onPrimaryAction,
  onSecondaryAction,
}: SummaryCardMessageProps) {
  return (
    <View style={styles.wrapper}>
      <MessageLabel text="Tóm tắt thông minh" icon="summarize" />
      <AppGlassCard variant="ai" padding={20} style={styles.card}>
        <MaterialIcons
          name="auto-awesome"
          size={64}
          color={`${COLORS.primary}1A`}
          style={styles.watermark}
        />
        <Text style={styles.title}>{message.title}</Text>
        {message.bullets.map((bullet) => (
          <View key={bullet} style={styles.bulletRow}>
            <MaterialIcons
              name="check-circle"
              size={16}
              color={COLORS.primary}
              style={styles.bulletIcon}
            />
            <Text style={styles.bulletText}>{bullet}</Text>
          </View>
        ))}
        <View style={styles.actions}>
          <Pressable
            onPress={onPrimaryAction}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {message.primaryAction}
            </Text>
          </Pressable>
          <Pressable
            onPress={onSecondaryAction}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.secondaryBtnText}>
              {message.secondaryAction}
            </Text>
          </Pressable>
        </View>
      </AppGlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: '100%',
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  card: {
    position: 'relative',
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    top: -4,
    right: -4,
    transform: [{ rotate: '12deg' }],
  },
  title: {
    ...typography.headlineMd,
    fontSize: 20,
    color: COLORS.primary,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  bulletIcon: {
    marginTop: 2,
  },
  bulletText: {
    ...typography.bodyMd,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  primaryBtnText: {
    ...typography.labelCaps,
    color: COLORS.onPrimary,
    textTransform: 'none',
    letterSpacing: 0,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.white,
  },
  secondaryBtnText: {
    ...typography.labelCaps,
    color: COLORS.onSurface,
    textTransform: 'none',
    letterSpacing: 0,
  },
  btnPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
});
