import { getTypography } from '../../constants/typography';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

import { normalizeDateValue, safeISOString } from '../../utils/date';
import EventFormFields from './EventFormFields';
import type { CalendarSyncRequest } from '../../services/sync';

type EditEventModalProps = {
  visible: boolean;
  event: CalendarSyncRequest | null;
  onClose: () => void;
  onEdit: (eventId: string, event: CalendarSyncRequest) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
};



export default function EditEventModal({
  visible,
  event,
  onClose,
  onEdit,
  onDelete,
}: EditEventModalProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  // Snapshot of the moment the popup was opened. Captured once so the default
  // displayed for missing/invalid times does not drift while the modal is open.
  const openedAtRef = React.useRef<Date>(new Date());

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
    // Capture the open timestamp once so it stays stable during the session.
    const now = new Date();
    openedAtRef.current = now;

    const startDateTime = normalizeDateValue(event.startTime);
    const endDateTime = normalizeDateValue(event.endTime);

    setTitle(event.title || '');
    setDescription(event.description || '');
    setLocation(event.location || '');
    // Use the event's saved times when valid; fall back to the open timestamp.
    const startValue = startDateTime ?? now;
    setStartDate(startValue);
    setEndDate(endDateTime ?? new Date(startValue.getTime() + 60 * 60 * 1000));
    setIsAllDay(event.isAllDay || false);
    setShowStartDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndDatePicker(false);
    setShowEndTimePicker(false);
    setError(null);
  }, [visible, event]);

  // Reset state when modal is closed so stale values are cleared.
  useEffect(() => {
    if (visible) return;
    const resetTo = new Date();
    setTitle('');
    setDescription('');
    setLocation('');
    setStartDate(resetTo);
    setEndDate(new Date(resetTo.getTime() + 60 * 60 * 1000));
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
        description: description.trim() || event.description || undefined,
        location: location.trim() || event.location || undefined,

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

  const handleDelete = async () => {
    console.log('FULL event object:', JSON.stringify(event, null, 2));
    if (!event?.id || !onDelete) {
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Xóa sự kiện',
        'Bạn chắc chắn muốn xóa sự kiện này?',
        [
          { text: 'Hủy', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Xóa', style: 'destructive', onPress: () => resolve(true) },
        ],
        { cancelable: true },
      );
    });

    if (!confirmed) return;

    setSubmitting(true);
    setError(null);

    try {
      await onDelete(event.id);
      onClose();
    } catch (deleteError: any) {
      setError(deleteError?.message || 'Không thể xóa sự kiện.');
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
            <EventFormFields
              title={title} setTitle={setTitle}
              description={description} setDescription={setDescription}
              location={location} setLocation={setLocation}
              startDate={startDate} setStartDate={setStartDate}
              endDate={endDate} setEndDate={setEndDate}
              isAllDay={isAllDay} setIsAllDay={setIsAllDay}
              showStartDatePicker={showStartDatePicker} setShowStartDatePicker={setShowStartDatePicker}
              showStartTimePicker={showStartTimePicker} setShowStartTimePicker={setShowStartTimePicker}
              showEndDatePicker={showEndDatePicker} setShowEndDatePicker={setShowEndDatePicker}
              showEndTimePicker={showEndTimePicker} setShowEndTimePicker={setShowEndTimePicker}
              error={error}
            />

            <View style={styles.buttonGroup}>
              <Pressable
                onPress={handleEdit}
                style={[styles.button, submitting && styles.buttonDisabled]}
                disabled={submitting}
              >
                <Text style={styles.buttonText}>{submitting ? 'Đang cập nhật...' : 'Cập nhật sự kiện'}</Text>
              </Pressable>
              {onDelete ? (
                <Pressable
                  onPress={handleDelete}
                  style={[styles.deleteButton, submitting && styles.buttonDisabled]}
                  disabled={submitting}
                >
                  <Text style={styles.deleteButtonText}>Xóa sự kiện</Text>
                </Pressable>
              ) : null}
            </View>
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
    gap: 20,
  },
  buttonGroup: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: `${COLORS.primary}88`,
  },
  deleteButton: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.error,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.onPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  buttonText: {
    color: COLORS.onPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
});
