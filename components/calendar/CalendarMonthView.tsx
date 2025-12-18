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
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-4 px-4">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-[var(--text-muted)] py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px px-4 flex-1 overflow-hidden">
        {dates.map((date) => {
          const dateStr = date.toISOString().split('T')[0];
          const isCurrentMonth = isInMonth(date, year, month);
          const isTodayDate = isToday(date);
          const dayEvents = eventsByDate.get(dateStr) || [];

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(date)}
              className={`
                relative p-2 min-h-24 border rounded-[var(--radius-control)] cursor-pointer
                transition-colors duration-200
                ${
                  isCurrentMonth
                    ? 'bg-[var(--panel)] border-[var(--border)] hover:bg-[var(--panel-2)] hover:border-[var(--border-hover)]'
                    : 'bg-[var(--bg)] border-[var(--border)] opacity-50'
                }
                ${isTodayDate ? 'ring-1 ring-[var(--accent)]' : ''}
              `}
            >
              {/* Date number */}
              <div
                className={`
                  text-sm font-semibold mb-1
                  ${isTodayDate ? 'text-[var(--accent)]' : 'text-[var(--text)]'}
                `}
              >
                {date.getDate()}
              </div>

              {/* Event indicators */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => {
                  const bgColor = getEventColor(event);
                  const label =
                    event.type === 'course'
                      ? event.courseCode
                      : event.type === 'task'
                        ? 'Task'
                        : 'Due';

                  return (
                    <div
                      key={event.id}
                      className="text-xs px-1.5 py-0.5 rounded bg-opacity-20 overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{
                        backgroundColor: `${bgColor}20`,
                        color: bgColor,
                      }}
                      title={event.title}
                    >
                      {label}: {event.title.substring(0, 15)}
                    </div>
                  );
                })}

                {/* +X more indicator */}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-[var(--text-muted)] px-1.5">
                    +{dayEvents.length - 3} more
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
