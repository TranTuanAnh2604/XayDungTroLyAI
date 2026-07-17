import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CalendarSyncRequest } from '../services/sync';

export const EVENTS_CACHE_KEY = '@app:events:cache';
export const EXTERNAL_ID_MAP_KEY = '@app:events:external_id_map';
export const EVENTS_CACHE_TTL_MS = 60_000;

export type PersistedEventCache = {
  events: CalendarSyncRequest[];
  externalIdMap: Record<string, string>;
  lastSyncedAt: number | null;
};

export function getEventCacheKey(event: CalendarSyncRequest): string {
  return event.externalId || event.id || `${event.startTime}-${event.endTime}-${event.title}`;
}

export async function readEventCache(): Promise<PersistedEventCache | null> {
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

export async function writeEventCache(
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

export async function invalidateEventCache(): Promise<void> {
  try {
    console.log('[cache] invalidating event cache after delete');
    await AsyncStorage.removeItem(EVENTS_CACHE_KEY);
    await AsyncStorage.removeItem(EXTERNAL_ID_MAP_KEY);
  } catch (error) {
    console.warn('Failed to invalidate event cache:', error);
  }
}
