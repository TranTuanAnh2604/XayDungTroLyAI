import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
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
  showEndDatePicker: boolean;
  setShowEndDatePicker: (val: boolean) => void;
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
  showEndDatePicker, setShowEndDatePicker,
  error,
  source, setSource
}: EventFormProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

  const openAndroidPicker = (
    currentDate: Date,
    setDate: (date: Date) => void
  ) => {
    DateTimePickerAndroid.open({
      value: currentDate,
      mode: 'date',
      minimumDate: new Date(),
      onChange: (event, selectedDate) => {
        if (event.type === 'dismissed' || !selectedDate) return;

        if (isAllDay) {
          const normalizedDate = normalizeDateValue(selectedDate);
          if (normalizedDate) {
            setDate(mergeDateAndTime(normalizedDate, currentDate));
          }
          return;
        }

        DateTimePickerAndroid.open({
          value: selectedDate,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent, selectedTime) => {
            if (timeEvent.type === 'dismissed' || !selectedTime) return;

            const combined = new Date(selectedDate);
            combined.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

            setDate(combined);
          },
        });
      },
    });
  };

  const handleStartPress = () => {
    if (Platform.OS === 'android') {
      openAndroidPicker(startDate, setStartDate);
    } else {
      setShowStartDatePicker(true);
    }
  };

  const handleEndPress = () => {
    if (Platform.OS === 'android') {
      openAndroidPicker(endDate, setEndDate);
    } else {
      setShowEndDatePicker(true);
    }
  };

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
        onPress={handleStartPress}
        iconName="clock-outline"
      />
      
      <DatePickerCard
        label="Kết thúc"
        valueText={formatDisplayDateValue(endDate)}
        onPress={handleEndPress}
        iconName="clock-check-outline"
      />

      {Platform.OS === 'ios' && showStartDatePicker ? (
        <DateTimePicker
          value={startDate}
          minimumDate={new Date()}
          mode={isAllDay ? 'date' : 'datetime'}
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (!selectedDate) return;
            if (isAllDay) {
              const normalizedDate = normalizeDateValue(selectedDate);
              if (normalizedDate) setStartDate(mergeDateAndTime(normalizedDate, startDate));
            } else {
              setStartDate(selectedDate);
            }
          }}
        />
      ) : null}
      
      {Platform.OS === 'ios' && showEndDatePicker ? (
        <DateTimePicker
          value={endDate}
          minimumDate={new Date()}
          mode={isAllDay ? 'date' : 'datetime'}
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (!selectedDate) return;
            if (isAllDay) {
              const normalizedDate = normalizeDateValue(selectedDate);
              if (normalizedDate) setEndDate(mergeDateAndTime(normalizedDate, endDate));
            } else {
              setEndDate(selectedDate);
            }
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
