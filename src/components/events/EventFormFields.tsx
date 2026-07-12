import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import BorderTextInput from '../ui/BorderTextInput';
import { useTheme } from '../../hooks/useTheme';
import { getTypography } from '../../constants/typography';
import { formatDisplayDateValue, mergeDateAndTime, normalizeDateValue } from '../../utils/date';

export type EventFormProps = {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  location: string;
  setLocation: (loc: string) => void;
  startDate: Date;
  setStartDate: (date: Date) => void;
  endDate: Date;
  setEndDate: (date: Date) => void;
  isAllDay: boolean;
  setIsAllDay: (val: boolean) => void;
  showStartDatePicker: boolean;
  setShowStartDatePicker: (val: boolean) => void;
  showStartTimePicker: boolean;
  setShowStartTimePicker: (val: boolean) => void;
  showEndDatePicker: boolean;
  setShowEndDatePicker: (val: boolean) => void;
  showEndTimePicker: boolean;
  setShowEndTimePicker: (val: boolean) => void;
  error: string | null;
  // source is optional, used in create form
  source?: string;
  setSource?: (val: string) => void;
};

export default function EventFormFields({
  title, setTitle,
  description, setDescription,
  location, setLocation,
  startDate, setStartDate,
  endDate, setEndDate,
  isAllDay, setIsAllDay,
  showStartDatePicker, setShowStartDatePicker,
  showStartTimePicker, setShowStartTimePicker,
  showEndDatePicker, setShowEndDatePicker,
  showEndTimePicker, setShowEndTimePicker,
  error,
  source, setSource
}: EventFormProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

  return (
    <>
      <BorderTextInput
        label="Tiêu đề"
        value={title}
        onChangeText={setTitle}
        placeholder="Nhập tiêu đề sự kiện"
      />
      <BorderTextInput
        label="Mô tả"
        value={description}
        onChangeText={setDescription}
        placeholder="Nhập mô tả"
        multiline
      />
      <BorderTextInput
        label="Địa điểm"
        value={location}
        onChangeText={setLocation}
        placeholder="Nhập địa điểm"
      />
      
      {setSource && (
        <BorderTextInput
          label="Nguồn"
          value={source ?? ''}
          onChangeText={setSource}
          placeholder="Ví dụ: app"
        />
      )}

      <Pressable
        style={styles.pickerRow}
        onPress={() => setShowStartDatePicker(true)}
      >
        <View>
          <Text style={styles.label}>Bắt đầu</Text>
          <Text style={styles.pickerValue}>{formatDisplayDateValue(startDate)}</Text>
        </View>
        <Text style={styles.actionLabel}>Chọn</Text>
      </Pressable>
      
      <Pressable
        style={styles.pickerRow}
        onPress={() => setShowEndDatePicker(true)}
      >
        <View>
          <Text style={styles.label}>Kết thúc</Text>
          <Text style={styles.pickerValue}>{formatDisplayDateValue(endDate)}</Text>
        </View>
        <Text style={styles.actionLabel}>Chọn</Text>
      </Pressable>

      {showStartDatePicker ? (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            const normalizedDate = normalizeDateValue(selectedDate ?? undefined);
            if (!event || event.type === 'dismissed' || !normalizedDate) {
              return;
            }
            const nextDate = mergeDateAndTime(normalizedDate, startDate);
            setStartDate(nextDate);
            if (Platform.OS === 'android') {
              setShowStartTimePicker(true);
            }
          }}
        />
      ) : null}
      
      {showStartTimePicker ? (
        <DateTimePicker
          value={startDate}
          mode="time"
          display="spinner"
          onChange={(event, selectedTime) => {
            setShowStartTimePicker(false);
            const normalizedTime = normalizeDateValue(selectedTime ?? undefined);
            if (!event || event.type === 'dismissed' || !normalizedTime) {
              return;
            }
            const nextDate = mergeDateAndTime(startDate, normalizedTime);
            setStartDate(nextDate);
          }}
        />
      ) : null}
      
      {showEndDatePicker ? (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            const normalizedDate = normalizeDateValue(selectedDate ?? undefined);
            if (!event || event.type === 'dismissed' || !normalizedDate) {
              return;
            }
            const nextDate = mergeDateAndTime(normalizedDate, endDate);
            setEndDate(nextDate);
            if (Platform.OS === 'android') {
              setShowEndTimePicker(true);
            }
          }}
        />
      ) : null}
      
      {showEndTimePicker ? (
        <DateTimePicker
          value={endDate}
          mode="time"
          display="spinner"
          onChange={(event, selectedTime) => {
            setShowEndTimePicker(false);
            const normalizedTime = normalizeDateValue(selectedTime ?? undefined);
            if (!event || event.type === 'dismissed' || !normalizedTime) {
              return;
            }
            const nextDate = mergeDateAndTime(endDate, normalizedTime);
            setEndDate(nextDate);
          }}
        />
      ) : null}

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Cả ngày</Text>
        <Switch
          value={isAllDay}
          onValueChange={setIsAllDay}
          thumbColor={isAllDay ? COLORS.primary : COLORS.surface}
          trackColor={{ false: COLORS.outlineVariant, true: COLORS.primaryTint10 }}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    ...typography.bodyMd,
    color: COLORS.onSurface,
  },
  actionLabel: {
    ...typography.bodyMd,
    color: COLORS.primary,
    fontWeight: '700',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  label: {
    ...typography.labelCaps,
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  pickerValue: {
    ...typography.bodyLg,
    color: COLORS.onSurface,
    marginTop: 4,
  },
  errorText: {
    color: COLORS.error ?? '#B91C1C',
    marginTop: 10,
    marginBottom: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});
