import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import type { EmailSummary } from '../../types/home';

type EmailSummaryCardProps = {
  item: EmailSummary;
};

export default function EmailSummaryCard({ item }: EmailSummaryCardProps) {
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

const styles = StyleSheet.create({
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
