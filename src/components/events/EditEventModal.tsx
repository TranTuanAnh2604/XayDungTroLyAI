import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import TaskModalContainer from '../tasks/ui/TaskModalContainer';
import ModalHeader from '../tasks/ui/ModalHeader';
import ModalFooter from '../tasks/ui/ModalFooter';
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
  const openedAtRef = React.useRef<Date>(new Date());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isAllDay, setIsAllDay] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !event) return;
    const now = new Date();
    openedAtRef.current = now;

    const startDateTime = normalizeDateValue(event.startTime);
    const endDateTime = normalizeDateValue(event.endTime);

    setTitle(event.title || '');
    setDescription(event.description || '');
    setLocation(event.location || '');
    const startValue = startDateTime ?? now;
    setStartDate(startValue);
    setEndDate(endDateTime ?? new Date(startValue.getTime() + 60 * 60 * 1000));
    setIsAllDay(event.isAllDay || false);
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
    setError(null);
  }, [visible, event]);

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
    setShowEndDatePicker(false);
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
    <TaskModalContainer visible={visible} onClose={onClose}>
      <ModalHeader
        title="Chỉnh sửa sự kiện"
        onClose={onClose}
      />
      
      <EventFormFields
        title={title} setTitle={setTitle}
        description={description} setDescription={setDescription}
        location={location} setLocation={setLocation}
        startDate={startDate} setStartDate={setStartDate}
        endDate={endDate} setEndDate={setEndDate}
        isAllDay={isAllDay} setIsAllDay={setIsAllDay}
        showStartDatePicker={showStartDatePicker} setShowStartDatePicker={setShowStartDatePicker}
        showEndDatePicker={showEndDatePicker} setShowEndDatePicker={setShowEndDatePicker}
        error={error}
      />
      
      <ModalFooter
        primaryLabel={submitting ? 'Đang cập nhật...' : 'Cập nhật sự kiện'}
        onPrimaryPress={handleEdit}
        secondaryLabel={onDelete ? 'Xóa sự kiện' : 'Đóng'}
        onSecondaryPress={onDelete ? handleDelete : onClose}
        secondaryType={onDelete ? 'danger' : 'cancel'}
        isPrimaryDisabled={submitting}
        isSubmitting={submitting}
      />
    </TaskModalContainer>
  );
}
