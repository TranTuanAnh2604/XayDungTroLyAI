import { getTypography } from '../../constants/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import HomeGlassCard from './HomeGlassCard';
import SkeletonBlock from './SkeletonBlock';
import { useTheme } from '../../hooks/useTheme';
import type { WeeklyTimeCategory } from '../../types/home';

type WeeklyTimeStatsCardProps = {
  categories: WeeklyTimeCategory[];
  skeleton?: boolean;
};

export default function WeeklyTimeStatsCard({
  categories,
  skeleton = false,
}: WeeklyTimeStatsCardProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);

  if (skeleton) {
    return (
      <HomeGlassCard variant="surface" padding={20} style={styles.card}>
        <SkeletonBlock height={14} width={160} borderRadius={7} style={{ marginBottom: 6 }} />
        <SkeletonBlock height={11} width={120} borderRadius={5} style={{ marginBottom: 18 }} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <SkeletonBlock height={12} width="40%" borderRadius={6} />
            <SkeletonBlock height={6} width="45%" borderRadius={3} />
          </View>
        ))}
      </HomeGlassCard>
    );
  }

  const totalHours = categories.reduce((sum, category) => sum + category.hours, 0);

  return (
    <HomeGlassCard variant="surface" padding={20} style={styles.card}>
      <Text style={styles.header}>Thống kê thời gian tuần</Text>
      <Text style={styles.subheader}>Tổng {totalHours} giờ dành cho công việc</Text>

      <View style={styles.list}>
        {categories.map((category) => {
          const percentage = totalHours > 0 ? (category.hours / totalHours) * 100 : 0;
          return (
            <View key={category.id} style={styles.row}>
              <View style={styles.rowLabel}>
                <View style={[styles.badge, { backgroundColor: category.color }]} />
                <View>
                  <Text style={styles.category}>{category.title}</Text>
                  <Text style={styles.categoryMeta}>{category.subtitle}</Text>
                </View>
              </View>
              <View style={styles.valueColumn}>
                <Text style={styles.hours}>{category.hours}h</Text>
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.round(percentage)}%`, backgroundColor: category.color },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </HomeGlassCard>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    ...typography.headlineMd,
    marginBottom: 6,
  },
  subheader: {
    ...typography.bodyMd,
    color: COLORS.onSurfaceVariant,
    marginBottom: 18,
  },
  list: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowLabel: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  badge: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 6,
  },
  category: {
    ...typography.bodyMd,
    fontWeight: '700',
  },
  categoryMeta: {
    ...typography.bodyMd,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  valueColumn: {
    flex: 1,
    maxWidth: 130,
    alignItems: 'flex-end',
    gap: 8,
  },
  hours: {
    ...typography.bodyMd,
    fontWeight: '700',
  },
  barBackground: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainer,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
});
