import { getTypography } from '../../constants/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import SkeletonBlock from './SkeletonBlock';
import { useTheme } from '../../hooks/useTheme';
import type { ProductivityReport } from '../../types/productivity';

type AiInsightsCardProps = { report: ProductivityReport | null; skeleton?: boolean };

export default function AiInsightsCard({ report, skeleton = false }: AiInsightsCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { colors: COLORS, isDark } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography, isDark), [COLORS, typography, isDark]);

  if (skeleton) {
    return (
      <AppGlassCard variant="ai" padding={16}>
        <SkeletonBlock height={12} width={140} borderRadius={6} style={{ marginBottom: 12 }} />
        <SkeletonBlock height={14} borderRadius={7} style={{ marginBottom: 8 }} />
        <SkeletonBlock height={14} width="80%" borderRadius={7} style={{ marginBottom: 8 }} />
        <SkeletonBlock height={14} width="65%" borderRadius={7} style={{ marginBottom: 8 }} />
      </AppGlassCard>
    );
  }

  if (!report) {
    return (
      <AppGlassCard variant="ai" padding={16}>
        <MaterialIcons name="auto-awesome" size={22} color={COLORS.secondary + '66'} style={styles.sparkle} />
        <View style={styles.labelRow}>
          <View style={styles.dot} />
          <Text style={styles.label}>AI Insights</Text>
        </View>
        <Text style={styles.empty}>Chưa có dữ liệu báo cáo năng suất cho tuần này.</Text>
      </AppGlassCard>
    );
  }

  const aiEvalText = report.Ai_Evaluation || (report as any).aiEvaluation || (report as any).AiEvaluation || (report as any).AIEvaluation || '';
  const hasEvaluation = !!aiEvalText?.trim();

  // Thêm logic hiển thị nguyên nhân do thiếu dữ liệu hoặc bị bỏ qua
  const isSkipped = report.aiSkipped || (report as any).AiSkipped || (report as any).ai_Skipped || false;

  return (
    <AppGlassCard variant="ai" padding={16}>
      <MaterialIcons name="auto-awesome" size={22} color={COLORS.secondary + '66'} style={styles.sparkle} />
      <View style={styles.labelRow}>
        <View style={styles.dot} />
        <Text style={styles.label}>AI Insights</Text>
      </View>

      {hasEvaluation ? (
        <Text style={styles.summary} numberOfLines={isExpanded ? undefined : 3}>
          {aiEvalText}
        </Text>
      ) : (
        <Text style={styles.empty}>
          {isSkipped
            ? 'AI đã bỏ qua phân tích do dữ liệu tuần này không có nhiều thay đổi hoặc không đủ để đánh giá.'
            : 'Chưa có phân tích AI cho tuần này.'}
        </Text>
      )}

      {hasEvaluation && aiEvalText.length > 120 && (
        <View style={styles.actionRow}>
          <Text style={styles.actionText} onPress={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
          </Text>
        </View>
      )}
    </AppGlassCard>
  );
}

const createStyles = (COLORS: any, typography: any, isDark: boolean) => StyleSheet.create({
  sparkle: { position: 'absolute', top: 16, right: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondary },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: isDark ? '#000' : COLORS.textSecondary },
  summary: { ...typography.bodyMd, color: isDark ? '#000' : COLORS.textPrimary, lineHeight: 22, marginBottom: 4 },
  empty: { ...typography.bodyMd, color: isDark ? '#000' : COLORS.textSecondary, fontStyle: 'italic' },
  actionRow: { marginTop: 8, alignItems: 'center' },
  actionText: { ...typography.bodyMd, color: COLORS.primary, fontWeight: '600' },
});