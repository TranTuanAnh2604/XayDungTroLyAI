import { getTypography } from '../../constants/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import { useTheme } from '../../hooks/useTheme';

import type { EmailSummary } from '../../types/home';

type EmailSummaryCardProps = {
  item: EmailSummary;
};

export default function EmailSummaryCard({ item }: EmailSummaryCardProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  const iconColor =
    item.iconColor === 'primary'
      ? COLORS.primaryContainer
      : COLORS.secondaryContainer;

  return (
    <AppGlassCard variant="surface" padding={20} style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="mail" size={16} color={iconColor} />
        <Text style={styles.project}>{item.project}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.summary} numberOfLines={2}>
        <Text style={styles.summaryLabel}>Tóm tắt: </Text>
        {item.summary}
      </Text>
    </AppGlassCard>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  card: {
    width: 280,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  project: {
    ...typography.labelCaps,
    color: COLORS.onSurfaceVariant,
    textTransform: 'none',
    letterSpacing: 0,
  },
  title: {
    ...typography.headlineSm,
    marginBottom: 8,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.onSurfaceVariant,
  },
  summaryLabel: {
    color: COLORS.secondary,
    fontWeight: '600',
  },
});
