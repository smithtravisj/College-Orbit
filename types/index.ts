export interface Course {
  id: string;
  code: string;
  name: string;
  term: string;
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
  link: string | null;
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
  link: string | null;
  status: 'open' | 'done';
  createdAt: string; // ISO datetime
}

export interface Settings {
  dueSoonWindowDays: number;
  weekStartsOn: 'Sun' | 'Mon';
  theme: 'light' | 'dark' | 'system';
  enableNotifications: boolean;
}

export interface AppData {
  courses: Course[];
  deadlines: Deadline[];
  tasks: Task[];
  settings: Settings;
}
