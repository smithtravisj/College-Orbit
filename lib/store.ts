import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Course, Deadline, Task, Exam, Note, Folder, Settings, AppData, ExcludedDate, GpaEntry, RecurringPattern, RecurringTaskFormData, RecurringDeadlinePattern, RecurringExamPattern, RecurringDeadlineFormData, RecurringExamFormData } from '@/types';
import { applyColorPalette, getCollegeColorPalette } from '@/lib/collegeColors';
import { DEFAULT_VISIBLE_PAGES, DEFAULT_VISIBLE_DASHBOARD_CARDS, DEFAULT_VISIBLE_TOOLS_CARDS } from '@/lib/customizationConstants';

const DEFAULT_SETTINGS: Settings = {
  dueSoonWindowDays: 7,
  weekStartsOn: 'Sun',
  theme: 'dark',
  enableNotifications: false,
  university: null,
  visiblePages: DEFAULT_VISIBLE_PAGES,
  visibleDashboardCards: DEFAULT_VISIBLE_DASHBOARD_CARDS,
  visibleToolsCards: DEFAULT_VISIBLE_TOOLS_CARDS,
  hasCompletedOnboarding: false, // Always show tour on first login
  examReminders: [
    { enabled: true, value: 7, unit: 'days' },
    { enabled: true, value: 1, unit: 'days' },
    { enabled: true, value: 3, unit: 'hours' }
  ],
};

interface AppStore {
  // Data
  courses: Course[];
  deadlines: Deadline[];
  tasks: Task[];
  exams: Exam[];
  notes: Note[];
  folders: Folder[];
  settings: Settings;
  excludedDates: ExcludedDate[];
  gpaEntries: GpaEntry[];
  recurringPatterns: RecurringPattern[];
  recurringDeadlinePatterns: RecurringDeadlinePattern[];
  recurringExamPatterns: RecurringExamPattern[];
  loading: boolean;
  userId: string | null;

  // Initialization
  initializeStore: () => Promise<void>;
  loadFromDatabase: () => Promise<void>;
  loadFromStorage: () => void;
  setUserId: (userId: string) => void;
  getStorageKey: () => string;
  invalidateCalendarCache: () => void;

  // Courses
  addCourse: (course: Omit<Course, 'id'>) => Promise<void>;
  updateCourse: (id: string, course: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  // Deadlines
  addDeadline: (deadline: Omit<Deadline, 'id' | 'createdAt'>) => Promise<void>;
  updateDeadline: (id: string, deadline: Partial<Deadline>) => Promise<void>;
  deleteDeadline: (id: string) => Promise<void>;
  toggleDeadlineComplete: (id: string) => Promise<void>;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskDone: (id: string) => Promise<void>;
  toggleChecklistItem: (taskId: string, itemId: string) => Promise<void>;

  // Recurring Tasks
  addRecurringTask: (taskData: any, recurringData: RecurringTaskFormData) => Promise<void>;
  updateRecurringPattern: (patternId: string, taskData: any, recurringData: RecurringTaskFormData) => Promise<void>;
  deleteRecurringPattern: (patternId: string, deleteInstances: boolean) => Promise<void>;
  pauseRecurringPattern: (patternId: string) => Promise<void>;
  resumeRecurringPattern: (patternId: string) => Promise<void>;

  // Recurring Deadlines
  addRecurringDeadline: (deadlineData: any, recurringData: RecurringDeadlineFormData) => Promise<void>;
  updateRecurringDeadlinePattern: (patternId: string, deadlineData: any, recurringData: RecurringDeadlineFormData) => Promise<void>;
  deleteRecurringDeadlinePattern: (patternId: string, deleteInstances: boolean) => Promise<void>;
  pauseRecurringDeadlinePattern: (patternId: string) => Promise<void>;
  resumeRecurringDeadlinePattern: (patternId: string) => Promise<void>;

  // Recurring Exams
  addRecurringExam: (examData: any, recurringData: RecurringExamFormData) => Promise<void>;
  updateRecurringExamPattern: (patternId: string, examData: any, recurringData: RecurringExamFormData) => Promise<void>;
  deleteRecurringExamPattern: (patternId: string, deleteInstances: boolean) => Promise<void>;
  pauseRecurringExamPattern: (patternId: string) => Promise<void>;
  resumeRecurringExamPattern: (patternId: string) => Promise<void>;

  // Exams
  addExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => Promise<void>;
  updateExam: (id: string, exam: Partial<Exam>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  toggleExamComplete: (id: string) => Promise<void>;

  // Notes
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleNotePin: (id: string) => Promise<void>;

  // Folders
  addFolder: (folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFolder: (id: string, folder: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // Excluded Dates
  addExcludedDate: (excludedDate: Omit<ExcludedDate, 'id' | 'createdAt'>) => Promise<void>;
  addExcludedDateRange: (dates: Array<Omit<ExcludedDate, 'id' | 'createdAt'>>) => Promise<void>;
  updateExcludedDate: (id: string, excludedDate: Partial<ExcludedDate>) => Promise<void>;
  deleteExcludedDate: (id: string) => Promise<void>;

  // GPA Entries
  addGpaEntry: (gpaEntry: Omit<GpaEntry, 'id' | 'createdAt'>) => Promise<void>;

  // Settings
  updateSettings: (settings: Partial<Settings>) => Promise<void>;

  // Import/Export
  exportData: () => Promise<AppData>;
  importData: (data: AppData) => Promise<void>;
  deleteAllData: () => void;
}

const useAppStore = create<AppStore>((set, get) => ({
  courses: [],
  deadlines: [],
  tasks: [],
  exams: [],
  notes: [],
  folders: [],
  settings: DEFAULT_SETTINGS,
  excludedDates: [],
  gpaEntries: [],
  recurringPatterns: [],
  recurringDeadlinePatterns: [],
  recurringExamPatterns: [],
  loading: false,
  userId: null,

  setUserId: (userId: string) => {
    set({ userId });
  },

  getStorageKey: () => {
    const state = get();
    if (state.userId) {
      return `byu-survival-tool-data-${state.userId}`;
    }
    return 'byu-survival-tool-data'; // Fallback for when userId is not set
  },

  // Helper function to invalidate calendar cache when tasks/deadlines/exams change
  invalidateCalendarCache: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('calendarCache');
      } catch (e) {
        console.warn('Failed to clear calendar cache:', e);
      }
    }
  },

  initializeStore: async () => {
    set({ loading: true });
    try {
      // Always load fresh settings from database to ensure we have the latest onboarding state
      await get().loadFromDatabase();
    } catch (error) {
      console.error('Failed to initialize store:', error);
      // Fallback to localStorage only
      get().loadFromStorage();
    } finally {
      set({ loading: false });
    }
  },

  loadFromDatabase: async () => {
    try {
      const [coursesRes, deadlinesRes, tasksRes, examsRes, notesRes, foldersRes, settingsRes, excludedDatesRes, gpaRes, recurringPatternsRes, recurringDeadlinePatternsRes, recurringExamPatternsRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/deadlines'),
        fetch('/api/tasks'),
        fetch('/api/exams'),
        fetch('/api/notes'),
        fetch('/api/folders'),
        fetch('/api/settings'),
        fetch('/api/excluded-dates'),
        fetch('/api/gpa-entries'),
        fetch('/api/recurring-patterns'),
        fetch('/api/recurring-deadline-patterns'),
        fetch('/api/recurring-exam-patterns'),
      ]);

      const coursesData = await coursesRes.json();
      const deadlinesData = await deadlinesRes.json();
      const tasksData = await tasksRes.json();
      const examsData = await examsRes.json();
      const notesData = await notesRes.json();
      const foldersData = await foldersRes.json();
      const settingsData = await settingsRes.json();
      const excludedDatesData = await excludedDatesRes.json();
      const gpaData = await gpaRes.json();
      const recurringPatternsData = await recurringPatternsRes.json();
      const recurringDeadlinePatternsData = await recurringDeadlinePatternsRes.json();
      const recurringExamPatternsData = await recurringExamPatternsRes.json();

      // Extract userId from settings response
      const userId = settingsData.userId;

      const rawSettings = settingsData.settings || DEFAULT_SETTINGS;

      console.log('[Store] Loaded settings from DB:', {
        hasCompletedOnboarding: rawSettings?.hasCompletedOnboarding,
        userId: rawSettings?.userId,
      });

      // Parse JSON fields if they're strings
      const savedVisiblePages = typeof rawSettings?.visiblePages === 'string'
        ? JSON.parse(rawSettings.visiblePages)
        : rawSettings?.visiblePages;
      const savedVisibleDashboardCards = typeof rawSettings?.visibleDashboardCards === 'string'
        ? JSON.parse(rawSettings.visibleDashboardCards)
        : rawSettings?.visibleDashboardCards;
      const savedVisibleToolsCards = typeof rawSettings?.visibleToolsCards === 'string'
        ? JSON.parse(rawSettings.visibleToolsCards)
        : rawSettings?.visibleToolsCards;

      // Merge saved settings with defaults to include new cards
      const parsedSettings = {
        ...rawSettings,
        visiblePages: savedVisiblePages ? [...new Set([...DEFAULT_VISIBLE_PAGES, ...savedVisiblePages])] : DEFAULT_VISIBLE_PAGES,
        visibleDashboardCards: savedVisibleDashboardCards ? [...new Set([...DEFAULT_VISIBLE_DASHBOARD_CARDS, ...savedVisibleDashboardCards])] : DEFAULT_VISIBLE_DASHBOARD_CARDS,
        visibleToolsCards: savedVisibleToolsCards ? [...new Set([...DEFAULT_VISIBLE_TOOLS_CARDS, ...savedVisibleToolsCards])] : DEFAULT_VISIBLE_TOOLS_CARDS,
      };

      const newData = {
        userId: userId || null,
        courses: coursesData.courses || [],
        deadlines: deadlinesData.deadlines || [],
        tasks: tasksData.tasks || [],
        exams: examsData.exams || [],
        notes: notesData.notes || [],
        folders: foldersData.folders || [],
        settings: parsedSettings,
        excludedDates: excludedDatesData.excludedDates || [],
        gpaEntries: gpaData.entries || [],
        recurringPatterns: recurringPatternsData.patterns || [],
        recurringDeadlinePatterns: recurringDeadlinePatternsData.patterns || [],
        recurringExamPatterns: recurringExamPatternsData.patterns || [],
      };

      set(newData);

      // Apply college colors based on loaded settings
      if (typeof window !== 'undefined') {
        const theme = newData.settings?.theme || 'dark';
        const palette = getCollegeColorPalette(
          newData.settings?.university || null,
          theme
        );
        applyColorPalette(palette);
        // Store theme in localStorage for loading screen
        localStorage.setItem('app-theme', theme);
      }

      // Save fresh data to localStorage with user-specific key
      if (typeof window !== 'undefined') {
        try {
          const storageKey = get().getStorageKey();
          localStorage.setItem(storageKey, JSON.stringify(newData));
        } catch (error) {
          console.warn('Failed to save to localStorage:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load from database:', error);
    }
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;

    try {
      const storageKey = get().getStorageKey();
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const data: AppData = JSON.parse(stored);
        const settings = data.settings || DEFAULT_SETTINGS;
        set({
          courses: data.courses || [],
          deadlines: data.deadlines || [],
          tasks: data.tasks || [],
          exams: data.exams || [],
          notes: data.notes || [],
          folders: data.folders || [],
          settings: settings,
          excludedDates: data.excludedDates || [],
          gpaEntries: data.gpaEntries || [],
        });
        // Apply college colors based on loaded settings
        const theme = settings.theme || 'dark';
        const palette = getCollegeColorPalette(
          settings.university || null,
          theme
        );
        applyColorPalette(palette);
        // Store theme in localStorage for loading screen
        localStorage.setItem('app-theme', theme);
      }
    } catch (error) {
      console.error('[loadFromStorage] Failed:', error);
    }
  },

  addCourse: async (course) => {
    // Optimistic update
    const tempId = uuidv4();
    set((state) => ({
      courses: [...state.courses, { ...course, id: tempId } as Course],
    }));

    try {
      // API call
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(`Failed to create course: ${errorData.error} - ${errorData.details}`);
      }

      const { course: newCourse } = await response.json();

      // Replace optimistic with real data
      set((state) => ({
        courses: state.courses.map((c) => (c.id === tempId ? newCourse : c)),
      }));
    } catch (error) {
      // Rollback on error
      set((state) => ({
        courses: state.courses.filter((c) => c.id !== tempId),
      }));
      console.error('Error creating course:', error);
      throw error;
    }
  },

  updateCourse: async (id, course) => {
    try {
      // Optimistic update
      set((state) => ({
        courses: state.courses.map((c) => (c.id === id ? { ...c, ...course } : c)),
      }));

      // API call
      const response = await fetch(`/api/courses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course),
      });

      if (!response.ok) throw new Error('Failed to update course');

      const { course: updatedCourse } = await response.json();

      // Update with server response
      set((state) => ({
        courses: state.courses.map((c) => (c.id === id ? updatedCourse : c)),
      }));
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error updating course:', error);
      throw error;
    }
  },

  deleteCourse: async (id) => {
    try {
      // Optimistic update
      set((state) => ({
        courses: state.courses.filter((c) => c.id !== id),
      }));

      // API call
      const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete course');
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error deleting course:', error);
      throw error;
    }
  },

  addDeadline: async (deadline) => {
    console.log('[Store] addDeadline called with:', JSON.stringify(deadline, null, 2));
    // Optimistic update
    const tempId = uuidv4();
    const createdAt = new Date().toISOString();
    set((state) => ({
      deadlines: [
        ...state.deadlines,
        { ...deadline, id: tempId, createdAt } as Deadline,
      ],
    }));

    try {
      // API call
      const requestBody = JSON.stringify(deadline);
      console.log('[Store] Sending request body:', requestBody);
      const response = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Store] API error response:', errorData);
        throw new Error(`Failed to create deadline: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('[Store] API response:', JSON.stringify(responseData, null, 2));
      const { deadline: newDeadline } = responseData;

      // Replace optimistic with real data
      set((state) => ({
        deadlines: state.deadlines.map((d) =>
          d.id === tempId ? newDeadline : d
        ),
      }));
      get().invalidateCalendarCache();
    } catch (error) {
      // Rollback on error
      set((state) => ({
        deadlines: state.deadlines.filter((d) => d.id !== tempId),
      }));
      console.error('[Store] Error creating deadline:', error);
      throw error;
    }
  },

  updateDeadline: async (id, deadline) => {
    console.log('[Store] updateDeadline called for ID:', id);
    console.log('[Store] Update payload:', JSON.stringify(deadline, null, 2));
    try {
      // Optimistic update
      set((state) => ({
        deadlines: state.deadlines.map((d) =>
          d.id === id ? { ...d, ...deadline } : d
        ),
      }));

      // API call
      const requestBody = JSON.stringify(deadline);
      console.log('[Store] Sending PATCH request body:', requestBody);
      const response = await fetch(`/api/deadlines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Store] API error response:', errorData);
        throw new Error(`Failed to update deadline: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('[Store] API response:', JSON.stringify(responseData, null, 2));
      const { deadline: updatedDeadline } = responseData;

      // Update with server response
      set((state) => ({
        deadlines: state.deadlines.map((d) =>
          d.id === id ? updatedDeadline : d
        ),
      }));
      get().invalidateCalendarCache();
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('[Store] Error updating deadline:', error);
      throw error;
    }
  },

  deleteDeadline: async (id) => {
    try {
      // Optimistic update
      set((state) => ({
        deadlines: state.deadlines.filter((d) => d.id !== id),
      }));

      // API call
      const response = await fetch(`/api/deadlines/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete deadline');
      get().invalidateCalendarCache();
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error deleting deadline:', error);
      throw error;
    }
  },

  toggleDeadlineComplete: async (id) => {
    const currentDeadlines = get().deadlines;
    const deadline = currentDeadlines.find((d) => d.id === id);
    if (deadline) {
      const oldStatus = deadline.status;

      await get().updateDeadline(id, {
        status: oldStatus === 'done' ? 'open' : 'done',
      });

      // Reload from database to ensure correct recurring deadline instances are shown
      // (when toggling status, the next instance of a pattern might change)
      if (deadline.isRecurring && oldStatus === 'done') {
        // Only reload when marking as uncomplete - this brings back the deadline instance
        await get().loadFromDatabase();
      }
    }
  },

  addTask: async (task) => {
    // Optimistic update
    const tempId = uuidv4();
    const createdAt = new Date().toISOString();
    set((state) => ({
      tasks: [...state.tasks, { ...task, id: tempId, createdAt } as Task],
    }));

    try {
      // API call
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });

      if (!response.ok) throw new Error('Failed to create task');

      const { task: newTask } = await response.json();

      // Replace optimistic with real data
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === tempId ? newTask : t)),
      }));
      get().invalidateCalendarCache();
    } catch (error) {
      // Rollback on error
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== tempId),
      }));
      console.error('Error creating task:', error);
      throw error;
    }
  },

  updateTask: async (id, task) => {
    try {
      // Optimistic update
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...task } : t)),
      }));

      // API call
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });

      if (!response.ok) throw new Error('Failed to update task');

      const { task: updatedTask } = await response.json();

      // Update with server response
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
      }));
      get().invalidateCalendarCache();
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      // Optimistic update
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));

      // API call
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      // Don't reload on success - optimistic delete is final
      get().invalidateCalendarCache();
    } catch (error) {
      // Only reload on actual error, to restore the deleted task
      console.error('Error deleting task:', error);
      await get().loadFromDatabase();
      throw error;
    }
  },

  toggleTaskDone: async (id) => {
    const currentTasks = get().tasks;
    const task = currentTasks.find((t) => t.id === id);
    if (task) {
      // Check if task is still in state before reloading
      // (it might have been deleted)
      const oldStatus = task.status;

      await get().updateTask(id, {
        status: oldStatus === 'done' ? 'open' : 'done',
      });

      // Reload from database to ensure correct recurring task instances are shown
      // (when toggling status, the next instance of a pattern might change)
      if (task.isRecurring && oldStatus === 'done') {
        // Only reload when marking as uncomplete - this brings back the task instance
        await get().loadFromDatabase();
      }
    }
  },

  toggleChecklistItem: async (taskId, itemId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (task) {
      const newChecklist = task.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      );
      await get().updateTask(taskId, { checklist: newChecklist });
    }
  },

  addExam: async (exam) => {
    // Optimistic update
    const tempId = uuidv4();
    const createdAt = new Date().toISOString();
    set((state) => ({
      exams: [...state.exams, { ...exam, id: tempId, createdAt } as Exam],
    }));

    try {
      // API call
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exam),
      });

      if (!response.ok) throw new Error('Failed to create exam');

      const { exam: newExam } = await response.json();

      // Replace optimistic with real data
      set((state) => ({
        exams: state.exams.map((e) => (e.id === tempId ? newExam : e)),
      }));
      get().invalidateCalendarCache();
    } catch (error) {
      // Rollback on error
      set((state) => ({
        exams: state.exams.filter((e) => e.id !== tempId),
      }));
      console.error('Error creating exam:', error);
      throw error;
    }
  },

  updateExam: async (id, exam) => {
    try {
      // Optimistic update
      set((state) => ({
        exams: state.exams.map((e) => (e.id === id ? { ...e, ...exam } : e)),
      }));

      // API call
      const response = await fetch(`/api/exams/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exam),
      });

      if (!response.ok) throw new Error('Failed to update exam');

      const { exam: updatedExam } = await response.json();

      // Update with server response
      set((state) => ({
        exams: state.exams.map((e) => (e.id === id ? updatedExam : e)),
      }));
      get().invalidateCalendarCache();
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error updating exam:', error);
      throw error;
    }
  },

  deleteExam: async (id) => {
    try {
      // Optimistic update
      set((state) => ({
        exams: state.exams.filter((e) => e.id !== id),
      }));

      // API call
      const response = await fetch(`/api/exams/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete exam');
      get().invalidateCalendarCache();
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error deleting exam:', error);
      throw error;
    }
  },

  toggleExamComplete: async (id) => {
    const currentExams = get().exams;
    const exam = currentExams.find((e) => e.id === id);
    if (exam) {
      const oldStatus = exam.status;

      await get().updateExam(id, {
        status: oldStatus === 'completed' ? 'scheduled' : 'completed',
      });
    }
  },

  // Notes
  addNote: async (note) => {
    // Optimistic update with temp ID and timestamps
    const tempId = uuidv4();
    const now = new Date().toISOString();
    set((state) => ({
      notes: [...state.notes, {
        ...note,
        id: tempId,
        createdAt: now,
        updatedAt: now,
      } as Note],
    }));

    try {
      // API call
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });

      if (!response.ok) throw new Error('Failed to create note');

      const { note: newNote } = await response.json();

      // Replace temp note with server response
      set((state) => ({
        notes: state.notes.map((n) => (n.id === tempId ? newNote : n)),
      }));
    } catch (error) {
      // Rollback on error
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== tempId),
      }));
      console.error('Error creating note:', error);
      throw error;
    }
  },

  updateNote: async (id, note) => {
    try {
      // Optimistic update
      set((state) => ({
        notes: state.notes.map((n) =>
          n.id === id ? { ...n, ...note, updatedAt: new Date().toISOString() } : n
        ),
      }));

      // API call
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });

      if (!response.ok) throw new Error('Failed to update note');

      const { note: updatedNote } = await response.json();

      // Update with server response
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
      }));
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error updating note:', error);
      throw error;
    }
  },

  deleteNote: async (id) => {
    try {
      // Optimistic update
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      }));

      // API call
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete note');
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error deleting note:', error);
      throw error;
    }
  },

  toggleNotePin: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;

    try {
      // Optimistic update
      const newPinState = !note.isPinned;
      set((state) => ({
        notes: state.notes.map((n) =>
          n.id === id ? { ...n, isPinned: newPinState } : n
        ),
      }));

      // API call
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: newPinState }),
      });

      if (!response.ok) throw new Error('Failed to toggle pin');

      const { note: updatedNote } = await response.json();

      // Update with server response
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
      }));
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error toggling note pin:', error);
      throw error;
    }
  },

  // Folders
  addFolder: async (folder) => {
    // Optimistic update with temp ID and timestamps
    const tempId = uuidv4();
    const now = new Date().toISOString();
    set((state) => ({
      folders: [...state.folders, {
        ...folder,
        id: tempId,
        createdAt: now,
        updatedAt: now,
      } as Folder],
    }));

    try {
      // API call
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folder),
      });

      if (!response.ok) throw new Error('Failed to create folder');

      const { folder: newFolder } = await response.json();

      // Replace temp folder with server response
      set((state) => ({
        folders: state.folders.map((f) => (f.id === tempId ? newFolder : f)),
      }));
    } catch (error) {
      // Rollback on error
      set((state) => ({
        folders: state.folders.filter((f) => f.id !== tempId),
      }));
      console.error('Error creating folder:', error);
      throw error;
    }
  },

  updateFolder: async (id, folder) => {
    try {
      // Optimistic update
      set((state) => ({
        folders: state.folders.map((f) =>
          f.id === id ? { ...f, ...folder, updatedAt: new Date().toISOString() } : f
        ),
      }));

      // API call
      const response = await fetch(`/api/folders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folder),
      });

      if (!response.ok) throw new Error('Failed to update folder');

      const { folder: updatedFolder } = await response.json();

      // Update with server response
      set((state) => ({
        folders: state.folders.map((f) => (f.id === id ? updatedFolder : f)),
      }));
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error updating folder:', error);
      throw error;
    }
  },

  deleteFolder: async (id) => {
    try {
      // Optimistic update
      set((state) => ({
        folders: state.folders.filter((f) => f.id !== id),
        // Also remove notes from this folder
        notes: state.notes.map((n) =>
          n.folderId === id ? { ...n, folderId: null } : n
        ),
      }));

      // API call
      const response = await fetch(`/api/folders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete folder');
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error deleting folder:', error);
      throw error;
    }
  },

  addExcludedDate: async (excludedDate) => {
    // Optimistic update
    const tempId = uuidv4();
    const createdAt = new Date().toISOString();
    set((state) => ({
      excludedDates: [
        ...state.excludedDates,
        { ...excludedDate, id: tempId, createdAt } as ExcludedDate,
      ],
    }));

    try {
      // API call
      const requestBody = { ...excludedDate, date: excludedDate.date };
      console.log('[addExcludedDate] Sending request:', JSON.stringify(requestBody));

      const response = await fetch('/api/excluded-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('[addExcludedDate] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[addExcludedDate] Error response:', errorData);
        throw new Error(`Failed to create excluded date: ${errorData.error || response.statusText}`);
      }

      const { excludedDates: updatedDates } = await response.json();
      console.log('[addExcludedDate] Updated dates:', updatedDates.length);

      // Replace with server data
      set({
        excludedDates: updatedDates,
      });
    } catch (error) {
      // Rollback on error
      set((state) => ({
        excludedDates: state.excludedDates.filter((ed) => ed.id !== tempId),
      }));
      console.error('Error creating excluded date:', error);
      throw error;
    }
  },

  addExcludedDateRange: async (dates) => {
    // Optimistic update
    const tempIds = dates.map(() => uuidv4());
    const createdAt = new Date().toISOString();
    set((state) => ({
      excludedDates: [
        ...state.excludedDates,
        ...dates.map((d, idx) => ({ ...d, id: tempIds[idx], createdAt }) as ExcludedDate),
      ],
    }));

    try {
      // Prepare dates array for API
      if (dates.length > 0) {
        const response = await fetch('/api/excluded-dates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dates: dates.map((d) => d.date),
            description: dates[0].description,
            courseId: dates[0].courseId || null,
          }),
        });

        if (!response.ok) throw new Error('Failed to create excluded dates');

        const { excludedDates: updatedDates } = await response.json();

        // Replace with server data
        set({
          excludedDates: updatedDates,
        });
      }
    } catch (error) {
      // Rollback on error
      set((state) => ({
        excludedDates: state.excludedDates.filter((ed) => !tempIds.includes(ed.id)),
      }));
      console.error('Error creating excluded date range:', error);
      throw error;
    }
  },

  updateExcludedDate: async (id, excludedDate) => {
    try {
      // Optimistic update
      set((state) => ({
        excludedDates: state.excludedDates.map((ed) =>
          ed.id === id ? { ...ed, ...excludedDate } : ed
        ),
      }));

      // API call
      const response = await fetch(`/api/excluded-dates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(excludedDate),
      });

      if (!response.ok) throw new Error('Failed to update excluded date');

      const { excludedDate: updatedExcludedDate } = await response.json();

      // Update with server response
      set((state) => ({
        excludedDates: state.excludedDates.map((ed) =>
          ed.id === id ? updatedExcludedDate : ed
        ),
      }));
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error updating excluded date:', error);
      throw error;
    }
  },

  deleteExcludedDate: async (id) => {
    try {
      // Optimistic update
      set((state) => ({
        excludedDates: state.excludedDates.filter((ed) => ed.id !== id),
      }));

      // API call
      const response = await fetch(`/api/excluded-dates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete excluded date');
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error deleting excluded date:', error);
      throw error;
    }
  },

  addGpaEntry: async (gpaEntry) => {
    // Optimistic update
    const tempId = uuidv4();
    const createdAt = new Date().toISOString();
    set((state) => ({
      gpaEntries: [
        ...state.gpaEntries,
        { ...gpaEntry, id: tempId, createdAt } as GpaEntry,
      ],
    }));

    try {
      // API call
      console.log('[addGpaEntry] Sending request:', JSON.stringify(gpaEntry));

      const response = await fetch('/api/gpa-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gpaEntry),
      });

      console.log('[addGpaEntry] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[addGpaEntry] Error response:', errorData);
        throw new Error(`Failed to create GPA entry: ${errorData.error || response.statusText}`);
      }

      // Reload all GPA entries from database to ensure consistency
      const entriesRes = await fetch('/api/gpa-entries');
      if (!entriesRes.ok) throw new Error('Failed to fetch GPA entries');

      const { entries: allEntries } = await entriesRes.json();
      console.log('[addGpaEntry] Updated entries:', allEntries.length);
      set({
        gpaEntries: allEntries,
      });
    } catch (error) {
      // Rollback on error
      set((state) => ({
        gpaEntries: state.gpaEntries.filter((ge) => ge.id !== tempId),
      }));
      console.error('Error creating GPA entry:', error);
      throw error;
    }
  },

  updateSettings: async (settings) => {
    try {
      // Optimistic update
      set((state) => ({
        settings: { ...state.settings, ...settings },
      }));

      // Apply colors if college or theme changed
      if ((settings.university !== undefined || settings.theme !== undefined) && typeof window !== 'undefined') {
        const currentState = get().settings;
        const newTheme = settings.theme !== undefined ? settings.theme : (currentState.theme || 'dark');
        const palette = getCollegeColorPalette(
          settings.university !== undefined ? settings.university : (currentState.university || null),
          newTheme
        );
        applyColorPalette(palette);
        // Store theme in localStorage for loading screen to access
        localStorage.setItem('app-theme', newTheme);
      }

      // Update localStorage with new settings
      if (typeof window !== 'undefined') {
        try {
          const appData = get();
          const newData = {
            courses: appData.courses,
            deadlines: appData.deadlines,
            tasks: appData.tasks,
            settings: { ...appData.settings, ...settings },
            excludedDates: appData.excludedDates,
            gpaEntries: appData.gpaEntries,
          };
          const storageKey = get().getStorageKey();
          localStorage.setItem(storageKey, JSON.stringify(newData));
        } catch (error) {
          console.warn('Failed to save to localStorage:', error);
        }
      }

      // API call
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`Failed to update settings: ${JSON.stringify(errorData)}`);
      }

      const { settings: updatedSettings } = await response.json();

      // Only update if server response differs from optimistic update
      const currentState = get().settings;
      const needsUpdate = JSON.stringify(currentState) !== JSON.stringify(updatedSettings);
      if (needsUpdate) {
        set({ settings: updatedSettings });
        // Update localStorage with server response
        if (typeof window !== 'undefined') {
          try {
            const appData = get();
            const storageKey = get().getStorageKey();
            localStorage.setItem(storageKey, JSON.stringify({
              courses: appData.courses,
              deadlines: appData.deadlines,
              tasks: appData.tasks,
              settings: updatedSettings,
              excludedDates: appData.excludedDates,
              gpaEntries: appData.gpaEntries,
            }));
          } catch (error) {
            console.warn('Failed to save to localStorage:', error);
          }
        }
      }

    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  exportData: async () => {
    const state = get();

    // Fetch notifications from API
    let notifications = [];
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        notifications = data.notifications || [];
      }
    } catch (error) {
      console.error('Failed to fetch notifications for export:', error);
    }

    return {
      courses: state.courses,
      deadlines: state.deadlines,
      tasks: state.tasks,
      exams: state.exams,
      notes: state.notes,
      folders: state.folders,
      settings: state.settings,
      excludedDates: state.excludedDates,
      gpaEntries: state.gpaEntries,
      recurringPatterns: state.recurringPatterns,
      recurringDeadlinePatterns: state.recurringDeadlinePatterns,
      recurringExamPatterns: state.recurringExamPatterns,
      notifications,
    };
  },

  importData: async (data: AppData) => {
    const store = get();

    try {
      // Validate import data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format: expected an object');
      }

      if (!Array.isArray(data.courses)) {
        throw new Error('Invalid data format: courses must be an array');
      }

      if (!Array.isArray(data.deadlines)) {
        throw new Error('Invalid data format: deadlines must be an array');
      }

      if (!Array.isArray(data.tasks)) {
        throw new Error('Invalid data format: tasks must be an array');
      }

      if (!Array.isArray(data.exams)) {
        throw new Error('Invalid data format: exams must be an array');
      }

      if (!Array.isArray(data.notes)) {
        throw new Error('Invalid data format: notes must be an array');
      }

      if (!Array.isArray(data.folders)) {
        throw new Error('Invalid data format: folders must be an array');
      }

      if (!Array.isArray(data.excludedDates)) {
        throw new Error('Invalid data format: excludedDates must be an array');
      }

      if (data.settings && typeof data.settings !== 'object') {
        throw new Error('Invalid data format: settings must be an object');
      }

      console.log('Import data validation passed');
      // Import courses
      if (data.courses && data.courses.length > 0) {
        console.log('Importing courses:', data.courses.length);
        for (const course of data.courses) {
          const { id, createdAt, updatedAt, userId, ...courseData } = course as any;
          await store.addCourse(courseData);
        }
      }

      // Import deadlines
      if (data.deadlines && data.deadlines.length > 0) {
        console.log('Importing deadlines:', data.deadlines.length);
        for (const deadline of data.deadlines) {
          const { id, createdAt, updatedAt, userId, ...deadlineData } = deadline as any;
          await store.addDeadline(deadlineData);
        }
      }

      // Import tasks
      if (data.tasks && data.tasks.length > 0) {
        console.log('Importing tasks:', data.tasks.length);
        for (const task of data.tasks) {
          const { id, createdAt, updatedAt, userId, ...taskData } = task as any;
          await store.addTask(taskData);
        }
      }

      // Import exams
      if (data.exams && data.exams.length > 0) {
        console.log('Importing exams:', data.exams.length);
        for (const exam of data.exams) {
          const { id, createdAt, userId, ...examData } = exam as any;
          await store.addExam(examData);
        }
      }

      // Import folders (before notes to ensure folders exist)
      if (data.folders && data.folders.length > 0) {
        console.log('Importing folders:', data.folders.length);
        for (const folder of data.folders) {
          const { id, createdAt, updatedAt, userId, ...folderData } = folder as any;
          await store.addFolder(folderData);
        }
      }

      // Import notes
      if (data.notes && data.notes.length > 0) {
        console.log('Importing notes:', data.notes.length);
        for (const note of data.notes) {
          const { id, createdAt, updatedAt, userId, ...noteData } = note as any;
          await store.addNote(noteData);
        }
      }

      // Import excluded dates
      if (data.excludedDates && data.excludedDates.length > 0) {
        console.log('Importing excluded dates:', data.excludedDates.length);

        // Reload courses from database to ensure we have all newly imported courses
        const coursesRes = await fetch('/api/courses');
        const coursesData = await coursesRes.json();
        const currentCourses = coursesData.courses || [];

        // Build a map of course names to IDs for matching
        const courseMap = new Map(currentCourses.map((c: Course) => [c.name, c.id]));
        console.log('Available courses for matching:', Array.from(courseMap.keys()));

        for (const excludedDate of data.excludedDates) {
          const { id, createdAt, updatedAt, userId, courseId: originalCourseId, ...excludedDateData } = excludedDate as any;

          // Try to find a matching course in the new account by name
          let newCourseId = undefined;
          if (originalCourseId) {
            // Find the course name from the original data
            const originalCourse = data.courses?.find(c => c.id === originalCourseId);
            if (originalCourse) {
              console.log('Original course for excluded date:', originalCourse.name);
              if (courseMap.has(originalCourse.name)) {
                newCourseId = courseMap.get(originalCourse.name);
                console.log('Matched course for excluded date:', originalCourse.name, '(new ID:', newCourseId, ')');
              } else {
                console.log('No matching course found for:', originalCourse.name);
              }
            }
          }

          // Add courseId if we found a match, otherwise leave it out for global holidays
          const excludedDateToAdd = newCourseId ? { ...excludedDateData, courseId: newCourseId } : excludedDateData;
          console.log('Adding excluded date:', excludedDateToAdd);
          await store.addExcludedDate(excludedDateToAdd);
        }
      } else {
        console.log('No excluded dates to import');
      }

      // Import GPA entries
      if (data.gpaEntries && data.gpaEntries.length > 0) {
        console.log('Importing GPA entries:', data.gpaEntries.length);
        for (const gpaEntry of data.gpaEntries) {
          const { id, createdAt, updatedAt, userId, courseId, ...gpaEntryData } = gpaEntry as any;
          console.log('Adding GPA entry:', gpaEntryData);
          await store.addGpaEntry(gpaEntryData);
        }
      } else {
        console.log('No GPA entries to import');
      }

      // Import recurring task patterns
      if (data.recurringPatterns && data.recurringPatterns.length > 0) {
        console.log('Importing recurring task patterns:', data.recurringPatterns.length);
        for (const pattern of data.recurringPatterns) {
          const { id, createdAt, updatedAt, userId, ...patternData } = pattern as any;
          // Post to create recurring task pattern via API
          const response = await fetch('/api/recurring-patterns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patternData),
          });
          if (!response.ok) {
            console.error('Failed to import recurring task pattern:', patternData);
          }
        }
      }

      // Import recurring deadline patterns
      if (data.recurringDeadlinePatterns && data.recurringDeadlinePatterns.length > 0) {
        console.log('Importing recurring deadline patterns:', data.recurringDeadlinePatterns.length);
        for (const pattern of data.recurringDeadlinePatterns) {
          const { id, createdAt, updatedAt, userId, ...patternData } = pattern as any;
          // Post to create recurring deadline pattern via API
          const response = await fetch('/api/recurring-deadline-patterns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patternData),
          });
          if (!response.ok) {
            console.error('Failed to import recurring deadline pattern:', patternData);
          }
        }
      }

      // Import recurring exam patterns
      if (data.recurringExamPatterns && data.recurringExamPatterns.length > 0) {
        console.log('Importing recurring exam patterns:', data.recurringExamPatterns.length);
        for (const pattern of data.recurringExamPatterns) {
          const { id, createdAt, updatedAt, userId, ...patternData } = pattern as any;
          // Post to create recurring exam pattern via API
          const response = await fetch('/api/recurring-exam-patterns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patternData),
          });
          if (!response.ok) {
            console.error('Failed to import recurring exam pattern:', patternData);
          }
        }
      }

      // Import settings
      if (data.settings) {
        await store.updateSettings(data.settings);
      }

      // Note: Notifications are exported for backup purposes but not imported
      // since they are auto-generated by the system for user's new account
      console.log('Notifications are not imported (auto-generated by system)');
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  },

  addRecurringTask: async (taskData, recurringData) => {
    try {
      // API call to create recurring task
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskData,
          recurring: recurringData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create recurring task');
      }

      // Reload from database to get new instances
      await get().loadFromDatabase();
    } catch (error) {
      console.error('Error creating recurring task:', error);
      throw error;
    }
  },

  updateRecurringPattern: async (patternId, taskData, recurringData) => {
    try {
      // Update the recurring pattern with new settings
      const updatePayload = {
        recurrenceType: recurringData.recurrenceType,
        intervalDays: recurringData.recurrenceType === 'custom' ? recurringData.customIntervalDays : null,
        daysOfWeek: recurringData.recurrenceType === 'weekly'
          ? recurringData.daysOfWeek
          : [],
        daysOfMonth: recurringData.recurrenceType === 'monthly'
          ? recurringData.daysOfMonth
          : [],
        startDate: recurringData.startDate ? recurringData.startDate : null,
        endDate: recurringData.endCondition === 'date' ? recurringData.endDate : null,
        occurrenceCount: recurringData.endCondition === 'count' ? recurringData.occurrenceCount : null,
        taskTemplate: {
          title: taskData.title,
          courseId: taskData.courseId || null,
          notes: taskData.notes,
          links: taskData.links || [],
          dueTime: recurringData.dueTime,
        },
      };

      console.log('[updateRecurringPattern] Sending payload:', JSON.stringify(updatePayload, null, 2));

      const response = await fetch(`/api/recurring-patterns/${patternId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update recurring pattern');
      }

      // Reload from database
      await get().loadFromDatabase();
    } catch (error) {
      console.error('Error updating recurring pattern:', error);
      throw error;
    }
  },

  deleteRecurringPattern: async (patternId, deleteInstances) => {
    try {
      const response = await fetch(
        `/api/recurring-patterns?id=${patternId}&deleteInstances=${deleteInstances}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete pattern');

      // Reload from database
      await get().loadFromDatabase();
    } catch (error) {
      console.error('Error deleting pattern:', error);
      throw error;
    }
  },

  pauseRecurringPattern: async (patternId) => {
    try {
      const response = await fetch(`/api/recurring-patterns/${patternId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });

      if (!response.ok) throw new Error('Failed to pause pattern');

      await get().loadFromDatabase();
    } catch (error) {
      console.error('Error pausing pattern:', error);
      throw error;
    }
  },

  resumeRecurringPattern: async (patternId) => {
    try {
      const response = await fetch(`/api/recurring-patterns/${patternId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });

      if (!response.ok) throw new Error('Failed to resume pattern');

      await get().loadFromDatabase();
    } catch (error) {
      console.error('Error resuming pattern:', error);
      throw error;
    }
  },

  addRecurringDeadline: async (deadlineData, recurringData) => {
    try {
      const response = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...deadlineData,
          recurring: recurringData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create recurring deadline');
      }

      await get().loadFromDatabase();
    } catch (error) {
      console.error('Error creating recurring deadline:', error);
      throw error;
    }
  },

  updateRecurringDeadlinePattern: async (patternId, deadlineData, recurringData) => {
    try {
      const updatePayload = {
        recurrenceType: recurringData.recurrenceType,
        intervalDays: recurringData.recurrenceType === 'custom' ? recurringData.customIntervalDays : null,
        daysOfWeek: recurringData.recurrenceType === 'weekly'
          ? recurringData.daysOfWeek
          : [],
        daysOfMonth: recurringData.recurrenceType === 'monthly'
          ? recurringData.daysOfMonth
          : [],
        startDate: recurringData.startDate ? recurringData.startDate : null,
        endDate: recurringData.endCondition === 'date' ? recurringData.endDate : null,
        occurrenceCount: recurringData.endCondition === 'count' ? recurringData.occurrenceCount : null,
        deadlineTemplate: {
          title: deadlineData.title,
          courseId: deadlineData.courseId || null,
          notes: deadlineData.notes,
          links: deadlineData.links || [],
        },
      };

      const response = await fetch(`/api/recurring-deadline-patterns/${patternId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update recurring deadline pattern');
      }

      await get().loadFromDatabase();
    } catch (error) {
      console.error('Error updating recurring deadline pattern:', error);
      throw error;
    }
  },

  deleteRecurringDeadlinePattern: async (patternId, deleteInstances) => {
    try {
      const response = await fetch(
        `/api/recurring-deadline-patterns?id=${patternId}&deleteInstances=${deleteInstances}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete pattern');

      await get().loadFromDatabase();
    } catch (error) {
      console.error('Error deleting deadline pattern:', error);
      throw error;
    }
  },

  pauseRecurringDeadlinePattern: async (patternId) => {
    try {
      const response = await fetch(`/api/recurring-deadline-patterns/${patternId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });

      if (!response.ok) throw new Error('Failed to pause pattern');

      await get().loadFromDatabase();
    } catch (error) {
      console.error('Error pausing deadline pattern:', error);
      throw error;
    }
  },

  resumeRecurringDeadlinePattern: async (patternId) => {
    try {
      const response = await fetch(`/api/recurring-deadline-patterns/${patternId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });

      if (!response.ok) throw new Error('Failed to resume pattern');

      await get().loadFromDatabase();
    } catch (error) {
      console.error('Error resuming deadline pattern:', error);
      throw error;
    }
  },

  addRecurringExam: async (examData, recurringData) => {
    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...examData,
          recurring: recurringData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create recurring exam');
      }

      await get().loadFromDatabase();
    } catch (error) {
      console.error('Error creating recurring exam:', error);
      throw error;
    }
  },

  updateRecurringExamPattern: async (patternId, examData, recurringData) => {
    try {
      // Convert examTime to a full datetime string for storage in template
      let templateExamAt: string | null = null;
      if (recurringData.examTime && recurringData.examTime.trim()) {
        try {
          const [hours, minutes] = recurringData.examTime.split(':').map(Number);
          const dummyDate = new Date();
          dummyDate.setHours(hours, minutes, 0, 0);
          templateExamAt = dummyDate.toISOString();
        } catch (e) {
          templateExamAt = null;
        }
      }

      const updatePayload = {
        recurrenceType: recurringData.recurrenceType,
        intervalDays: recurringData.recurrenceType === 'custom' ? recurringData.customIntervalDays : null,
        daysOfWeek: recurringData.recurrenceType === 'weekly'
          ? recurringData.daysOfWeek
          : [],
        daysOfMonth: recurringData.recurrenceType === 'monthly'
          ? recurringData.daysOfMonth
          : [],
        startDate: recurringData.startDate ? recurringData.startDate : null,
        endDate: recurringData.endCondition === 'date' ? recurringData.endDate : null,
        occurrenceCount: recurringData.endCondition === 'count' ? recurringData.occurrenceCount : null,
        examTemplate: {
          title: examData.title,
          courseId: examData.courseId || null,
          notes: examData.notes,
          links: examData.links || [],
          location: examData.location || null,
          examAt: templateExamAt,
        },
      };

      const response = await fetch(`/api/recurring-exam-patterns/${patternId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update recurring exam pattern');
      }

      await get().loadFromDatabase();
    } catch (error) {
      console.error('Error updating recurring exam pattern:', error);
      throw error;
    }
  },

  deleteRecurringExamPattern: async (patternId, deleteInstances) => {
    try {
      const response = await fetch(
        `/api/recurring-exam-patterns?id=${patternId}&deleteInstances=${deleteInstances}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete pattern');

      await get().loadFromDatabase();
    } catch (error) {
      console.error('Error deleting exam pattern:', error);
      throw error;
    }
  },

  pauseRecurringExamPattern: async (patternId) => {
    try {
      const response = await fetch(`/api/recurring-exam-patterns/${patternId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });

      if (!response.ok) throw new Error('Failed to pause pattern');

      await get().loadFromDatabase();
    } catch (error) {
      console.error('Error pausing exam pattern:', error);
      throw error;
    }
  },

  resumeRecurringExamPattern: async (patternId) => {
    try {
      const response = await fetch(`/api/recurring-exam-patterns/${patternId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });

      if (!response.ok) throw new Error('Failed to resume pattern');

      await get().loadFromDatabase();
    } catch (error) {
      console.error('Error resuming exam pattern:', error);
      throw error;
    }
  },

  deleteAllData: async () => {
    try {
      // Delete from database via API
      const response = await fetch('/api/user/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to delete data from database');
      }

      // Clear store
      set({
        courses: [],
        deadlines: [],
        tasks: [],
        exams: [],
        notes: [],
        folders: [],
        settings: DEFAULT_SETTINGS,
        excludedDates: [],
        gpaEntries: [],
        recurringPatterns: [],
        recurringDeadlinePatterns: [],
        recurringExamPatterns: [],
      });

      // Clear localStorage
      if (typeof window !== 'undefined') {
        const storageKey = get().getStorageKey();
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Error deleting all data:', error);
      throw error;
    }
  },
}));

export default useAppStore;
