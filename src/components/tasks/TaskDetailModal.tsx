import React, { useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TaskModalContainer from './ui/TaskModalContainer';
import TaskFormLayout from './ui/TaskFormLayout';
import TaskFormFields, { TaskFormData } from './ui/TaskFormFields';
import { tasksApi } from '../../services/task';
import type { ExtendedTaskItem } from '../../types/tasks';
import { useTheme } from '../../hooks/useTheme';
import { RADIUS } from '../../constants/theme';
import { getTypography } from '../../constants/typography';

interface TaskDetailModalProps {
  item: ExtendedTaskItem | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDelete: (item: ExtendedTaskItem) => void;
  onToggleCompletion: (item: ExtendedTaskItem) => void;
}

export default function TaskDetailModal({
  item,
  visible,
  onClose,
  onSaved,
  onDelete,
  onToggleCompletion,
}: TaskDetailModalProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const s = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    type: 'task',
    title: '',
    description: '',
    priority: 'normal',
    dueDate: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item && visible) {
      setFormData({
        type: item.itemType,
        title: item.title,
        description: item.description || '',
        priority: item.priority === 'high' ? 'high' : 'normal',
        dueDate: item.dueDate ? new Date(item.dueDate) : null,
      });
      setIsEditMode(false);
    }
  }, [item, visible]);

  const handleClose = () => {
    setIsEditMode(false);
    onClose();
  };

  const handleUpdate = async () => {
    if (!item) return;
    if (!formData.title.trim()) {
      Alert.alert('Lỗi', 'Tiêu đề không được để trống');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (item.itemType === 'task') {
        await tasksApi.updateTask(item.id, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          dueDate: formData.dueDate ? formData.dueDate.toISOString() : undefined,
        });
      } else {
        const targetDate = formData.dueDate ? formData.dueDate.toISOString() : new Date().toISOString();
        await tasksApi.updateTodo(item.id, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          dueDate: targetDate,
        });
      }
      onSaved();
      setIsEditMode(false);
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  const headerRight = (
    <TouchableOpacity
      style={[s.statusBadge, item.completed && s.statusBadgeDone]}
      onPress={() => onToggleCompletion(item)}
    >
      <Text style={[s.statusText, item.completed && s.statusTextDone]}>
        {item.completed ? '✓ Hoàn thành' : '○ Đang xử lý'}
      </Text>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (isEditMode) {
      return (
        <View style={s.actionRow}>
          <TouchableOpacity style={s.cancelBtn} onPress={() => setIsEditMode(false)} disabled={isSubmitting}>
            <Text style={s.cancelBtnText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.submitBtn, !formData.title.trim() && s.submitBtnDisabled]}
            onPress={handleUpdate}
            disabled={!formData.title.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={COLORS.onPrimary} />
            ) : (
              <Text style={s.submitBtnText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={s.actionRow}>
        <TouchableOpacity style={s.deleteBtn} onPress={() => onDelete(item)}>
          <Text style={s.deleteBtnText}>🗑️ Xóa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.editBtn} onPress={() => setIsEditMode(true)}>
          <Text style={s.editBtnText}>✏️ Chỉnh sửa</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <TaskModalContainer visible={visible} onClose={handleClose}>
      <TaskFormLayout
        title={item.itemType === 'task' ? '🔥 CÔNG VIỆC' : '✅ VIỆC CẦN LÀM'}
        headerRight={headerRight}
        footer={renderFooter()}
      >
        <TaskFormFields
          data={formData}
          onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
          isReadOnly={!isEditMode}
        />
      </TaskFormLayout>
    </TaskModalContainer>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.errorTint || `${COLORS.error}1A` },
  statusBadgeDone: { backgroundColor: `${COLORS.primary}1A` },
  statusText: { fontSize: 11, fontWeight: '700', color: COLORS.error },
  statusTextDone: { color: COLORS.primary },
  
  actionRow: { flexDirection: 'row', gap: 12, width: '100%', alignItems: 'center' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  cancelBtnText: { ...typography.bodyLg, color: COLORS.textSecondary, fontWeight: '600' },
  submitBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { backgroundColor: COLORS.outlineVariant },
  submitBtnText: { ...typography.bodyLg, color: COLORS.onPrimary, fontWeight: '700' },
  
  deleteBtn: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { ...typography.bodyLg, color: COLORS.error, fontWeight: '600' },
  editBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { ...typography.bodyLg, color: COLORS.onPrimary, fontWeight: '700' },
});
