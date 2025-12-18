import { Course, Task, Deadline } from '@/types';
import { getDayOfWeek } from './utils';

export interface CalendarEvent {
  id: string;
  type: 'course' | 'task' | 'deadline';
  title: string;
  time?: string;
  endTime?: string;
  location?: string;
  courseCode?: string;
  courseId?: string | null;
  colorTag?: string;
  status?: 'open' | 'done';
  dueAt?: string | null;
  meetingTimeData?: {
    days: string[];
    start: string;
    end: string;
    location: string;
  };
}

// Get start and end dates for a week containing the given date
export function getWeekRange(
  date: Date,
  weekStartsOn: 'Sun' | 'Mon' = 'Sun'
): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();

  const firstDayOfWeek = weekStartsOn === 'Sun' ? 0 : 1;
  const diff = d.getDate() - day + (day === 0 && weekStartsOn === 'Mon' ? -6 : firstDayOfWeek);

  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// Get all dates in a month as an array
export function getDatesInMonth(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const firstDay = new Date(year, month, 1);

  // Add days from previous month to fill the grid
  const startDate = new Date(firstDay);
  startDate.setDate(1 - firstDay.getDay());

  // Add all days until we've filled the grid (7 rows * 7 days)
  const date = new Date(startDate);
  for (let i = 0; i < 42; i++) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  return dates;
}

// Check if a course meets on a specific date
export function courseOccursOnDate(course: Course, date: Date): boolean {
  if (!course.meetingTimes || course.meetingTimes.length === 0) return false;

  const dateStr = date.toISOString().split('T')[0];

  // Check if course is active on this date
  if (course.startDate && course.startDate > dateStr) return false;
  if (course.endDate && course.endDate < dateStr) return false;

  const dayName = getDayOfWeek(date);

  // Check if any meeting time matches this day of week
  return course.meetingTimes.some((mt) => mt.days.includes(dayName));
}

// Get all course events for a specific date
export function getCourseEventsForDate(
  date: Date,
  courses: Course[]
): CalendarEvent[] {
  return courses
    .filter((course) => courseOccursOnDate(course, date))
    .flatMap((course) =>
      course.meetingTimes
        .filter((mt) => mt.days.includes(getDayOfWeek(date)))
        .map((mt) => ({
          id: `${course.id}-${mt.start}-${mt.end}`,
          type: 'course' as const,
          title: course.name,
          courseCode: course.code,
          courseId: course.id,
          time: mt.start,
          endTime: mt.end,
          location: mt.location,
          colorTag: course.colorTag,
          meetingTimeData: mt,
        }))
    );
}

// Get all task/deadline events for a specific date
export function getTaskDeadlineEventsForDate(
  date: Date,
  tasks: Task[],
  deadlines: Deadline[]
): CalendarEvent[] {
  const dateStr = date.toISOString().split('T')[0];
  const allItems = [...tasks, ...deadlines];

  return allItems
    .filter((item) => {
      if (!item.dueAt) return false;
      const itemDateStr = item.dueAt.split('T')[0];
      return itemDateStr === dateStr;
    })
    .map((item) => {
      const isTask = 'pinned' in item;
      const type: 'task' | 'deadline' = isTask ? 'task' : 'deadline';
      return {
        id: item.id,
        type,
        title: item.title,
        courseId: item.courseId,
        dueAt: item.dueAt,
        time: item.dueAt ? new Date(item.dueAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
        status: item.status,
      };
    });
}

// Get all events for a specific date (combined courses, tasks, deadlines)
export function getEventsForDate(
  date: Date,
  courses: Course[],
  tasks: Task[],
  deadlines: Deadline[]
): CalendarEvent[] {
  const courseEvents = getCourseEventsForDate(date, courses);
  const taskDeadlineEvents = getTaskDeadlineEventsForDate(date, tasks, deadlines);

  // Sort by time (courses by start time, tasks/deadlines by time)
  return [...courseEvents, ...taskDeadlineEvents].sort((a, b) => {
    const timeA = a.time || '';
    const timeB = b.time || '';
    return timeA.localeCompare(timeB);
  });
}

// Get all events for a date range
export function getEventsForRange(
  startDate: Date,
  endDate: Date,
  courses: Course[],
  tasks: Task[],
  deadlines: Deadline[]
): Map<string, CalendarEvent[]> {
  const eventsByDate = new Map<string, CalendarEvent[]>();

  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const events = getEventsForDate(current, courses, tasks, deadlines);
    if (events.length > 0) {
      eventsByDate.set(dateStr, events);
    }
    current.setDate(current.getDate() + 1);
  }

  return eventsByDate;
}

// Calculate time slot position for week/day views
// Returns top position (in pixels/units) and height for the event
export function getTimeSlotPosition(
  time: string,
  startHour: number = 6,
  endHour: number = 22
): { top: number; height: number } {
  const [hours, minutes] = time.split(':').map(Number);

  // Calculate fractional hour from start
  const totalMinutes = hours * 60 + minutes;
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  if (totalMinutes < startMinutes || totalMinutes > endMinutes) {
    return { top: 0, height: 0 };
  }

  const positionFromStart = totalMinutes - startMinutes;
  const slotHeightInPixels = 60; // Each hour is 60px

  const top = (positionFromStart / 60) * slotHeightInPixels;
  return { top, height: slotHeightInPixels };
}

// Calculate height of an event based on duration
export function getEventHeight(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  const durationMinutes = endTotalMinutes - startTotalMinutes;
  const slotHeightInPixels = 60; // Each hour is 60px

  return (durationMinutes / 60) * slotHeightInPixels;
}

// Format date range for display
export function formatDateRange(start: Date, end: Date): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const formatDate = (d: Date) => {
    const monthStr = monthNames[d.getMonth()].slice(0, 3);
    return `${monthStr} ${d.getDate()}`;
  };

  const startStr = formatDate(start);
  const endStr = formatDate(end);

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${monthNames[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
  }

  return `${startStr} - ${endStr}`;
}

// Check if a date is in the current month
export function isInMonth(date: Date, year: number, month: number): boolean {
  return date.getFullYear() === year && date.getMonth() === month;
}

// Standard color palette
export const COLOR_PALETTE = {
  blue: '#3b82f6',
  green: '#10b981',
  purple: '#a855f7',
  orange: '#f59e0b',
  red: '#ef4444',
  pink: '#ec4899',
  indigo: '#6366f1',
  cyan: '#06b6d4',
};

// Get the color for an event
export function getEventColor(event: CalendarEvent): string {
  if (event.type === 'course') {
    // Use course color tag if available, otherwise blue
    if (event.colorTag) {
      return parseColor(event.colorTag);
    }
    return COLOR_PALETTE.blue;
  }

  if (event.type === 'task') {
    // Use green for tasks
    return COLOR_PALETTE.green;
  }

  if (event.type === 'deadline') {
    // Use orange for deadlines
    return COLOR_PALETTE.orange;
  }

  return COLOR_PALETTE.blue;
}

// Parse color tag to RGB values for opacity variations
export function parseColor(colorTag?: string): string {
  if (!colorTag) return 'var(--accent)';

  const colorMap: Record<string, string> = {
    'red': '#ef4444',
    'blue': '#3b82f6',
    'green': '#10b981',
    'yellow': '#f59e0b',
    'purple': '#a855f7',
    'pink': '#ec4899',
    'indigo': '#6366f1',
    'cyan': '#06b6d4',
  };

  return colorMap[colorTag] || colorTag;
}
