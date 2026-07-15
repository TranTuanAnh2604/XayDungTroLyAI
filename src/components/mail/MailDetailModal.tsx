import { getTypography } from '../../constants/typography';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';

import TaskModalContainer from '../tasks/ui/TaskModalContainer';
import ModalHeader from '../tasks/ui/ModalHeader';
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
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (visible) {
      // Defer rendering heavy email body to allow smooth modal slide-in animation
      const timer = setTimeout(() => setShowContent(true), 250);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [visible]);

  if (!email) {
    return null;
  }

  const headerRight = (
    <MailActionToolbar
      isPinned={isPinned}
      isArchived={isArchived}
      disabled={isBusy || !email}
      onPinPress={() => onPinPress?.(email.id)}
      onArchivePress={() => onArchivePress?.(email.id)}
    />
  );

  return (
    <TaskModalContainer visible={visible} onClose={onClose}>
      <ModalHeader
        title="Chi tiết Email"
        subtitle={email.fromHeader}
        rightElement={headerRight}
        onClose={onClose}
      />
      
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.emailHeaderBox}>
          <Text style={styles.subject} selectable>
            {email.subject ?? email.aiAnalysis.summary}
          </Text>
          <Text style={styles.metaText}>{new Date(email.receivedAt).toLocaleString('vi-VN')}</Text>
        </View>

        <View style={styles.aiCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <MaterialIcons name="auto-awesome" size={18} color={COLORS.primary} />
                <Text style={[styles.aiHeader, { marginBottom: 0 }]}>AI Tóm tắt</Text>
              </View>
              <Text style={styles.aiText}>{email.aiAnalysis.summary || 'Không có tóm tắt.'}</Text>

              {email.aiAnalysis.keyPoints ? (
                <View style={styles.keyPointsBlock}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <MaterialIcons name="push-pin" size={16} color={COLORS.textPrimary} />
                    <Text style={[styles.keyPointsTitle, { marginBottom: 0 }]}>Điểm chính</Text>
                  </View>
                  <Text style={styles.keyPointsText}>{email.aiAnalysis.keyPoints}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nội dung gốc</Text>
              {showContent ? (
                <Text style={styles.text}>{email.content || 'Không có nội dung.'}</Text>
              ) : (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
              )}
            </View>
      </ScrollView>
    </TaskModalContainer>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  emailHeaderBox: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  subject: {
    ...typography.headlineSm,
    fontSize: 20,
    lineHeight: 28,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  body: {
    flex: 1,
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
