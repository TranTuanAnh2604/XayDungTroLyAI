import React, { useState } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { detectEventType } from '../../../utils/eventTypeDetection';

import SegmentedControl from './SegmentedControl';
import InputField from './InputField';
import PrioritySelector from './PrioritySelector';
import DatePickerCard from './DatePickerCard';

export type TaskFormData = {
  type: 'task' | 'todo';
  title: string;
  description: string;
  priority: 'normal' | 'high';
  dueDate: Date | null;
};

interface TaskFormFieldsProps {
  data: TaskFormData;
  onChange?: (data: Partial<TaskFormData>) => void;
  isReadOnly?: boolean;
  onVoicePress?: () => void;
}

export default function TaskFormFields({
  data,
  onChange,
  isReadOnly = false,
  onVoicePress,
}: TaskFormFieldsProps) {
  const { colors: COLORS } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const update = (updates: Partial<TaskFormData>) => {
    if (!isReadOnly && onChange) {
      onChange(updates);
    }
  };

  const handleTitleChange = (text: string) => {
    const updates: Partial<TaskFormData> = { title: text };
    if (detectEventType(text) === 'urgent' && data.priority !== 'high' && data.type === 'task') {
      updates.priority = 'high';
    }
    update(updates);
  };

  const handlePriorityChange = (priority: 'normal' | 'high' | 'low') => {
    const updates: Partial<TaskFormData> = { priority: priority as 'normal' | 'high' };
    if (priority === 'normal' && data.title.includes(' (Khẩn cấp)')) {
      updates.title = data.title.replace(' (Khẩn cấp)', '');
    } else if (priority === 'high' && detectEventType(data.title) !== 'urgent') {
      updates.title = data.title.trim() + ' (Khẩn cấp)';
    }
    update(updates);
  };

  return (
    <View style={styles.container}>
      <SegmentedControl
        options={[
          { label: 'Tasks', value: 'task' },
          { label: 'Todos', value: 'todo' },
        ]}
        selectedValue={data.type}
        onValueChange={(val) => update({ type: val as 'task' | 'todo' })}
        disabled={isReadOnly}
      />

      <View style={styles.titleRow}>
        <View style={styles.titleInputWrapper}>
          <InputField
            label="Tiêu đề"
            placeholder="Tiêu đề công việc..."
            value={data.title}
            onChangeText={handleTitleChange}
            editable={!isReadOnly}
          />
        </View>
        {onVoicePress && (
          <TouchableOpacity style={[styles.voiceBtn, { backgroundColor: `${COLORS.primary}1A` }]} onPress={onVoicePress} activeOpacity={0.7}>
            <MaterialCommunityIcons name="microphone" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      <InputField
        label="Mô tả"
        placeholder="Mô tả hoặc ghi chú..."
        value={data.description}
        onChangeText={(description) => update({ description })}
        isTextArea
        editable={!isReadOnly}
      />

      {data.type === 'task' && (
        <PrioritySelector
          label="Mức ưu tiên"
          selectedPriority={data.priority}
          onPriorityChange={handlePriorityChange}
          disabled={isReadOnly}
        />
      )}

      <DatePickerCard
        label="Ngày hết hạn"
        date={data.dueDate}
        onPress={() => setShowDatePicker(true)}
        disabled={isReadOnly}
      />

      {showDatePicker && !isReadOnly && (
        <DateTimePicker
          value={data.dueDate || new Date()}
          minimumDate={new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) update({ dueDate: selectedDate });
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleInputWrapper: {
    flex: 1,
  },
  voiceBtn: {
    marginTop: 27, 
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
