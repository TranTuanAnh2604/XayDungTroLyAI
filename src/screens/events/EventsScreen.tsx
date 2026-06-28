import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateSelectorStrip from '../../components/events/DateSelectorStrip';
import EventTimeline from '../../components/events/EventTimeline';
import EventsFAB from '../../components/events/EventsFAB';
import EventsInsightCard from '../../components/events/EventsInsightCard';
import CreateEventModal from '../../components/events/CreateEventModal';
import EditEventModal from '../../components/events/EditEventModal';
import { TabScreenLayout, TopAppBar } from '../../components/navigation';
import {
  getBottomNavReservedHeight,
  SCROLL_BOTTOM_EXTRA,
} from '../../constants/layout';
import { EVENTS_INSIGHT } from '../../data/eventsMock';
import { useOpenSettings } from '../../hooks/useOpenSettings';
import { createCalendarEvent, fetchCalendarEvents, updateCalendarEvent } from '../../services/sync';
import type { CalendarSyncRequest } from '../../services/sync';
import type { CalendarDateItem, TimelineEvent } from '../../types/events';

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function getLocalMidnight(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatLocalDateId(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseCalendarDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildCalendarDates(referenceDate: Date): CalendarDateItem[] {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 3);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(date);
    current.setDate(date.getDate() + index);
    return {
      id: formatLocalDateId(current),
      weekday: WEEKDAY_LABELS[current.getDay()],
      day: current.getDate(),
    };
  });
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const openSettings = useOpenSettings();
  const [todayId, setTodayId] = useState<string>(() => formatLocalDateId(getLocalMidnight()));
  const [selectedDateId, setSelectedDateId] = useState<string>(todayId);
  const [calendarDates, setCalendarDates] = useState<CalendarDateItem[]>(() =>
    buildCalendarDates(getLocalMidnight()),
  );
  const [allEvents, setAllEvents] = useState<TimelineEvent[]>([]);
  const [rawCalendarEvents, setRawCalendarEvents] = useState<CalendarSyncRequest[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const bottomChrome = getBottomNavReservedHeight(insets);

  const displayDate = new Date(selectedDateId);
  const dateLabel = `${displayDate.getDate()}/${displayDate.getMonth() + 1}/${displayDate.getFullYear()}`;
  const monthLabel = `Tháng ${displayDate.getMonth() + 1}, ${displayDate.getFullYear()}`;
  const todayLabel =
    selectedDateId === todayId ? `Hôm nay · ${dateLabel}` : dateLabel;

  const events = useMemo(
    () => allEvents.filter((event) => event.date === selectedDateId),
    [allEvents, selectedDateId],
  );

  const editingEvent = useMemo(() => {
  if (!editingEventId) {
    return null;
  }

  return (
    rawCalendarEvents.find(
      (event) => event.id === editingEventId,
    ) ?? null
  );
}, [editingEventId, rawCalendarEvents]);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      setError(null);

      try {
        const calendarEvents = await fetchCalendarEvents();
        setRawCalendarEvents(calendarEvents);
        setAllEvents(
          calendarEvents.map((event, index) =>
            mapCalendarEventToTimelineEvent(event, index),
          ),
        );
      } catch (fetchError) {
        console.error('Failed to load calendar events:', fetchError);
        setError('Không thể tải dữ liệu sự kiện.');
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  useEffect(() => {
    const updateDateState = () => {
      const newTodayId = formatLocalDateId(getLocalMidnight());
      if (newTodayId === todayId) {
        return;
      }

      const newCalendarDates = buildCalendarDates(getLocalMidnight());
      setTodayId(newTodayId);
      setCalendarDates(newCalendarDates);
      setSelectedDateId((prevSelected) =>
        prevSelected === todayId ||
        !newCalendarDates.some((dateItem) => dateItem.id === prevSelected)
          ? newTodayId
          : prevSelected,
      );
    };

    const scheduleMidnightRefresh = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setDate(now.getDate() + 1);
      nextMidnight.setHours(0, 0, 0, 0);
      const delay = nextMidnight.getTime() - now.getTime();

      timerRef.current = setTimeout(() => {
        updateDateState();
        scheduleMidnightRefresh();
      }, delay);
    };

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        updateDateState();
      }
    });

    scheduleMidnightRefresh();

    return () => {
      subscription.remove();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [todayId]);

  const mapCalendarEventToTimelineEvent = (
    event: CalendarSyncRequest,
    index: number,
  ): TimelineEvent => {
    const eventStart = parseCalendarDate(event.startTime) ?? getLocalMidnight();
    const time = event.isAllDay
      ? 'Cả ngày'
      : eventStart.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
    const dateString = formatLocalDateId(eventStart);
    const id =
      event.id ??
      `${dateString}-${time}-${index}`;
    if (event.isAllDay) {
      return {
        id: id,
        date: dateString,
        type: 'task',
        time,
        title: event.title || 'Sự kiện',
        tags: [],
        expandedDetail:
          event.location && event.location.length > 0
            ? `Địa điểm: ${event.location}`
            : `Nguồn: ${event.source}`,
      };
    }

    return {
      id: id,
      date: dateString,
      type: 'meeting',
      time,
      title: event.title || 'Sự kiện',
      description: event.description || event.location || 'Không có mô tả',
      badge: event.source || 'Lịch',
      joinLabel: 'Xem chi tiết',
      expandedDetail:
        event.location && event.location.length > 0
          ? `Địa điểm: ${event.location}`
          : `Nguồn: ${event.source}`,
    };
  };

  const isEventConflict = (
    candidate: CalendarSyncRequest,
  ): CalendarSyncRequest | undefined => {
    const candidateStart = parseCalendarDate(candidate.startTime);
    const candidateEnd = parseCalendarDate(candidate.endTime);

    if (!candidateStart || !candidateEnd) {
      return undefined;
    }

    return rawCalendarEvents.find((existing) => {
      const existingStart = parseCalendarDate(existing.startTime);
      const existingEnd = parseCalendarDate(existing.endTime);
      if (!existingStart || !existingEnd) {
        return false;
      }
      return (
        existing.id !== candidate.id &&
        candidateStart < existingEnd &&
        existingStart < candidateEnd
      );
    });
  };

  const formatEventRange = (event: CalendarSyncRequest) => {
    const start = parseCalendarDate(event.startTime);
    const end = parseCalendarDate(event.endTime);
    const startLabel = start ? start.toLocaleString('vi-VN') : 'Không xác định';
    const endLabel = end ? end.toLocaleString('vi-VN') : 'Không xác định';
    return `${startLabel} — ${endLabel}`;
  };

  return (
    <TabScreenLayout
      topBar={<TopAppBar onSettingsPress={openSettings} />}
      bottomExtra={SCROLL_BOTTOM_EXTRA + 56}
      footer={
        <EventsFAB
          bottomOffset={bottomChrome + 32}
          onPress={() => setIsCreateModalOpen(true)}
        />
      }
    >

      <DateSelectorStrip
        monthLabel={monthLabel}
        todayLabel={todayLabel}
        dates={calendarDates}
        selectedId={selectedDateId}
        onSelect={setSelectedDateId}
      />

      <EventsInsightCard insight={EVENTS_INSIGHT} />

      <CreateEventModal
        visible={isCreateModalOpen}
        defaultDateId={selectedDateId}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={async (event) => {
          const conflict = isEventConflict(event);
          if (conflict) {
            Alert.alert(
              'Xung đột lịch',
              `Sự kiện mới bị trùng với một sự kiện đã tồn tại:\n${conflict.title}\n${formatEventRange(conflict)}`,
            );
            return;
          }

          try {
            const createdEvent = await createCalendarEvent(event);
            const nextEvents = [
              ...allEvents,
              mapCalendarEventToTimelineEvent(createdEvent, allEvents.length),
            ];
            setAllEvents(nextEvents);
            setRawCalendarEvents((prev) => [...prev, createdEvent]);
            setSelectedDateId(formatLocalDateId(new Date(createdEvent.startTime)));
            setIsCreateModalOpen(false);
          } catch (createError: any) {
            console.error('Failed to create calendar event:', createError);
            setError(createError?.message || 'Không thể thêm sự kiện.');
          }
        }}
      />

      {loading ? (
        <View style={styles.messageContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{error}</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Không có sự kiện nào.</Text>
        </View>
      ) : (
        <EventTimeline 
          events={events}
          onEdit={(eventId) => {
            setEditingEventId(eventId);
            setIsEditModalOpen(true);
          }}
        />
      )}

      <EditEventModal
        visible={isEditModalOpen}
        event={editingEvent}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEventId(null);
        }}
        onEdit={async (eventId, updatedEvent) => {
  try {
    const editedEvent = await updateCalendarEvent(eventId, updatedEvent);

    const mergedEvent = {
      ...updatedEvent,
      ...editedEvent,
      id: eventId,
    };

    setRawCalendarEvents((prev) =>
      prev.map((item) =>
        item.id === eventId
          ? mergedEvent
          : item,
      ),
    );

    setAllEvents((prev) =>
      prev.map((item, index) =>
        item.id === eventId
          ? mapCalendarEventToTimelineEvent(
              mergedEvent,
              index,
            )
          : item,
      ),
    );

    setSelectedDateId(
      formatLocalDateId(
        parseCalendarDate(
          mergedEvent.startTime,
        ) ?? getLocalMidnight(),
      ),
    );

    setIsEditModalOpen(false);
    setEditingEventId(null);
  } catch (editError: any) {
    console.error(
      'Failed to update calendar event:',
      editError,
    );

    setError(
      editError?.message ||
        'Không thể cập nhật sự kiện.',
    );
  }
}}
      />
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 180,
  },
  messageText: {
    fontSize: 16,
    color: '#777',
  },
});
