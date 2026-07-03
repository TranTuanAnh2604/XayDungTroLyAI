import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, apiGet, apiPut, apiDelete } from './api';

let hasSyncedDeviceDataThisSession = false;
const PENDING_SERVER_SYNC_EVENTS_KEY = '@app:events:pending_server_sync';

export function shouldSyncDeviceDataThisSession(): boolean {
  return !hasSyncedDeviceDataThisSession;
}

export function markDeviceDataSyncedThisSession(): void {
  hasSyncedDeviceDataThisSession = true;
}

export async function markCalendarEventPendingServerSync(externalId: string): Promise<void> {
  if (!externalId) {
    return;
  }

  try {
    const raw = await AsyncStorage.getItem(PENDING_SERVER_SYNC_EVENTS_KEY);
    const existingIds: string[] = raw ? JSON.parse(raw) : [];
    if (!existingIds.includes(externalId)) {
      existingIds.push(externalId);
      await AsyncStorage.setItem(PENDING_SERVER_SYNC_EVENTS_KEY, JSON.stringify(existingIds));
    }
  } catch (error) {
    console.warn('Failed to remember pending server sync event:', error);
  }
}

export async function consumePendingServerSyncEvents(
  events: CalendarSyncRequest[],
): Promise<CalendarSyncRequest[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_SERVER_SYNC_EVENTS_KEY);
    if (!raw) {
      return events;
    }

    const pendingExternalIds: string[] = JSON.parse(raw) || [];
    if (pendingExternalIds.length === 0) {
      return events;
    }

    const filteredEvents = events.filter(
      (event) => !pendingExternalIds.includes(event.externalId),
    );

    if (filteredEvents.length !== events.length) {
      await AsyncStorage.removeItem(PENDING_SERVER_SYNC_EVENTS_KEY);
    }

    return filteredEvents;
  } catch (error) {
    console.warn('Failed to consume pending server sync events:', error);
    return events;
  }
}

export type ContactSyncRequest = {
  name: string;
  phone: string;
  fingerprint?: string;
};

export type ContactSyncResponse = {
  success?: boolean;
  message?: string;
};

export type CalendarSyncRequest = {
  id?: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  source: string;
  externalId: string;
  isAllDay: boolean;
  notificationId?: string | null;
  fingerprint?: string;
};

export type CalendarSyncResponse = {
  success?: boolean;
  message?: string;
};

export type CalendarConflict = {
  id: string;
  title: string;
  deviceEvent: {
    title: string;
    startTime: string;
    endTime: string;
    location: string;
  };
  serverEvent: {
    title: string;
    startTime: string;
    endTime: string;
    location: string;
  };
};

export type ResolveConflictRequest = {
  resolution: 'keep_device' | 'keep_server' | 'merge';
};

export async function syncContacts(
  contacts: ContactSyncRequest[],
): Promise<ContactSyncResponse> {
  const response = await apiPost<ContactSyncResponse>(
    '/api/Contacts/sync',
    contacts,
  );

  return {
    success: response.success ?? true,
    message: response.message,
  };
}

export async function syncCalendars(
  data: CalendarSyncRequest[],
): Promise<CalendarSyncResponse> {
  const response = await apiPost<CalendarSyncResponse>(
    '/api/Calendar/sync',
    data,
  );

  return {
    success: response.success ?? true,
    message: response.message,
  };
}

function normalizeCalendarEvent(raw: any): CalendarSyncRequest {
  return {
    ...raw,
    externalId: raw.externalId ?? raw.external_id,
  };
}

export async function fetchCalendarEvents(
  from?: string,
  to?: string,
): Promise<CalendarSyncRequest[]> {
  const query = new URLSearchParams();
  if (from) query.set('from', from);
  if (to) query.set('to', to);

  const path = `/api/Calendar/events${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiGet<any>(path);

  let events: any[] = [];

  if (Array.isArray(response)) {
    events = response;
  } else if (response && 'events' in response && Array.isArray(response.events)) {
    events = response.events;
  } else if (response && 'data' in response) {
    if (Array.isArray(response.data)) {
      events = response.data;
    } else if (
      response.data &&
      typeof response.data === 'object' &&
      'events' in response.data &&
      Array.isArray(response.data.events)
    ) {
      events = response.data.events;
    }
  }

  return events.map(normalizeCalendarEvent);
}

export async function createCalendarEvent(
  event: CalendarSyncRequest,
): Promise<CalendarSyncRequest> {
  const response = await apiPost<any>('/api/Calendar/events', event);

  if (response && typeof response === 'object' && 'data' in response && response.data) {
    if ('event' in response.data && response.data.event) {
      return normalizeCalendarEvent(response.data.event);
    }
    return normalizeCalendarEvent(response.data);
  }

  return normalizeCalendarEvent(response);
}

export async function updateCalendarEvent(
  eventId: string,
  event: CalendarSyncRequest,
): Promise<CalendarSyncRequest> {
  const response = await apiPut<
    | CalendarSyncRequest
    | { data: CalendarSyncRequest }
    | { data: { event: CalendarSyncRequest } }
  >(`/api/Calendar/events/${eventId}`, event);

  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    response.data &&
    typeof response.data === 'object'
  ) {
    if ('event' in response.data && response.data.event) {
      return normalizeCalendarEvent(response.data.event);
    }

    return normalizeCalendarEvent(response.data);
  }

  return normalizeCalendarEvent(response);
}

export async function getCalendarConflicts(): Promise<
  CalendarConflict[]
> {
  try {
    const response = await apiGet<{ conflicts: CalendarConflict[] }>(
      '/api/Calendar/conflicts',
    );
    return response.conflicts || [];
  } catch (error) {
    console.error('Failed to fetch calendar conflicts:', error);
    return [];
  }
}

export async function resolveCalendarConflict(
  conflictId: string,
  resolution: 'keep_device' | 'keep_server' | 'merge',
): Promise<void> {
  await apiPut('/api/Calendar/conflicts/' + conflictId + '/resolve', {
    resolution,
  });
}

export async function deleteCalendarEvent(
  eventId: string,
): Promise<void> {
  await apiDelete<{
    success?: boolean;
    message?: string;
  }>(`/api/Calendar/events/${eventId}`);
}

export async function syncCalendarsAndResolveConflicts(
  data: CalendarSyncRequest[],
): Promise<CalendarSyncResponse> {
  // First sync the calendars
  const syncResponse = await syncCalendars(data);

  // Then fetch any conflicts that were created
  const conflicts = await getCalendarConflicts();

  // Auto-resolve conflicts by keeping device version
  // (can be customized later to use AI suggestion or user choice)
  for (const conflict of conflicts) {
    try {
      await resolveCalendarConflict(conflict.id, 'keep_device');
    } catch (error) {
      console.error('Failed to resolve conflict:', conflict.id, error);
    }
  }

  return syncResponse;
}

