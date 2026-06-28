import { apiPost } from './api';
import { apiGet, apiPut } from './api';

let hasSyncedDeviceDataThisSession = false;

export function shouldSyncDeviceDataThisSession(): boolean {
  return !hasSyncedDeviceDataThisSession;
}

export function markDeviceDataSyncedThisSession(): void {
  hasSyncedDeviceDataThisSession = true;
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

export async function fetchCalendarEvents(
  from?: string,
  to?: string,
): Promise<CalendarSyncRequest[]> {
  const query = new URLSearchParams();
  if (from) query.set('from', from);
  if (to) query.set('to', to);

  const path = `/api/Calendar/events${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiGet<
    CalendarSyncRequest[] |
    { events: CalendarSyncRequest[] } |
    { data: CalendarSyncRequest[] } |
    { data: { events: CalendarSyncRequest[] } }
  >(path);

  if (Array.isArray(response)) {
    return response;
  }

  if (response && 'events' in response && Array.isArray(response.events)) {
    return response.events;
  }

  if (response && 'data' in response) {
    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (
      response.data &&
      typeof response.data === 'object' &&
      'events' in response.data &&
      Array.isArray(response.data.events)
    ) {
      return response.data.events;
    }
  }

  return [];
}

export async function createCalendarEvent(
  event: CalendarSyncRequest,
): Promise<CalendarSyncRequest> {
  const response = await apiPost<
    | CalendarSyncRequest
    | { data: CalendarSyncRequest }
    | { data: { event: CalendarSyncRequest } }
  >('/api/Calendar/events', event);

  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    response.data &&
    typeof response.data === 'object'
  ) {
    if ('event' in response.data && response.data.event) {
      return response.data.event;
    }

    return response.data as CalendarSyncRequest;
  }

  return response as CalendarSyncRequest;
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
      return response.data.event;
    }

    return response.data as CalendarSyncRequest;
  }

  return response as CalendarSyncRequest;
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

