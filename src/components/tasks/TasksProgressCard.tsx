import { getTypography } from '../../constants/typography';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import AppGlassCard from '../ui/AppGlassCard';
import { useTheme } from '../../hooks/useTheme';
import type { TasksProgress } from '../../types/tasks';

type TasksProgressCardProps = {
  progress: TasksProgress;
};

export default function TasksProgressCard({ progress }: TasksProgressCardProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);
  
  const percent = progress.total > 0 ? progress.completed / progress.total : 0;
  const displayPercent = Math.round(percent * 100);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percent,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [percent, widthAnim]);

  const barWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <AppGlassCard variant="surface" padding={20} style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1, paddingRight: 16 }}>
          <Text style={styles.header}>Tiến độ hôm nay</Text>
          <Text style={styles.subheader}>{progress.subtitle}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayPercent}%</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, { width: barWidth }]} />
      </View>
    </AppGlassCard>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  card: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    ...typography.headlineMd,
    marginBottom: 4,
    color: COLORS.onSurface,
  },
  subheader: {
    ...typography.bodyMd,
    color: COLORS.onSurfaceVariant,
  },
  badge: {
    minWidth: 56,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
  progressBar: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainer,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 999,
  },
});
