import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Course, Deadline, Task, Settings, AppData, ExcludedDate, GpaEntry } from '@/types';

const DEFAULT_SETTINGS: Settings = {
  dueSoonWindowDays: 7,
  weekStartsOn: 'Sun',
  theme: 'system',
  enableNotifications: false,
};

interface AppStore {
  // Data
  courses: Course[];
  deadlines: Deadline[];
  tasks: Task[];
  settings: Settings;
  excludedDates: ExcludedDate[];
  gpaEntries: GpaEntry[];
  loading: boolean;

  // Initialization
  initializeStore: () => Promise<void>;
  loadFromDatabase: () => Promise<void>;
  loadFromStorage: () => void;

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
  exportData: () => AppData;
  importData: (data: AppData) => Promise<void>;
  deleteAllData: () => void;
}

const useAppStore = create<AppStore>((set, get) => ({
  courses: [],
  deadlines: [],
  tasks: [],
  settings: DEFAULT_SETTINGS,
  excludedDates: [],
  gpaEntries: [],
  loading: false,

  initializeStore: async () => {
    set({ loading: true });
    try {
      // Check if user is authenticated by fetching session
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();

      if (session?.user) {
        // User is authenticated, load from database
        await get().loadFromDatabase();
      } else {
        // User is not authenticated, try loading from localStorage
        get().loadFromStorage();
      }
    } catch (error) {
      console.error('Failed to initialize store:', error);
      get().loadFromStorage();
    } finally {
      set({ loading: false });
    }
  },

  loadFromDatabase: async () => {
    try {
      const [coursesRes, deadlinesRes, tasksRes, settingsRes, excludedDatesRes, gpaRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/deadlines'),
        fetch('/api/tasks'),
        fetch('/api/settings'),
        fetch('/api/excluded-dates'),
        fetch('/api/gpa-entries'),
      ]);

      const coursesData = await coursesRes.json();
      const deadlinesData = await deadlinesRes.json();
      const tasksData = await tasksRes.json();
      const settingsData = await settingsRes.json();
      const excludedDatesData = await excludedDatesRes.json();
      const gpaData = await gpaRes.json();

      set({
        courses: coursesData.courses || [],
        deadlines: deadlinesData.deadlines || [],
        tasks: tasksData.tasks || [],
        settings: settingsData.settings || DEFAULT_SETTINGS,
        excludedDates: excludedDatesData.excludedDates || [],
        gpaEntries: gpaData.entries || [],
      });
    } catch (error) {
      console.error('Failed to load from database:', error);
    }
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('byu-survival-tool-data');
      if (stored) {
        const data: AppData = JSON.parse(stored);
        set({
          courses: data.courses || [],
          deadlines: data.deadlines || [],
          tasks: data.tasks || [],
          settings: data.settings || DEFAULT_SETTINGS,
          excludedDates: data.excludedDates || [],
          gpaEntries: data.gpaEntries || [],
        });
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
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
      const response = await fetch('/api/excluded-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...excludedDate, date: excludedDate.date }),
      });

      if (!response.ok) throw new Error('Failed to create excluded date');

      const { excludedDates: updatedDates } = await response.json();

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
      const response = await fetch('/api/gpa-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gpaEntry),
      });

      if (!response.ok) throw new Error('Failed to create GPA entry');

      // Reload all GPA entries from database to ensure consistency
      const entriesRes = await fetch('/api/gpa-entries');
      if (!entriesRes.ok) throw new Error('Failed to fetch GPA entries');

      const { entries: allEntries } = await entriesRes.json();
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

      // API call
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to update settings');

      const { settings: updatedSettings } = await response.json();

      // Update with server response
      set({ settings: updatedSettings });
    } catch (error) {
      // Reload from database on error
      await get().loadFromDatabase();
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  exportData: () => {
    const state = get();
    return {
      courses: state.courses,
      deadlines: state.deadlines,
      tasks: state.tasks,
      settings: state.settings,
      excludedDates: state.excludedDates,
      gpaEntries: state.gpaEntries,
    };
  },

  importData: async (data: AppData) => {
    const store = get();

    try {
      // Import courses
      if (data.courses && data.courses.length > 0) {
        for (const course of data.courses) {
          const { id, createdAt, updatedAt, ...courseData } = course as any;
          await store.addCourse(courseData);
        }
      }

      // Import deadlines
      if (data.deadlines && data.deadlines.length > 0) {
        for (const deadline of data.deadlines) {
          const { id, createdAt, updatedAt, ...deadlineData } = deadline as any;
          await store.addDeadline(deadlineData);
        }
      }

      // Import tasks
      if (data.tasks && data.tasks.length > 0) {
        for (const task of data.tasks) {
          const { id, createdAt, updatedAt, ...taskData } = task as any;
          await store.addTask(taskData);
        }
      }

      // Import excluded dates
      if (data.excludedDates && data.excludedDates.length > 0) {
        for (const excludedDate of data.excludedDates) {
          const { id, createdAt, updatedAt, ...excludedDateData } = excludedDate as any;
          await store.addExcludedDate(excludedDateData);
        }
      }

      // Import GPA entries
      if (data.gpaEntries && data.gpaEntries.length > 0) {
        for (const gpaEntry of data.gpaEntries) {
          const { id, createdAt, updatedAt, ...gpaEntryData } = gpaEntry as any;
          await store.addGpaEntry(gpaEntryData);
        }
      }

      // Import settings
      if (data.settings) {
        await store.updateSettings(data.settings);
      }
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
        localStorage.removeItem('byu-survival-tool-data');
      }
    } catch (error) {
      console.error('Error deleting all data:', error);
      throw error;
    }
  },
}));

export default useAppStore;
