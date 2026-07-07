import { getTypography } from '../../constants/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HomeGlassCard from './HomeGlassCard';
import SkeletonBlock from './SkeletonBlock';
import { useTheme } from '../../hooks/useTheme';
import type { ProductivityReport } from '../../types/productivity';

type AiInsightsCardProps = { report: ProductivityReport | null; skeleton?: boolean; };
type InsightRowProps = { icon: string; iconColor: string; label: string; items: string[]; COLORS: any; typography: any; };

function InsightRow({ icon, iconColor, label, items, COLORS, typography }: InsightRowProps) {
  if (!items || items.length === 0) return null;
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <MaterialIcons name={icon as any} size={14} color={iconColor} />
        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: iconColor }}>{label}</Text>
      </View>
      {items.map((item, idx) => (
        <View key={idx} style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
          <Text style={{ color: iconColor, fontSize: 13, lineHeight: 20 }}>•</Text>
          <Text style={{ ...typography.bodyMd, color: COLORS.textPrimary, flex: 1, lineHeight: 20 }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function AiInsightsCard({ report, skeleton = false }: AiInsightsCardProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  if (skeleton || !report) {
    return (
      <HomeGlassCard variant='ai' padding={20}>
        <SkeletonBlock height={12} width={140} borderRadius={6} style={{ marginBottom: 12 }} />
        <SkeletonBlock height={14} borderRadius={7} style={{ marginBottom: 8 }} />
        <SkeletonBlock height={14} width='80%' borderRadius={7} style={{ marginBottom: 8 }} />
        <SkeletonBlock height={14} width='65%' borderRadius={7} style={{ marginBottom: 8 }} />
      </HomeGlassCard>
    );
  }
  const hasInsights = (report.strengths?.length ?? 0) > 0 || (report.weaknesses?.length ?? 0) > 0 || (report.suggestions?.length ?? 0) > 0;
  return (
    <HomeGlassCard variant='ai' padding={20}>
      <MaterialIcons name='auto-awesome' size={22} color={COLORS.secondary + '66'} style={styles.sparkle} />
      <View style={styles.labelRow}>
        <View style={styles.dot} />
        <Text style={styles.label}>AI Insights</Text>
      </View>
      {report.aiSummary ? (<Text style={styles.summary}>{report.aiSummary}</Text>) : null}
      {report.overallEvaluation ? (<View style={styles.evalBox}><Text style={styles.evalText}>{report.overallEvaluation}</Text></View>) : null}
      {hasInsights ? (
        <View style={styles.insights}>
          <InsightRow icon='thumb-up' iconColor={COLORS.success} label='Điểm mạnh' items={report.strengths ?? []} COLORS={COLORS} typography={typography} />
          <InsightRow icon='warning' iconColor={COLORS.warning} label='Cần cải thiện' items={report.weaknesses ?? []} COLORS={COLORS} typography={typography} />
          <InsightRow icon='lightbulb' iconColor={COLORS.primary} label='Đề xuất' items={report.suggestions ?? []} COLORS={COLORS} typography={typography} />
        </View>
      ) : null}
      {!report.aiSummary && !hasInsights ? (<Text style={styles.empty}>Chưa có phân tích AI cho tuần này.</Text>) : null}
    </HomeGlassCard>
  );
}
const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  sparkle: { position: 'absolute', top: 16, right: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondary },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: COLORS.textSecondary },
  summary: { ...typography.bodyMd, color: COLORS.textPrimary, lineHeight: 22, marginBottom: 12 },
  evalBox: { backgroundColor: COLORS.primary + '0D', borderRadius: 12, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  evalText: { ...typography.bodyMd, color: COLORS.textPrimary, lineHeight: 20 },
  insights: { marginTop: 4 },
  empty: { ...typography.bodyMd, color: COLORS.textSecondary, fontStyle: 'italic' },
});