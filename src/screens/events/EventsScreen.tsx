import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateSelectorStrip from '../../components/events/DateSelectorStrip';
import EventTimeline from '../../components/events/EventTimeline';
import EventsFAB from '../../components/events/EventsFAB';
import EventsInsightCard from '../../components/events/EventsInsightCard';
import CreateEventModal from '../../components/events/CreateEventModal';
import EditEventModal from '../../components/events/EditEventModal';
import { TabScreenLayout, TopAppBar } from '../../components/navigation';
import { useTheme } from '../../hooks/useTheme';
import {
  getBottomNavReservedHeight,
  SCROLL_BOTTOM_EXTRA,
} from '../../constants/layout';
import { EVENTS_INSIGHT } from '../../data/eventsMock';
import { useOpenSettings } from '../../hooks/useOpenSettings';
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvents,
  updateCalendarEvent,
} from '../../services/sync';
import {
  cancelEventReminder,
  scheduleEventReminderForEvent,
} from '../../services/notifications';
import { detectEventType } from '../../utils/eventTypeDetection';
import type { CalendarSyncRequest } from '../../services/sync';
import type { CalendarDateItem, TimelineEvent } from '../../types/events';

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const EVENTS_CACHE_KEY = '@app:events:cache';
const EXTERNAL_ID_MAP_KEY = '@app:events:external_id_map';
const EVENTS_CACHE_TTL_MS = 60_000;

type PersistedEventCache = {
  events: CalendarSyncRequest[];
  externalIdMap: Record<string, string>;
  lastSyncedAt: number | null;
};

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

function getEventCacheKey(event: CalendarSyncRequest): string {
  return event.externalId || event.id || `${event.startTime}-${event.endTime}-${event.title}`;
}

function mergeCalendarEvents(
  currentEvents: CalendarSyncRequest[],
  incomingEvents: CalendarSyncRequest[],
): CalendarSyncRequest[] {
  const mergedByKey = new Map<string, CalendarSyncRequest>();

  currentEvents.forEach((event) => {
    const key = getEventCacheKey(event);
    if (key) {
      mergedByKey.set(key, event);
    }
  });

  incomingEvents.forEach((event) => {
    const key = getEventCacheKey(event);
    if (key) {
      mergedByKey.set(key, event);
    }
  });

  return Array.from(mergedByKey.values());
}

async function readEventCache(): Promise<PersistedEventCache | null> {
  try {
    const raw = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedEventCache;
    if (!parsed || !Array.isArray(parsed.events)) {
      return null;
    }

    return {
      events: parsed.events,
      externalIdMap: parsed.externalIdMap || {},
      lastSyncedAt: parsed.lastSyncedAt ?? null,
    };
  } catch (error) {
    console.warn('Failed to read event cache:', error);
    return null;
  }
}

async function writeEventCache(
  events: CalendarSyncRequest[],
  externalIdMap: Record<string, string>,
  lastSyncedAt: number,
): Promise<void> {
  try {
    const payload: PersistedEventCache = {
      events,
      externalIdMap,
      lastSyncedAt,
    };

    await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(payload));
    await AsyncStorage.setItem(EXTERNAL_ID_MAP_KEY, JSON.stringify(externalIdMap));
  } catch (error) {
    console.warn('Failed to persist event cache:', error);
  }
}

async function invalidateEventCache(): Promise<void> {
  try {
    console.log('[cache] invalidating event cache after delete');
    await AsyncStorage.removeItem(EVENTS_CACHE_KEY);
    await AsyncStorage.removeItem(EXTERNAL_ID_MAP_KEY);
  } catch (error) {
    console.warn('Failed to invalidate event cache:', error);
  }
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

function inferTimelineEventType(title: string, isAllDay: boolean): TimelineEvent['type'] {
  return detectEventType(title, isAllDay);
}

export default function EventsScreen() {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const openSettings = useOpenSettings();
  const [todayId, setTodayId] = useState<string>(() => formatLocalDateId(getLocalMidnight()));
  const [selectedDateId, setSelectedDateId] = useState<string>(todayId);
  const [calendarDates, setCalendarDates] = useState<CalendarDateItem[]>(() =>
    buildCalendarDates(getLocalMidnight()),
  );
  const [allEvents, setAllEvents] = useState<TimelineEvent[]>([]);
  const [rawCalendarEvents, setRawCalendarEvents] = useState<CalendarSyncRequest[]>([]);
  const [loadedExternalIds, setLoadedExternalIds] = useState<Record<string, string>>({});
  const [hasLoadedExternalIdMap, setHasLoadedExternalIdMap] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rawCalendarEventsRef = useRef<CalendarSyncRequest[]>([]);
  const loadedExternalIdsRef = useRef<Record<string, string>>({});
  const hasInitialDataRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [hasInitialData, setHasInitialData] = useState(false);
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

  const EXTERNAL_ID_MAP_KEY = '@app:events:external_id_map';

  useEffect(() => {
    rawCalendarEventsRef.current = rawCalendarEvents;
  }, [rawCalendarEvents]);

  useEffect(() => {
    loadedExternalIdsRef.current = loadedExternalIds;
  }, [loadedExternalIds]);

  useEffect(() => {
    hasInitialDataRef.current = hasInitialData;
  }, [hasInitialData]);

  const refreshEvents = useCallback(async (options: { force?: boolean; silent?: boolean } = {}) => {
    const { force = false, silent = false } = options;

    try {
      const cachedState = await readEventCache();
      const now = Date.now();
      const isCacheFresh = Boolean(
        cachedState?.lastSyncedAt &&
        now - cachedState.lastSyncedAt < EVENTS_CACHE_TTL_MS,
      );

      if (!force && isCacheFresh && cachedState?.events?.length) {
        const nextEvents = cachedState.events;
        const nextExternalIdMap = cachedState.externalIdMap || {};

        setRawCalendarEvents(nextEvents);
        setAllEvents(nextEvents.map((event, index) => mapCalendarEventToTimelineEvent(event, index)));
        setLoadedExternalIds(nextExternalIdMap);
        setHasLoadedExternalIdMap(true);
        setHasInitialData(true);
        setLoading(false);
        return nextEvents;
      }

      if (!silent && !hasInitialDataRef.current) {
        setLoading(true);
      }

      setError(null);
      const calendarEvents = await fetchCalendarEvents();
      const initialEvents = rawCalendarEventsRef.current;
      const currentExternalIdMap = loadedExternalIdsRef.current;

      const persistedMap = { ...currentExternalIdMap };
      const sourceList = force ? calendarEvents : mergeCalendarEvents(initialEvents, calendarEvents);
      const sourceLabel = force ? 'server' : 'merged';
      console.log(`[refresh] using ${sourceLabel} events (force=${force}, count=${sourceList.length})`);

      const mergedEvents = sourceList.map((event) => {
        if (event.id && !event.externalId && persistedMap[event.id]) {
          return { ...event, externalId: persistedMap[event.id] };
        }
        return event;
      });

      mergedEvents.forEach((event) => {
        if (event.id && event.externalId) {
          persistedMap[event.id] = event.externalId;
        }
      });

      await writeEventCache(mergedEvents, persistedMap, Date.now());
      console.log(`[refresh] cache written with ${mergedEvents.length} events`);

      setRawCalendarEvents(mergedEvents);
      setAllEvents(mergedEvents.map((event, index) => mapCalendarEventToTimelineEvent(event, index)));
      setLoadedExternalIds(persistedMap);
      setHasLoadedExternalIdMap(true);
      setHasInitialData(mergedEvents.length > 0 || initialEvents.length > 0);
      setLoading(false);
      return mergedEvents;
    } catch (fetchError) {
      console.error('[refresh] failed to load calendar events:', fetchError);
      const cachedState = await readEventCache();
      if (cachedState?.events?.length) {
        setRawCalendarEvents(cachedState.events);
        setAllEvents(cachedState.events.map((event, index) => mapCalendarEventToTimelineEvent(event, index)));
        setLoadedExternalIds(cachedState.externalIdMap || {});
        setHasLoadedExternalIdMap(true);
        setHasInitialData(true);
      } else {
        setError('Không thể tải dữ liệu sự kiện.');
      }
      setLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initializeEvents() {
      const cachedState = await readEventCache();
      if (isMounted && cachedState?.events?.length) {
        setRawCalendarEvents(cachedState.events);
        setAllEvents(cachedState.events.map((event, index) => mapCalendarEventToTimelineEvent(event, index)));
        setLoadedExternalIds(cachedState.externalIdMap || {});
        setHasLoadedExternalIdMap(true);
        setHasInitialData(true);
        setLoading(false);
      } else if (isMounted) {
        setLoading(true);
      }

      if (isMounted) {
        await refreshEvents({ force: !cachedState?.events?.length });
      }
    }

    initializeEvents();

    return () => {
      isMounted = false;
    };
  }, [refreshEvents]);

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
        void refreshEvents({ silent: true });
      }
    });

    scheduleMidnightRefresh();

    return () => {
      subscription.remove();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [refreshEvents, todayId]);

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
    const inferredType = inferTimelineEventType(event.title || 'Sự kiện', event.isAllDay);

    if (inferredType === 'urgent') {
      return {
        id,
        date: dateString,
        type: 'urgent',
        time,
        title: event.title || 'Sự kiện',
        description: event.description || event.location || 'Không có mô tả',
        badge: 'Quan trọng',
        avatars: [],
        expandedDetail:
          event.location && event.location.length > 0
            ? `Địa điểm: ${event.location}`
            : `Nguồn: ${event.source}`,
      };
    }

    if (inferredType === 'meeting') {
      return {
        id,
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
    }

    if (inferredType === 'break') {
      return {
        id,
        date: dateString,
        type: 'break',
        time,
        title: event.title || 'Sự kiện',
      };
    }

    return {
      id,
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
  };

  const isEventConflict = (
    candidate: CalendarSyncRequest,
    sourceEvents: CalendarSyncRequest[] = rawCalendarEvents,
    sourceLabel = 'local-state',
  ): CalendarSyncRequest | undefined => {
    const candidateId = candidate.id || candidate.externalId || candidate.title;
    console.log(`[conflict-detect] checking '${candidateId}' against ${sourceEvents.length} events from source='${sourceLabel}'`);

    const candidateStart = parseCalendarDate(candidate.startTime);
    const candidateEnd = parseCalendarDate(candidate.endTime);

    if (!candidateStart || !candidateEnd) {
      console.log(`[conflict-detect] invalid candidate times, skipping`);
      return undefined;
    }

    const conflict = sourceEvents.find((existing) => {
      const existingStart = parseCalendarDate(existing.startTime);
      const existingEnd = parseCalendarDate(existing.endTime);
      if (!existingStart || !existingEnd) {
        return false;
      }
      const overlaps = (
        existing.id !== candidate.id &&
        candidateStart < existingEnd &&
        existingStart < candidateEnd
      );
      if (overlaps) {
        const existingId = existing.id || existing.externalId || existing.title;
        console.log(`[conflict-detect] found overlap with '${existingId}'`);
      }
      return overlaps;
    });
    return conflict;
  };

  const getLatestConflictCheckData = useCallback(async () => {
    console.log('[conflict-detect] fetching latest data for conflict check');
    const serverEvents = await refreshEvents({ force: true, silent: true });
    const sourceEvents = Array.isArray(serverEvents) ? serverEvents : rawCalendarEvents;
    const source = Array.isArray(serverEvents) ? 'server-sync' : 'local-cache';
    console.log(`[conflict-detect] using ${source} source with ${sourceEvents.length} events`);
    return { sourceEvents, source };
  }, [refreshEvents]);

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
          const { sourceEvents, source } = await getLatestConflictCheckData();
          const conflict = isEventConflict(event, sourceEvents, source);
          if (conflict) {
            Alert.alert(
              'Xung đột lịch',
              `Sự kiện mới bị trùng với một sự kiện đã tồn tại:\n${conflict.title}\n${formatEventRange(conflict)}`,
            );
            return;
          }

          try {
            const createdEvent = await createCalendarEvent(event);
            const savedEvent = {
              ...createdEvent,
              source: event.source || 'app',
            };

            let reminderNotificationId: string | null = null;
            try {
              reminderNotificationId = await scheduleEventReminderForEvent({
                ...savedEvent,
                notificationId: undefined,
              });
            } catch (notifErr) {
              console.warn('Failed to schedule local reminder:', notifErr);
            }

            const eventWithReminder = {
              ...savedEvent,
              notificationId: reminderNotificationId ?? undefined,
            };
            const nextEvents = [
              ...allEvents,
              mapCalendarEventToTimelineEvent(eventWithReminder, allEvents.length),
            ];
            const nextRawEvents = [...rawCalendarEvents, eventWithReminder];
            setAllEvents(nextEvents);
            setRawCalendarEvents(nextRawEvents);
            setLoadedExternalIds((prev) => {
              const nextMap = {
                ...prev,
                [eventWithReminder.id ?? '']: eventWithReminder.externalId ?? eventWithReminder.id ?? '',
              };
              if (reminderNotificationId) {
                nextMap[`notif:${eventWithReminder.id}`] = reminderNotificationId;
              }
              AsyncStorage.setItem(EXTERNAL_ID_MAP_KEY, JSON.stringify(nextMap)).catch(() => { });
              void writeEventCache(nextRawEvents, nextMap, Date.now());
              return nextMap;
            });
            setSelectedDateId(formatLocalDateId(new Date(eventWithReminder.startTime)));
            setIsCreateModalOpen(false);

            void refreshEvents({ force: true, silent: true });
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
            const oldEvent = rawCalendarEvents.find((item) => item.id === eventId);
            const oldType = inferTimelineEventType(oldEvent?.title || '', oldEvent?.isAllDay || false);
            const newType = inferTimelineEventType(updatedEvent.title || '', updatedEvent.isAllDay || false);

            console.log(`[edit-event-start] eventId=${eventId}`);
            console.log(`[edit-event] type change: "${oldType}" → "${newType}"`);
            console.log(`[edit-event] oldEvent:`, oldEvent);
            console.log(`[edit-event] updatedEvent from form:`, updatedEvent);

            const editedEvent = await updateCalendarEvent(eventId, updatedEvent);
            console.log(`[edit-event] API response (editedEvent):`, editedEvent);

            const existingEvent = rawCalendarEvents.find((item) => item.id === eventId);

            let reminderNotificationId: string | null = null;
            try {
              reminderNotificationId = await scheduleEventReminderForEvent(
                {
                  ...updatedEvent,
                  ...editedEvent,
                  id: eventId,
                  notificationId: existingEvent?.notificationId ?? undefined,
                },
                existingEvent?.notificationId ?? undefined,
              );
              console.log(`[edit-event] reminder scheduled:`, reminderNotificationId);
            } catch (notifErr) {
              console.warn('[edit-event] failed to reschedule reminder:', notifErr);
            }

            // Preserve ALL fields from existing event, then apply updates from form, then from API
            const mergedEvent: CalendarSyncRequest = {
              ...existingEvent,  // Base: all original fields
              ...updatedEvent,   // Form: only changed fields
              ...editedEvent,    // API: final authoritative data
              id: eventId,       // Ensure ID is set
              notificationId: reminderNotificationId ?? existingEvent?.notificationId ?? undefined,
            };

            console.log(`[edit-event] merged event:`, mergedEvent);
            console.log(`[edit-event] critical fields for new type "${newType}":`, {
              title: mergedEvent.title,
              description: mergedEvent.description,
              location: mergedEvent.location,
              source: mergedEvent.source,
              isAllDay: mergedEvent.isAllDay,
            });

            const nextRawEvents = rawCalendarEvents.map((item) =>
              item.id === eventId
                ? { ...mergedEvent }  // Create new object reference
                : item,
            );

            console.log(`[edit-event] updated rawCalendarEvents, count:`, nextRawEvents.length);
            setRawCalendarEvents(nextRawEvents);
            rawCalendarEventsRef.current = nextRawEvents;

            // Map to TimelineEvent with logging
            const mappedEvent = mapCalendarEventToTimelineEvent(mergedEvent, 0);
            console.log(`[edit-event] mapped TimelineEvent:`, mappedEvent);
            if (oldType !== newType) {
              console.log(`[edit-event] TYPE CHANGED, old rendering props ≠ new rendering props!`);
            }

            setAllEvents((prev) => {
              const updated = prev.map((item, index) =>
                item.id === eventId
                  ? mappedEvent
                  : item,
              );
              console.log(`[edit-event] allEvents updated, count:`, updated.length);
              return updated;
            });

            const newDateId = formatLocalDateId(
              parseCalendarDate(mergedEvent.startTime) ?? getLocalMidnight(),
            );
            console.log(`[edit-event] updating selectedDateId to:`, newDateId);
            setSelectedDateId(newDateId);

            void writeEventCache(nextRawEvents, loadedExternalIdsRef.current, Date.now());
            void refreshEvents({ force: true, silent: true });
            console.log(`[edit-event-end] edit complete`);

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
        onDelete={async (eventId) => {
          try {
            console.log(`[delete-event] deleting event ${eventId}`);
            await deleteCalendarEvent(eventId);
            console.log(`[delete-event] deleted from server/database`);

            const existingEvent = rawCalendarEvents.find((item) => item.id === eventId);
            await cancelEventReminder(existingEvent?.notificationId ?? loadedExternalIds[`notif:${eventId}`]);
            console.log(`[delete-event] cancelled reminder for ${eventId}`);

            const nextRawEvents = rawCalendarEvents.filter((item) => item.id !== eventId);

            setRawCalendarEvents(nextRawEvents);

            setAllEvents((prev) =>
              prev.filter((item) => item.id !== eventId),
            );

            const next = { ...loadedExternalIds };
            delete next[eventId];
            delete next[`notif:${eventId}`];
            setLoadedExternalIds(next);

            console.log(`[delete-event] invalidating cache for ${eventId}`);
            await invalidateEventCache();
            console.log(`[delete-event] cache invalidated, will refresh on next conflict check`);

            console.log(`[delete-event] refreshing to sync state with server`);
            void refreshEvents({ force: true, silent: true });

            setIsEditModalOpen(false);
            setEditingEventId(null);
          } catch (deleteError: any) {
            console.error('Failed to delete calendar event:', deleteError);
            setError(deleteError?.message || 'Không thể xóa sự kiện.');
            throw deleteError;
          }
        }}
      />
    </TabScreenLayout>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  messageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 180,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
