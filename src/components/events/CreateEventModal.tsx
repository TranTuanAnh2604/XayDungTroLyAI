import React, { useEffect, useState } from 'react';
import TaskModalContainer from '../tasks/ui/TaskModalContainer';
import ModalHeader from '../tasks/ui/ModalHeader';
import ModalFooter from '../tasks/ui/ModalFooter';
import { normalizeDateValue, safeISOString } from '../../utils/date';
import EventFormFields from './EventFormFields';
import type { CalendarSyncRequest } from '../../services/sync';

type CreateEventModalProps = {
  visible: boolean;
  defaultDateId: string;
  onClose: () => void;
  onCreate: (event: CalendarSyncRequest) => Promise<void>;
};

function captureNow(): Date {
  return new Date();
}

export default function CreateEventModal({
  visible,
  defaultDateId,
  onClose,
  onCreate,
}: CreateEventModalProps) {
  const openedAtRef = React.useRef<Date>(captureNow());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
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
    const now = captureNow();
    openedAtRef.current = now;
    setTitle('');
    setDescription('');
    setLocation('');
    
    setStartDate(now);
    setEndDate(new Date(now.getTime() + 60 * 60 * 1000));
    
    setIsAllDay(false);
    setShowStartDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndDatePicker(false);
    setShowEndTimePicker(false);
    setError(null);
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
        source: 'app',
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
    <TaskModalContainer visible={visible} onClose={onClose}>
      <ModalHeader
        title="Thêm sự kiện"
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
        showStartTimePicker={showStartTimePicker} setShowStartTimePicker={setShowStartTimePicker}
        showEndDatePicker={showEndDatePicker} setShowEndDatePicker={setShowEndDatePicker}
        showEndTimePicker={showEndTimePicker} setShowEndTimePicker={setShowEndTimePicker}
        error={error}
      />
      
      <ModalFooter
        primaryLabel={submitting ? 'Đang tạo...' : 'Tạo sự kiện'}
        onPrimaryPress={handleCreate}
        secondaryLabel="Đóng"
        onSecondaryPress={onClose}
        isPrimaryDisabled={submitting}
        isSubmitting={submitting}
      />
    </TaskModalContainer>
  );
}
