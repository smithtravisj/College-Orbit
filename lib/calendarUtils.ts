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

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const allItems = [...tasks, ...deadlines];

  return allItems
    .filter((item) => {
      // Exclude completed tasks and deadlines
      if (item.status === 'done') return false;

      if (!item.dueAt) return false;

      const dueDate = new Date(item.dueAt);
      const dueYear = dueDate.getFullYear();
      const dueMonth = String(dueDate.getMonth() + 1).padStart(2, '0');
      const dueDay = String(dueDate.getDate()).padStart(2, '0');
      const dueDateLocal = `${dueYear}-${dueMonth}-${dueDay}`;

      // Check if date matches directly
      if (dueDateLocal === dateStr) return true;

      // Check if time is at midnight - if so, also check previous day (end of day convention)
      const [, timeStr] = item.dueAt.split('T');
      if (timeStr && timeStr.startsWith('00:00:00')) {
        const prevDay = new Date(dueDate);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevYear = prevDay.getFullYear();
        const prevMonth = String(prevDay.getMonth() + 1).padStart(2, '0');
        const prevDayNum = String(prevDay.getDate()).padStart(2, '0');
        const prevDateStr = `${prevYear}-${prevMonth}-${prevDayNum}`;
        return prevDateStr === dateStr;
      }

      return false;
    })
    .map((item) => {
      const isTask = 'pinned' in item;
      const type: 'task' | 'deadline' = isTask ? 'task' : 'deadline';

      // Get time in 24-hour format (HH:MM) if dueAt exists
      let time: string | undefined;
      if (item.dueAt) {
        const date = new Date(item.dueAt);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        time = `${hours}:${minutes}`;
      }

      return {
        id: item.id,
        type,
        title: item.title,
        courseId: item.courseId,
        dueAt: item.dueAt,
        time,
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

  // Sort by type priority (courses > deadlines > tasks), then by time
  return [...courseEvents, ...taskDeadlineEvents].sort((a, b) => {
    // Priority order: course, deadline, task
    const typePriority: Record<string, number> = { course: 0, deadline: 1, task: 2 };
    const priorityA = typePriority[a.type];
    const priorityB = typePriority[b.type];

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Within same type, sort by time
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
  startHour: number = 0,
  endHour: number = 24
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
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#ff7d00',
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

// Get color for month view dots and legend
export function getMonthViewColor(event: CalendarEvent): string {
  const monthViewColors: Record<string, string> = {
    course: '#3d5fa5',
    task: '#3d7855',
    deadline: '#7d5c52',
  };
  return monthViewColors[event.type] || monthViewColors.course;
}

// Event layout interface for handling overlaps
export interface EventLayout {
  event: CalendarEvent;
  column: number;
  totalColumns: number;
}

// Check if a time is the default end-of-day time (11:59 PM)
export function isDefaultEndOfDayTime(dueAt: string | null | undefined): boolean {
  if (!dueAt) return false;
  const date = new Date(dueAt);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return hours === 23 && minutes === 59;
}

// Separate tasks/deadlines into all-day (default 11:59pm) and timed events
export function separateTaskDeadlineEvents(events: CalendarEvent[]): {
  allDay: CalendarEvent[];
  timed: CalendarEvent[];
} {
  const allDay: CalendarEvent[] = [];
  const timed: CalendarEvent[] = [];

  events.forEach((event) => {
    if (event.type !== 'course') {
      if (isDefaultEndOfDayTime(event.dueAt)) {
        allDay.push(event);
      } else {
        timed.push(event);
      }
    }
  });

  return { allDay, timed };
}

// Calculate column layout for overlapping events
// Uses an interval scheduling algorithm to assign events to non-overlapping columns
export function calculateEventLayout(events: CalendarEvent[]): EventLayout[] {
  if (events.length === 0) return [];

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Filter events with times and sort by start time, then end time
  // For events without endTime (like tasks/deadlines), assume 1 hour duration
  const eventsWithTime = events
    .filter(e => e.time)
    .map(e => ({
      event: e,
      start: timeToMinutes(e.time!),
      end: e.endTime ? timeToMinutes(e.endTime) : timeToMinutes(e.time!) + 60,
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  if (eventsWithTime.length === 0) return [];

  // Assign events to columns using greedy interval scheduling
  const openColumns: number[] = []; // Track the end time of the last event in each column
  const eventLayout: Array<{ event: CalendarEvent; column: number }> = [];

  for (const { event, start, end } of eventsWithTime) {
    // Find first column where the last event ends before this event starts
    let targetColumn = -1;
    for (let i = 0; i < openColumns.length; i++) {
      if (openColumns[i] <= start) {
        targetColumn = i;
        break;
      }
    }

    if (targetColumn === -1) {
      // No available column, create a new one
      targetColumn = openColumns.length;
      openColumns.push(end);
    } else {
      // Reuse column and update its end time
      openColumns[targetColumn] = Math.max(openColumns[targetColumn], end);
    }

    eventLayout.push({
      event,
      column: targetColumn,
    });
  }

  // Return layout with total column count
  const totalColumns = openColumns.length;
  return eventLayout.map(({ event, column }) => ({
    event,
    column,
    totalColumns,
  }));
}
