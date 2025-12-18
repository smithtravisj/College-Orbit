'use client';

import { useMemo } from 'react';
import { Course, Task, Deadline } from '@/types';
import {
  getEventsForDate,
  getTimeSlotPosition,
  getEventHeight,
  getEventColor,
} from '@/lib/calendarUtils';
import { isToday } from '@/lib/utils';

interface CalendarDayViewProps {
  date: Date;
  courses: Course[];
  tasks: Task[];
  deadlines: Deadline[];
}

const HOUR_HEIGHT = 60; // pixels
const START_HOUR = 6;
const END_HOUR = 22;

export default function CalendarDayView({
  date,
  courses,
  tasks,
  deadlines,
}: CalendarDayViewProps) {
  const events = useMemo(
    () => getEventsForDate(date, courses, tasks, deadlines),
    [date, courses, tasks, deadlines]
  );

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  const courseEvents = events.filter((e) => e.type === 'course');
  const taskDeadlineEvents = events.filter((e) => e.type !== 'course');

  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col h-full bg-[var(--panel)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">{dateStr}</h2>
        {isToday(date) && (
          <p className="text-sm text-[var(--accent)]">Today</p>
        )}
      </div>

      {/* All-day events section */}
      {taskDeadlineEvents.length > 0 && (
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--panel-2)]">
          <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">All Day</p>
          <div className="space-y-1">
            {taskDeadlineEvents.map((event) => {
              const color = getEventColor(event);
              return (
                <div
                  key={event.id}
                  className="px-2 py-1 rounded text-sm bg-opacity-10 overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{
                    backgroundColor: `${color}20`,
                    color: color,
                  }}
                  title={event.title}
                >
                  {event.type === 'task' ? '📝' : '⏰'} {event.title}
                  {event.time && <span className="text-xs opacity-75"> ({event.time})</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="flex flex-1 overflow-auto">
        {/* Time column */}
        <div className="w-20 border-r border-[var(--border)] py-2 flex-shrink-0">
          {hours.map((hour) => {
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            return (
              <div
                key={hour}
                className="h-[60px] pr-2 text-right text-xs text-[var(--text-muted)] flex items-start justify-end pt-1"
              >
                {displayHour} {ampm}
              </div>
            );
          })}
        </div>

        {/* Events column */}
        <div className="flex-1 relative py-2">
          {/* Hour grid lines */}
          {hours.map((hour) => (
            <div
              key={`line-${hour}`}
              className="absolute w-full border-t border-[var(--border)]"
              style={{
                top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
              }}
            />
          ))}

          {/* Course events as blocks */}
          {courseEvents.map((event) => {
            if (!event.time || !event.endTime) return null;

            const { top } = getTimeSlotPosition(event.time, START_HOUR, END_HOUR);
            const height = getEventHeight(event.time, event.endTime);
            const color = getEventColor(event);

            return (
              <div
                key={event.id}
                className="absolute left-2 right-2 rounded-[var(--radius-control)] p-2 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  backgroundColor: `${color}30`,
                  borderLeft: `4px solid ${color}`,
                  zIndex: 10,
                }}
                title={event.title}
              >
                <div className="text-xs font-semibold text-[var(--text)] truncate">
                  {event.courseCode}
                </div>
                <div className="text-xs text-[var(--text-secondary)] truncate">
                  {event.time} - {event.endTime}
                </div>
                {event.location && (
                  <div className="text-xs text-[var(--text-muted)] truncate">
                    {event.location}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
