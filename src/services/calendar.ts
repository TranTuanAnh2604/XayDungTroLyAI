import * as Calendar from 'expo-calendar';
import type { CalendarSyncRequest } from './sync';

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
