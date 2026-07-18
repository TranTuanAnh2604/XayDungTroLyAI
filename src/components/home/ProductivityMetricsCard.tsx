import { getTypography } from '../../constants/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import SkeletonBlock from './SkeletonBlock';
import { useTheme } from '../../hooks/useTheme';
import type { ReportMetrics } from '../../types/productivity';

type Props = {
  metrics: ReportMetrics | null;
  skeleton?: boolean;
};

const ITEMS = (m: ReportMetrics) => [
  { icon: 'check-circle', color: '#7C4DFF', label: 'Nhiệm vụ', value: `${m.tasksCompleted}`, hint: `${m.tasksPending} trễ hạn` },
  { icon: 'task-alt', color: '#00BFA6', label: 'Việc cần làm', value: `${m.todosCompleted}`, hint: `${m.todosPending} trễ hạn` },
  { icon: 'event', color: '#FFB300', label: 'Lịch họp', value: `${m.meetingsThisWeek}`, hint: `~${m.meetingHoursThisWeek}h` },
  { icon: 'mail', color: '#EF5350', label: 'Email', value: `${m.emailsThisWeek}`, hint: `${m.unreadEmailsNow} chưa đọc` },
] as const;

export default function ProductivityMetricsCard({ metrics, skeleton = false }: Props) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);

  if (skeleton || !metrics) {
    return (
      <AppGlassCard variant="surface" padding={20} style={styles.card}>
        <SkeletonBlock height={14} width={160} borderRadius={7} style={{ marginBottom: 16 }} />
        <View style={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} height={70} width="47%" borderRadius={12} />
          ))}
        </View>
      </AppGlassCard>
    );
  }

  return (
    <AppGlassCard variant="surface" padding={20} style={styles.card}>
      <Text style={styles.header}>Thống kê tuần này</Text>
      <View style={styles.grid}>
        {ITEMS(metrics).map((item) => (
          <View key={item.label} style={styles.item}>
            <View style={[styles.iconWrap, { backgroundColor: item.color + '22' }]}>
              <MaterialIcons name={item.icon as any} size={16} color={item.color} />
            </View>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.hint}>{item.hint}</Text>
          </View>
        ))}
      </View>
    </AppGlassCard>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  card: { flex: 1 },
  header: { ...typography.headlineMd, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  item: { width: '47%', gap: 4 },
  iconWrap: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  value: { ...typography.headlineSm, fontWeight: '700', color: COLORS.onBackground },
  label: { ...typography.bodyMd, fontWeight: '600', color: COLORS.textPrimary, fontSize: 12 },
  hint: { fontSize: 10, color: COLORS.textSecondary },
});