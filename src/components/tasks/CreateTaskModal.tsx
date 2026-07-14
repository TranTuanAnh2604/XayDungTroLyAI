import React, { useState } from 'react';
import { View } from 'react-native';
import TaskModalContainer from './ui/TaskModalContainer';
import ModalHeader from './ui/ModalHeader';
import ModalFooter from './ui/ModalFooter';
import TaskFormFields, { TaskFormData } from './ui/TaskFormFields';
import { tasksApi } from '../../services/task';

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

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.dueDate) return;
    setIsSubmitting(true);

    const optimisticId = `opt-${Date.now()}`;
    const optimisticTask = {
      id: optimisticId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      dueDate: formData.dueDate.toISOString(),
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
          formData.dueDate.toISOString()
        );
      } else {
        const targetDate = formData.dueDate.toISOString();
        await tasksApi.createTodo(
          formData.title.trim(),
          formData.description.trim(),
          targetDate
        );
      }
      onSaved();
    } catch (error) {
      console.error('Lỗi không thể tạo mới:', error);
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
      />
      
      <ModalFooter
        primaryLabel="Tạo công việc"
        onPrimaryPress={handleCreate}
        secondaryLabel="Hủy"
        onSecondaryPress={handleClose}
        isPrimaryDisabled={!formData.title.trim() || !formData.dueDate}
        isSubmitting={isSubmitting}
        secondaryType="cancel"
      />
    </TaskModalContainer>
  );
}
