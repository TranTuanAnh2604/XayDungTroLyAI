export function parseExternalId(externalId: string) {
  const idx = (externalId || '').lastIndexOf('_');
  if (idx === -1) return { calendarId: null, eventId: externalId || null };
  return {
    calendarId: externalId.slice(0, idx),
    eventId: externalId.slice(idx + 1),
  };
}

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function getLocalMidnight(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatLocalDateId(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseCalendarDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildCalendarDates(referenceDate: Date) {
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