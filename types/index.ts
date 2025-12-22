export interface Course {
  id: string;
  code: string;
  name: string;
  term: string;
  startDate?: string | null; // ISO date or null
  endDate?: string | null; // ISO date or null
  meetingTimes: Array<{
    days: string[];
    start: string;
    end: string;
    location: string;
  }>;
  links: Array<{
    label: string;
    url: string;
  }>;
  colorTag?: string;
}

export interface Deadline {
  id: string;
  title: string;
  courseId: string | null;
  dueAt: string | null; // ISO datetime
  notes: string;
  links: Array<{
    label: string;
    url: string;
  }>;
  status: 'open' | 'done';
  createdAt: string; // ISO datetime
  recurringPatternId: string | null;
  instanceDate: string | null; // ISO datetime
  isRecurring: boolean;
  recurringPattern?: RecurringDeadlinePattern | null;
}

export interface Task {
  id: string;
  title: string;
  courseId: string | null;
  dueAt: string | null; // ISO datetime
  pinned: boolean;
  checklist: Array<{
    id: string;
    text: string;
    done: boolean;
  }>;
  notes: string;
  links: Array<{
    label: string;
    url: string;
  }>;
  status: 'open' | 'done';
  createdAt: string; // ISO datetime
  recurringPatternId: string | null;
  instanceDate: string | null; // ISO datetime
  isRecurring: boolean;
  recurringPattern?: RecurringPattern | null;
}

export interface RecurringPattern {
  id: string;
  userId: string;
  recurrenceType: 'weekly' | 'monthly' | 'custom';
  intervalDays: number | null;
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  daysOfMonth?: number[]; // 1-31
  startDate: string | null; // ISO datetime - when recurrence starts
  endDate: string | null; // ISO datetime
  occurrenceCount: number | null;
  lastGenerated: string; // ISO datetime
  instanceCount: number;
  taskTemplate: {
    title: string;
    courseId: string | null;
    notes: string;
    links: Array<{ label: string; url: string }>;
    dueTime: string; // HH:mm
  };
  isActive: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface RecurringTaskFormData {
  isRecurring: boolean;
  recurrenceType: 'weekly' | 'monthly' | 'custom';
  customIntervalDays: number;
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  daysOfMonth: number[]; // 1-31 for monthly recurrence
  startDate: string; // ISO date - when recurrence starts
  endCondition: 'date' | 'count' | 'never';
  endDate: string;
  occurrenceCount: number;
  dueTime: string; // HH:mm
}

export interface RecurringDeadlinePattern {
  id: string;
  userId: string;
  recurrenceType: 'weekly' | 'monthly' | 'custom';
  intervalDays: number | null;
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  daysOfMonth?: number[]; // 1-31
  startDate: string | null; // ISO datetime - when recurrence starts
  endDate: string | null; // ISO datetime
  occurrenceCount: number | null;
  lastGenerated: string; // ISO datetime
  instanceCount: number;
  deadlineTemplate: {
    title: string;
    courseId: string | null;
    notes: string;
    links: Array<{ label: string; url: string }>;
  };
  isActive: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface RecurringExamPattern {
  id: string;
  userId: string;
  recurrenceType: 'weekly' | 'monthly' | 'custom';
  intervalDays: number | null;
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  daysOfMonth?: number[]; // 1-31
  startDate: string | null; // ISO datetime - when recurrence starts
  endDate: string | null; // ISO datetime
  occurrenceCount: number | null;
  lastGenerated: string; // ISO datetime
  instanceCount: number;
  examTemplate: {
    title: string;
    courseId: string | null;
    notes: string;
    links: Array<{ label: string; url: string }>;
    location: string | null;
    examAt: string | null; // Time for exams (null for all-day)
  };
  isActive: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface RecurringDeadlineFormData {
  isRecurring: boolean;
  recurrenceType: 'weekly' | 'monthly' | 'custom';
  customIntervalDays: number;
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  daysOfMonth: number[]; // 1-31 for monthly recurrence
  startDate: string; // ISO date - when recurrence starts
  endCondition: 'date' | 'count' | 'never';
  endDate: string;
  occurrenceCount: number;
}

export interface RecurringExamFormData {
  isRecurring: boolean;
  recurrenceType: 'weekly' | 'monthly' | 'custom';
  customIntervalDays: number;
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  daysOfMonth: number[]; // 1-31 for monthly recurrence
  startDate: string; // ISO date - when recurrence starts
  endCondition: 'date' | 'count' | 'never';
  endDate: string;
  occurrenceCount: number;
  examTime: string; // HH:mm
}

export interface Exam {
  id: string;
  title: string;
  courseId: string | null;
  examAt: string; // ISO datetime
  location: string | null;
  notes: string;
  links: Array<{
    label: string;
    url: string;
  }>;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string; // ISO datetime
}

export interface Note {
  id: string;
  title: string;
  content: any; // TipTap JSON format
  plainText?: string; // Optional: computed on server
  folderId: string | null;
  courseId: string | null;
  tags: string[];
  isPinned: boolean;
  links: Array<{
    label: string;
    url: string;
  }>;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  courseId: string | null;
  colorTag: string | null;
  order: number;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface Settings {
  dueSoonWindowDays: number;
  weekStartsOn: 'Sun' | 'Mon';
  theme: 'light' | 'dark' | 'system';
  enableNotifications: boolean;
  university?: string | null;
  visiblePages?: string[];
  visibleDashboardCards?: string[];
  visibleToolsCards?: string[];
  toolsCardsOrder?: string[] | string | null;
  visiblePagesOrder?: string[] | string | null;
  hasCompletedOnboarding?: boolean;
  examReminders?: Array<{ enabled: boolean; value: number; unit: 'hours' | 'days' }>;
  pomodoroWorkDuration?: number;
  pomodoroBreakDuration?: number;
  pomodoroIsMuted?: boolean;
  selectedGradeSemester?: string;
  dashboardCardsCollapsedState?: string[] | null;
}

export interface ExcludedDate {
  id: string;
  courseId: string | null; // null = global holiday
  date: string; // ISO date string (YYYY-MM-DD)
  description: string;
  createdAt: string; // ISO datetime
}

export interface GpaEntry {
  id: string;
  courseName: string;
  grade: string;
  credits: number;
  courseId?: string | null;
  university?: string | null;
  term?: string | null;
  status?: 'in_progress' | 'final';
  createdAt: string; // ISO datetime
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string; // ISO datetime
}

export interface AppData {
  courses: Course[];
  deadlines: Deadline[];
  tasks: Task[];
  exams: Exam[];
  notes: Note[];
  folders: Folder[];
  settings: Settings;
  excludedDates: ExcludedDate[];
  gpaEntries?: GpaEntry[];
  recurringPatterns?: RecurringPattern[];
  recurringDeadlinePatterns?: RecurringDeadlinePattern[];
  recurringExamPatterns?: RecurringExamPattern[];
  notifications?: Notification[];
}
