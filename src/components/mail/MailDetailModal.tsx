import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import type { GmailEmail } from '../../services/gmail';

type MailDetailModalProps = {
  visible: boolean;
  email: GmailEmail | null;
  onClose: () => void;
};

export default function MailDetailModal({ visible, email, onClose }: MailDetailModalProps) {
  if (!email) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
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
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Đóng</Text>
            </Pressable>
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

const styles = StyleSheet.create({
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
    color: COLORS.onSurface,
    marginBottom: 6,
  },
  fromLine: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.outline,
    marginTop: 4,
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
    color: COLORS.onSurface,
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
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  keyPointsText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.onSurfaceVariant,
  },
  sectionTitle: {
    ...typography.labelCaps,
    color: COLORS.primary,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.onSurfaceVariant,
  },
});
