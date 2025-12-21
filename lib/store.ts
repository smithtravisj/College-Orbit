import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Course, Deadline, Task, Exam, Note, Folder, Settings, AppData, ExcludedDate, GpaEntry } from '@/types';
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
  loading: boolean;
  userId: string | null;

  // Initialization
  initializeStore: () => Promise<void>;
  loadFromDatabase: () => Promise<void>;
  loadFromStorage: () => void;
  setUserId: (userId: string) => void;
  getStorageKey: () => string;

  // Courses
  addCourse: (course: Omit<Course, 'id'>) => Promise<void>;
  updateCourse: (id: string, course: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  // Deadlines
  addDeadline: (deadline: Omit<Deadline, 'id' | 'createdAt'>) => Promise<void>;
  updateDeadline: (id: string, deadline: Partial<Deadline>) => Promise<void>;
  deleteDeadline: (id: string) => Promise<void>;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskDone: (id: string) => Promise<void>;
  toggleChecklistItem: (taskId: string, itemId: string) => Promise<void>;

  // Exams
  addExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => Promise<void>;
  updateExam: (id: string, exam: Partial<Exam>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;

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
      const [coursesRes, deadlinesRes, tasksRes, examsRes, notesRes, foldersRes, settingsRes, excludedDatesRes, gpaRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/deadlines'),
        fetch('/api/tasks'),
        fetch('/api/exams'),
        fetch('/api/notes'),
        fetch('/api/folders'),
        fetch('/api/settings'),
        fetch('/api/excluded-dates'),
        fetch('/api/gpa-entries'),
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
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error deleting deadline:', error);
      throw error;
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

      if (!response.ok) throw new Error('Failed to delete task');
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  toggleTaskDone: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (task) {
      await get().updateTask(id, {
        status: task.status === 'done' ? 'open' : 'done',
      });
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
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error deleting exam:', error);
      throw error;
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

      if (!response.ok) throw new Error('Failed to update settings');

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
      notifications,
    };
  },

  importData: async (data: AppData) => {
    const store = get();

    try {
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
        settings: DEFAULT_SETTINGS,
        excludedDates: [],
        gpaEntries: [],
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
