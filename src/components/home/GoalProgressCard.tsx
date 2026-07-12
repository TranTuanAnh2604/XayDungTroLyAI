import { getTypography } from '../../constants/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppGlassCard from '../ui/AppGlassCard';
import SkeletonBlock from './SkeletonBlock';
import { useTheme } from '../../hooks/useTheme';
import type { GoalProgress } from '../../types/home';

type GoalProgressCardProps = {
  progress: GoalProgress;
  skeleton?: boolean;
};

export default function GoalProgressCard({
  progress,
  skeleton = false,
}: GoalProgressCardProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);

  if (skeleton) {
    return (
      <AppGlassCard variant="surface" padding={20} style={styles.card}>
        <SkeletonBlock height={14} width={140} borderRadius={7} style={{ marginBottom: 8 }} />
        <SkeletonBlock height={11} width="70%" borderRadius={5} style={{ marginBottom: 20 }} />
        <SkeletonBlock height={10} borderRadius={5} style={{ marginBottom: 10 }} />
        <SkeletonBlock height={12} width="55%" borderRadius={6} />
      </AppGlassCard>
    );
  }

  const percent = Math.round(progress.completedPercent);

  return (
    <AppGlassCard variant="surface" padding={20} style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.header}>Mục tiêu cá nhân</Text>
          <Text style={styles.subheader}>{progress.subtitle}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{percent}%</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>

      <Text style={styles.detail}>{progress.detail}</Text>
    </AppGlassCard>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    ...typography.headlineMd,
    marginBottom: 4,
  },
  subheader: {
    ...typography.bodyMd,
    color: COLORS.onSurfaceVariant,
  },
  badge: {
    minWidth: 64,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
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
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  detail: {
    ...typography.bodyMd,
    color: COLORS.onSurfaceVariant,
  },
});
