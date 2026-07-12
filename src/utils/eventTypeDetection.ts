/**
 * Centralized event type detection logic used across the application.
 * This ensures consistent classification of events for both UI display and notifications.
 */

export type EventType = 'urgent' | 'meeting' | 'task' | 'break';

interface EventTypeKeywords {
  urgent: string[];
  meeting: string[];
  break: string[];
  task: string[];
}

/**
 * Comprehensive keyword mapping for event type detection.
 * Keywords are checked in order: urgent -> break -> meeting -> task (default)
 */
const EVENT_TYPE_KEYWORDS: EventTypeKeywords = {
  urgent: [
    // Vietnamese
    'khẩn cấp',
    'khẩn',
    'gấp',
    'đến hạn',
    'báo cáo',
    'quan trọng',
    // English
    'urgent',
    'critical',
    'deadline',
    'report',
    'emergency',
    'asap',
    'important',
  ],
  meeting: [
    // Vietnamese
    'họp',
    'cuộc gọi',
    'online',
    'hội thảo',
    'tham dự',
    'gọi',
    // English
    'meeting',
    'call',
    'zoom',
    'teams',
    'webinar',
    'interview',
    'conference',
    'presentation',
  ],
  break: [
    // Rest/Relax
    'nghỉ',
    'relax',
    'spa',
    // Coffee/Tea breaks
    'coffee',
    'cafe',
    'cà phê',
    'trà',
    'tea',
    // Meal-related (comprehensive)
    'ăn',
    'ăn sáng',
    'ăn trưa',
    'ăn tối',
    'ăn cơm',
    'ăn nhẹ',
    'ăn xế chiều',
    'đi ăn',
    'eat',
    'eating',
    'breakfast',
    'lunch',
    'dinner',
    'meal',
    'food',
    'brunch',
    'snack',
  ],
  task: [],
};

/**
 * Detect event type based on title.
 * Uses flexible keyword matching (case-insensitive).
 * Priority order: urgent > break > meeting > task
 *
 * @param title Event title to classify
 * @param isAllDay Whether the event is an all-day event
 * @returns The detected event type
 *
 * @example
 * detectEventType('ăn sáng') // => 'break'
 * detectEventType('Ăn trưa với khách hàng') // => 'break'
 * detectEventType('Họp dự án') // => 'meeting'
 * detectEventType('Báo cáo gấp') // => 'urgent'
 * detectEventType('Làm hồ sơ') // => 'task'
 */
export function detectEventType(title: string, isAllDay: boolean = false): EventType {
  const normalizedTitle = (title || '').toLowerCase().trim();

  // Check urgent keywords first (highest priority)
  if (EVENT_TYPE_KEYWORDS.urgent.some((keyword) => normalizedTitle.includes(keyword))) {
    return 'urgent';
  }

  // Check break keywords second (includes meals and relaxation)
  if (EVENT_TYPE_KEYWORDS.break.some((keyword) => normalizedTitle.includes(keyword))) {
    return 'break';
  }

  // Check meeting keywords third
  if (EVENT_TYPE_KEYWORDS.meeting.some((keyword) => normalizedTitle.includes(keyword))) {
    return 'meeting';
  }

  // Default to task for all-day events or general tasks
  return 'task';
}

/**
 * Get the reminder offset (in minutes) for a given event type.
 * Used to determine when to send notifications before events.
 *
 * @param eventType The event type
 * @returns Minutes before event to send reminder
 */
export function getReminderOffsetForEventType(eventType: EventType): number {
  const REMINDER_OFFSETS: Record<EventType, number> = {
    urgent: 60,
    meeting: 45,
    task: 30,
    break: 15,
  };
  return REMINDER_OFFSETS[eventType];
}

/**
 * Get all keywords for a specific event type.
 * Useful for debugging or displaying event type information.
 *
 * @param eventType The event type to get keywords for
 * @returns Array of keywords for that event type
 */
export function getKeywordsForEventType(eventType: EventType): string[] {
  return EVENT_TYPE_KEYWORDS[eventType];
}
