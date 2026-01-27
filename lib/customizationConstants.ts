export const PAGES = {
  DASHBOARD: 'Dashboard',
  CALENDAR: 'Calendar',
  WORK: 'Work',
  EXAMS: 'Exams',
  NOTES: 'Notes',
  COURSES: 'Courses',
  SHOPPING: 'Shopping',
  TOOLS: 'Tools',
  PROGRESS: 'Progress',
  SETTINGS: 'Settings',
} as const;

export const DASHBOARD_CARDS = {
  TIMELINE: 'timeline',
  OVERVIEW: 'overview',
  PROGRESS: 'progress',
  QUICK_LINKS: 'dashboard_quickLinks',
  // Legacy cards (kept for backwards compatibility / migration)
  NEXT_CLASS: 'nextClass',
  DUE_SOON: 'dueSoon',
  TODAY_TASKS: 'todayTasks',
  UPCOMING_WEEK: 'upcomingWeek',
} as const;

export const TOOLS_CARDS = {
  POMODORO_TIMER: 'pomodoroTimer',
  GRADE_TRACKER: 'gradeTracker',
  GPA_TREND_CHART: 'gpaTrendChart',
  WHAT_IF_PROJECTOR: 'whatIfProjector',
  GPA_CALCULATOR: 'gpaCalculator',
  FINAL_GRADE_CALCULATOR: 'finalGradeCalculator',
  QUICK_LINKS: 'tools_quickLinks',
} as const;

export const DEFAULT_VISIBLE_PAGES = Object.values(PAGES);
// Default to new timeline-based layout (timeline, overview, progress, quick links)
export const DEFAULT_VISIBLE_DASHBOARD_CARDS = [
  DASHBOARD_CARDS.TIMELINE,
  DASHBOARD_CARDS.OVERVIEW,
  DASHBOARD_CARDS.PROGRESS,
  DASHBOARD_CARDS.QUICK_LINKS,
];
// Legacy cards list for users who haven't migrated yet
export const LEGACY_DASHBOARD_CARDS = [
  DASHBOARD_CARDS.NEXT_CLASS,
  DASHBOARD_CARDS.DUE_SOON,
  DASHBOARD_CARDS.OVERVIEW,
  DASHBOARD_CARDS.TODAY_TASKS,
  DASHBOARD_CARDS.QUICK_LINKS,
  DASHBOARD_CARDS.UPCOMING_WEEK,
];
export const DEFAULT_VISIBLE_TOOLS_CARDS = Object.values(TOOLS_CARDS);

export const CARD_LABELS: Record<string, string> = {
  [DASHBOARD_CARDS.TIMELINE]: 'Timeline',
  [DASHBOARD_CARDS.NEXT_CLASS]: 'Next Class',
  [DASHBOARD_CARDS.DUE_SOON]: 'Due Soon',
  [DASHBOARD_CARDS.OVERVIEW]: 'Overview',
  [DASHBOARD_CARDS.PROGRESS]: 'Your Progress',
  [DASHBOARD_CARDS.TODAY_TASKS]: "Today's Tasks",
  [DASHBOARD_CARDS.QUICK_LINKS]: 'Quick Links',
  [DASHBOARD_CARDS.UPCOMING_WEEK]: 'Upcoming This Week',
  [TOOLS_CARDS.QUICK_LINKS]: 'Quick Links',
  [TOOLS_CARDS.POMODORO_TIMER]: 'Pomodoro Timer',
  [TOOLS_CARDS.GRADE_TRACKER]: 'Grade Tracker',
  [TOOLS_CARDS.WHAT_IF_PROJECTOR]: 'What-If GPA Projector',
  [TOOLS_CARDS.GPA_TREND_CHART]: 'GPA Trend',
  [TOOLS_CARDS.GPA_CALCULATOR]: 'GPA Calculator',
  [TOOLS_CARDS.FINAL_GRADE_CALCULATOR]: 'Final Grade Calculator',
};
