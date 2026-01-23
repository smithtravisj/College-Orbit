export interface Course {
  id: string;
  code: string;
  name: string;
  term: string;
  credits?: number | null;
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
  files?: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  colorTag?: string;
  // Canvas LMS Integration
  canvasCourseId?: string | null;
  canvasEnrollmentId?: string | null;
}

export interface Deadline {
  id: string;
  title: string;
  courseId: string | null;
  dueAt: string | null; // ISO datetime
  priority: 1 | 2 | 3 | null; // 1 = highest, 3 = lowest
  effort: 'small' | 'medium' | 'large' | null;
  notes: string;
  tags: string[];
  links: Array<{
    label: string;
    url: string;
  }>;
  files?: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  status: 'open' | 'done';
  workingOn: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  recurringPatternId: string | null;
  instanceDate: string | null; // ISO datetime
  isRecurring: boolean;
  recurringPattern?: RecurringDeadlinePattern | null;
  // Canvas LMS Integration
  canvasAssignmentId?: string | null;
  canvasSubmissionId?: string | null;
  canvasPointsPossible?: number | null;
  canvasPointsEarned?: number | null;
  canvasGradePostedAt?: string | null;
}

export interface Task {
  id: string;
  title: string;
  courseId: string | null;
  dueAt: string | null; // ISO datetime
  pinned: boolean;
  importance: 'low' | 'medium' | 'high' | null;
  checklist: Array<{
    id: string;
    text: string;
    done: boolean;
  }>;
  notes: string;
  tags: string[];
  links: Array<{
    label: string;
    url: string;
  }>;
  files?: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  status: 'open' | 'done';
  workingOn: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  recurringPatternId: string | null;
  instanceDate: string | null; // ISO datetime
  isRecurring: boolean;
  recurringPattern?: RecurringPattern | null;
}

export interface RecurringPattern {
  id: string;
  userId: string;
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'custom';
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
    tags: string[];
    links: Array<{ label: string; url: string }>;
    dueTime: string; // HH:mm
  };
  isActive: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface RecurringTaskFormData {
  isRecurring: boolean;
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'custom';
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
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'custom';
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
    tags: string[];
    links: Array<{ label: string; url: string }>;
  };
  isActive: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface RecurringExamPattern {
  id: string;
  userId: string;
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'custom';
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
    tags: string[];
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
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'custom';
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
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'custom';
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
  examAt: string | null; // ISO datetime
  location: string | null;
  notes: string;
  tags: string[];
  links: Array<{
    label: string;
    url: string;
  }>;
  files?: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  status: 'scheduled' | 'completed' | 'cancelled';
  isRecurring?: boolean;
  recurringPatternId?: string | null;
  createdAt: string; // ISO datetime
}

export interface Note {
  id: string;
  title: string;
  content: any; // TipTap JSON format
  plainText?: string; // Optional: computed on server
  folderId: string | null;
  courseId: string | null;
  taskId: string | null;
  deadlineId: string | null;
  examId: string | null;
  workItemId: string | null;
  recurringTaskPatternId: string | null;
  recurringDeadlinePatternId: string | null;
  recurringExamPatternId: string | null;
  recurringWorkPatternId: string | null;
  tags: string[];
  isPinned: boolean;
  links: Array<{
    label: string;
    url: string;
  }>;
  files?: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  // Optional included relations from API
  task?: { id: string; title: string } | null;
  deadline?: { id: string; title: string } | null;
  exam?: { id: string; title: string } | null;
  workItem?: { id: string; title: string; type: WorkItemType } | null;
  recurringTaskPattern?: { id: string; taskTemplate: any } | null;
  recurringDeadlinePattern?: { id: string; deadlineTemplate: any } | null;
  recurringExamPattern?: { id: string; examTemplate: any } | null;
  recurringWorkPattern?: { id: string; workItemTemplate: any } | null;
  course?: { id: string; code: string; name: string } | null;
  folder?: { id: string; name: string } | null;
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

export interface CustomColorSet {
  accent: string;
  accentHover: string;
  accentText: string;
  link: string;
  success: string;
  warning: string;
  danger: string;
}

export interface CustomColors {
  light: CustomColorSet;
  dark: CustomColorSet;
}

export interface Settings {
  dueSoonWindowDays: number;
  weekStartsOn: 'Sun' | 'Mon';
  timeFormat: '12h' | '24h';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY';
  theme: 'light' | 'dark';
  enableNotifications: boolean;
  university?: string | null;
  visiblePages?: string[];
  visibleDashboardCards?: string[];
  visibleToolsCards?: string[];
  toolsCardsOrder?: string[] | string | null;
  visiblePagesOrder?: string[] | string | null;
  hasCompletedOnboarding?: boolean;
  examReminders?: Array<{ enabled: boolean; value: number; unit: 'hours' | 'days' }>;
  deadlineReminders?: Array<{ enabled: boolean; value: number; unit: 'hours' | 'days' }>;
  taskReminders?: Array<{ enabled: boolean; value: number; unit: 'hours' | 'days' }>;
  readingReminders?: Array<{ enabled: boolean; value: number; unit: 'hours' | 'days' }>;
  projectReminders?: Array<{ enabled: boolean; value: number; unit: 'hours' | 'days' }>;
  pomodoroWorkDuration?: number;
  pomodoroBreakDuration?: number;
  pomodoroIsMuted?: boolean;
  selectedGradeSemester?: string;
  dashboardCardsCollapsedState?: string[] | null;
  hiddenQuickLinks?: Record<string, string[]> | null;
  courseTermFilter?: string;
  emailAnnouncements?: boolean;
  emailExamReminders?: boolean;
  emailAccountAlerts?: boolean;
  emailDeadlineReminders?: boolean;
  emailTaskReminders?: boolean;
  emailReadingReminders?: boolean;
  emailProjectReminders?: boolean;
  notifyAnnouncements?: boolean;
  notifyExamReminders?: boolean;
  notifyAccountAlerts?: boolean;
  notifyDeadlineReminders?: boolean;
  notifyTaskReminders?: boolean;
  notifyReadingReminders?: boolean;
  notifyProjectReminders?: boolean;
  useCustomTheme?: boolean;
  customColors?: CustomColors | null;
  gradientIntensity?: number; // 0-100, controls gradient intensity on buttons, nav, filters
  glowIntensity?: number; // 0-100, controls glow effect intensity on buttons
  autoCreateCourseFolders?: boolean; // Auto-create note folders when courses are created
  autoSyncCoursesToGradeTracker?: boolean; // Auto-add courses to grade tracker when created/updated
  showCanvasBadges?: boolean; // Show Canvas badges on synced items
  showRelativeDates?: boolean; // Show "Today", "Tomorrow", "In 3 days" instead of actual dates (within 7 days)
  showNavCounts?: boolean; // Master toggle for showing counts in navigation
  showNavCountTasks?: boolean; // Show overdue tasks count in nav
  showNavCountAssignments?: boolean; // Show overdue assignments count in nav
  showNavCountExams?: boolean; // Show total exams count in nav
  showPriorityIndicators?: boolean; // Show priority badges on tasks
  showEffortIndicators?: boolean; // Show effort level badges on assignments
  groupTasksByCourse?: boolean; // Group tasks by course in list view
  groupAssignmentsByCourse?: boolean; // Group assignments by course in list view
  showCourseCode?: boolean; // Show course code (CS 101) instead of name (Intro to Computer Science)
  confirmBeforeDelete?: boolean; // Show confirmation dialogs before deleting items
  enableKeyboardShortcuts?: boolean; // Enable keyboard shortcuts for navigation and actions
  // Colorblind Accessibility
  colorblindMode?: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia' | null; // Type of colorblindness
  colorblindStyle?: 'palette' | 'patterns' | 'both' | null; // How to apply colorblind mode
  // Canvas LMS Integration
  canvasInstanceUrl?: string | null;
  canvasAccessToken?: string | null;
  canvasUserId?: string | null;
  canvasUserName?: string | null;
  canvasSyncEnabled?: boolean;
  canvasLastSyncedAt?: string | null;
  canvasSyncCourses?: boolean;
  canvasSyncAssignments?: boolean;
  canvasSyncGrades?: boolean;
  canvasSyncEvents?: boolean;
  canvasSyncAnnouncements?: boolean;
  canvasAutoMarkComplete?: boolean; // Auto-mark assignments as complete when submitted in Canvas
  // Timeline Settings
  timelineRange?: 'today' | 'week'; // Default timeline view range
  timelineShowProgress?: boolean; // Show progress indicator on timeline
  timelineItemTypes?: ('class' | 'task' | 'deadline' | 'exam' | 'event')[]; // Which item types to show
  // Beta Program
  isBetaUser?: boolean;
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
  // Canvas LMS Integration
  canvasAnnouncementId?: string | null;
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
  shoppingItems?: ShoppingItem[];
  calendarEvents?: CalendarEvent[];
  workItems?: WorkItem[];
  recurringWorkPatterns?: RecurringWorkPattern[];
}

// Calendar Event Types
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  color: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  // Canvas LMS Integration
  canvasEventId?: string | null;
}

// Shopping List Types
export type ShoppingListType = 'grocery' | 'wishlist' | 'pantry';

export interface ShoppingItem {
  id: string;
  listType: ShoppingListType;
  name: string;
  quantity: number;
  unit: string | null;
  category: string;
  notes: string;
  checked: boolean;
  priority: 'low' | 'medium' | 'high' | null;
  price: number | null;
  perishable: boolean | null;
  order: number;
  purchasedAt: string | null; // ISO datetime when purchased, null = active item
  createdAt: string;
  updatedAt: string;
}

// Shared categories for Grocery and Pantry (so items can move between them)
export const FOOD_CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat & Seafood',
  'Bakery',
  'Bread',
  'Frozen',
  'Refrigerated',
  'Canned Goods',
  'Pasta & Rice',
  'Snacks',
  'Beverages',
  'Condiments',
  'Sauces',
  'Spreads',
  'Spices & Seasonings',
  'Baking Supplies',
  'Oils & Cooking Sprays',
  'Breakfast',
  'Instant Meals',
  'Household',
  'Personal Care',
  'Other',
] as const;

export const GROCERY_CATEGORIES = FOOD_CATEGORIES;

export const WISHLIST_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports & Outdoors',
  'Entertainment',
  'Kitchen',
  'School Supplies',
  'Gifts',
  'Other',
] as const;

export const PANTRY_CATEGORIES = FOOD_CATEGORIES;

// Unified Work Item Types
export type WorkItemType = 'task' | 'assignment' | 'reading' | 'project';
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'critical' | null;
export type WorkItemEffort = 'small' | 'medium' | 'large' | null;

export interface WorkItem {
  id: string;
  title: string;
  type: WorkItemType;
  courseId: string | null;
  dueAt: string | null; // ISO datetime
  priority: WorkItemPriority;
  effort: WorkItemEffort;
  pinned: boolean;
  checklist: Array<{
    id: string;
    text: string;
    done: boolean;
  }>;
  notes: string;
  tags: string[];
  links: Array<{
    label: string;
    url: string;
  }>;
  files: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  status: 'open' | 'done';
  workingOn: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  instanceDate: string | null; // ISO datetime
  isRecurring: boolean;
  recurringPatternId: string | null;
  recurringPattern?: RecurringWorkPattern | null;
  // Canvas LMS Integration (for type='assignment')
  canvasAssignmentId?: string | null;
  canvasSubmissionId?: string | null;
  canvasPointsPossible?: number | null;
  canvasPointsEarned?: number | null;
  canvasGradePostedAt?: string | null;
  // Optional included course relation
  course?: {
    id: string;
    code: string;
    name: string;
    colorTag?: string | null;
  } | null;
}

export interface RecurringWorkPattern {
  id: string;
  userId: string;
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'custom';
  intervalDays: number | null;
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  daysOfMonth?: number[]; // 1-31
  startDate: string | null; // ISO datetime - when recurrence starts
  endDate: string | null; // ISO datetime
  occurrenceCount: number | null;
  lastGenerated: string; // ISO datetime
  instanceCount: number;
  workItemTemplate: {
    title: string;
    type: WorkItemType;
    courseId: string | null;
    notes: string;
    tags: string[];
    links: Array<{ label: string; url: string }>;
    dueTime: string; // HH:mm
    priority: WorkItemPriority;
    effort: WorkItemEffort;
    pinned: boolean;
    checklist: Array<{ id: string; text: string; done: boolean }>;
  };
  isActive: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface RecurringWorkFormData {
  isRecurring: boolean;
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'custom';
  customIntervalDays: number;
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  daysOfMonth: number[]; // 1-31 for monthly recurrence
  startDate: string; // ISO date - when recurrence starts
  endCondition: 'date' | 'count' | 'never';
  endDate: string;
  occurrenceCount: number;
  dueTime: string; // HH:mm
}

// Work Item type labels for display
export const WORK_ITEM_TYPE_LABELS: Record<WorkItemType, string> = {
  task: 'Task',
  assignment: 'Assignment',
  reading: 'Reading',
  project: 'Project',
};

// Work Item priority labels for display
export const WORK_ITEM_PRIORITY_LABELS: Record<Exclude<WorkItemPriority, null>, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

// Work Item effort labels for display
export const WORK_ITEM_EFFORT_LABELS: Record<Exclude<WorkItemEffort, null>, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};

// Beta Program Types
export interface BetaFeedback {
  id: string;
  userId: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { email: string; name: string | null };
}

export interface AppVersion {
  id: string;
  version: string;
  changes: string[];
  isBetaOnly: boolean;
  releasedAt: string;
  createdAt: string;
  updatedAt: string;
}
