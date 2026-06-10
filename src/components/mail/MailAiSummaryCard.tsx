import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import { COLORS, RADIUS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import type { MailAiSummary } from '../../types/mail';

type MailAiSummaryCardProps = {
  summary: MailAiSummary;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
};

export default function MailAiSummaryCard({
  summary,
  onPrimaryPress,
  onSecondaryPress,
}: MailAiSummaryCardProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ping = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]),
    );
    ping.start();
    glowAnim.start();
    return () => {
      ping.stop();
      glowAnim.stop();
    };
  }, [glow, pulse]);

  const shadowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.2],
  });

  return (
    <Animated.View style={[styles.wrap, { shadowOpacity }]}>
      <AppGlassCard variant="ai" padding={20}>
        <MaterialIcons
          name="auto-awesome"
          size={24}
          color={`${COLORS.secondary}66`}
          style={styles.sparkle}
        />
        <View style={styles.labelRow}>
          <Animated.View style={[styles.dot, { opacity: pulse }]} />
          <Text style={styles.label}>{summary.label}</Text>
        </View>
        <Text style={styles.body}>
          Chào buổi sáng! Bạn có{' '}
          <Text style={styles.highlight}>{summary.highlight}</Text> cần xử lý:{' '}
          {summary.body}
        </Text>
        <View style={styles.actions}>
          <Pressable
            onPress={onPrimaryPress}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.primaryText}>{summary.primaryAction}</Text>
          </Pressable>
          <Pressable
            onPress={onSecondaryPress}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.secondaryText}>{summary.secondaryAction}</Text>
          </Pressable>
        </View>
      </AppGlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 32,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 30,
    elevation: 6,
  },
  sparkle: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
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
  highlight: {
    fontWeight: '700',
    color: COLORS.secondary,
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
