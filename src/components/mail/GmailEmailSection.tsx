import { getTypography } from '../../constants/typography';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

import type { GmailEmail } from '../../services/gmail';

type GmailEmailSectionProps = {
  emails: GmailEmail[];
};

export default function GmailEmailSection({ emails }: GmailEmailSectionProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={[styles.bar, { backgroundColor: COLORS.primary }]} />
        <Text style={styles.title}>Gmail của bạn</Text>
      </View>

      {emails.map((email) => (
        <View key={email.id} style={styles.emailCard}>
          <View style={styles.emailHeader}>
            <Text style={styles.sender}>{email.sender}</Text>
            <Text style={styles.time}>{new Date(email.receivedAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}</Text>
          </View>

          <Text style={styles.subject}>{email.aiAnalysis.summary}</Text>
          <Text style={styles.body}>{email.content}</Text>

          {email.aiAnalysis.keyPoints ? (
            <View style={styles.analysisSection}>
              <Text style={styles.analysisTitle}>Điểm chính</Text>
              <Text style={styles.analysisText}>{email.aiAnalysis.keyPoints}</Text>
            </View>
          ) : null}

          {email.aiAnalysis.actionItems ? (
            <View style={styles.analysisSection}>
              <Text style={styles.analysisTitle}>Hành động đề xuất</Text>
              <Text style={styles.analysisText}>{email.aiAnalysis.actionItems}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  bar: {
    width: 6,
    height: 16,
    borderRadius: 3,
  },
  title: {
    ...typography.labelCaps,
    letterSpacing: 1.5,
  },
  emailCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: `${COLORS.surface}F2`,
    marginBottom: 16,
  },
  emailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sender: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  time: {
    fontSize: 12,
    color: COLORS.outline,
  },
  subject: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.onSurfaceVariant,
    marginBottom: 14,
  },
  analysisSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.outline + '33',
  },
  analysisTitle: {
    ...typography.labelCaps,
    color: COLORS.primary,
    marginBottom: 6,
  },
  analysisText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
  },
});
