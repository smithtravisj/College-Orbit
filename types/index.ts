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
}

export interface Settings {
  dueSoonWindowDays: number;
  weekStartsOn: 'Sun' | 'Mon';
  theme: 'light' | 'dark' | 'system';
  enableNotifications: boolean;
  university?: string | null;
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
  settings: Settings;
  excludedDates: ExcludedDate[];
  gpaEntries?: GpaEntry[];
  notifications?: Notification[];
}
