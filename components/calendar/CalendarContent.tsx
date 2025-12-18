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
    <>
      <PageHeader
        title="Calendar"
        subtitle={getDateRangeDisplay()}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleToday}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-control)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Today
            </button>
            <button
              onClick={handlePreviousDate}
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-control)',
                color: 'var(--text)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextDate}
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-control)',
                color: 'var(--text)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Next"
            >
              <ChevronRight size={20} />
            </button>
            <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--border)', margin: '0 16px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['month', 'week', 'day'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => handleViewChange(v)}
                  style={{
                    borderRadius: 'var(--radius-control)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    padding: '8px 12px',
                    backgroundColor: view === v ? 'var(--accent-2)' : 'transparent',
                    color: view === v ? 'var(--text)' : 'var(--muted)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (view !== v) {
                      e.currentTarget.style.color = 'var(--text)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
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
          </div>
        }
      />
      <div style={{ padding: 'clamp(12px, 4%, 24px)', overflow: 'visible' }}>
        <div style={{
          borderRadius: '16px',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--panel)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 220px)',
          overflow: 'hidden',
        }}>
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
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
      </div>
    </>
  );
}
