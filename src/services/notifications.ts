import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { detectEventType, getReminderOffsetForEventType, type EventType } from '../utils/eventTypeDetection';
import type { CalendarSyncRequest } from './sync';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type ScheduledNotification = {
  id: string; // internal event id
  notificationId: string; // expo notification identifier
};

export type ReminderEventType = EventType;

async function ensureNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Thông báo chính',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7C3AED',
  });
}

export async function initializeNotifications(): Promise<boolean> {
  try {
    await ensureNotificationChannel();

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const granted = await Notifications.requestPermissionsAsync();
      return granted.status === 'granted';
    }
    return true;
  } catch (error) {
    console.warn('Notification permission request failed:', error);
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  return initializeNotifications();
}

export function calculateNotificationDelaySeconds(
  eventStartTime: Date | string | number,
  reminderMinutes: number,
  now: Date = new Date(),
): number | null {
  const startTime = eventStartTime instanceof Date ? eventStartTime : new Date(eventStartTime);
  if (Number.isNaN(startTime.getTime())) {
    return null;
  }

  const notificationTime = new Date(startTime.getTime() - reminderMinutes * 60 * 1000);
  const seconds = (notificationTime.getTime() - now.getTime()) / 1000;

  if (seconds <= 0) {
    return null;
  }

  return Math.floor(seconds);
}

export function getReminderOffset(eventType: string | null | undefined): number {
  const normalizedType = (eventType || '').toLowerCase().trim();
  if (normalizedType === 'urgent' || normalizedType === 'meeting' || normalizedType === 'task' || normalizedType === 'break') {
    return getReminderOffsetForEventType(normalizedType as EventType);
  }
  return getReminderOffsetForEventType('task');
}

function inferReminderEventType(title: string, isAllDay = false): ReminderEventType {
  return detectEventType(title, isAllDay);
}

function buildReminderContent(title: string, reminderMinutes: number) {
  return {
    title: 'Upcoming Event',
    body: `${title || 'Event'} starts in ${reminderMinutes} minutes.`,
  };
}

export async function scheduleEventNotification(
  eventId: string,
  title: string,
  body: string,
  eventStartTime: Date | string | number,
  reminderMinutes = 15,
): Promise<string | null> {
  const delaySeconds = calculateNotificationDelaySeconds(eventStartTime, reminderMinutes);
  if (delaySeconds === null) {
    return null;
  }

  await ensureNotificationChannel();

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { eventId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
      repeats: false,
    },
  });

  return notificationId;
}

export async function scheduleEventReminderForEvent(
  event: Pick<CalendarSyncRequest, 'id' | 'title' | 'startTime' | 'isAllDay' | 'notificationId'>,
  previousNotificationId?: string | null,
): Promise<string | null> {
  if (previousNotificationId) {
    await cancelScheduledNotification(previousNotificationId);
  }

  const reminderMinutes = getReminderOffset(inferReminderEventType(event.title, event.isAllDay));
  const { title, body } = buildReminderContent(event.title || 'Event', reminderMinutes);

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return null;
  }

  return scheduleEventNotification(event.id ?? '', title, body, event.startTime, reminderMinutes);
}

export async function upsertEventReminder(
  eventId: string,
  title: string,
  body: string,
  eventStartTime: Date | string | number,
  reminderMinutes = 15,
  previousNotificationId?: string | null,
): Promise<string | null> {
  if (previousNotificationId) {
    await cancelScheduledNotification(previousNotificationId);
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return null;
  }

  return scheduleEventNotification(eventId, title, body, eventStartTime, reminderMinutes);
}

export async function cancelEventReminder(notificationId?: string | null): Promise<void> {
  if (!notificationId) {
    return;
  }

  await cancelScheduledNotification(notificationId);
}

export async function cancelScheduledNotification(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('Failed to cancel scheduled notification', error);
  }
}
