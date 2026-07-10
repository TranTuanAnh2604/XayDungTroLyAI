import React, { useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../hooks/useTheme';
import { RADIUS } from '../../../constants/theme';
import { getTypography } from '../../../constants/typography';

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
}

export default function TaskFormFields({
  data,
  onChange,
  isReadOnly = false,
}: TaskFormFieldsProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const update = (updates: Partial<TaskFormData>) => {
    if (!isReadOnly && onChange) {
      onChange(updates);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.typeSelectorRow}>
        <TouchableOpacity
          style={[styles.typeBtn, data.type === 'task' && styles.typeBtnActive]}
          onPress={() => update({ type: 'task' })}
          disabled={isReadOnly}
        >
          <Text
            style={[
              styles.typeBtnText,
              data.type === 'task' && styles.typeBtnTextActive,
            ]}
          >
            Tasks (Quan trọng)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, data.type === 'todo' && styles.typeBtnActive]}
          onPress={() => update({ type: 'todo' })}
          disabled={isReadOnly}
        >
          <Text
            style={[
              styles.typeBtnText,
              data.type === 'todo' && styles.typeBtnTextActive,
            ]}
          >
            Todos (Hàng ngày)
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Tiêu đề công việc..."
        placeholderTextColor={COLORS.outline}
        value={data.title}
        onChangeText={(title) => update({ title })}
        editable={!isReadOnly}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Mô tả hoặc ghi chú..."
        placeholderTextColor={COLORS.outline}
        value={data.description}
        onChangeText={(description) => update({ description })}
        multiline
        numberOfLines={3}
        editable={!isReadOnly}
      />

      {data.type === 'task' && (
        <View style={styles.priorityRow}>
          <Text style={styles.priorityLabel}>Ưu tiên:</Text>
          <TouchableOpacity
            style={[
              styles.prioBadge,
              data.priority === 'normal' && styles.prioBadgeActive,
            ]}
            onPress={() => update({ priority: 'normal' })}
            disabled={isReadOnly}
          >
            <Text
              style={
                data.priority === 'normal'
                  ? styles.prioTextActive
                  : styles.prioText
              }
            >
              Thường
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.prioBadge,
              styles.prioHigh,
              data.priority === 'high' && styles.prioBadgeHighActive,
            ]}
            onPress={() => update({ priority: 'high' })}
            disabled={isReadOnly}
          >
            <Text
              style={
                data.priority === 'high'
                  ? styles.prioTextActive
                  : styles.prioTextHigh
              }
            >
              Cao
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.datePickerRow}>
        <Text style={styles.priorityLabel}>
          Đến hạn: <Text style={{ color: COLORS.error }}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setShowDatePicker(true)}
          disabled={isReadOnly}
        >
          <Text
            style={
              data.dueDate ? styles.dateBtnTextActive : styles.dateBtnText
            }
          >
            {data.dueDate
              ? data.dueDate.toLocaleDateString('vi-VN')
              : 'Chọn ngày'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && !isReadOnly && (
          <DateTimePicker
            value={data.dueDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) update({ dueDate: selectedDate });
            }}
          />
        )}
      </View>
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) =>
  StyleSheet.create({
    container: { gap: 12 },
    typeSelectorRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
    typeBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: RADIUS.md,
      backgroundColor: COLORS.surfaceVariant,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    typeBtnActive: {
      backgroundColor: `${COLORS.primary}1A`,
      borderColor: COLORS.primary,
    },
    typeBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: COLORS.textSecondary,
    },
    typeBtnTextActive: { color: COLORS.primary },
    input: {
      backgroundColor: COLORS.surfaceVariant,
      borderRadius: RADIUS.md,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: COLORS.onSurface,
      fontSize: 14,
      borderWidth: 1,
      borderColor: COLORS.outlineVariant,
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    priorityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 4,
    },
    priorityLabel: {
      fontSize: 13,
      color: COLORS.textSecondary,
      fontWeight: '600',
    },
    prioBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: RADIUS.sm,
      backgroundColor: COLORS.surfaceVariant,
    },
    prioBadgeActive: { backgroundColor: COLORS.primary },
    prioHigh: { backgroundColor: COLORS.errorTint || `${COLORS.error}1A` },
    prioBadgeHighActive: { backgroundColor: COLORS.error },
    prioText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
    prioTextHigh: { color: COLORS.error, fontSize: 12, fontWeight: '600' },
    prioTextActive: {
      color: COLORS.onPrimary,
      fontSize: 12,
      fontWeight: '700',
    },
    datePickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 4,
    },
    dateBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: RADIUS.sm,
      backgroundColor: COLORS.surfaceVariant,
      borderWidth: 1,
      borderColor: COLORS.outlineVariant,
    },
    dateBtnText: {
      color: COLORS.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    dateBtnTextActive: {
      color: COLORS.primary,
      fontSize: 13,
      fontWeight: '700',
    },
  });
