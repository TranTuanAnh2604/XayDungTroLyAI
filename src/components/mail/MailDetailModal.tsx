import { getTypography } from '../../constants/typography';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

import type { GmailEmail } from '../../services/gmail';
import MailActionToolbar from './MailActionToolbar';

type MailDetailModalProps = {
  visible: boolean;
  email: GmailEmail | null;
  onClose: () => void;
  onPinPress?: (emailId: string) => void;
  onArchivePress?: (emailId: string) => void;
  isPinned?: boolean;
  isArchived?: boolean;
  isBusy?: boolean;
};

export default function MailDetailModal({
  visible,
  email,
  onClose,
  onPinPress,
  onArchivePress,
  isPinned = false,
  isArchived = false,
  isBusy = false,
}: MailDetailModalProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  if (!email) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.subject} numberOfLines={2}>
                {email.subject ?? email.aiAnalysis.summary}
              </Text>
              <Text style={styles.fromLine}>{email.fromHeader}</Text>
              <Text style={styles.metaText}>{new Date(email.receivedAt).toLocaleString('vi-VN')}</Text>
            </View>
            <View style={styles.headerActions}>
              <MailActionToolbar
                isPinned={isPinned}
                isArchived={isArchived}
                disabled={isBusy || !email}
                onPinPress={() => onPinPress?.(email.id)}
                onArchivePress={() => onArchivePress?.(email.id)}
              />
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>Đóng</Text>
              </Pressable>
            </View>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <View style={styles.aiCard}>
              <Text style={styles.aiHeader}>✨ AI Tóm tắt</Text>
              <Text style={styles.aiText}>{email.aiAnalysis.summary || 'Không có tóm tắt.'}</Text>

              {email.aiAnalysis.keyPoints ? (
                <View style={styles.keyPointsBlock}>
                  <Text style={styles.keyPointsTitle}>📌 Điểm chính</Text>
                  <Text style={styles.keyPointsText}>{email.aiAnalysis.keyPoints}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nội dung gốc</Text>
              <Text style={styles.text}>{email.content || 'Không có nội dung.'}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 0.9,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  subject: {
    ...typography.headlineSm,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  fromLine: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  closeText: {
    color: COLORS.onPrimary,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    marginTop: 16,
  },
  bodyContent: {
    paddingBottom: 32,
  },
  section: {
    marginTop: 18,
  },
  aiCard: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 18,
    padding: 16,
  },
  aiHeader: {
    ...typography.labelCaps,
    color: COLORS.primary,
    marginBottom: 8,
  },
  aiText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textPrimary,
  },
  keyPointsBlock: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: `${COLORS.surface}CC`,
  },
  keyPointsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  keyPointsText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    ...typography.labelCaps,
    color: COLORS.primary,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
});
