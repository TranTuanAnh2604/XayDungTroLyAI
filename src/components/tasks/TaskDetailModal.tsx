import React, { useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TaskModalContainer from './ui/TaskModalContainer';
import ModalHeader from './ui/ModalHeader';
import ModalFooter from './ui/ModalFooter';
import TaskFormFields, { TaskFormData } from './ui/TaskFormFields';
import { tasksApi } from '../../services/task';
import type { ExtendedTaskItem } from '../../types/tasks';
import { useTheme } from '../../hooks/useTheme';

interface TaskDetailModalProps {
  item: ExtendedTaskItem | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  onOptimisticUpdate?: (updatedData: any) => void;
  onDelete: (item: ExtendedTaskItem) => void;
  onToggleCompletion: (item: ExtendedTaskItem) => void;
}

export default function TaskDetailModal({
  visible,
  item,
  onClose,
  onSaved,
  onOptimisticUpdate,
  onDelete,
  onToggleCompletion,
}: TaskDetailModalProps) {
  const { colors: COLORS } = useTheme();
  const s = useMemo(() => createStyles(COLORS), [COLORS]);

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
    }
  }, [item, visible]);

  const handleClose = () => {
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
      if (onOptimisticUpdate) {
        onOptimisticUpdate({
          id: item.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          dueDate: formData.dueDate ? formData.dueDate.toISOString() : undefined,
          itemType: item.itemType,
        });
      }

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
      onClose();
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật, vui lòng thử lại.');
      onSaved(); // Triggers a reload to fix UI if update failed
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  const headerRight = (
    <TouchableOpacity
      style={[s.statusBadge, item.completed && s.statusBadgeDone]}
      onPress={() => onToggleCompletion(item)}
      activeOpacity={0.7}
    >
      <Text style={[s.statusText, item.completed && s.statusTextDone]}>
        {item.completed ? 'Hoàn thành' : 'Đang xử lý'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <TaskModalContainer visible={visible} onClose={handleClose}>
      <ModalHeader
        title={item.itemType === 'task' ? 'Chi tiết Task' : 'Chi tiết Todo'}
        subtitle="Chỉnh sửa hoặc cập nhật trạng thái"
        rightElement={headerRight}
        onClose={handleClose}
      />

      <TaskFormFields
        data={formData}
        onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
        hideTypeSelector={true}
        dateTimePickerProps={{
          minimumDate: new Date(),
          mode: 'datetime',
          is24Hour: true
        }}
      />

      <ModalFooter
        primaryLabel={isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
        onPrimaryPress={handleUpdate}
        secondaryLabel="Xóa"
        onSecondaryPress={() => onDelete(item)}
        isPrimaryDisabled={!formData.title.trim()}
        isSubmitting={isSubmitting}
        secondaryType="danger"
      />
    </TaskModalContainer>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
  },
  statusBadgeDone: {
    backgroundColor: `${COLORS.primary}1A`,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
  },
  statusTextDone: {
    color: COLORS.primary,
  },
});
