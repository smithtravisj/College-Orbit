'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/lib/store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useSubscription } from '@/hooks/useSubscription';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import { getThemeColors } from '@/lib/visualThemes';
import { useIsLightMode } from '@/hooks/useEffectiveTheme';
import { useHighlightElement } from '@/hooks/useHighlightElement';
import CalendarMonthView from './CalendarMonthView';
import CalendarDayView from './CalendarDayView';
import CalendarWeekView from './CalendarWeekView';
import CalendarLegend from './CalendarLegend';
import ExcludedDatesCard from '@/components/ExcludedDatesCard';
import AddEventModal from './AddEventModal';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CalendarEvent } from '@/types';

type ViewType = 'month' | 'week' | 'day';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedCalendarData {
  tasks: any[];
  deadlines: any[];
  workItems: any[];
  exams: any[];
  calendarEvents: CalendarEvent[];
  courses: any[];
  excludedDates: any[];
  timestamp: number;
}

export default function CalendarContent() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile();
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';
  const isLightMode = useIsLightMode();

  // Handle scroll-to and highlight from global search
  useHighlightElement();

  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);
  const savedVisualTheme = useAppStore((state) => state.settings.visualTheme);
  const savedGlowIntensity = useAppStore((state) => state.settings.glowIntensity) ?? 50;

  // Custom theme and visual effects are only active for premium users
  const { isPremium } = useSubscription();
  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;
  const visualTheme = isPremium ? savedVisualTheme : null;
  const glowIntensity = isPremium ? savedGlowIntensity : 50;

  const colorPalette = getCollegeColorPalette(university || null, theme);
  // Visual theme takes priority
  const accentColor = (() => {
    if (visualTheme && visualTheme !== 'default') {
      const themeColors = getThemeColors(visualTheme, theme);
      if (themeColors.accent) return themeColors.accent;
    }
    if (useCustomTheme && customColors) {
      return getCustomColorSetForTheme(customColors as CustomColors, theme).accent;
    }
    return colorPalette.accent;
  })();
  const glowScale = glowIntensity / 50;
  const glowOpacity = Math.min(255, Math.round(0.5 * glowScale * 255)).toString(16).padStart(2, '0');

  const [view, setView] = useState<ViewType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date()); // For mobile: track selected day separate from month
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [filteredDeadlines, setFilteredDeadlines] = useState<any[]>([]);
  const [filteredWorkItems, setFilteredWorkItems] = useState<any[]>([]);
  const [filteredExams, setFilteredExams] = useState<any[]>([]);
  const [allTaskInstances, setAllTaskInstances] = useState<any[]>([]);
  const [allDeadlineInstances, setAllDeadlineInstances] = useState<any[]>([]);
  const [allWorkItemInstances, setAllWorkItemInstances] = useState<any[]>([]);
  const [allExamInstances, setAllExamInstances] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [cachedCourses, setCachedCourses] = useState<any[]>([]);
  const [cachedExcludedDates, setCachedExcludedDates] = useState<any[]>([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [addEventInitialDate, setAddEventInitialDate] = useState<Date | undefined>(undefined);
  const [addEventInitialTime, setAddEventInitialTime] = useState<string | undefined>(undefined);
  const [addEventInitialAllDay, setAddEventInitialAllDay] = useState(false);
  const hasFilteredRef = useRef(false);
  const cacheLoadedRef = useRef(false);

  const { courses, tasks, deadlines, workItems, exams, excludedDates, calendarEvents: storeCalendarEvents } = useAppStore();

  // Initialize calendar events from store immediately (store loads from localStorage on startup)
  // This provides instant data while fresh data is fetched in the background
  const storeEventsInitialized = useRef(false);
  useEffect(() => {
    if (storeCalendarEvents.length > 0 && !storeEventsInitialized.current) {
      setCalendarEvents(storeCalendarEvents);
      storeEventsInitialized.current = true;
    }
  }, [storeCalendarEvents]);

  // Load from localStorage cache and fetch fresh data in background
  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        // Try to load from cache first
        if (typeof window !== 'undefined' && !cacheLoadedRef.current) {
          const cachedData = localStorage.getItem('calendarCache');
          if (cachedData) {
            try {
              const parsed: CachedCalendarData = JSON.parse(cachedData);
              const now = Date.now();

              // Check if cache is still fresh
              if (now - parsed.timestamp < CACHE_DURATION) {
                console.log('[Calendar] Loading from cache');
                setAllTaskInstances(parsed.tasks || []);
                setAllDeadlineInstances(parsed.deadlines || []);
                setAllWorkItemInstances(parsed.workItems || []);
                setAllExamInstances(parsed.exams || []);
                if (parsed.calendarEvents) {
                  setCalendarEvents(parsed.calendarEvents);
                }
                if (parsed.courses) {
                  setCachedCourses(parsed.courses);
                }
                if (parsed.excludedDates) {
                  setCachedExcludedDates(parsed.excludedDates);
                }
                cacheLoadedRef.current = true;
              }
            } catch (e) {
              // Cache is invalid, clear it
              localStorage.removeItem('calendarCache');
            }
          }
        }
      } catch (error) {
        console.error('Error loading from cache:', error);
      }

      // Fetch all calendar data in a single request
      try {
        const response = await fetch('/api/calendar-data');
        if (response.ok) {
          const data = await response.json();

          const allOpenTasks = (data.tasks || []).filter((task: any) => task.status !== 'done');
          const allOpenDeadlines = (data.deadlines || []).filter((deadline: any) => deadline.status !== 'done');
          const allOpenWorkItems = (data.workItems || []).filter((item: any) => item.status !== 'done');
          const allOpenExams = (data.exams || []).filter((exam: any) => exam.status !== 'completed');

          setAllTaskInstances(allOpenTasks);
          setAllDeadlineInstances(allOpenDeadlines);
          setAllWorkItemInstances(allOpenWorkItems);
          setAllExamInstances(allOpenExams);
          setCalendarEvents(data.calendarEvents || []);
          setCachedCourses(data.courses || []);
          setCachedExcludedDates(data.excludedDates || []);

          // Save to cache
          if (typeof window !== 'undefined') {
            try {
              const fetchedData: CachedCalendarData = {
                tasks: allOpenTasks,
                deadlines: allOpenDeadlines,
                workItems: allOpenWorkItems,
                exams: allOpenExams,
                calendarEvents: data.calendarEvents || [],
                courses: data.courses || [],
                excludedDates: data.excludedDates || [],
                timestamp: Date.now(),
              };
              localStorage.setItem('calendarCache', JSON.stringify(fetchedData));
            } catch (e) {
              console.warn('Failed to save calendar cache:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      }
    };

    loadCalendarData();
  }, []);

  // Filter out completed tasks, deadlines, and work items on mount and when data loads
  useEffect(() => {
    // Only filter if we haven't filtered yet OR if the arrays were empty and now have data
    if (!hasFilteredRef.current || (filteredTasks.length === 0 && (tasks.length > 0 || allTaskInstances.length > 0))) {
      // Use fetched instances if available, otherwise fall back to store data
      const tasksToUse = allTaskInstances.length > 0 ? allTaskInstances : tasks;
      const deadlinesToUse = allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines;
      const workItemsToUse = allWorkItemInstances.length > 0 ? allWorkItemInstances : workItems;
      const examsToUse = allExamInstances.length > 0 ? allExamInstances : exams;

      setFilteredTasks(tasksToUse.filter(task => task.status !== 'done'));
      setFilteredDeadlines(deadlinesToUse.filter(deadline => deadline.status !== 'done'));
      setFilteredWorkItems(workItemsToUse.filter(item => item.status !== 'done'));
      setFilteredExams(examsToUse.filter(exam => exam.status !== 'completed'));
      hasFilteredRef.current = true;
    }
  }, [tasks.length, deadlines.length, workItems.length, exams.length, allTaskInstances.length, allDeadlineInstances.length, allWorkItemInstances.length, allExamInstances.length]);

  useEffect(() => {
    // Read view from localStorage (persists across refreshes)
    let viewToUse: ViewType = 'week';
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('calendarView') as ViewType;
      if (savedView && ['month', 'week', 'day'].includes(savedView)) {
        viewToUse = savedView;
      }
    }
    setView(viewToUse);

    // Always start at current date on refresh
    setCurrentDate(new Date());

    // AppLoader already handles initialization
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  const handleViewChange = (newView: ViewType) => {
    setView(newView);
    if (typeof window !== 'undefined') {
      localStorage.setItem('calendarView', newView);
    }
    const dateStr = currentDate.toISOString().split('T')[0];
    router.push(`/calendar?view=${newView}&date=${dateStr}`);
  };

  const handlePreviousDate = () => {
    const newDate = new Date(currentDate);
    // On mobile, always navigate by month
    if (isMobile || view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
      // On mobile, also update selectedDay to first day of new month
      if (isMobile) {
        const newSelectedDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
        setSelectedDay(newSelectedDay);
      }
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(currentDate);
    // On mobile, always navigate by month
    if (isMobile || view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
      // On mobile, also update selectedDay to first day of new month
      if (isMobile) {
        const newSelectedDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
        setSelectedDay(newSelectedDay);
      }
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    // On mobile, also update selectedDay to today
    if (isMobile) {
      setSelectedDay(new Date());
    }
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDay(date); // Always update selectedDay for mobile
    if (!isMobile) {
      // On desktop, switch view to day
      setCurrentDate(date);
      if (view !== 'day') {
        setView('day');
      }
    }
  };

  const getDateDisplay = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    // On mobile, show the selected day's date
    if (isMobile) {
      return `${monthNames[selectedDay.getMonth()]} ${selectedDay.getDate()}, ${selectedDay.getFullYear()}`;
    }

    if (view === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (view === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const formatDate = (d: Date) => `${monthNames[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
      return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    } else {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    }
  };

  const handleSaveEvent = async (eventData: {
    title: string;
    description: string;
    startAt: string;
    endAt: string | null;
    allDay: boolean;
    location: string | null;
    color: string | null;
  }) => {
    try {
      const response = await fetch('/api/calendar-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const data = await response.json();
        setCalendarEvents((prev) => [...prev, data.event]);
        // Clear cache to force refresh
        if (typeof window !== 'undefined') {
          localStorage.removeItem('calendarCache');
        }
      } else {
        throw new Error('Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      throw error;
    }
  };

  const handleTimeSlotClick = (date: Date, time?: string, allDay?: boolean) => {
    setAddEventInitialDate(date);
    setAddEventInitialTime(time);
    setAddEventInitialAllDay(allDay || false);
    setShowAddEventModal(true);
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    // Update local state for instant UI refresh
    setCalendarEvents((prev) =>
      prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
    );
    // Clear cache to force refresh on next page load
    if (typeof window !== 'undefined') {
      localStorage.removeItem('calendarCache');
    }
  };

  const handleStatusChange = async () => {
    // Refresh tasks, deadlines, and calendar events when status changes
    try {
      const [tasksResponse, deadlinesResponse, eventsResponse] = await Promise.all([
        fetch('/api/tasks?showAll=true'),
        fetch('/api/deadlines?showAll=true'),
        fetch('/api/calendar-events'),
      ]);

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        const allOpenTasks = tasksData.tasks.filter((task: any) => task.status !== 'done');
        setAllTaskInstances(allOpenTasks);
        setFilteredTasks(allOpenTasks);
      }

      if (deadlinesResponse.ok) {
        const deadlinesData = await deadlinesResponse.json();
        const allOpenDeadlines = deadlinesData.deadlines.filter((deadline: any) => deadline.status !== 'done');
        setAllDeadlineInstances(allOpenDeadlines);
        setFilteredDeadlines(allOpenDeadlines);
      }

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setCalendarEvents(eventsData.events || []);
      }

      // Clear cache
      if (typeof window !== 'undefined') {
        localStorage.removeItem('calendarCache');
      }
    } catch (error) {
      console.error('Error refreshing calendar data:', error);
    }
  };

  const handleEventReschedule = async (eventType: string, eventId: string, newDate: Date, allDay: boolean) => {
    // Calculate the new date/time
    let finalDate = newDate;
    if (allDay) {
      finalDate = new Date(newDate);
      finalDate.setHours(23, 59, 0, 0);
    }
    const newDateISO = finalDate.toISOString();

    // Check if this is a WorkItem (exists in workItems arrays or is a work item type like reading/project)
    const isWorkItemType = ['task', 'deadline', 'reading', 'project'].includes(eventType);
    const existsInWorkItems = allWorkItemInstances.some(item => item.id === eventId) ||
                              filteredWorkItems.some(item => item.id === eventId) ||
                              workItems.some(item => item.id === eventId);
    const isWorkItem = isWorkItemType && existsInWorkItems;

    // Optimistic update - update UI immediately
    if (isWorkItem || eventType === 'reading' || eventType === 'project') {
      // Update work item state
      setAllWorkItemInstances((prev) =>
        prev.map((item) => (item.id === eventId ? { ...item, dueAt: newDateISO } : item))
      );
      setFilteredWorkItems((prev) =>
        prev.map((item) => (item.id === eventId ? { ...item, dueAt: newDateISO } : item))
      );
    } else if (eventType === 'task') {
      setAllTaskInstances((prev) =>
        prev.map((task) => (task.id === eventId ? { ...task, dueAt: newDateISO } : task))
      );
      setFilteredTasks((prev) =>
        prev.map((task) => (task.id === eventId ? { ...task, dueAt: newDateISO } : task))
      );
    } else if (eventType === 'deadline') {
      setAllDeadlineInstances((prev) =>
        prev.map((deadline) => (deadline.id === eventId ? { ...deadline, dueAt: newDateISO } : deadline))
      );
      setFilteredDeadlines((prev) =>
        prev.map((deadline) => (deadline.id === eventId ? { ...deadline, dueAt: newDateISO } : deadline))
      );
    } else if (eventType === 'exam') {
      setAllExamInstances((prev) =>
        prev.map((exam) => (exam.id === eventId ? { ...exam, examAt: newDateISO } : exam))
      );
      setFilteredExams((prev) =>
        prev.map((exam) => (exam.id === eventId ? { ...exam, examAt: newDateISO } : exam))
      );
    } else if (eventType === 'event') {
      setCalendarEvents((prev) =>
        prev.map((event) => (event.id === eventId ? { ...event, startAt: newDateISO, allDay } : event))
      );
    }

    // Clear cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem('calendarCache');
    }

    // Make API call in background
    try {
      let apiUrl = '';
      let body: Record<string, any> = {};

      if (isWorkItem || eventType === 'reading' || eventType === 'project') {
        // Use work API for WorkItems
        apiUrl = `/api/work/${eventId}`;
        body = { dueAt: newDateISO };
      } else if (eventType === 'task') {
        apiUrl = `/api/tasks/${eventId}`;
        body = { dueAt: newDateISO };
      } else if (eventType === 'deadline') {
        apiUrl = `/api/deadlines/${eventId}`;
        body = { dueAt: newDateISO };
      } else if (eventType === 'exam') {
        apiUrl = `/api/exams/${eventId}`;
        body = { examAt: newDateISO };
      } else if (eventType === 'event') {
        apiUrl = `/api/calendar-events/${eventId}`;
        body = { startAt: newDateISO, allDay };
      } else {
        console.warn('Unknown event type:', eventType);
        return;
      }

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error('Failed to reschedule event');
        // Could revert optimistic update here if needed
      }
    } catch (error) {
      console.error('Error rescheduling event:', error);
      // Could revert optimistic update here if needed
    }
  };

  return (
    <>
      {/* Calendar Header */}
      <div className="mx-auto w-full max-w-[1800px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
        <h1
          style={{
            fontSize: isMobile ? '26px' : '34px',
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
          }}
        >
          Calendar
        </h1>
        <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
          {visualTheme === 'cartoon' ? "See what's coming up." : "Your schedule, all in one place."}
        </p>
      </div>

      <div style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', overflow: 'visible', position: 'relative', zIndex: 1 }}>
        <div className="animate-fade-in-up" style={{
          position: 'relative',
          zIndex: 1,
          borderRadius: '16px',
          border: '1px solid var(--border)',
          borderLeftWidth: '3px',
          borderLeftColor: `${accentColor}55`,
          backgroundColor: 'var(--panel)',
          boxShadow: isLightMode ? '0 1px 4px rgba(0,0,0,0.04)' : '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          ...(isMobile ? {} : { height: 'calc(100vh - 140px)', overflow: 'hidden' }),
        }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <button
              onClick={handleToday}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-control)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text)',
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                e.currentTarget.style.borderColor = 'var(--border-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              Today
            </button>
            <button
              onClick={handlePreviousDate}
              style={{
                padding: '6px 8px',
                borderRadius: 'var(--radius-control)',
                color: 'var(--text)',
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                e.currentTarget.style.borderColor = 'var(--border-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
              title="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextDate}
              style={{
                padding: '6px 8px',
                borderRadius: 'var(--radius-control)',
                color: 'var(--text)',
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                e.currentTarget.style.borderColor = 'var(--border-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
              title="Next"
            >
              <ChevronRight size={18} />
            </button>
            <div style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500, marginLeft: '12px' }}>
              {getDateDisplay()}
            </div>
            <button
              onClick={() => {
                // Default to current view's date
                setAddEventInitialDate(view === 'day' ? currentDate : (isMobile ? selectedDay : currentDate));
                setAddEventInitialTime(undefined);
                setAddEventInitialAllDay(false);
                setShowAddEventModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-control)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'white',
                backgroundColor: 'var(--accent)',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                border: 'none',
                boxShadow: `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginLeft: '12px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <Plus size={16} />
              <span style={{ display: isMobile ? 'none' : 'inline' }}>Add Event</span>
            </button>
            <div style={{ flex: 1 }} />
            {!isMobile && (
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['month', 'week', 'day'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => handleViewChange(v)}
                  style={{
                    borderRadius: 'var(--radius-control)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    padding: '6px 12px',
                    backgroundColor: view === v ? 'var(--accent)' : 'transparent',
                    backgroundImage: view === v ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)' : 'none',
                    color: view === v ? 'white' : 'var(--muted)',
                    border: view === v ? 'none' : '1px solid var(--border)',
                    boxShadow: view === v ? `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}` : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (view !== v) {
                      e.currentTarget.style.color = 'var(--text)';
                      e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (view !== v) {
                      e.currentTarget.style.color = 'var(--muted)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            )}
          </div>

          <div style={{ flex: isMobile ? 'none' : 1, overflow: isMobile ? 'visible' : 'auto', display: 'flex', flexDirection: 'column' }}>
            {isMobile ? (
              <>
                {/* Mobile: Month view at top with compact height */}
                <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border)', overflow: 'visible', minHeight: '280px' }}>
                  <CalendarMonthView
                    year={currentDate.getFullYear()}
                    month={currentDate.getMonth()}
                    courses={cachedCourses.length > 0 ? cachedCourses : courses}
                    tasks={allTaskInstances.length > 0 ? allTaskInstances : filteredTasks}
                    deadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : filteredDeadlines}
                    workItems={allWorkItemInstances.length > 0 ? allWorkItemInstances : filteredWorkItems}
                    exams={allExamInstances.length > 0 ? allExamInstances : filteredExams}
                    allTasks={allTaskInstances.length > 0 ? allTaskInstances : tasks}
                    allDeadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines}
                    allWorkItems={allWorkItemInstances.length > 0 ? allWorkItemInstances : workItems}
                    excludedDates={cachedExcludedDates.length > 0 ? cachedExcludedDates : excludedDates}
                    calendarEvents={calendarEvents}
                    onSelectDate={handleSelectDate}
                    selectedDate={selectedDay}
                    onEventUpdate={handleEventUpdate}
                    onStatusChange={handleStatusChange}
                  />
                </div>
                {/* Mobile: Day view below the month, showing schedule for selected day */}
                <div style={{ overflow: 'visible' }}>
                  <CalendarDayView
                    date={selectedDay}
                    courses={cachedCourses.length > 0 ? cachedCourses : courses}
                    tasks={allTaskInstances.length > 0 ? allTaskInstances : filteredTasks}
                    deadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : filteredDeadlines}
                    workItems={allWorkItemInstances.length > 0 ? allWorkItemInstances : filteredWorkItems}
                    exams={allExamInstances.length > 0 ? allExamInstances : filteredExams}
                    allTasks={allTaskInstances.length > 0 ? allTaskInstances : tasks}
                    allDeadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines}
                    allWorkItems={allWorkItemInstances.length > 0 ? allWorkItemInstances : workItems}
                    excludedDates={cachedExcludedDates.length > 0 ? cachedExcludedDates : excludedDates}
                    calendarEvents={calendarEvents}
                    onTimeSlotClick={handleTimeSlotClick}
                    onEventUpdate={handleEventUpdate}
                    onStatusChange={handleStatusChange}
                    onEventReschedule={handleEventReschedule}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Desktop: Original behavior with view switching */}
                {view === 'month' && (
                  <CalendarMonthView
                    year={currentDate.getFullYear()}
                    month={currentDate.getMonth()}
                    courses={cachedCourses.length > 0 ? cachedCourses : courses}
                    tasks={allTaskInstances.length > 0 ? allTaskInstances : filteredTasks}
                    deadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : filteredDeadlines}
                    workItems={allWorkItemInstances.length > 0 ? allWorkItemInstances : filteredWorkItems}
                    exams={allExamInstances.length > 0 ? allExamInstances : filteredExams}
                    allTasks={allTaskInstances.length > 0 ? allTaskInstances : tasks}
                    allDeadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines}
                    allWorkItems={allWorkItemInstances.length > 0 ? allWorkItemInstances : workItems}
                    excludedDates={cachedExcludedDates.length > 0 ? cachedExcludedDates : excludedDates}
                    calendarEvents={calendarEvents}
                    onSelectDate={handleSelectDate}
                    onEventUpdate={handleEventUpdate}
                    onStatusChange={handleStatusChange}
                  />
                )}
                {view === 'week' && (
                  <CalendarWeekView
                    date={currentDate}
                    courses={cachedCourses.length > 0 ? cachedCourses : courses}
                    tasks={allTaskInstances.length > 0 ? allTaskInstances : filteredTasks}
                    deadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : filteredDeadlines}
                    workItems={allWorkItemInstances.length > 0 ? allWorkItemInstances : filteredWorkItems}
                    exams={allExamInstances.length > 0 ? allExamInstances : filteredExams}
                    allTasks={allTaskInstances.length > 0 ? allTaskInstances : tasks}
                    allDeadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines}
                    allWorkItems={allWorkItemInstances.length > 0 ? allWorkItemInstances : workItems}
                    excludedDates={cachedExcludedDates.length > 0 ? cachedExcludedDates : excludedDates}
                    calendarEvents={calendarEvents}
                    onTimeSlotClick={handleTimeSlotClick}
                    onEventUpdate={handleEventUpdate}
                    onStatusChange={handleStatusChange}
                    onEventReschedule={handleEventReschedule}
                  />
                )}
                {view === 'day' && (
                  <CalendarDayView
                    date={currentDate}
                    courses={cachedCourses.length > 0 ? cachedCourses : courses}
                    tasks={allTaskInstances.length > 0 ? allTaskInstances : filteredTasks}
                    deadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : filteredDeadlines}
                    workItems={allWorkItemInstances.length > 0 ? allWorkItemInstances : filteredWorkItems}
                    exams={allExamInstances.length > 0 ? allExamInstances : filteredExams}
                    allTasks={allTaskInstances.length > 0 ? allTaskInstances : tasks}
                    allDeadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines}
                    allWorkItems={allWorkItemInstances.length > 0 ? allWorkItemInstances : workItems}
                    excludedDates={cachedExcludedDates.length > 0 ? cachedExcludedDates : excludedDates}
                    calendarEvents={calendarEvents}
                    onTimeSlotClick={handleTimeSlotClick}
                    onEventUpdate={handleEventUpdate}
                    onStatusChange={handleStatusChange}
                    onEventReschedule={handleEventReschedule}
                  />
                )}
              </>
            )}
          </div>
          {!isMobile && <CalendarLegend />}
        </div>

        <div id="excluded-dates" style={{ marginTop: '24px' }}>
          <ExcludedDatesCard />
        </div>
      </div>

      <AddEventModal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        onSave={handleSaveEvent}
        initialDate={addEventInitialDate}
        initialTime={addEventInitialTime}
        initialAllDay={addEventInitialAllDay}
      />
    </>
  );
}
