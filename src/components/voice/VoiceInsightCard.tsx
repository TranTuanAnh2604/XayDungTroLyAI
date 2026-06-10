import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import { COLORS, RADIUS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import type { VoiceInsight } from '../../types/voice';

type VoiceInsightCardProps = {
  insight: VoiceInsight;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
};

export default function VoiceInsightCard({
  insight,
  onPrimaryPress,
  onSecondaryPress,
}: VoiceInsightCardProps) {
  return (
    <AppGlassCard variant="ai" padding={24} style={styles.wrap}>
      <MaterialIcons
        name="auto-awesome"
        size={48}
        color={`${COLORS.secondary}66`}
        style={styles.watermark}
      />
      <View style={styles.labelRow}>
        <View style={styles.dot} />
        <Text style={styles.label}>{insight.label}</Text>
      </View>
      <Text style={styles.body}>{insight.body}</Text>
      <View style={styles.actions}>
        <Pressable
          onPress={onPrimaryPress}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={styles.primaryText}>{insight.primaryAction}</Text>
        </Pressable>
        <Pressable
          onPress={onSecondaryPress}
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={styles.secondaryText}>{insight.secondaryAction}</Text>
        </Pressable>
      </View>
    </AppGlassCard>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 48,
  },
  watermark: {
    position: 'absolute',
    top: 8,
    right: 8,
    transform: [{ rotate: '12deg' }],
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  label: {
    ...typography.labelCaps,
    color: COLORS.secondary,
    letterSpacing: 2,
  },
  body: {
    ...typography.bodyMd,
    color: COLORS.onSurface,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  primaryText: {
    ...typography.labelCaps,
    color: COLORS.onPrimary,
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '600',
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  secondaryText: {
    ...typography.labelCaps,
    color: COLORS.onSurface,
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '600',
  },
  btnPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
});
