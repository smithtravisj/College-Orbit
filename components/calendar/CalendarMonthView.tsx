'use client';

import { useMemo } from 'react';
import { Course, Task, Deadline } from '@/types';
import {
  getDatesInMonth,
  getEventsForDate,
  isInMonth,
  getEventColor,
} from '@/lib/calendarUtils';
import { isToday } from '@/lib/utils';

interface CalendarMonthViewProps {
  year: number;
  month: number;
  courses: Course[];
  tasks: Task[];
  deadlines: Deadline[];
  onSelectDate: (date: Date) => void;
}

export default function CalendarMonthView({
  year,
  month,
  courses,
  tasks,
  deadlines,
  onSelectDate,
}: CalendarMonthViewProps) {
  const dates = useMemo(() => getDatesInMonth(year, month), [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getEventsForDate>>();
    dates.forEach((date) => {
      const dateStr = date.toISOString().split('T')[0];
      const events = getEventsForDate(date, courses, tasks, deadlines);
      if (events.length > 0) {
        map.set(dateStr, events);
      }
    });
    return map;
  }, [dates, courses, tasks, deadlines]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '8px', paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', flexShrink: 0 }}>
        {dayNames.map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text)',
              padding: '6px 0',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', paddingLeft: '12px', paddingRight: '12px', paddingBottom: '8px', flex: 1, overflow: 'hidden', gridAutoRows: 'minmax(0, 1fr)' }}>
        {dates.map((date) => {
          const dateStr = date.toISOString().split('T')[0];
          const isCurrentMonth = isInMonth(date, year, month);
          const isTodayDate = isToday(date);
          const dayEvents = eventsByDate.get(dateStr) || [];

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(date)}
              style={{
                position: 'relative',
                padding: '8px',
                border: `1px solid ${isCurrentMonth ? 'var(--border)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-control)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: isCurrentMonth ? 'var(--panel)' : 'var(--bg)',
                opacity: isCurrentMonth ? 1 : 0.5,
                boxShadow: isTodayDate ? '0 0 0 1px var(--accent)' : 'none',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                if (isCurrentMonth) {
                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (isCurrentMonth) {
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }
              }}
            >
              {/* Date number */}
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                  paddingLeft: '4px',
                  paddingRight: '4px',
                  paddingTop: '2px',
                  paddingBottom: '2px',
                  color: isTodayDate ? 'var(--accent)' : 'var(--text)',
                  lineHeight: 1,
                }}
              >
                {date.getDate()}
              </div>

              {/* Event indicators - colored dots */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1, alignContent: 'flex-start', minHeight: 0 }}>
                {dayEvents.slice(0, 8).map((event) => {
                  const color = getEventColor(event);

                  return (
                    <div
                      key={event.id}
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        flexShrink: 0,
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                      }}
                      title={event.type === 'course' ? `${event.courseCode}: ${event.title}` : event.title}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                  );
                })}

                {/* +X more indicator */}
                {dayEvents.length > 8 && (
                  <div style={{
                    fontSize: '0.6rem',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    lineHeight: 1,
                    paddingTop: '0.5px',
                  }}>
                    +{dayEvents.length - 8}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
