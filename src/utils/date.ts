export function normalizeDateValue(value: Date | number | string | undefined | null): Date | null {
  if (value == null) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function mergeDateAndTime(dateValue: Date, timeValue: Date): Date {
  const merged = new Date(dateValue.getTime());
  merged.setHours(timeValue.getHours(), timeValue.getMinutes(), timeValue.getSeconds(), timeValue.getMilliseconds());
  return merged;
}

export function formatDisplayDateValue(value: Date | null): string {
  return value ? value.toLocaleString('vi-VN') : '';
}

export function safeISOString(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  try {
    return date.toISOString();
  } catch {
    return null;
  }
}
