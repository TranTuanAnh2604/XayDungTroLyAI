import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import InputField from '../tasks/ui/InputField';
import DatePickerCard from '../tasks/ui/DatePickerCard';
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
    <View style={styles.container}>
      <InputField
        label="Tiêu đề"
        value={title}
        onChangeText={setTitle}
        placeholder="Nhập tiêu đề sự kiện"
      />
      <InputField
        label="Mô tả"
        value={description}
        onChangeText={setDescription}
        placeholder="Nhập mô tả"
        isTextArea
      />
      <InputField
        label="Địa điểm"
        value={location}
        onChangeText={setLocation}
        placeholder="Nhập địa điểm"
      />
      
      {setSource && (
        <InputField
          label="Nguồn"
          value={source ?? ''}
          onChangeText={setSource}
          placeholder="Ví dụ: app"
        />
      )}

      <DatePickerCard
        label="Bắt đầu"
        valueText={formatDisplayDateValue(startDate)}
        onPress={() => setShowStartDatePicker(true)}
        iconName="clock-outline"
      />
      
      <DatePickerCard
        label="Kết thúc"
        valueText={formatDisplayDateValue(endDate)}
        onPress={() => setShowEndDatePicker(true)}
        iconName="clock-check-outline"
      />

      {showStartDatePicker ? (
        <DateTimePicker
          value={startDate}
          minimumDate={new Date()}
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
          minimumDate={new Date()}
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
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  switchLabel: {
    ...typography.bodyMd,
    color: COLORS.onSurface,
  },
  errorText: {
    color: COLORS.error ?? '#B91C1C',
    marginTop: 4,
    marginBottom: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});
