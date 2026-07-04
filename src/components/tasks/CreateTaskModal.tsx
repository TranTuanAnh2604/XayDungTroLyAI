import React, { useState, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TaskModalContainer from './ui/TaskModalContainer';
import TaskFormLayout from './ui/TaskFormLayout';
import TaskFormFields, { TaskFormData } from './ui/TaskFormFields';
import { tasksApi } from '../../services/task';
import { useTheme } from '../../hooks/useTheme';
import { RADIUS } from '../../constants/theme';
import { getTypography } from '../../constants/typography';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  onVoicePress: () => void;
}

export default function CreateTaskModal({ visible, onClose, onSaved, onVoicePress }: CreateTaskModalProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const s = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

  const [formData, setFormData] = useState<TaskFormData>({
    type: 'task',
    title: '',
    description: '',
    priority: 'normal',
    dueDate: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      type: 'task',
      title: '',
      description: '',
      priority: 'normal',
      dueDate: null,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) return;
    try {
      setIsSubmitting(true);
      if (formData.type === 'task') {
        await tasksApi.createTask(
          formData.title.trim(),
          formData.description.trim(),
          formData.priority,
          formData.dueDate?.toISOString()
        );
      } else {
        const targetDate = formData.dueDate ? formData.dueDate.toISOString() : new Date().toISOString();
        await tasksApi.createTodo(
          formData.title.trim(),
          formData.description.trim(),
          targetDate
        );
      }
      resetForm();
      onSaved();
      onClose();
    } catch (error) {
      console.error('Lỗi không thể tạo mới:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFooter = () => (
    <View style={s.actionRow}>
      <TouchableOpacity
        style={s.voiceShortcut}
        onPress={() => {
          onClose();
          onVoicePress();
        }}
      >
        <Text style={s.voiceShortcutText}>🎙️</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.cancelBtn} onPress={handleClose} disabled={isSubmitting}>
        <Text style={s.cancelBtnText}>Hủy</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.submitBtn, !formData.title.trim() && s.submitBtnDisabled]}
        onPress={handleCreate}
        disabled={!formData.title.trim() || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={COLORS.onPrimary} />
        ) : (
          <Text style={s.submitBtnText}>Tạo ngay</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <TaskModalContainer visible={visible} onClose={handleClose}>
      <TaskFormLayout title="Thêm công việc mới" footer={renderFooter()}>
        <TaskFormFields
          data={formData}
          onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
        />
      </TaskFormLayout>
    </TaskModalContainer>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  actionRow: { flexDirection: 'row', gap: 12, width: '100%', alignItems: 'center' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  cancelBtnText: { ...typography.bodyLg, color: COLORS.textSecondary, fontWeight: '600' },
  submitBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { backgroundColor: COLORS.outlineVariant },
  submitBtnText: { ...typography.bodyLg, color: COLORS.onPrimary, fontWeight: '700' },
  voiceShortcut: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 12, backgroundColor: `${COLORS.primary}1A`, borderRadius: RADIUS.full },
  voiceShortcutText: { color: COLORS.primary, fontSize: 18, fontWeight: '600' },
});
