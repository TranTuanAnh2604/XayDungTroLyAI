import * as Calendar from 'expo-calendar';
import type { CalendarSyncRequest } from './sync';
import { parseExternalId } from '../utils/calendarUtils';
const DEFAULT_CALENDAR_SYNC_START = new Date('2026-01-01');
const DEFAULT_CALENDAR_SYNC_END = new Date('2027-01-01');

export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function fetchDeviceCalendarEvents(
  startDate = DEFAULT_CALENDAR_SYNC_START,
  endDate = DEFAULT_CALENDAR_SYNC_END,
): Promise<CalendarSyncRequest[]> {
  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT,
  );

  const visibleCalendars = calendars.filter(
    (calendar) =>
      calendar.isVisible &&
      (calendar.accessLevel === 'owner' ||
        calendar.allowsModifications === true),
  );

  const eventRequests = visibleCalendars.map((calendar) =>
    fetchCalendarEventsForCalendar(calendar, startDate, endDate),
  );

  const eventArrays = await Promise.all(eventRequests);
  return eventArrays.flat();
}

async function fetchCalendarEventsForCalendar(
  calendar: Calendar.Calendar,
  startDate: Date,
  endDate: Date,
): Promise<CalendarSyncRequest[]> {
  try {
    const events = await Calendar.getEventsAsync(
      [calendar.id],
      startDate,
      endDate,
    );

    return events.map((event) => ({
      title: event.title ?? '',
      description: event.notes ?? '',
      startTime: new Date(event.startDate).toISOString(),
      endTime: new Date(event.endDate).toISOString(),
      location: event.location ?? '',
      source: calendar.source?.name ?? 'device',
      externalId: `${calendar.id}_${event.id}`,
      fingerprint: `${(event.title ?? '').trim()}_${new Date(
        event.startDate,
      ).toISOString()}_${new Date(event.endDate).toISOString()}_${(
        event.location ?? ''
      ).trim()}`,
      isAllDay: event.allDay ?? false,
    }));
  } catch (error) {
    console.log(
      `Failed to read calendar events for ${calendar.title}:`,
      error,
    );
    return [];
  }
}


export async function createDeviceCalendarEvent(
  event: CalendarSyncRequest,
): Promise<string> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Chưa được cấp quyền truy cập Calendar trên thiết bị.');
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writableCalendar = calendars.find(
    (calendar) =>
      calendar.allowsModifications === true ||
      calendar.accessLevel === 'owner',
  ) ?? calendars[0];

  if (!writableCalendar) {
    throw new Error('Không tìm thấy lịch phù hợp để thêm sự kiện.');
  }

  const eventId = await Calendar.createEventAsync(writableCalendar.id, {
    title: event.title,
    notes: event.description,
    startDate: new Date(event.startTime),
    endDate: new Date(event.endTime),
    location: event.location,
    allDay: event.isAllDay,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  return `${writableCalendar.id}_${eventId}`;
}


export async function updateDeviceCalendarEvent(
  externalId: string,
  event: CalendarSyncRequest,
): Promise<void> {
  const { eventId } = parseExternalId(externalId);
  if (!eventId) {
    throw new Error('External ID không hợp lệ để cập nhật sự kiện trên thiết bị.');
  }

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Chưa được cấp quyền truy cập Calendar trên thiết bị.');
  }

  await Calendar.updateEventAsync(eventId, {
    title: event.title,
    notes: event.description,
    startDate: new Date(event.startTime),
    endDate: new Date(event.endTime),
    location: event.location,
    allDay: event.isAllDay,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}


export async function deleteDeviceCalendarEvent(
  externalId: string,
  instanceStartDate?: Date
) {
  const { eventId } = parseExternalId(externalId);
  if (!eventId) return;

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Chưa được cấp quyền truy cập Calendar trên thiết bị.');
  }

  try {
    await Calendar.deleteEventAsync(
      eventId,
      instanceStartDate ? { instanceStartDate } : {}
    );
    console.log('Deleted device event:', eventId);
  } catch (error) {
    console.error('Delete failed:', error);
    throw error;
  }
}