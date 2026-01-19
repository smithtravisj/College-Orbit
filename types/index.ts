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
  files?: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  colorTag?: string;
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
  recurringTaskPatternId: string | null;
  recurringDeadlinePatternId: string | null;
  recurringExamPatternId: string | null;
  tags: string[];
  isPinned: boolean;
  links: Array<{
    label: string;
    url: string;
  }>;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  // Optional included relations from API
  task?: { id: string; title: string } | null;
  deadline?: { id: string; title: string } | null;
  exam?: { id: string; title: string } | null;
  recurringTaskPattern?: { id: string; taskTemplate: any } | null;
  recurringDeadlinePattern?: { id: string; deadlineTemplate: any } | null;
  recurringExamPattern?: { id: string; examTemplate: any } | null;
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
  hiddenQuickLinks?: Record<string, string[]> | null;
  courseTermFilter?: string;
  emailAnnouncements?: boolean;
  emailExamReminders?: boolean;
  emailAccountAlerts?: boolean;
  notifyAnnouncements?: boolean;
  notifyExamReminders?: boolean;
  notifyAccountAlerts?: boolean;
  useCustomTheme?: boolean;
  customColors?: CustomColors | null;
  gradientIntensity?: number; // 0-100, controls gradient intensity on buttons, nav, filters
  glowIntensity?: number; // 0-100, controls glow effect intensity on buttons
  autoCreateCourseFolders?: boolean; // Auto-create note folders when courses are created
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
  shoppingItems?: ShoppingItem[];
  calendarEvents?: CalendarEvent[];
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
  createdAt: string;
  updatedAt: string;
}

export const GROCERY_CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat & Seafood',
  'Bakery',
  'Frozen',
  'Canned Goods',
  'Snacks',
  'Beverages',
  'Condiments',
  'Household',
  'Personal Care',
  'Other',
] as const;

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

export const PANTRY_CATEGORIES = [
  'Baking Supplies',
  'Beverages',
  'Bread',
  'Breakfast',
  'Canned Goods',
  'Condiments',
  'Frozen',
  'Instant Meals',
  'Pasta & Rice',
  'Oils & Cooking Sprays',
  'Produce',
  'Refrigerated',
  'Sauces',
  'Snacks',
  'Spices & Seasonings',
  'Spreads',
  'Other',
] as const;
