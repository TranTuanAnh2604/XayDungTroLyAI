import { getTypography } from '../../constants/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HomeGlassCard from './HomeGlassCard';
import { useTheme } from '../../hooks/useTheme';

import type { DaySummary } from '../../types/home';

type DaySummaryCardProps = {
  summary: DaySummary;
};

export default function DaySummaryCard({ summary }: DaySummaryCardProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  const steps = [1, 2, 3];

  return (
    <HomeGlassCard variant="ai" padding={20}>
      <View style={styles.sparkle}>
        <MaterialIcons name="auto-awesome" size={24} color={COLORS.secondary} />
      </View>
      <Text style={styles.label}>Tổng quan ngày hôm nay</Text>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{summary.priorityTasks}</Text>
          <Text style={styles.statLabel}>nhiệm vụ ưu tiên</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{summary.meetings}</Text>
          <Text style={styles.statLabel}>cuộc họp</Text>
        </View>
      </View>
      <View style={styles.progressRow}>
        {steps.map((step) => (
          <View
            key={step}
            style={[
              styles.progressSegment,
              step <= summary.progressStep
                ? styles.progressActive
                : styles.progressInactive,
            ]}
          />
        ))}
      </View>
    </HomeGlassCard>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  sparkle: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  label: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.secondary,
    marginBottom: 12,
    paddingRight: 32,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  stat: {
    flexShrink: 1,
  },
  statValue: {
    ...typography.statLg,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.outlineVariant,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 9999,
  },
  progressActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  progressInactive: {
    backgroundColor: COLORS.surfaceContainer,
  },
});
