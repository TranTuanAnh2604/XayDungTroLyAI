import { getTypography } from '../../constants/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import SkeletonBlock from './SkeletonBlock';
import { useTheme } from '../../hooks/useTheme';
import { RADIUS } from '../../constants/theme';
import type { ProductivityReport } from '../../types/productivity';

type ProductivityScoreCardProps = {
  report: ProductivityReport | null;
  skeleton?: boolean;
};

function scoreColor(score: number, COLORS: any): string {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.primary;
  if (score >= 40) return COLORS.warning;
  return COLORS.danger;
}

export default function ProductivityScoreCard({
  report,
  skeleton = false,
}: ProductivityScoreCardProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);

  if (skeleton || !report) {
    return (
      <AppGlassCard variant="surface" padding={20} style={styles.card}>
        <SkeletonBlock height={12} width={120} borderRadius={6} style={styles.skRow} />
        <SkeletonBlock height={48} width={80} borderRadius={8} style={styles.skRow} />
        <SkeletonBlock height={10} width="60%" borderRadius={5} style={styles.skRow} />
        <SkeletonBlock height={8} borderRadius={4} style={styles.skRow} />
      </AppGlassCard>
    );
  }

  const score = Math.round(report.productivityScore ?? 0);
  const completion = Math.round(report.taskCompletionRate ?? 0);
  const color = scoreColor(score, COLORS);

  return (
    <AppGlassCard variant="surface" padding={20} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Hiệu suất tuần</Text>
        {report.weeklyPerformance ? (
          (() => {
            let trendIcon = 'trending-flat';
            if (score >= 80) trendIcon = 'trending-up';
            else if (score < 50) trendIcon = 'trending-down';
            
            return (
              <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
                <MaterialIcons name={trendIcon as any} size={14} color={color} />
                <Text style={[styles.badgeText, { color: color }]}>
                  {report.weeklyPerformance}
                </Text>
              </View>
            );
          })()
        ) : null}
      </View>

      <View style={styles.scoreRow}>
        <Text style={[styles.scoreValue, { color }]}>{score}</Text>
        <Text style={styles.scoreMax}>/100</Text>
      </View>

      <Text style={styles.barLabel}>Hoàn thành nhiệm vụ — {completion}%</Text>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${completion}%`, backgroundColor: color },
          ]}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{report.tasksCompleted ?? 0}</Text>
          <Text style={styles.statLabel}>Nhiệm vụ</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{report.eventsCompleted ?? 0}</Text>
          <Text style={styles.statLabel}>Sự kiện</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{(report.focusTimeHours ?? 0).toFixed(1)}h</Text>
          <Text style={styles.statLabel}>Tập trung</Text>
        </View>
      </View>
    </AppGlassCard>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.textSecondary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
  },
  scoreMax: {
    ...typography.bodyMd,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  barLabel: {
    ...typography.bodyMd,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  barBg: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainer,
    overflow: 'hidden',
    marginBottom: 16,
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.statLg,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.outlineVariant,
  },
  skRow: {
    marginBottom: 12,
  },
});
