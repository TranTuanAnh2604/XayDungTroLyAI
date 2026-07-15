import { getTypography } from '../../constants/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppGlassCard from '../ui/AppGlassCard';
import SkeletonBlock from './SkeletonBlock';
import { useTheme } from '../../hooks/useTheme';
import type { ProductivityTrendPoint } from '../../types/productivity';

type ProductivityTrendCardProps = {
  trend: ProductivityTrendPoint[];
  skeleton?: boolean;
};

function shortWeekLabel(raw: string): string {
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }
  return raw.length > 6 ? raw.slice(0, 6) : raw;
}

export default function ProductivityTrendCard({
  trend,
  skeleton = false,
}: ProductivityTrendCardProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);

  if (skeleton || trend.length === 0) {
    return (
      <AppGlassCard variant="surface" padding={20} style={styles.card}>
        <SkeletonBlock height={14} width={160} borderRadius={7} style={{ marginBottom: 6 }} />
        <SkeletonBlock height={10} width={100} borderRadius={5} style={{ marginBottom: 18 }} />
        <View style={styles.skBars}>
          {[65, 80, 55, 90, 70, 85, 60, 75].map((h, i) => (
            <SkeletonBlock key={i} height={h} width={20} borderRadius={4} />
          ))}
        </View>
      </AppGlassCard>
    );
  }

  const maxScore = Math.max(...trend.map((p) => p.score), 1);

  return (
    <AppGlassCard variant="surface" padding={20} style={styles.card}>
      <Text style={styles.header}>Xu hướng hiệu suất</Text>
      <Text style={styles.subheader}>Điểm năng suất {trend.length} tuần gần nhất</Text>

      <View style={styles.chartRow}>
        {trend.map((point, idx) => {
          const barPct = (point.score / maxScore) * 100;
          const isLast = idx === trend.length - 1;

          return (
            <View key={idx} style={styles.barCol}>
              {isLast ? (
                <Text style={[styles.barTopLabel, { color: COLORS.primary }]}>
                  {Math.round(point.score)}
                </Text>
              ) : (
                <View style={styles.barTopLabel} />
              )}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${barPct}%`,
                      backgroundColor: isLast ? COLORS.primary : COLORS.primaryTint10,
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                    },
                  ]}
                />
              </View>
              <Text style={styles.weekLabel} numberOfLines={1}>
                {shortWeekLabel(point.week)}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
        <Text style={styles.legendText}>Điểm năng suất</Text>
      </View>
    </AppGlassCard>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  card: {
    flex: 1,
  },
  header: {
    ...typography.headlineMd,
    marginBottom: 4,
  },
  subheader: {
    ...typography.bodyMd,
    color: COLORS.onSurfaceVariant,
    marginBottom: 20,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 80,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTopLabel: {
    fontSize: 10,
    fontWeight: '700',
    height: 14,
    textAlign: 'center',
  },
  barTrack: {
    width: '100%',
    flex: 1,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginVertical: 4,
  },
  barFill: {
    width: '100%',
  },
  weekLabel: {
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  skBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 100,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
});
