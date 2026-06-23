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

