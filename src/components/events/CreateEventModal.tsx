import { getTypography } from '../../constants/typography';
import React, { useEffect, useState } from 'react';
import {
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
              source={source ?? ''} setSource={setSource}
            />

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
    gap: 20,
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
});
