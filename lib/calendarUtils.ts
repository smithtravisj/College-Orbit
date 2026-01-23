import { Course, Task, Deadline, Exam, ExcludedDate, CalendarEvent as CustomCalendarEvent } from '@/types';
import { getDayOfWeek } from './utils';
import { getEventTypeColors, ColorblindMode, ColorblindStyle } from '@/lib/collegeColors';

export interface CalendarEvent {
  id: string;
  type: 'course' | 'task' | 'deadline' | 'exam' | 'event';
  title: string;
  time?: string;
  endTime?: string;
  location?: string;
  courseCode?: string;
  courseId?: string | null;
  colorTag?: string;
  color?: string | null; // Custom color for calendar events
  status?: 'open' | 'done' | 'scheduled' | 'completed' | 'cancelled';
  dueAt?: string | null;
  examAt?: string | null;
  startAt?: string | null; // For custom calendar events
  endAt?: string | null; // For custom calendar events
  allDay?: boolean; // For custom calendar events
  description?: string; // For custom calendar events
  instanceDate?: string | null; // For recurring task instances
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

// Check if a date is excluded (globally or for a specific course)
export function isDateExcluded(
  date: Date,
  courseId: string | undefined,
  excludedDates: ExcludedDate[]
): boolean {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return excludedDates.some((excluded) => {
    const excludedYear = excluded.date.substring(0, 4);
    const excludedMonth = excluded.date.substring(5, 7);
    const excludedDay = excluded.date.substring(8, 10);
    const excludedDateStr = `${excludedYear}-${excludedMonth}-${excludedDay}`;

    if (excludedDateStr !== dateStr) return false;

    // Global holiday (applies to all courses)
    if (excluded.courseId === null) return true;

    // Course-specific exclusion
    if (courseId && excluded.courseId === courseId) return true;

    return false;
  });
}

// Check if a course meets on a specific date
export function courseOccursOnDate(
  course: Course,
  date: Date,
  excludedDates?: ExcludedDate[]
): boolean {
  if (!course.meetingTimes || course.meetingTimes.length === 0) return false;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  // Check if course is active on this date
  if (course.startDate) {
    const startStr = course.startDate.split('T')[0];
    if (startStr > dateStr) return false;
  }
  if (course.endDate) {
    const endStr = course.endDate.split('T')[0];
    if (endStr < dateStr) return false;
  }

  // Check if date is excluded
  if (excludedDates && isDateExcluded(date, course.id, excludedDates)) {
    return false;
  }

  const dayName = getDayOfWeek(date);

  // Check if any meeting time matches this day of week
  return course.meetingTimes.some((mt) => mt.days.includes(dayName));
}

// Get all course events for a specific date
export function getCourseEventsForDate(
  date: Date,
  courses: Course[],
  excludedDates?: ExcludedDate[]
): CalendarEvent[] {
  return courses
    .filter((course) => courseOccursOnDate(course, date, excludedDates))
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
        instanceDate: (item as any).instanceDate || null,
      };
    });
}

// Get all exam events for a specific date
export function getExamEventsForDate(
  date: Date,
  exams: Exam[]
): CalendarEvent[] {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return exams
    .filter((exam) => {
      if (!exam.examAt) return false;

      const examDate = new Date(exam.examAt);
      const examYear = examDate.getFullYear();
      const examMonth = String(examDate.getMonth() + 1).padStart(2, '0');
      const examDay = String(examDate.getDate()).padStart(2, '0');
      const examDateLocal = `${examYear}-${examMonth}-${examDay}`;

      // Check if date matches
      return examDateLocal === dateStr;
    })
    .map((exam) => {
      // Get time in 24-hour format (HH:MM) if examAt exists
      let time: string | undefined;
      if (exam.examAt) {
        const date = new Date(exam.examAt);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        time = `${hours}:${minutes}`;
      }

      return {
        id: exam.id,
        type: 'exam' as const,
        title: exam.title,
        courseId: exam.courseId,
        examAt: exam.examAt,
        location: exam.location || undefined,
        time,
        status: exam.status,
        instanceDate: (exam as any).instanceDate || null,
      };
    });
}

// Get custom calendar events for a specific date
export function getCustomCalendarEventsForDate(
  date: Date,
  calendarEvents: CustomCalendarEvent[]
): CalendarEvent[] {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return calendarEvents
    .filter((event) => {
      if (!event.startAt) return false;

      const eventDate = new Date(event.startAt);
      const eventYear = eventDate.getFullYear();
      const eventMonth = String(eventDate.getMonth() + 1).padStart(2, '0');
      const eventDay = String(eventDate.getDate()).padStart(2, '0');
      const eventDateLocal = `${eventYear}-${eventMonth}-${eventDay}`;

      return eventDateLocal === dateStr;
    })
    .map((event) => {
      // Get time in 24-hour format (HH:MM) if not all-day
      let time: string | undefined;
      let endTime: string | undefined;

      if (!event.allDay && event.startAt) {
        const startDate = new Date(event.startAt);
        const hours = String(startDate.getHours()).padStart(2, '0');
        const minutes = String(startDate.getMinutes()).padStart(2, '0');
        time = `${hours}:${minutes}`;

        if (event.endAt) {
          const endDate = new Date(event.endAt);
          const endHours = String(endDate.getHours()).padStart(2, '0');
          const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
          endTime = `${endHours}:${endMinutes}`;
        }
      }

      return {
        id: event.id,
        type: 'event' as const,
        title: event.title,
        time,
        endTime,
        location: event.location || undefined,
        color: event.color,
        startAt: event.startAt,
        endAt: event.endAt,
        allDay: event.allDay,
        description: event.description,
      };
    });
}

// Get all events for a specific date (combined courses, tasks, deadlines, exams, custom events)
export function getEventsForDate(
  date: Date,
  courses: Course[],
  tasks: Task[],
  deadlines: Deadline[],
  exams?: Exam[],
  excludedDates?: ExcludedDate[],
  calendarEvents?: CustomCalendarEvent[]
): CalendarEvent[] {
  const courseEvents = getCourseEventsForDate(date, courses, excludedDates);
  const taskDeadlineEvents = getTaskDeadlineEventsForDate(date, tasks, deadlines);
  const examEvents = exams ? getExamEventsForDate(date, exams) : [];
  const customEvents = calendarEvents ? getCustomCalendarEventsForDate(date, calendarEvents) : [];

  // Sort by type priority (courses > exams > events > deadlines > tasks), then by time
  return [...courseEvents, ...examEvents, ...customEvents, ...taskDeadlineEvents].sort((a, b) => {
    // Priority order: course, exam, event, deadline, task
    const typePriority: Record<string, number> = { course: 0, exam: 1, event: 2, deadline: 3, task: 4 };
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
  deadlines: Deadline[],
  exams?: Exam[],
  excludedDates?: ExcludedDate[]
): Map<string, CalendarEvent[]> {
  const eventsByDate = new Map<string, CalendarEvent[]>();

  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const events = getEventsForDate(current, courses, tasks, deadlines, exams, excludedDates);
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

// Standard color palette (default colors)
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

// Event type colors - default hex values
export const EVENT_TYPE_COLORS = {
  course: '#3b82f6',   // Blue
  task: '#22c55e',     // Green
  exam: '#ef4444',     // Red
  deadline: '#ff7d00', // Orange
  event: '#a855f7',    // Purple
};

// Raw hex colors for cases where CSS variables can't be used (e.g., color calculations)
export const EVENT_TYPE_COLORS_HEX = {
  course: '#3b82f6',
  task: '#22c55e',
  exam: '#ef4444',
  deadline: '#ff7d00',
  event: '#a855f7',
};

// Get the color for an event (supports colorblind mode)
export function getEventColor(
  event: CalendarEvent,
  colorblindMode?: ColorblindMode | null,
  theme?: 'light' | 'dark',
  colorblindStyle?: ColorblindStyle | null
): string {
  const colors = getEventTypeColors(colorblindMode, theme || 'dark', colorblindStyle);

  if (event.type === 'course') {
    // Use course color tag if available, otherwise colorblind-aware blue
    if (event.colorTag) {
      return parseColor(event.colorTag);
    }
    return colors.course;
  }

  if (event.type === 'exam') {
    return colors.exam;
  }

  if (event.type === 'task') {
    return colors.task;
  }

  if (event.type === 'deadline') {
    return colors.deadline;
  }

  if (event.type === 'event') {
    // Use custom color if set, otherwise colorblind-aware purple for calendar events
    return event.color || colors.event;
  }

  return colors.course;
}

// Parse color tag to RGB values for opacity variations
export function parseColor(colorTag?: string): string {
  if (!colorTag) return 'var(--accent)';

  // Named color to hex mapping
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

  // Legacy hex colors from old Canvas sync - map to standard palette
  const legacyHexMap: Record<string, string> = {
    '#FF6B6B': '#ef4444', // old red → standard red
    '#ff6b6b': '#ef4444',
    '#4ECDC4': '#06b6d4', // old teal → cyan
    '#4ecdc4': '#06b6d4',
    '#45B7D1': '#3b82f6', // old blue → standard blue
    '#45b7d1': '#3b82f6',
    '#96CEB4': '#10b981', // old green → standard green
    '#96ceb4': '#10b981',
    '#FFEAA7': '#f59e0b', // old yellow → standard yellow
    '#ffeaa7': '#f59e0b',
    '#DDA0DD': '#ec4899', // old plum → pink
    '#dda0dd': '#ec4899',
    '#98D8C8': '#10b981', // old mint → green
    '#98d8c8': '#10b981',
    '#F7DC6F': '#f59e0b', // old gold → yellow
    '#f7dc6f': '#f59e0b',
    '#BB8FCE': '#a855f7', // old purple → standard purple
    '#bb8fce': '#a855f7',
    '#85C1E9': '#3b82f6', // old light blue → standard blue
    '#85c1e9': '#3b82f6',
  };

  // Check named colors first
  if (colorMap[colorTag]) {
    return colorMap[colorTag];
  }

  // Check legacy hex colors
  if (legacyHexMap[colorTag]) {
    return legacyHexMap[colorTag];
  }

  // Return as-is for any other value
  return colorTag;
}

// Get color for month view dots and legend (supports colorblind mode)
export function getMonthViewColor(
  event: CalendarEvent,
  colorblindMode?: ColorblindMode | null,
  theme?: 'light' | 'dark',
  colorblindStyle?: ColorblindStyle | null
): string {
  const colors = getEventTypeColors(colorblindMode, theme || 'dark', colorblindStyle);

  // For custom calendar events, use their custom color if set
  if (event.type === 'event' && event.color) {
    return event.color;
  }

  // Use colorblind-aware colors
  const colorMap: Record<string, string> = {
    course: colors.course,
    exam: colors.exam,
    task: colors.task,
    deadline: colors.deadline,
    event: colors.event,
  };
  return colorMap[event.type] || colors.course;
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
    if (event.type === 'course') {
      // Courses are handled separately (timed events with their own logic)
      return;
    }

    if (event.type === 'event') {
      // Custom calendar events use allDay property
      if (event.allDay) {
        allDay.push(event);
      } else {
        timed.push(event);
      }
    } else {
      // Tasks and deadlines use dueAt time
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

  // First pass: Assign events to columns using greedy interval scheduling
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

  // Second pass: Calculate totalColumns for each event based on overlapping groups
  return eventLayout.map(({ event, column }, idx) => {
    const { start, end } = eventsWithTime[idx];

    // Count how many events overlap with this one at any point during its duration
    const overlappingEvents = eventsWithTime.filter(({ start: otherStart, end: otherEnd }) => {
      return !(otherEnd <= start || otherStart >= end); // True if they overlap
    });

    // Only use totalColumns if there are actual overlaps
    const totalColumns = overlappingEvents.length > 1 ? overlappingEvents.length : 1;

    return {
      event,
      column: column > totalColumns - 1 ? totalColumns - 1 : column,
      totalColumns,
    };
  });
}

// Get description for an excluded date (prioritize global over course-specific)
export function getExcludedDateDescription(
  date: Date,
  excludedDates: ExcludedDate[]
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  // Look for global holiday first
  const globalExcluded = excludedDates.find((ex) => {
    const exYear = ex.date.substring(0, 4);
    const exMonth = ex.date.substring(5, 7);
    const exDay = ex.date.substring(8, 10);
    const exDateStr = `${exYear}-${exMonth}-${exDay}`;
    return exDateStr === dateStr && ex.courseId === null;
  });

  if (globalExcluded) {
    return globalExcluded.description;
  }

  // Then look for any course-specific exclusion
  const courseExcluded = excludedDates.find((ex) => {
    const exYear = ex.date.substring(0, 4);
    const exMonth = ex.date.substring(5, 7);
    const exDay = ex.date.substring(8, 10);
    const exDateStr = `${exYear}-${exMonth}-${exDay}`;
    return exDateStr === dateStr && ex.courseId !== null;
  });

  return courseExcluded?.description || '';
}

// Get the type of exclusion (holiday or class cancelled) for display
export function getExclusionType(
  date: Date,
  excludedDates: ExcludedDate[]
): 'holiday' | 'class-cancelled' | null {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  // Look for global holiday first
  const globalExcluded = excludedDates.find((ex) => {
    const exYear = ex.date.substring(0, 4);
    const exMonth = ex.date.substring(5, 7);
    const exDay = ex.date.substring(8, 10);
    const exDateStr = `${exYear}-${exMonth}-${exDay}`;
    return exDateStr === dateStr && ex.courseId === null;
  });

  if (globalExcluded) {
    return 'holiday';
  }

  // Then look for any course-specific exclusion
  const courseExcluded = excludedDates.find((ex) => {
    const exYear = ex.date.substring(0, 4);
    const exMonth = ex.date.substring(5, 7);
    const exDay = ex.date.substring(8, 10);
    const exDateStr = `${exYear}-${exMonth}-${exDay}`;
    return exDateStr === dateStr && ex.courseId !== null;
  });

  return courseExcluded ? 'class-cancelled' : null;
}

// Generate array of dates between start and end (inclusive)
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// Get all excluded dates for a course (including global holidays)
export function getExcludedDatesForCourse(
  courseId: string | null,
  excludedDates: ExcludedDate[]
): ExcludedDate[] {
  return excludedDates.filter((ex) =>
    ex.courseId === null || ex.courseId === courseId
  );
}
