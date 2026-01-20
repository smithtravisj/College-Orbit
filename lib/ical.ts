// iCal (.ics) generation utilities

interface CalendarItem {
  id: string;
  title: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
  location?: string | null;
  type: 'deadline' | 'exam' | 'task' | 'course' | 'event';
}

/**
 * Escape special characters for iCal format
 */
function escapeIcal(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Format date for iCal
 * - All-day: YYYYMMDD (no time component)
 * - Timed: YYYYMMDDTHHmmss (local time, no Z suffix to avoid timezone issues)
 */
function formatIcalDate(date: Date, allDay: boolean = false): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (allDay) {
    return `${year}${month}${day}`;
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Generate a unique identifier for an event
 */
function generateUid(item: CalendarItem): string {
  return `${item.id}-${item.type}@collegeorbit.com`;
}

/**
 * Generate iCal content from calendar items
 */
export function generateIcal(items: CalendarItem[], calendarName: string = 'College Orbit'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//College Orbit//Calendar Export//EN',
    `X-WR-CALNAME:${escapeIcal(calendarName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const item of items) {
    const uid = generateUid(item);
    const now = new Date();
    const dtstamp = formatIcalDate(now);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);

    // Determine if this is an all-day event
    const isAllDay = item.allDay ?? false;

    if (isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatIcalDate(item.startDate, true)}`);
      if (item.endDate) {
        // For all-day events, end date should be the day after
        const endDate = new Date(item.endDate);
        endDate.setDate(endDate.getDate() + 1);
        lines.push(`DTEND;VALUE=DATE:${formatIcalDate(endDate, true)}`);
      } else {
        // Single day event - end is next day
        const endDate = new Date(item.startDate);
        endDate.setDate(endDate.getDate() + 1);
        lines.push(`DTEND;VALUE=DATE:${formatIcalDate(endDate, true)}`);
      }
    } else {
      lines.push(`DTSTART:${formatIcalDate(item.startDate)}`);
      if (item.endDate) {
        lines.push(`DTEND:${formatIcalDate(item.endDate)}`);
      } else {
        // Default 1 hour duration
        const endDate = new Date(item.startDate);
        endDate.setHours(endDate.getHours() + 1);
        lines.push(`DTEND:${formatIcalDate(endDate)}`);
      }
    }

    // Add type prefix to title for clarity
    const typePrefix = item.type === 'deadline' ? '[Assignment] ' :
                       item.type === 'exam' ? '[Exam] ' :
                       item.type === 'task' ? '[Task] ' :
                       item.type === 'course' ? '' : '';

    lines.push(`SUMMARY:${escapeIcal(typePrefix + item.title)}`);

    if (item.description) {
      lines.push(`DESCRIPTION:${escapeIcal(item.description)}`);
    }

    if (item.location) {
      lines.push(`LOCATION:${escapeIcal(item.location)}`);
    }

    // Add categories based on type
    lines.push(`CATEGORIES:${item.type.toUpperCase()}`);

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Convert database items to CalendarItem format
 */
export interface DbDeadline {
  id: string;
  title: string;
  description?: string | null;
  dueAt: Date | null;
  course?: { name: string } | null;
}

export interface DbExam {
  id: string;
  title: string;
  notes?: string | null;
  examAt: Date | null;
  location?: string | null;
  course?: { name: string } | null;
}

export interface DbTask {
  id: string;
  title: string;
  description?: string | null;
  dueAt?: Date | null;
  course?: { name: string } | null;
}

export interface DbCourse {
  id: string;
  name: string;
  code: string;
  meetingTimes?: any; // JSON meeting times data
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface DbCalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  startAt: Date;
  endAt?: Date | null;
  allDay: boolean;
  location?: string | null;
}

export function deadlineToCalendarItem(deadline: DbDeadline): CalendarItem | null {
  if (!deadline.dueAt) return null;

  const courseName = deadline.course?.name ? ` (${deadline.course.name})` : '';
  const dueDate = new Date(deadline.dueAt);

  // Check if the time is midnight (00:00) - treat as all-day event
  const isAllDay = dueDate.getHours() === 0 && dueDate.getMinutes() === 0;

  return {
    id: deadline.id,
    title: deadline.title + courseName,
    description: deadline.description,
    startDate: dueDate,
    allDay: isAllDay,
    type: 'deadline',
  };
}

export function examToCalendarItem(exam: DbExam): CalendarItem | null {
  if (!exam.examAt) return null;

  const courseName = exam.course?.name ? ` (${exam.course.name})` : '';
  const examDate = new Date(exam.examAt);

  // Default 2 hour exam duration
  const endDate = new Date(examDate);
  endDate.setHours(endDate.getHours() + 2);

  return {
    id: exam.id,
    title: exam.title + courseName,
    description: exam.notes,
    startDate: examDate,
    endDate,
    allDay: false,
    location: exam.location,
    type: 'exam',
  };
}

export function taskToCalendarItem(task: DbTask): CalendarItem | null {
  if (!task.dueAt) return null;

  const courseName = task.course?.name ? ` (${task.course.name})` : '';
  const dueDate = new Date(task.dueAt);

  // Check if the time is midnight (00:00) - treat as all-day event
  const isAllDay = dueDate.getHours() === 0 && dueDate.getMinutes() === 0;

  return {
    id: task.id,
    title: task.title + courseName,
    description: task.description,
    startDate: dueDate,
    allDay: isAllDay,
    type: 'task',
  };
}

export function courseScheduleToCalendarItems(course: DbCourse): CalendarItem[] {
  const items: CalendarItem[] = [];

  if (!course.meetingTimes || !course.startDate || !course.endDate) {
    return items;
  }

  // Parse meetingTimes - expected format: array of { day: string, startTime: string, endTime: string, location?: string }
  const meetingTimes = typeof course.meetingTimes === 'string' ? JSON.parse(course.meetingTimes) : course.meetingTimes;

  if (!Array.isArray(meetingTimes)) return items;

  const startDate = new Date(course.startDate);
  const endDate = new Date(course.endDate);

  // Map day names to day numbers
  const dayNameToNumber: { [key: string]: number } = {
    'sunday': 0, 'sun': 0,
    'monday': 1, 'mon': 1,
    'tuesday': 2, 'tue': 2,
    'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thu': 4,
    'friday': 5, 'fri': 5,
    'saturday': 6, 'sat': 6,
  };

  // Generate recurring events for each meeting time
  for (const slot of meetingTimes) {
    if (!slot.day || !slot.startTime || !slot.endTime) continue;

    // Convert day name to number if needed
    let dayOfWeek: number;
    if (typeof slot.day === 'string') {
      dayOfWeek = dayNameToNumber[slot.day.toLowerCase()] ?? -1;
    } else {
      dayOfWeek = slot.day;
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) continue;

    let currentDate = new Date(startDate);

    // Find first occurrence of this day of week
    while (currentDate.getDay() !== dayOfWeek && currentDate <= endDate) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate events for each week
    while (currentDate <= endDate) {
      const [startHours, startMinutes] = slot.startTime.split(':').map(Number);
      const [endHours, endMinutes] = slot.endTime.split(':').map(Number);

      const eventStart = new Date(currentDate);
      eventStart.setHours(startHours, startMinutes, 0, 0);

      const eventEnd = new Date(currentDate);
      eventEnd.setHours(endHours, endMinutes, 0, 0);

      items.push({
        id: `${course.id}-${currentDate.toISOString().split('T')[0]}`,
        title: `${course.code} - ${course.name}`,
        startDate: eventStart,
        endDate: eventEnd,
        allDay: false,
        location: slot.location || null,
        type: 'course',
      });

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }
  }

  return items;
}

export function calendarEventToCalendarItem(event: DbCalendarEvent): CalendarItem {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startDate: new Date(event.startAt),
    endDate: event.endAt ? new Date(event.endAt) : undefined,
    allDay: event.allDay,
    location: event.location,
    type: 'event',
  };
}
