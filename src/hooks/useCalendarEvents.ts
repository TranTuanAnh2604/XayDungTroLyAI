import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppState, DeviceEventEmitter, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvents,
  updateCalendarEvent,
} from '../services/sync';
import {
  cancelEventReminder,
  scheduleEventReminderForEvent,
} from '../services/notifications';
import { detectEventType } from '../utils/eventTypeDetection';
import type { CalendarSyncRequest } from '../services/sync';
import type { CalendarDateItem, TimelineEvent } from '../types/events';

import {
  getLocalMidnight,
  formatLocalDateId,
  parseCalendarDate,
  buildCalendarDates,
} from '../utils/calendarUtils';
import {
  readEventCache,
  writeEventCache,
  invalidateEventCache,
  EVENTS_CACHE_TTL_MS,
  EXTERNAL_ID_MAP_KEY,
} from '../utils/eventCache';

function inferTimelineEventType(title: string, isAllDay: boolean): TimelineEvent['type'] {
  return detectEventType(title, isAllDay);
}

export function useCalendarEvents() {
  const isFocused = useIsFocused();
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
  const [conflictEvent, setConflictEvent] = useState<CalendarSyncRequest | null>(null);
  const [serverConflictId, setServerConflictId] = useState<string | null>(null);
  const [conflictingEvents, setConflictingEvents] = useState<CalendarSyncRequest[]>([]);
  const [ignoredConflicts, setIgnoredConflicts] = useState<Set<string>>(new Set());
  const ignoredConflictsRef = useRef<Set<string>>(new Set());
  const [hasLoadedIgnoredConflicts, setHasLoadedIgnoredConflicts] = useState(false);
  const shownConflictsRef = useRef<Set<string>>(new Set());

  const events = useMemo(
    () => allEvents.filter((event) => event.date === selectedDateId),
    [allEvents, selectedDateId],
  );

  const importantDates = useMemo(() => {
    const counts: Record<string, number> = {};
    allEvents.forEach(e => {
      if (e.type === 'urgent' && e.date) {
        counts[e.date] = (counts[e.date] || 0) + 1;
      }
    });
    const result = new Set<string>();
    Object.entries(counts).forEach(([date, count]) => {
      if (count >= 1) result.add(date);
    });
    return result;
  }, [allEvents]);

  const editingEvent = useMemo(() => {
    if (!editingEventId) return null;
    return rawCalendarEvents.find((event) => event.id === editingEventId) ?? null;
  }, [editingEventId, rawCalendarEvents]);

  useEffect(() => {
    rawCalendarEventsRef.current = rawCalendarEvents;
  }, [rawCalendarEvents]);

  useEffect(() => {
    AsyncStorage.getItem('@app:events:ignored_conflicts').then(val => {
      if (val) {
        try {
          const parsed = new Set<string>(JSON.parse(val));
          setIgnoredConflicts(parsed);
          ignoredConflictsRef.current = parsed;
        } catch (e) { }
      }
      setHasLoadedIgnoredConflicts(true);
    });
  }, []);

  useEffect(() => {
    loadedExternalIdsRef.current = loadedExternalIds;
  }, [loadedExternalIds]);

  useEffect(() => {
    hasInitialDataRef.current = hasInitialData;
  }, [hasInitialData]);

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
    const id = event.id ?? `${dateString}-${time}-${index}`;
    const inferredType = inferTimelineEventType(event.title || 'Sự kiện', event.isAllDay);

    if (inferredType === 'urgent') {
      return {
        id, date: dateString, type: 'urgent', time, title: event.title || 'Sự kiện',
        description: event.description || event.location || 'Không có mô tả',
        badge: 'Quan trọng', avatars: [],
        expandedDetail: event.location && event.location.length > 0 ? `Địa điểm: ${event.location}` : `Nguồn: ${event.source}`,
      };
    }

    if (inferredType === 'meeting') {
      return {
        id, date: dateString, type: 'meeting', time, title: event.title || 'Sự kiện',
        description: event.description || event.location || 'Không có mô tả',
        badge: event.source || 'Lịch', joinLabel: 'Xem chi tiết',
        expandedDetail: event.location && event.location.length > 0 ? `Địa điểm: ${event.location}` : `Nguồn: ${event.source}`,
      };
    }

    if (inferredType === 'break') {
      return { id, date: dateString, type: 'break', time, title: event.title || 'Sự kiện' };
    }

    return {
      id, date: dateString, type: 'task', time, title: event.title || 'Sự kiện', tags: [],
      expandedDetail: event.location && event.location.length > 0 ? `Địa điểm: ${event.location}` : `Nguồn: ${event.source}`,
    };
  };

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
      const sourceList = calendarEvents;
      
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
        await refreshEvents({ force: true });
      }
    }
    initializeEvents();
    return () => { isMounted = false; };
  }, [refreshEvents]);

  useEffect(() => {
    const updateDateState = () => {
      const newTodayId = formatLocalDateId(getLocalMidnight());
      if (newTodayId === todayId) return;
      const newCalendarDates = buildCalendarDates(getLocalMidnight());
      setTodayId(newTodayId);
      setCalendarDates(newCalendarDates);
      setSelectedDateId((prevSelected) =>
        prevSelected === todayId || !newCalendarDates.some((dateItem) => dateItem.id === prevSelected)
          ? newTodayId
          : prevSelected,
      );
    };

    const scheduleMidnightRefresh = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
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
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [refreshEvents, todayId]);

  useEffect(() => {
    if (isFocused && hasInitialDataRef.current) {
      void refreshEvents({ force: true, silent: true });
    }
  }, [isFocused, refreshEvents]);

  const findEventConflicts = useCallback((
    candidate: CalendarSyncRequest,
    sourceEvents: CalendarSyncRequest[] = rawCalendarEvents,
  ): CalendarSyncRequest[] => {
    if (candidate.isAllDay) return [];

    const candidateStart = parseCalendarDate(candidate.startTime)?.getTime();
    const candidateEnd = parseCalendarDate(candidate.endTime)?.getTime();

    if (!candidateStart || !candidateEnd) return [];

    return sourceEvents.filter((existing) => {
      if (existing.isAllDay) return false;
      if (existing.id === candidate.id) return false;
      
      const candidateId = candidate.id || candidate.externalId || candidate.title || '';
      const existingId = existing.id || existing.externalId || existing.title || '';
      if (candidateId && existingId) {
        const conflictKey = [String(candidateId), String(existingId)].sort().join('_');
        if (ignoredConflictsRef.current.has(conflictKey)) return false;
      }
      
      const existingStart = parseCalendarDate(existing.startTime)?.getTime();
      const existingEnd = parseCalendarDate(existing.endTime)?.getTime();
      if (!existingStart || !existingEnd) return false;
      
      return candidateStart < existingEnd && candidateEnd > existingStart;
    });
  }, [rawCalendarEvents]);

  const getLatestConflictCheckData = useCallback(async () => {
    const serverEvents = await refreshEvents({ force: true, silent: true });
    const sourceEvents = Array.isArray(serverEvents) ? serverEvents : rawCalendarEvents;
    let serverConflicts: any[] = [];
    try {
      const { getCalendarConflicts } = require('../services/sync');
      serverConflicts = await getCalendarConflicts();
    } catch (err) {
      console.warn('[conflict-detect] failed to fetch server conflicts', err);
    }
    return { sourceEvents, serverConflicts };
  }, [refreshEvents, rawCalendarEvents]);

  useEffect(() => {
    if (!hasLoadedIgnoredConflicts || loading || rawCalendarEvents.length < 2) return;
    const selectedDateStart = new Date(selectedDateId);
    selectedDateStart.setHours(0, 0, 0, 0);
    const selectedDateEnd = new Date(selectedDateId);
    selectedDateEnd.setHours(23, 59, 59, 999);
    const sDate = selectedDateStart.getTime();
    const eDate = selectedDateEnd.getTime();

    const eventsForSelectedDate = rawCalendarEvents.filter((e) => {
      const start = parseCalendarDate(e.startTime)?.getTime() || 0;
      const end = parseCalendarDate(e.endTime)?.getTime() || 0;
      return start <= eDate && end >= sDate;
    });

    let foundConflict: CalendarSyncRequest | null = null;
    let foundOverlaps: CalendarSyncRequest[] = [];

    for (let i = 0; i < eventsForSelectedDate.length; i++) {
      const e1 = eventsForSelectedDate[i];
      const overlaps = findEventConflicts(e1, eventsForSelectedDate);
      if (overlaps.length > 0) {
        const conflictId = e1.id || e1.externalId || e1.title;
        if (conflictId && !shownConflictsRef.current.has(conflictId)) {
          foundConflict = e1;
          foundOverlaps = overlaps;
          shownConflictsRef.current.add(conflictId);
          overlaps.forEach(o => {
            const oId = o.id || o.externalId || o.title;
            if (oId) shownConflictsRef.current.add(oId);
          });
          break;
        }
      }
    }

    if (foundConflict) {
      setConflictEvent(foundConflict);
      setConflictingEvents(foundOverlaps);
      setServerConflictId(null);
    }
  }, [rawCalendarEvents, loading, selectedDateId, findEventConflicts, hasLoadedIgnoredConflicts]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('events_changed', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      shownConflictsRef.current.clear();
      const { sourceEvents, serverConflicts } = await getLatestConflictCheckData();
      for (const event of sourceEvents) {
        const conflicts = findEventConflicts(event, sourceEvents);
        if (conflicts.length > 0) {
          const cId = event.id || event.externalId || event.title;
          if (cId && !shownConflictsRef.current.has(cId)) {
            setConflictEvent(event);
            setConflictingEvents(conflicts);
            shownConflictsRef.current.add(cId);
            conflicts.forEach((o) => {
              const oId = o.id || o.externalId || o.title;
              if (oId) shownConflictsRef.current.add(oId);
            });
            const eid = event.id;
            const matchingConflict = serverConflicts.find((c: any) =>
              c.eventId === eid || c.EventId === eid || c.conflictingEventId === eid || c.title === event.title
            );
            setServerConflictId(matchingConflict ? (matchingConflict.id || matchingConflict.Id) : null);
            break;
          }
        }
      }
    });
    return () => subscription.remove();
  }, [getLatestConflictCheckData, findEventConflicts]);

  const applyAiSuggestion = async (suggestion: any) => {
    const targetEventId = suggestion.eventId || (conflictEvent ? conflictEvent.id : null);
    if (!targetEventId) return;

    let targetEvent = conflictEvent?.id === targetEventId ? conflictEvent : conflictingEvents.find(e => e.id === targetEventId);
    if (!targetEvent) targetEvent = rawCalendarEvents.find((e: any) => e.id === targetEventId);

    if (!targetEvent) {
      Alert.alert('Lỗi', 'Không tìm thấy sự kiện cần dời.');
      return;
    }

    try {
      const updatedEvent = {
        ...targetEvent,
        startTime: suggestion.newStart || suggestion.suggestedStartTime || suggestion.newStartTime || targetEvent.startTime,
        endTime: suggestion.newEnd || suggestion.suggestedEndTime || suggestion.newEndTime || targetEvent.endTime,
      };

      await updateCalendarEvent(targetEventId, updatedEvent);
      if (targetEvent.source === 'device' && targetEvent.externalId) {
        try {
          const { updateDeviceCalendarEvent } = require('../services/calendar');
          await updateDeviceCalendarEvent(targetEvent.externalId, updatedEvent);
        } catch (e) { }
      }
      await refreshEvents({ force: true, silent: true });
      setConflictEvent(null);
      setConflictingEvents([]);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể áp dụng gợi ý. Vui lòng thử lại.');
    }
  };

  const handleDismissConflict = () => {
    if (conflictEvent && conflictingEvents.length > 0) {
      const newIgnored = new Set(ignoredConflictsRef.current);
      const e1Id = conflictEvent.id || conflictEvent.externalId || conflictEvent.title || '';
      conflictingEvents.forEach(e2 => {
        const e2Id = e2.id || e2.externalId || e2.title || '';
        if (e1Id && e2Id) {
          const key = [String(e1Id), String(e2Id)].sort().join('_');
          newIgnored.add(key);
        }
      });
      setIgnoredConflicts(newIgnored);
      ignoredConflictsRef.current = newIgnored;
      AsyncStorage.setItem('@app:events:ignored_conflicts', JSON.stringify(Array.from(newIgnored))).catch(() => { });
    }
    setConflictEvent(null);
    setConflictingEvents([]);
    setServerConflictId(null);
  };

  const handleCreateEvent = async (event: CalendarSyncRequest) => {
    const candidateStart = parseCalendarDate(event.startTime)?.getTime();
    const candidateEnd = parseCalendarDate(event.endTime)?.getTime();
    if (candidateStart && candidateEnd) {
      const strictConflicts = findEventConflicts(event, rawCalendarEvents);
      if (strictConflicts.length > 0) {
        const conflict = strictConflicts[0];
        const start = parseCalendarDate(conflict.startTime);
        const end = parseCalendarDate(conflict.endTime);
        const startLabel = start ? start.toLocaleString('vi-VN') : 'Không xác định';
        const endLabel = end ? end.toLocaleString('vi-VN') : 'Không xác định';
        throw new Error(`Thời gian sự kiện bị trùng với sự kiện "${conflict.title || 'Không tên'}"\n(${startLabel} — ${endLabel}).`);
      }
    }

    const optimisticId = `opt-${Date.now()}`;
    const optimisticEvent: CalendarSyncRequest = { ...event, id: optimisticId, source: event.source || 'app' };
    const optimisticTimelineEvent = mapCalendarEventToTimelineEvent(optimisticEvent, allEvents.length);
    setRawCalendarEvents(prev => [...prev, optimisticEvent]);
    setAllEvents(prev => [...prev, optimisticTimelineEvent]);
    setSelectedDateId(formatLocalDateId(new Date(event.startTime)));
    setIsCreateModalOpen(false);

    try {
      const createdEvent = await createCalendarEvent(event);
      const savedEvent = { ...createdEvent, source: event.source || 'app' };
      
      let reminderNotificationId: string | null = null;
      try {
        reminderNotificationId = await scheduleEventReminderForEvent({ ...savedEvent, notificationId: undefined });
      } catch (notifErr) { }

      const eventWithReminder = { ...savedEvent, notificationId: reminderNotificationId ?? undefined };
      const nextEvents = [
        ...allEvents.filter(e => e.id !== optimisticId),
        mapCalendarEventToTimelineEvent(eventWithReminder, allEvents.length),
      ];
      const nextRawEvents = [...rawCalendarEvents.filter(e => e.id !== optimisticId), eventWithReminder];
      
      setAllEvents(nextEvents);
      setRawCalendarEvents(nextRawEvents);
      rawCalendarEventsRef.current = nextRawEvents;
      
      setLoadedExternalIds((prev) => {
        const nextMap = { ...prev, [eventWithReminder.id ?? '']: eventWithReminder.externalId ?? eventWithReminder.id ?? '' };
        if (reminderNotificationId) nextMap[`notif:${eventWithReminder.id}`] = reminderNotificationId;
        AsyncStorage.setItem(EXTERNAL_ID_MAP_KEY, JSON.stringify(nextMap)).catch(() => { });
        void writeEventCache(nextRawEvents, nextMap, Date.now());
        return nextMap;
      });

      const { sourceEvents, serverConflicts } = await getLatestConflictCheckData();
      const conflicts = findEventConflicts(eventWithReminder, sourceEvents);
      if (conflicts.length > 0) {
        setConflictEvent(eventWithReminder);
        setConflictingEvents(conflicts);
        const eid = eventWithReminder.id;
        const matchingConflict = serverConflicts.find((c: any) => c.eventId === eid || c.EventId === eid || c.conflictingEventId === eid);
        setServerConflictId(matchingConflict ? (matchingConflict.id || matchingConflict.Id) : null);
      }
      DeviceEventEmitter.emit('events_changed');
    } catch (createError: any) {
      setRawCalendarEvents(prev => prev.filter(e => e.id !== optimisticId));
      setAllEvents(prev => prev.filter(e => e.id !== optimisticId));
      setError(createError?.message || 'Không thể tạo sự kiện.');
    }
  };

  const handleEditEvent = async (eventId: string, updatedEvent: CalendarSyncRequest) => {
    try {
      const oldEvent = rawCalendarEvents.find((item) => item.id === eventId);
      const candidateStart = parseCalendarDate(updatedEvent.startTime)?.getTime();
      const candidateEnd = parseCalendarDate(updatedEvent.endTime)?.getTime();
      if (candidateStart && candidateEnd) {
        const strictConflicts = findEventConflicts(updatedEvent as CalendarSyncRequest, rawCalendarEvents);
        if (strictConflicts.length > 0) {
          const conflict = strictConflicts[0];
          const start = parseCalendarDate(conflict.startTime);
          const end = parseCalendarDate(conflict.endTime);
          throw new Error(`Thời gian cập nhật bị trùng với sự kiện "${conflict.title || 'Không tên'}"\n(${start?.toLocaleString('vi-VN')} — ${end?.toLocaleString('vi-VN')}).`);
        }
      }

      const optimisticMergedEvent: CalendarSyncRequest = { ...(oldEvent as any), ...updatedEvent, id: eventId };
      const optimisticMappedEvent = mapCalendarEventToTimelineEvent(optimisticMergedEvent, 0);

      const optRawEvents = rawCalendarEvents.map((item) => item.id === eventId ? optimisticMergedEvent : item);
      setRawCalendarEvents(optRawEvents);
      rawCalendarEventsRef.current = optRawEvents;
      setAllEvents((prev) => prev.map((item) => (item.id === eventId ? optimisticMappedEvent : item)));
      setSelectedDateId(formatLocalDateId(parseCalendarDate(optimisticMergedEvent.startTime) ?? getLocalMidnight()));
      setIsEditModalOpen(false);
      setEditingEventId(null);

      try {
        const editedEvent = await updateCalendarEvent(eventId, updatedEvent);
        const existingEvent = rawCalendarEvents.find((item) => item.id === eventId);
        let reminderNotificationId: string | null = null;
        try {
          reminderNotificationId = await scheduleEventReminderForEvent(
            { ...updatedEvent, ...editedEvent, id: eventId, notificationId: existingEvent?.notificationId ?? undefined },
            existingEvent?.notificationId ?? undefined,
          );
        } catch (notifErr) { }

        const finalMergedEvent: CalendarSyncRequest = {
          ...optimisticMergedEvent, ...editedEvent,
          notificationId: reminderNotificationId ?? existingEvent?.notificationId ?? undefined,
        };

        const finalRawEvents = rawCalendarEventsRef.current.map((item) => item.id === eventId ? finalMergedEvent : item);
        setRawCalendarEvents(finalRawEvents);
        rawCalendarEventsRef.current = finalRawEvents;
        const finalMappedEvent = mapCalendarEventToTimelineEvent(finalMergedEvent, 0);
        setAllEvents((prev) => prev.map((item) => (item.id === eventId ? finalMappedEvent : item)));
        void writeEventCache(finalRawEvents, loadedExternalIdsRef.current, Date.now());

        const { sourceEvents, serverConflicts } = await getLatestConflictCheckData();
        const conflicts = findEventConflicts(finalMergedEvent, sourceEvents);
        if (conflicts.length > 0) {
          setConflictEvent(finalMergedEvent);
          setConflictingEvents(conflicts);
          const eid = finalMergedEvent.id;
          const matchingConflict = serverConflicts.find((c: any) => c.eventId === eid || c.EventId === eid || c.conflictingEventId === eid);
          setServerConflictId(matchingConflict ? (matchingConflict.id || matchingConflict.Id) : null);
        }
        DeviceEventEmitter.emit('events_changed');
      } catch (editError: any) {
        setRawCalendarEvents(rawCalendarEvents);
        rawCalendarEventsRef.current = rawCalendarEvents;
        if (oldEvent) {
          const oldMappedEvent = mapCalendarEventToTimelineEvent(oldEvent, 0);
          setAllEvents(prev => prev.map(item => item.id === eventId ? oldMappedEvent : item));
        }
        setError(editError?.message || 'Không thể cập nhật sự kiện.');
      }
    } catch (e: any) {
      setError(e?.message || 'Đã xảy ra lỗi.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const existingEvent = rawCalendarEvents.find((item) => item.id === eventId);
      const nextRawEvents = rawCalendarEvents.filter((item) => item.id !== eventId);
      setRawCalendarEvents(nextRawEvents);
      rawCalendarEventsRef.current = nextRawEvents;
      setAllEvents((prev) => prev.filter((item) => item.id !== eventId));
      setIsEditModalOpen(false);
      setEditingEventId(null);

      // Xóa Event: Nếu Event được tạo từ Task thì Task vẫn giữ nguyên.
      // Vì Backend tự động map Task sang Event (Event ID = Task ID), 
      // nếu gọi deleteCalendarEvent thì Backend sẽ xóa luôn Task.
      // Do đó, để xóa khỏi Calendar nhưng giữ lại Task, ta gỡ bỏ dueDate.
      if (existingEvent?.source === 'task' || existingEvent?.source === 'todo') {
        const { tasksApi } = require('../services/task');
        if (existingEvent.source === 'task') {
          await tasksApi.updateTask(eventId, { dueDate: null as any }, true);
        } else {
          await tasksApi.updateTodo(eventId, { dueDate: null as any }, true);
        }
      } else {
        await deleteCalendarEvent(eventId, false, existingEvent);
      }

      await cancelEventReminder(existingEvent?.notificationId ?? loadedExternalIds[`notif:${eventId}`]);

      const next = { ...loadedExternalIds };
      delete next[eventId];
      delete next[`notif:${eventId}`];
      setLoadedExternalIds(next);

      await invalidateEventCache();
      void refreshEvents({ force: true, silent: true });
      DeviceEventEmitter.emit('events_changed');
    } catch (deleteError: any) {
      setError(deleteError?.message || 'Không thể xóa sự kiện.');
      throw deleteError;
    }
  };

  return {
    selectedDateId,
    setSelectedDateId,
    importantDates,
    events,
    loading,
    error,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editingEventId,
    setEditingEventId,
    editingEvent,
    conflictEvent,
    setConflictEvent,
    conflictingEvents,
    setConflictingEvents,
    serverConflictId,
    setServerConflictId,
    handleCreateEvent,
    handleEditEvent,
    handleDeleteEvent,
    handleDismissConflict,
    applyAiSuggestion,
  };
}
