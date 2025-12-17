import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Course, Deadline, Task, Settings, AppData } from '@/types';

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

  // Initialization
  initializeStore: () => void;
  loadFromStorage: () => void;

  // Courses
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (id: string, course: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  // Deadlines
  addDeadline: (deadline: Omit<Deadline, 'id' | 'createdAt'>) => void;
  updateDeadline: (id: string, deadline: Partial<Deadline>) => void;
  deleteDeadline: (id: string) => void;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskDone: (id: string) => void;
  toggleTaskPin: (id: string) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;

  // Settings
  updateSettings: (settings: Partial<Settings>) => void;

  // Import/Export
  exportData: () => AppData;
  importData: (data: AppData) => void;
  deleteAllData: () => void;
  saveToStorage: (state: any) => void;
}

const useAppStore = create<AppStore>((set, get) => ({
  courses: [],
  deadlines: [],
  tasks: [],
  settings: DEFAULT_SETTINGS,

  initializeStore: () => {
    get().loadFromStorage();
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
        });
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  },

  addCourse: (course) => {
    const id = uuidv4();
    set((state) => {
      const newCourses = [...state.courses, { ...course, id }];
      const newState = {
        ...state,
        courses: newCourses,
      };
      get().saveToStorage(newState);
      return newState;
    });
  },

  updateCourse: (id, course) => {
    set((state) => {
      const newCourses = state.courses.map((c) =>
        c.id === id ? { ...c, ...course } : c
      );
      const newState = { ...state, courses: newCourses };
      get().saveToStorage(newState);
      return newState;
    });
  },

  deleteCourse: (id) => {
    set((state) => {
      const newCourses = state.courses.filter((c) => c.id !== id);
      const newState = { ...state, courses: newCourses };
      get().saveToStorage(newState);
      return newState;
    });
  },

  addDeadline: (deadline) => {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    set((state) => {
      const newDeadlines = [...state.deadlines, { ...deadline, id, createdAt }];
      const newState = {
        ...state,
        deadlines: newDeadlines,
      };
      get().saveToStorage(newState);
      return newState;
    });
  },

  updateDeadline: (id, deadline) => {
    set((state) => {
      const newDeadlines = state.deadlines.map((d) =>
        d.id === id ? { ...d, ...deadline } : d
      );
      const newState = { ...state, deadlines: newDeadlines };
      get().saveToStorage(newState);
      return newState;
    });
  },

  deleteDeadline: (id) => {
    set((state) => {
      const newDeadlines = state.deadlines.filter((d) => d.id !== id);
      const newState = { ...state, deadlines: newDeadlines };
      get().saveToStorage(newState);
      return newState;
    });
  },

  addTask: (task) => {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    set((state) => {
      const newTasks = [...state.tasks, { ...task, id, createdAt }];
      const newState = {
        ...state,
        tasks: newTasks,
      };
      get().saveToStorage(newState);
      return newState;
    });
  },

  updateTask: (id, task) => {
    set((state) => {
      const newTasks = state.tasks.map((t) =>
        t.id === id ? { ...t, ...task } : t
      );
      const newState = { ...state, tasks: newTasks };
      get().saveToStorage(newState);
      return newState;
    });
  },

  deleteTask: (id) => {
    set((state) => {
      const newTasks = state.tasks.filter((t) => t.id !== id);
      const newState = { ...state, tasks: newTasks };
      get().saveToStorage(newState);
      return newState;
    });
  },

  toggleTaskDone: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (task) {
      get().updateTask(id, { status: task.status === 'done' ? 'open' : 'done' });
    }
  },

  toggleTaskPin: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (task) {
      get().updateTask(id, { pinned: !task.pinned });
    }
  },

  toggleChecklistItem: (taskId, itemId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (task) {
      const newChecklist = task.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      );
      get().updateTask(taskId, { checklist: newChecklist });
    }
  },

  updateSettings: (settings) => {
    set((state) => {
      const newSettings = { ...state.settings, ...settings };
      const newState = { ...state, settings: newSettings };
      get().saveToStorage(newState);
      return newState;
    });
  },

  exportData: () => {
    const state = get();
    return {
      courses: state.courses,
      deadlines: state.deadlines,
      tasks: state.tasks,
      settings: state.settings,
    };
  },

  importData: (data: AppData) => {
    set((state) => {
      const newState = {
        ...state,
        courses: data.courses || [],
        deadlines: data.deadlines || [],
        tasks: data.tasks || [],
        settings: data.settings || DEFAULT_SETTINGS,
      };
      get().saveToStorage(newState);
      return newState;
    });
  },

  deleteAllData: () => {
    set({
      courses: [],
      deadlines: [],
      tasks: [],
      settings: DEFAULT_SETTINGS,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('byu-survival-tool-data');
    }
  },

  saveToStorage: (state: any) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        'byu-survival-tool-data',
        JSON.stringify({
          courses: state.courses,
          deadlines: state.deadlines,
          tasks: state.tasks,
          settings: state.settings,
        })
      );
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  },
}));

export default useAppStore;
