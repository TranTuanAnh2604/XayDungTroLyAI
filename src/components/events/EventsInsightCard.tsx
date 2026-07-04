import { getTypography } from '../../constants/typography';
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
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

import type { EventsInsight } from '../../types/events';

type EventsInsightCardProps = {
  insight: EventsInsight;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
};

export default function EventsInsightCard({
  insight,
  onPrimaryPress,
  onSecondaryPress,
}: EventsInsightCardProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(borderAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(borderAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]),
    );
    float.start();
    shimmer.start();
    return () => {
      float.stop();
      shimmer.stop();
    };
  }, [borderAnim, floatAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.aiCardBorder, `${COLORS.secondary}66`],
  });

  return (
    <Animated.View
      style={[styles.floatWrap, { transform: [{ translateY: floatAnim }] }]}
    >
      <Animated.View style={[styles.borderWrap, { borderColor }]}>
        <AppGlassCard variant="ai" padding={20}>
          <MaterialIcons
            name="auto-awesome"
            size={64}
            color={`${COLORS.secondary}1A`}
            style={styles.watermark}
          />
          <View style={styles.row}>
            <View style={styles.iconRail}>
              <MaterialIcons
                name="lightbulb-outline"
                size={24}
                color={COLORS.secondary}
              />
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{insight.title}</Text>
              <Text style={styles.body}>
                <Text style={styles.highlight}>{insight.highlight}: </Text>
                {insight.body}
              </Text>
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
                  <Text style={styles.secondaryText}>
                    {insight.secondaryAction}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </AppGlassCard>
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  floatWrap: {
    marginBottom: 40,
  },
  borderWrap: {
    borderRadius: RADIUS.aiCard,
    borderWidth: 1,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    top: -8,
    right: -8,
    transform: [{ rotate: '12deg' }],
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'stretch',
  },
  iconRail: {
    width: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondaryFixed,
    borderWidth: 1,
    borderColor: COLORS.secondaryBorder10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 14,
    paddingBottom: 14,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  body: {
    ...typography.bodyMd,
    lineHeight: 22,
  },
  highlight: {
    fontWeight: '600',
    color: COLORS.secondary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  primaryBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: RADIUS.xl,
  },
  primaryText: {
    ...typography.labelCaps,
    color: COLORS.onSecondary,
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.secondaryBorder20,
  },
  secondaryText: {
    ...typography.labelCaps,
    color: COLORS.secondary,
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '700',
  },
  btnPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
});
