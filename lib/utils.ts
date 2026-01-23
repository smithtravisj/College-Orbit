export type TimeFormat = '12h' | '24h';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY';

export function formatDate(date: Date | string, dateFormat: DateFormat = 'MM/DD/YYYY'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (dateFormat === 'DD/MM/YYYY') {
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function formatTime(date: Date | string, timeFormat: TimeFormat = '12h'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (timeFormat === '24h') {
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(date: Date | string, dateFormat: DateFormat = 'MM/DD/YYYY', timeFormat: TimeFormat = '12h'): string {
  return `${formatDate(date, dateFormat)} ${formatTime(date, timeFormat)}`;
}

// Format a time string like "14:30" to the user's preferred format
export function formatTimeString(time: string, timeFormat: TimeFormat = '12h'): string {
  const [hours, minutes] = time.split(':').map(Number);

  if (timeFormat === '24h') {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

// Format a date string like "2024-01-19" to the user's preferred format
export function formatDateString(dateStr: string, dateFormat: DateFormat = 'MM/DD/YYYY'): string {
  const d = new Date(dateStr + 'T00:00:00');
  return formatDate(d, dateFormat);
}

// Format date as numeric (01/19/2024 or 19/01/2024)
export function formatDateNumeric(date: Date | string, dateFormat: DateFormat = 'MM/DD/YYYY'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (dateFormat === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`;
  }
  return `${month}/${day}/${year}`;
}

export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function isTomorrow(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear()
  );
}

// Get the number of days from today (0 = today, 1 = tomorrow, etc.)
export function getDaysFromToday(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  // Reset times to compare just dates
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// Get relative date string if within 7 days, otherwise return null
export function getRelativeDateString(date: Date | string): string | null {
  const days = getDaysFromToday(date);

  if (days < 0) return null; // Past dates show as actual date
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days} days`;

  return null; // Beyond 7 days, show actual date
}

export function isOverdue(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  // Check if this is a "no specific time" item (23:59 is the default)
  const isAllDayItem = d.getHours() === 23 && d.getMinutes() === 59;

  if (isAllDayItem) {
    // For all-day items, only overdue if the entire day has passed
    return d < now && !isToday(d);
  } else {
    // For timed items, overdue if the specific datetime has passed
    return d < now;
  }
}

export function getNextDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function isSoonDeadline(dueAt: string, windowDays: number): boolean {
  const deadline = new Date(dueAt);
  const now = new Date();
  const soon = getNextDays(windowDays);
  return deadline <= soon && deadline > now;
}

export function getDayOfWeek(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export function compareTime(time1: string, time2: string): number {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  const mins1 = h1 * 60 + m1;
  const mins2 = h2 * 60 + m2;
  return mins1 - mins2;
}

export function isCurrentClass(
  start: string,
  end: string,
  date: Date | string
): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isToday(d)) return false;

  const now = new Date();
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  return compareTime(start, nowTime) <= 0 && compareTime(nowTime, end) < 0;
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    // If URL parsing fails, try to extract manually
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    return match ? match[1] : url;
  }
}

