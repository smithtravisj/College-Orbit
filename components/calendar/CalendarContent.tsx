'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useAppStore from '@/lib/store';
import PageHeader from '@/components/PageHeader';
import CalendarMonthView from './CalendarMonthView';
import CalendarDayView from './CalendarDayView';
import CalendarWeekView from './CalendarWeekView';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type ViewType = 'month' | 'week' | 'day';

export default function CalendarContent() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<ViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { courses, tasks, deadlines, initializeStore } = useAppStore();

  useEffect(() => {
    // Read view and date from URL on mount
    const viewParam = searchParams.get('view') as ViewType;
    const dateParam = searchParams.get('date');

    if (viewParam && ['month', 'week', 'day'].includes(viewParam)) {
      setView(viewParam);
    }
    if (dateParam) {
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  const handleViewChange = (newView: ViewType) => {
    setView(newView);
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
    setCurrentDate(date);
    if (view !== 'day') {
      setView('day');
    }
  };

  const getDateRangeDisplay = () => {
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
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Calendar"
        subtitle={getDateRangeDisplay()}
        actions={
          <div className="flex gap-2 items-center">
            <button
              onClick={handleToday}
              className="px-3 py-2 rounded-[var(--radius-control)] text-sm font-medium text-[var(--text)] hover:bg-white/10 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handlePreviousDate}
              className="p-2 rounded-[var(--radius-control)] text-[var(--text)] hover:bg-white/10 transition-colors"
              title="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextDate}
              className="p-2 rounded-[var(--radius-control)] text-[var(--text)] hover:bg-white/10 transition-colors"
              title="Next"
            >
              <ChevronRight size={20} />
            </button>
            <div className="w-1 h-8 bg-[var(--border)] mx-2" />
            <div className="flex gap-2">
              {(['month', 'week', 'day'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => handleViewChange(v)}
                  className={`rounded-[var(--radius-control)] text-sm font-medium transition-colors px-3 py-2 ${
                    view === v
                      ? 'bg-[var(--accent-2)] text-[var(--text)]'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
        }
      />
      <div className="flex-1 overflow-hidden">
        {view === 'month' && (
          <CalendarMonthView
            year={currentDate.getFullYear()}
            month={currentDate.getMonth()}
            courses={courses}
            tasks={tasks}
            deadlines={deadlines}
            onSelectDate={handleSelectDate}
          />
        )}
        {view === 'week' && (
          <CalendarWeekView
            date={currentDate}
            courses={courses}
            tasks={tasks}
            deadlines={deadlines}
          />
        )}
        {view === 'day' && (
          <CalendarDayView
            date={currentDate}
            courses={courses}
            tasks={tasks}
            deadlines={deadlines}
          />
        )}
      </div>
    </div>
  );
}
