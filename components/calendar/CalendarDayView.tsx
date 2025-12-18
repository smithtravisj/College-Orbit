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
const START_HOUR = 0;
const END_HOUR = 24;

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--panel)', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text)' }}>{dateStr}</h2>
        {isToday(date) && (
          <p style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>Today</p>
        )}
      </div>

      {/* All-day events section */}
      {taskDeadlineEvents.length > 0 && (
        <div style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--panel-2)', flexShrink: 0 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>All Day</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {taskDeadlineEvents.map((event) => {
              const color = getEventColor(event);
              return (
                <div
                  key={event.id}
                  style={{
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    borderRadius: 'var(--radius-control)',
                    fontSize: '0.875rem',
                    backgroundColor: `${color}20`,
                    color: color,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={event.title}
                >
                  {event.type === 'task' ? '📝' : '⏰'} {event.title}
                  {event.time && <span style={{ fontSize: '0.75rem', opacity: 0.75 }}> ({event.time})</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div style={{ display: 'flex', flex: 1, overflow: 'auto' }}>
        {/* Time column */}
        <div style={{ width: '80px', borderRight: '1px solid var(--border)', paddingTop: '8px', paddingLeft: '8px', flexShrink: 0 }}>
          {hours.map((hour) => {
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            return (
              <div
                key={hour}
                style={{
                  height: `${HOUR_HEIGHT}px`,
                  paddingRight: '8px',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  paddingTop: '4px',
                }}
              >
                {displayHour} {ampm}
              </div>
            );
          })}
        </div>

        {/* Events column */}
        <div style={{ flex: 1, position: 'relative', paddingTop: '8px', paddingRight: '8px' }}>
          {/* Hour grid lines */}
          {hours.map((hour) => (
            <div
              key={`line-${hour}`}
              style={{
                position: 'absolute',
                width: '100%',
                borderTop: '1px solid var(--border)',
                top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
                height: `${HOUR_HEIGHT}px`,
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
                style={{
                  position: 'absolute',
                  left: '8px',
                  right: '8px',
                  borderRadius: 'var(--radius-control)',
                  padding: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  top: `${top}px`,
                  height: `${height}px`,
                  backgroundColor: `${color}30`,
                  borderLeft: `4px solid ${color}`,
                  zIndex: 10,
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                title={event.title}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {event.courseCode}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {event.time} - {event.endTime}
                </div>
                {event.location && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
