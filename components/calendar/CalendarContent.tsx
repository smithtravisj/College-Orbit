'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/lib/store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { getCollegeColorPalette } from '@/lib/collegeColors';
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
  const colorPalette = getCollegeColorPalette(university || null, theme);

  const [view, setView] = useState<ViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date()); // For mobile: track selected day separate from month
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [filteredDeadlines, setFilteredDeadlines] = useState<any[]>([]);
  const [filteredExams, setFilteredExams] = useState<any[]>([]);
  const [allTaskInstances, setAllTaskInstances] = useState<any[]>([]);
  const [allDeadlineInstances, setAllDeadlineInstances] = useState<any[]>([]);
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

  const { courses, tasks, deadlines, exams, excludedDates, initializeStore } = useAppStore();

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

      // Always fetch fresh data in the background
      try {
        const fetchedData: CachedCalendarData = {
          tasks: [],
          deadlines: [],
          exams: [],
          calendarEvents: [],
          courses: [],
          excludedDates: [],
          timestamp: Date.now(),
        };

        // Fetch all task instances
        const tasksResponse = await fetch('/api/tasks?showAll=true');
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          const allOpenTasks = tasksData.tasks.filter((task: any) => task.status !== 'done');
          setAllTaskInstances(allOpenTasks);
          fetchedData.tasks = allOpenTasks;
        }

        // Fetch all deadline instances
        const deadlinesResponse = await fetch('/api/deadlines?showAll=true');
        if (deadlinesResponse.ok) {
          const deadlinesData = await deadlinesResponse.json();
          const allOpenDeadlines = deadlinesData.deadlines.filter((deadline: any) => deadline.status !== 'done');
          setAllDeadlineInstances(allOpenDeadlines);
          fetchedData.deadlines = allOpenDeadlines;
        }

        // Fetch all exam instances
        const examsResponse = await fetch('/api/exams?showAll=true');
        if (examsResponse.ok) {
          const examsData = await examsResponse.json();
          const allOpenExams = examsData.exams.filter((exam: any) => exam.status !== 'completed');
          setAllExamInstances(allOpenExams);
          fetchedData.exams = allOpenExams;
        }

        // Fetch all calendar events
        const eventsResponse = await fetch('/api/calendar-events');
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setCalendarEvents(eventsData.events || []);
          fetchedData.calendarEvents = eventsData.events || [];
        }

        // Fetch courses
        const coursesResponse = await fetch('/api/courses');
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setCachedCourses(coursesData.courses || []);
          fetchedData.courses = coursesData.courses || [];
        }

        // Fetch excluded dates
        const excludedDatesResponse = await fetch('/api/excluded-dates');
        if (excludedDatesResponse.ok) {
          const excludedDatesData = await excludedDatesResponse.json();
          setCachedExcludedDates(excludedDatesData.excludedDates || []);
          fetchedData.excludedDates = excludedDatesData.excludedDates || [];
        }

        // Save to cache
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('calendarCache', JSON.stringify(fetchedData));
          } catch (e) {
            console.warn('Failed to save calendar cache:', e);
          }
        }
      } catch (error) {
        console.error('Error fetching all instances:', error);
      }
    };

    loadCalendarData();
  }, []);

  // Filter out completed tasks and deadlines on mount and when data loads
  useEffect(() => {
    // Only filter if we haven't filtered yet OR if the arrays were empty and now have data
    if (!hasFilteredRef.current || (filteredTasks.length === 0 && (tasks.length > 0 || allTaskInstances.length > 0))) {
      // Use fetched instances if available, otherwise fall back to store data
      const tasksToUse = allTaskInstances.length > 0 ? allTaskInstances : tasks;
      const deadlinesToUse = allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines;
      const examsToUse = allExamInstances.length > 0 ? allExamInstances : exams;

      setFilteredTasks(tasksToUse.filter(task => task.status !== 'done'));
      setFilteredDeadlines(deadlinesToUse.filter(deadline => deadline.status !== 'done'));
      setFilteredExams(examsToUse.filter(exam => exam.status !== 'completed'));
      hasFilteredRef.current = true;
    }
  }, [tasks.length, deadlines.length, exams.length, allTaskInstances.length, allDeadlineInstances.length, allExamInstances.length]);

  useEffect(() => {
    // Read view from localStorage (persists across refreshes)
    let viewToUse: ViewType = 'month';
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('calendarView') as ViewType;
      if (savedView && ['month', 'week', 'day'].includes(savedView)) {
        viewToUse = savedView;
      }
    }
    setView(viewToUse);

    // Always start at current date on refresh
    setCurrentDate(new Date());

    initializeStore();
    setMounted(true);
  }, [initializeStore]);

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
    // Refresh tasks and deadlines when status changes
    try {
      const [tasksResponse, deadlinesResponse] = await Promise.all([
        fetch('/api/tasks?showAll=true'),
        fetch('/api/deadlines?showAll=true'),
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

      // Clear cache
      if (typeof window !== 'undefined') {
        localStorage.removeItem('calendarCache');
      }
    } catch (error) {
      console.error('Error refreshing calendar data:', error);
    }
  };

  return (
    <>
      {/* Calendar Header */}
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* Subtle glow behind title */}
          <div style={{ position: 'absolute', inset: '-20px -30px', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                background: `radial-gradient(ellipse 100% 100% at 50% 50%, ${colorPalette.accent}18 0%, transparent 70%)`,
              }}
            />
          </div>
          <h1
            style={{
              position: 'relative',
              zIndex: 1,
              fontSize: isMobile ? '26px' : '34px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            Calendar
          </h1>
        </div>
        <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
          Your schedule at a glance.
        </p>
      </div>

      <div style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', overflow: 'visible', position: 'relative', zIndex: 1 }}>
        <div style={{
          position: 'relative',
          zIndex: 1,
          borderRadius: '16px',
          border: '1px solid var(--border)',
          borderLeftWidth: '3px',
          borderLeftColor: `${colorPalette.accent}55`,
          backgroundColor: 'var(--panel)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          ...(isMobile ? { minHeight: 'calc(100vh - 140px)' } : { height: 'calc(100vh - 140px)', overflow: 'hidden' }),
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
                boxShadow: `0 0 10px ${colorPalette.accent}80`,
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
                    boxShadow: view === v ? `0 0 10px ${colorPalette.accent}80` : 'none',
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
                    exams={allExamInstances.length > 0 ? allExamInstances : filteredExams}
                    allTasks={allTaskInstances.length > 0 ? allTaskInstances : tasks}
                    allDeadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines}
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
                    exams={allExamInstances.length > 0 ? allExamInstances : filteredExams}
                    allTasks={allTaskInstances.length > 0 ? allTaskInstances : tasks}
                    allDeadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines}
                    excludedDates={cachedExcludedDates.length > 0 ? cachedExcludedDates : excludedDates}
                    calendarEvents={calendarEvents}
                    onTimeSlotClick={handleTimeSlotClick}
                    onEventUpdate={handleEventUpdate}
                    onStatusChange={handleStatusChange}
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
                    exams={allExamInstances.length > 0 ? allExamInstances : filteredExams}
                    allTasks={allTaskInstances.length > 0 ? allTaskInstances : tasks}
                    allDeadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines}
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
                    exams={allExamInstances.length > 0 ? allExamInstances : filteredExams}
                    allTasks={allTaskInstances.length > 0 ? allTaskInstances : tasks}
                    allDeadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines}
                    excludedDates={cachedExcludedDates.length > 0 ? cachedExcludedDates : excludedDates}
                    calendarEvents={calendarEvents}
                    onTimeSlotClick={handleTimeSlotClick}
                    onEventUpdate={handleEventUpdate}
                    onStatusChange={handleStatusChange}
                  />
                )}
                {view === 'day' && (
                  <CalendarDayView
                    date={currentDate}
                    courses={cachedCourses.length > 0 ? cachedCourses : courses}
                    tasks={allTaskInstances.length > 0 ? allTaskInstances : filteredTasks}
                    deadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : filteredDeadlines}
                    exams={allExamInstances.length > 0 ? allExamInstances : filteredExams}
                    allTasks={allTaskInstances.length > 0 ? allTaskInstances : tasks}
                    allDeadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines}
                    excludedDates={cachedExcludedDates.length > 0 ? cachedExcludedDates : excludedDates}
                    calendarEvents={calendarEvents}
                    onTimeSlotClick={handleTimeSlotClick}
                    onEventUpdate={handleEventUpdate}
                    onStatusChange={handleStatusChange}
                  />
                )}
              </>
            )}
          </div>
          {!isMobile && <CalendarLegend />}
        </div>

        <div style={{ marginTop: '24px' }}>
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
