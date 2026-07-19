import React, { useState } from 'react';
import { View } from 'react-native';
import TaskModalContainer from './ui/TaskModalContainer';
import ModalHeader from './ui/ModalHeader';
import ModalFooter from './ui/ModalFooter';
import TaskFormFields, { TaskFormData } from './ui/TaskFormFields';
import { tasksApi } from '../../services/task';
import { Alert } from 'react-native';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  onOptimisticCreate?: (task: any) => void;
  onVoicePress: () => void;
}

export default function CreateTaskModal({ visible, onClose, onSaved, onOptimisticCreate, onVoicePress }: CreateTaskModalProps) {
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

  // Task bắt buộc có hạn; Todo thì không bắt buộc (BE tự mặc định hôm nay)
  const isTaskMissingDueDate = formData.type === 'task' && !formData.dueDate;

  const handleCreate = async () => {
    if (!formData.title.trim() || isTaskMissingDueDate) return;
    setIsSubmitting(true);

    // Todo không chọn ngày -> mặc định hôm nay ngay từ lúc optimistic update, để UI hiển thị nhất quán
    const effectiveDueDate = formData.dueDate || new Date();

    const optimisticId = `opt-${Date.now()}`;
    const optimisticTask = {
      id: optimisticId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      dueDate: effectiveDueDate.toISOString(),
      createdAt: new Date().toISOString(),
      completed: false,
      itemType: formData.type,
      meta: `Tạo: ${new Date().toLocaleDateString('vi-VN')}`
    };

    if (onOptimisticCreate) {
      onOptimisticCreate(optimisticTask);
    }

    resetForm();
    onClose();

    try {
      if (formData.type === 'task') {
        await tasksApi.createTask(
          formData.title.trim(),
          formData.description.trim(),
          formData.priority,
          formData.dueDate!.toISOString()
        );
      } else {
        // Không truyền dueDate nếu user không chọn -> để BE tự set new Date().toISOString()
        await tasksApi.createTodo(
          formData.title.trim(),
          formData.description.trim(),
          formData.dueDate ? formData.dueDate.toISOString() : undefined
        );
      }
      onSaved();
    } catch (error) {
      console.error('Lỗi không thể tạo mới:', error);
      Alert.alert('Không thể tạo công việc', 'Thời gian đến hạn có thể đã ở quá khứ. Vui lòng thử lại.');
      onSaved();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TaskModalContainer visible={visible} onClose={handleClose}>
      <ModalHeader
        title="🔥 Công việc mới"
        subtitle="Quản lý công việc nhanh chóng và hiệu quả"
        onClose={handleClose}
      />

      <TaskFormFields
        data={formData}
        onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
        onVoicePress={() => {
          onClose();
          onVoicePress();
        }}
        dateTimePickerProps={{
          minimumDate: new Date(),
          mode: 'datetime',
          is24Hour: true
        }}
      />

      <ModalFooter
        primaryLabel="Tạo công việc"
        onPrimaryPress={handleCreate}
        secondaryLabel="Hủy"
        onSecondaryPress={handleClose}
        isPrimaryDisabled={!formData.title.trim() || isTaskMissingDueDate}
        isSubmitting={isSubmitting}
        secondaryType="cancel"
      />
    </TaskModalContainer>
  );
}