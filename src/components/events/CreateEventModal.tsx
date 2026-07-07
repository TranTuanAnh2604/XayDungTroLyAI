import { getTypography } from '../../constants/typography';
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
import { useTheme } from '../../hooks/useTheme';

import BorderTextInput from '../ui/BorderTextInput';
import type { CalendarSyncRequest } from '../../services/sync';

type CreateEventModalProps = {
  visible: boolean;
  defaultDateId: string;
  onClose: () => void;
  onCreate: (event: CalendarSyncRequest) => Promise<void>;
};

/** Returns the current date+time, used as the one-time snapshot when the popup opens. */
function captureNow(): Date {
  return new Date();
}

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

export default function CreateEventModal({
  visible,
  defaultDateId,
  onClose,
  onCreate,
}: CreateEventModalProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  // Snapshot of the moment the popup was opened. Captured once on open so the
  // displayed default does not tick forward while the modal is visible.
  const openedAtRef = React.useRef<Date>(captureNow());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState('app');
  const [startDate, setStartDate] = useState<Date>(() => captureNow());
  const [endDate, setEndDate] = useState<Date>(() => captureNow());
  const [isAllDay, setIsAllDay] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    // Capture the open time exactly once per popup open.
    const now = captureNow();
    openedAtRef.current = now;
    setTitle('');
    setDescription('');
    setLocation('');
    setSource('app');
    
    // Bắt đầu bằng thời gian hiện tại
    setStartDate(now);
    // Kết thúc mặc định sau 1 tiếng
    setEndDate(new Date(now.getTime() + 60 * 60 * 1000));
    
    setIsAllDay(false);
    setShowStartDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndDatePicker(false);
    setShowEndTimePicker(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleCreate = async () => {
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

    setSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        startTime: startIso,
        endTime: endIso,
        location: location.trim() || undefined,
        source: source.trim() || 'app',
        externalId: `event-${Date.now()}`,
        isAllDay,
      });
    } catch (createError: any) {
      setError(createError?.message || 'Không thể thêm sự kiện.');
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
            <Text style={styles.title}>Thêm sự kiện</Text>
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
            <BorderTextInput
              label="Nguồn"
              value={source}
              onChangeText={setSource}
              placeholder="Ví dụ: app"
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

            <Pressable
              onPress={handleCreate}
              style={[styles.button, submitting && styles.buttonDisabled]}
              disabled={submitting}
            >
              <Text style={styles.buttonText}>{submitting ? 'Đang tạo...' : 'Tạo sự kiện'}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
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
    marginTop: 10,
  },
});
