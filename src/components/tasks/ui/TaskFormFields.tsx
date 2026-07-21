import React, { useState } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Alert } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
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
  dateTimePickerProps?: any;
  hideTypeSelector?: boolean;
}

const MIN_LEAD_MINUTES = 1; // đệm nhỏ tránh race-condition ngay lúc chọn xong bấm submit

export default function TaskFormFields({
  data,
  onChange,
  isReadOnly = false,
  onVoicePress,
  dateTimePickerProps = {},
  hideTypeSelector = false,
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

  const wantsDateTime = dateTimePickerProps.mode === 'datetime' && data.type !== 'todo';
  const minimumDate = dateTimePickerProps.minimumDate || new Date();
  const is24Hour = dateTimePickerProps.is24Hour ?? true;

  const isPast = (d: Date) => d.getTime() < Date.now() + MIN_LEAD_MINUTES * 60000;

  const rejectPastAndWarn = () => {
    Alert.alert(
      'Thời gian không hợp lệ',
      'Bạn không thể chọn thời gian đã ở trong quá khứ. Vui lòng chọn lại giờ khác.'
    );
  };

  const openAndroidPicker = () => {
    const base = data.dueDate || new Date();

    DateTimePickerAndroid.open({
      value: base,
      mode: 'date',
      minimumDate,
      onChange: (event, selectedDate) => {
        if (event.type === 'dismissed' || !selectedDate) return;

        if (!wantsDateTime) {
          update({ dueDate: selectedDate });
          return;
        }

        DateTimePickerAndroid.open({
          value: selectedDate,
          mode: 'time',
          is24Hour,
          onChange: (timeEvent, selectedTime) => {
            if (timeEvent.type === 'dismissed' || !selectedTime) return;

            const combined = new Date(selectedDate);
            combined.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

            if (isPast(combined)) {
              rejectPastAndWarn();
              return; // không cập nhật state, giữ nguyên giá trị cũ
            }

            update({ dueDate: combined });
          },
        });
      },
    });
  };

  const handlePress = () => {
    if (isReadOnly) return;
    if (Platform.OS === 'android') {
      openAndroidPicker();
    } else {
      setShowDatePicker(true);
    }
  };

  return (
    <View style={styles.container}>
      {!hideTypeSelector && (
        <SegmentedControl
          options={[
            { label: 'Tasks', value: 'task' },
            { label: 'Todos', value: 'todo' },
          ]}
          selectedValue={data.type}
          onValueChange={(val) => update({ type: val as 'task' | 'todo' })}
          disabled={isReadOnly}
        />
      )}

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
        label={data.type === 'todo' ? 'Ngày hết hạn (tùy chọn, mặc định hôm nay)' : 'Ngày hết hạn'}
        date={data.dueDate}
        valueText={
          data.dueDate
            ? wantsDateTime
              ? `${data.dueDate.toLocaleDateString('vi-VN')} ${data.dueDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
              : data.dueDate.toLocaleDateString('vi-VN')
            : undefined
        }
        onPress={handlePress}
        disabled={isReadOnly}
      />

      {Platform.OS === 'ios' && showDatePicker && !isReadOnly && (
        <DateTimePicker
          value={data.dueDate || new Date()}
          minimumDate={minimumDate}
          mode={wantsDateTime ? 'datetime' : 'date'}
          is24Hour={is24Hour}
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (!selectedDate) return;

            if (wantsDateTime && isPast(selectedDate)) {
              rejectPastAndWarn();
              return;
            }

            update({ dueDate: selectedDate });
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