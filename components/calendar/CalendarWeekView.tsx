'use client';

import { useMemo } from 'react';
import { Course, Task, Deadline } from '@/types';
import {
  getWeekRange,
  getEventsForDate,
  getTimeSlotPosition,
  getEventHeight,
  getEventColor,
} from '@/lib/calendarUtils';
import { getDayOfWeek, isToday } from '@/lib/utils';

interface CalendarWeekViewProps {
  date: Date;
  courses: Course[];
  tasks: Task[];
  deadlines: Deadline[];
}

const HOUR_HEIGHT = 60; // pixels
const START_HOUR = 6;
const END_HOUR = 22;

export default function CalendarWeekView({
  date,
  courses,
  tasks,
  deadlines,
}: CalendarWeekViewProps) {
  const { start: weekStart } = getWeekRange(date);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getEventsForDate>>();
    weekDays.forEach((day) => {
      const events = getEventsForDate(day, courses, tasks, deadlines);
      map.set(day.toISOString().split('T')[0], events);
    });
    return map;
  }, [weekDays, courses, tasks, deadlines]);

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <div className="flex flex-col h-full bg-[var(--panel)]">
      {/* Day headers */}
      <div className="grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
        {/* Empty corner */}
        <div className="border-b border-r border-[var(--border)]" />

        {/* Day headers */}
        {weekDays.map((day) => {
          const dateStr = day.toISOString().split('T')[0];
          const isTodayDate = isToday(day);
          const dayName = getDayOfWeek(day);

          return (
            <div
              key={dateStr}
              className={`
                border-b border-r border-[var(--border)] px-2 py-3 text-center
                ${isTodayDate ? 'bg-[var(--accent-2)]' : 'bg-[var(--panel-2)]'}
              `}
            >
              <div className="text-sm font-medium text-[var(--text)]">{dayName}</div>
              <div className={`text-lg font-semibold ${isTodayDate ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
          {/* Time column */}
          <div className="border-r border-[var(--border)] py-2 bg-[var(--panel-2)] flex-shrink-0">
            {hours.map((hour) => {
              const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
              const ampm = hour >= 12 ? 'PM' : 'AM';
              return (
                <div
                  key={hour}
                  className="h-[60px] pr-2 text-right text-xs text-[var(--text-muted)] flex items-start justify-end pt-1 border-b border-[var(--border)]"
                >
                  {displayHour} {ampm}
                </div>
              );
            })}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dateStr = day.toISOString().split('T')[0];
            const dayEvents = eventsByDay.get(dateStr) || [];
            const courseEvents = dayEvents.filter((e) => e.type === 'course');
            const isTodayDate = isToday(day);

            return (
              <div
                key={dateStr}
                className={`
                  relative border-r border-[var(--border)]
                  ${isTodayDate ? 'bg-[var(--accent)]' : 'bg-[var(--panel)]'}
                `}
                style={{
                  backgroundColor: isTodayDate ? 'rgba(83, 155, 245, 0.05)' : undefined,
                }}
              >
                {/* Hour grid lines */}
                {hours.map((hour) => (
                  <div
                    key={`line-${hour}`}
                    className="absolute w-full border-b border-[var(--border)]"
                    style={{
                      top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
                      height: `${HOUR_HEIGHT}px`,
                    }}
                  />
                ))}

                {/* Course events */}
                {courseEvents.map((event) => {
                  if (!event.time || !event.endTime) return null;

                  const { top } = getTimeSlotPosition(event.time, START_HOUR, END_HOUR);
                  const height = getEventHeight(event.time, event.endTime);
                  const color = getEventColor(event);

                  return (
                    <div
                      key={event.id}
                      className="absolute left-1 right-1 rounded text-xs p-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity z-10"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: `${color}40`,
                        borderLeft: `3px solid ${color}`,
                      }}
                      title={event.title}
                    >
                      <div className="font-semibold text-[var(--text)] truncate leading-tight">
                        {event.courseCode}
                      </div>
                      <div className="text-[var(--text-secondary)] truncate leading-tight">
                        {event.time} - {event.endTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
