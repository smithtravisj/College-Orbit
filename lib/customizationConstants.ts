export const PAGES = {
  DASHBOARD: 'Dashboard',
  CALENDAR: 'Calendar',
  TASKS: 'Tasks',
  DEADLINES: 'Deadlines',
  EXAMS: 'Exams',
  NOTES: 'Notes',
  COURSES: 'Courses',
  TOOLS: 'Tools',
  SETTINGS: 'Settings',
} as const;

export const DASHBOARD_CARDS = {
  NEXT_CLASS: 'nextClass',
  DUE_SOON: 'dueSoon',
  OVERVIEW: 'overview',
  TODAY_TASKS: 'todayTasks',
  QUICK_LINKS: 'dashboard_quickLinks',
  UPCOMING_WEEK: 'upcomingWeek',
} as const;

export const TOOLS_CARDS = {
  QUICK_LINKS: 'tools_quickLinks',
  GPA_CALCULATOR: 'gpaCalculator',
  POMODORO_TIMER: 'pomodoroTimer',
} as const;

export const DEFAULT_VISIBLE_PAGES = Object.values(PAGES);
export const DEFAULT_VISIBLE_DASHBOARD_CARDS = Object.values(DASHBOARD_CARDS);
export const DEFAULT_VISIBLE_TOOLS_CARDS = Object.values(TOOLS_CARDS);

export const CARD_LABELS: Record<string, string> = {
  [DASHBOARD_CARDS.NEXT_CLASS]: 'Next Class',
  [DASHBOARD_CARDS.DUE_SOON]: 'Due Soon',
  [DASHBOARD_CARDS.OVERVIEW]: 'Overview',
  [DASHBOARD_CARDS.TODAY_TASKS]: "Today's Tasks",
  [DASHBOARD_CARDS.QUICK_LINKS]: 'Quick Links',
  [DASHBOARD_CARDS.UPCOMING_WEEK]: 'Upcoming This Week',
  [TOOLS_CARDS.QUICK_LINKS]: 'Quick Links',
  [TOOLS_CARDS.GPA_CALCULATOR]: 'GPA Calculator',
  [TOOLS_CARDS.POMODORO_TIMER]: 'Pomodoro Timer',
};
