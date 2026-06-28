import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import BorderTextInput from '../ui/BorderTextInput';
import type { CalendarSyncRequest } from '../../services/sync';

type EditEventModalProps = {
  visible: boolean;
  event: CalendarSyncRequest  | null;
  onClose: () => void;
  onEdit: (eventId: string, event: CalendarSyncRequest) => Promise<void>;
};

function normalizeDateValue(value: Date | number | string | undefined | null): Date | null {
  if (value == null) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mergeDateAndTime(dateValue: Date, timeValue: Date): Date {
  const merged = new Date(dateValue.getTime());
  merged.setHours(timeValue.getHours(), timeValue.getMinutes(), timeValue.getSeconds(), timeValue.getMilliseconds());
  return merged;
}

function formatDisplayDateValue(value: Date | null): string {
  return value ? value.toLocaleString('vi-VN') : '';
}

function safeISOString(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  try {
    return date.toISOString();
  } catch {
    return null;
  }
}

export default function EditEventModal({
  visible,
  event,
  onClose,
  onEdit,
}: EditEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isAllDay, setIsAllDay] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !event) return;
    
    const startDateTime = normalizeDateValue(event.startTime);
    const endDateTime = normalizeDateValue(event.endTime);
    
    setTitle(event.title || '');
    setDescription(event.description || '');
    setLocation(event.location || '');
    setStartDate(startDateTime || new Date());
    setEndDate(endDateTime || new Date());
    setIsAllDay(event.isAllDay || false);
    setShowStartDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndDatePicker(false);
    setShowEndTimePicker(false);
    setError(null);
  }, [visible, event]);

  // Reset state when modal is closed
  useEffect(() => {
    if (visible) return;
    setTitle('');
    setDescription('');
    setLocation('');
    setStartDate(new Date());
    setEndDate(new Date());
    setIsAllDay(false);
    setShowStartDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndDatePicker(false);
    setShowEndTimePicker(false);
    setSubmitting(false);
    setError(null);
  }, [visible]);

  const handleEdit = async () => {
    setError(null);

    if (!title.trim()) {
      setError('Tiêu đề là bắt buộc.');
      return;
    }

    const parsedStart = normalizeDateValue(startDate);
    const parsedEnd = normalizeDateValue(endDate);

    if (!parsedStart || !parsedEnd) {
      setError('Ngày giờ bắt đầu hoặc kết thúc không hợp lệ. Vui lòng thử lại.');
      return;
    }

    if (parsedEnd.getTime() <= parsedStart.getTime()) {
      setError('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
      return;
    }

    const startIso = safeISOString(parsedStart);
    const endIso = safeISOString(parsedEnd);

    if (!startIso || !endIso) {
      setError('Có lỗi với giá trị ngày giờ. Vui lòng chọn lại.');
      return;
    }

    if (!event?.id) {
      setError('Không tìm thấy sự kiện để chỉnh sửa.');
      return;
    }

    setSubmitting(true);
    try {
      await onEdit(event.id, {
        ...event,
        id: event.id,

        title: title.trim() || event.title,
        description: description.trim() || event.description,
        location: location.trim() || event.location,

        startTime: startIso,
        endTime: endIso,

        source: event.source ?? 'app',
        externalId: event.externalId,
        isAllDay,
        });
    } catch (editError: any) {
      setError(editError?.message || 'Không thể cập nhật sự kiện.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Chỉnh sửa sự kiện</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Đóng</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.form}
            showsVerticalScrollIndicator={false}
          >
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
                onChange={(dateEvent, selectedDate) => {
                  setShowStartDatePicker(false);
                  const normalizedDate = normalizeDateValue(selectedDate ?? undefined);
                  if (!dateEvent || dateEvent.type === 'dismissed' || !normalizedDate) {
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
                onChange={(timeEvent, selectedTime) => {
                  setShowStartTimePicker(false);
                  const normalizedTime = normalizeDateValue(selectedTime ?? undefined);
                  if (!timeEvent || timeEvent.type === 'dismissed' || !normalizedTime) {
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
                onChange={(dateEvent, selectedDate) => {
                  setShowEndDatePicker(false);
                  const normalizedDate = normalizeDateValue(selectedDate ?? undefined);
                  if (!dateEvent || dateEvent.type === 'dismissed' || !normalizedDate) {
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
                onChange={(timeEvent, selectedTime) => {
                  setShowEndTimePicker(false);
                  const normalizedTime = normalizeDateValue(selectedTime ?? undefined);
                  if (!timeEvent || timeEvent.type === 'dismissed' || !normalizedTime) {
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

            <Pressable
              onPress={handleEdit}
              style={[styles.button, submitting && styles.buttonDisabled]}
              disabled={submitting}
            >
              <Text style={styles.buttonText}>{submitting ? 'Đang cập nhật...' : 'Cập nhật sự kiện'}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  container: {
    maxHeight: '90%',
    width: '100%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...typography.headlineSm,
    color: COLORS.onSurface,
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
  },
  closeButtonText: {
    color: COLORS.onPrimary,
    fontWeight: '700',
  },
  form: {
    paddingBottom: 32,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  switchLabel: {
    ...typography.bodyMd,
    color: COLORS.onSurface,
  },
  button: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: `${COLORS.primary}88`,
  },
  buttonText: {
    color: COLORS.onPrimary,
    fontWeight: '700',
    fontSize: 15,
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
    marginBottom: 16,
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
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});
