import { Course, Task, Deadline, Exam, CalendarEvent } from './index';

export type TimelineItemType = 'class' | 'task' | 'deadline' | 'exam' | 'event';

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  title: string;
  time: string | null; // HH:mm format or null for all-day
  endTime?: string | null; // For classes/events with duration
  courseId: string | null;
  courseName?: string;
  courseCode?: string;
  location?: string | null;
  isAllDay?: boolean;
  isOverdue?: boolean;
  isCompleted?: boolean;
  isCurrent?: boolean; // For classes currently in session
  originalItem: Course | Task | Deadline | Exam | CalendarEvent | any; // The original data for actions
  links?: Array<{ label: string; url: string }>;
  files?: Array<{ name: string; url: string; size: number }>;
  canComplete?: boolean; // Tasks and deadlines can be completed
}

export type TimelineRange = 'today' | 'week';

export interface TimelineProgress {
  completed: number;
  total: number;
  percentage: number;
  hasOverdue: boolean;
}

export interface TimelineDayData {
  date: Date;
  dateKey: string; // YYYY-MM-DD
  dayName: string; // 'Mon', 'Tue', etc.
  dateStr: string; // 'Jan 20'
  isToday: boolean;
  items: TimelineItem[];
  progress: TimelineProgress;
}

export interface TimelineGroupedData {
  days: TimelineDayData[];
  totalProgress: TimelineProgress;
}

// Color mapping for timeline item types - hex values for rendering
export const TIMELINE_COLORS: Record<TimelineItemType, string> = {
  class: '#3b82f6',    // blue
  exam: '#ef4444',     // red
  task: '#22c55e',     // green
  deadline: '#ff7d00', // orange
  event: '#a855f7',    // purple
};
