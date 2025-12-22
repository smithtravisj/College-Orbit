'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useAppStore from '@/lib/store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import PageHeader from '@/components/PageHeader';
import CalendarMonthView from './CalendarMonthView';
import CalendarDayView from './CalendarDayView';
import CalendarWeekView from './CalendarWeekView';
import CalendarLegend from './CalendarLegend';
import ExcludedDatesCard from '@/components/ExcludedDatesCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type ViewType = 'month' | 'week' | 'day';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedCalendarData {
  tasks: any[];
  deadlines: any[];
  exams: any[];
  timestamp: number;
}

export default function CalendarContent() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const [view, setView] = useState<ViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date()); // For mobile: track selected day separate from month
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [filteredDeadlines, setFilteredDeadlines] = useState<any[]>([]);
  const [filteredExams, setFilteredExams] = useState<any[]>([]);
  const [allTaskInstances, setAllTaskInstances] = useState<any[]>([]);
  const [allDeadlineInstances, setAllDeadlineInstances] = useState<any[]>([]);
  const [allExamInstances, setAllExamInstances] = useState<any[]>([]);
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
                setAllTaskInstances(parsed.tasks);
                setAllDeadlineInstances(parsed.deadlines);
                setAllExamInstances(parsed.exams);
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
    // Read view and date from URL or localStorage
    const viewParam = searchParams.get('view') as ViewType;
    const dateParam = searchParams.get('date');

    // First try URL param, then localStorage, then default to 'month'
    let viewToUse: ViewType = 'month';
    if (viewParam && ['month', 'week', 'day'].includes(viewParam)) {
      viewToUse = viewParam;
    } else if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('calendarView') as ViewType;
      if (savedView && ['month', 'week', 'day'].includes(savedView)) {
        viewToUse = savedView;
      }
    }
    setView(viewToUse);

    // If in day view, always go to today. Otherwise use dateParam if available
    if (viewToUse === 'day') {
      setCurrentDate(new Date());
    } else if (dateParam) {
      const date = new Date(dateParam);
      if (!isNaN(date.getTime())) {
        setCurrentDate(date);
      }
    }

    initializeStore();
    setMounted(true);
  }, [initializeStore, searchParams]);

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
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
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

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="View your courses, tasks, deadlines, and exams"
      />
      <div style={{ padding: 'clamp(12px, 4%, 24px)', overflow: 'visible' }}>
        <div style={{
          borderRadius: '16px',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--panel)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 140px)',
          overflow: 'hidden',
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
                    color: view === v ? 'white' : 'var(--muted)',
                    border: view === v ? 'none' : '1px solid var(--border)',
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

          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {isMobile ? (
              <>
                {/* Mobile: Month view at top with compact height */}
                <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border)', overflow: 'visible', minHeight: '280px' }}>
                  <CalendarMonthView
                    year={currentDate.getFullYear()}
                    month={currentDate.getMonth()}
                    courses={courses}
                    tasks={allTaskInstances.length > 0 ? allTaskInstances : filteredTasks}
                    deadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : filteredDeadlines}
                    exams={allExamInstances.length > 0 ? allExamInstances : filteredExams}
                    allTasks={allTaskInstances.length > 0 ? allTaskInstances : tasks}
                    allDeadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines}
                    excludedDates={excludedDates}
                    onSelectDate={handleSelectDate}
                    selectedDate={selectedDay}
                  />
                </div>
                {/* Mobile: Day view below the month, showing schedule for selected day */}
                <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                  <CalendarDayView
                    date={selectedDay}
                    courses={courses}
                    tasks={allTaskInstances.length > 0 ? allTaskInstances : filteredTasks}
                    deadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : filteredDeadlines}
                    exams={allExamInstances.length > 0 ? allExamInstances : filteredExams}
                    allTasks={allTaskInstances.length > 0 ? allTaskInstances : tasks}
                    allDeadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines}
                    excludedDates={excludedDates}
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
                    courses={courses}
                    tasks={allTaskInstances.length > 0 ? allTaskInstances : filteredTasks}
                    deadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : filteredDeadlines}
                    exams={allExamInstances.length > 0 ? allExamInstances : filteredExams}
                    allTasks={allTaskInstances.length > 0 ? allTaskInstances : tasks}
                    allDeadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines}
                    excludedDates={excludedDates}
                    onSelectDate={handleSelectDate}
                  />
                )}
                {view === 'week' && (
                  <CalendarWeekView
                    date={currentDate}
                    courses={courses}
                    tasks={allTaskInstances.length > 0 ? allTaskInstances : filteredTasks}
                    deadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : filteredDeadlines}
                    exams={allExamInstances.length > 0 ? allExamInstances : filteredExams}
                    allTasks={allTaskInstances.length > 0 ? allTaskInstances : tasks}
                    allDeadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines}
                    excludedDates={excludedDates}
                  />
                )}
                {view === 'day' && (
                  <CalendarDayView
                    date={currentDate}
                    courses={courses}
                    tasks={allTaskInstances.length > 0 ? allTaskInstances : filteredTasks}
                    deadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : filteredDeadlines}
                    exams={allExamInstances.length > 0 ? allExamInstances : filteredExams}
                    allTasks={allTaskInstances.length > 0 ? allTaskInstances : tasks}
                    allDeadlines={allDeadlineInstances.length > 0 ? allDeadlineInstances : deadlines}
                    excludedDates={excludedDates}
                  />
                )}
              </>
            )}
          </div>
          <CalendarLegend />
        </div>

        <div style={{ marginTop: '24px' }}>
          <ExcludedDatesCard />
        </div>
      </div>
    </>
  );
}
