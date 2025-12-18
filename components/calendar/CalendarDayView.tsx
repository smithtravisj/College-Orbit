'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { Course, Task, Deadline, ExcludedDate } from '@/types';
import {
  getEventsForDate,
  getTimeSlotPosition,
  getEventHeight,
  getEventColor,
  calculateEventLayout,
  separateTaskDeadlineEvents,
  getExclusionType,
  CalendarEvent,
} from '@/lib/calendarUtils';
import EventDetailModal from '@/components/EventDetailModal';

interface CalendarDayViewProps {
  date: Date;
  courses: Course[];
  tasks: Task[];
  deadlines: Deadline[];
  allTasks?: Task[];
  allDeadlines?: Deadline[];
  excludedDates?: ExcludedDate[];
}

const HOUR_HEIGHT = 60; // pixels
const START_HOUR = 0;
const END_HOUR = 24;

export default function CalendarDayView({
  date,
  courses,
  tasks,
  deadlines,
  allTasks = [],
  allDeadlines = [],
  excludedDates = [],
}: CalendarDayViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    // Scroll to 8 AM on mount
    if (scrollContainerRef.current) {
      const scrollPosition = 8 * HOUR_HEIGHT; // 8 AM
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  const events = useMemo(
    () => getEventsForDate(date, courses, tasks, deadlines, excludedDates),
    [date, courses, tasks, deadlines, excludedDates]
  );

  const courseEvents = useMemo(() => events.filter((e) => e.type === 'course'), [events]);
  const taskDeadlineEvents = useMemo(() => events.filter((e) => e.type !== 'course'), [events]);
  const { timed: timedTaskDeadlineEvents } = useMemo(() => separateTaskDeadlineEvents(taskDeadlineEvents), [taskDeadlineEvents]);

  // Combine all timed events (courses + timed tasks/deadlines) for unified layout
  const allTimedEvents = useMemo(() => [...courseEvents, ...timedTaskDeadlineEvents], [courseEvents, timedTaskDeadlineEvents]);
  const eventLayout = useMemo(() => calculateEventLayout(allTimedEvents), [allTimedEvents]);

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const exclusionType = getExclusionType(date, excludedDates);

  // Get course code for cancelled classes
  let courseCode = '';
  if (exclusionType === 'class-cancelled') {
    const dateYear = date.getFullYear();
    const dateMonth = String(date.getMonth() + 1).padStart(2, '0');
    const dateDay = String(date.getDate()).padStart(2, '0');
    const dateKey = `${dateYear}-${dateMonth}-${dateDay}`;
    const exclusion = excludedDates.find((ex) => ex.date === dateKey && ex.courseId);
    if (exclusion) {
      const course = courses.find(c => c.id === exclusion.courseId);
      courseCode = course?.code || '';
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--panel)', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{dateStr}</h2>
      </div>

      {(() => {
        const { allDay: allDayEvents } = separateTaskDeadlineEvents(taskDeadlineEvents);
        if (allDayEvents.length === 0 && !exclusionType) return null;

        return (
          <div style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--panel-2)', flexShrink: 0 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>All Day</p>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
              {exclusionType && (
                <div
                  style={{
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    borderRadius: 'var(--radius-control)',
                    fontSize: '0.875rem',
                    backgroundColor: '#122343',
                    color: 'white',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: '0 0 auto',
                    fontWeight: 500,
                  }}
                >
                  {exclusionType === 'holiday' ? 'Holiday' : `Class Cancelled${courseCode ? ': ' + courseCode : ''}`}
                </div>
              )}
              {allDayEvents.map((event) => {
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
                      backgroundColor: `${color}30`,
                      color: 'white',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: '0 0 auto',
                      cursor: 'pointer',
                    }}
                    title={event.title}
                    onClick={() => setSelectedEvent(event)}
                  >
                    {event.title}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Time grid */}
      <div ref={scrollContainerRef} style={{ display: 'flex', flex: 1, overflow: 'auto' }}>
        {/* Time column */}
        <div style={{ width: '80px', paddingTop: '8px', paddingLeft: '8px', flexShrink: 0 }}>
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
          {hours.map((hour) => {
            if (hour === START_HOUR) return null; // Skip first hour line
            return (
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
            );
          })}

          {/* Course events as blocks */}
          {courseEvents.map((event) => {
            if (!event.time || !event.endTime) return null;

            // Get layout information for this event
            const layout = eventLayout.find(l => l.event.id === event.id);
            if (!layout) return null;

            const { top: baseTop } = getTimeSlotPosition(event.time, START_HOUR, END_HOUR);
            const top = baseTop + 1;
            const height = getEventHeight(event.time, event.endTime);
            const color = getEventColor(event);

            // Calculate width and left position based on column
            const eventWidth = 100 / layout.totalColumns;
            const eventLeft = layout.column * eventWidth;

            // Convert 24-hour time to 12-hour format
            const formatTime = (time: string) => {
              const [hours, minutes] = time.split(':');
              const hour = parseInt(hours);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
              return `${displayHour}:${minutes} ${ampm}`;
            };

            return (
              <div
                key={event.id}
                style={{
                  position: 'absolute',
                  left: `calc(${eventLeft}% + 8px)`,
                  width: `calc(${eventWidth}% - 16px)`,
                  borderRadius: 'var(--radius-control)',
                  padding: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  top: `${top}px`,
                  height: `${height}px`,
                  backgroundColor: `${color}30`,
                  zIndex: 10,
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                title={event.title}
                onClick={() => setSelectedEvent(event)}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {event.courseCode}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {formatTime(event.time)} - {formatTime(event.endTime)}
                </div>
                {event.location && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.location}
                  </div>
                )}
              </div>
            );
          })}

          {/* Timed task/deadline events */}
          {(() => {
            const { timed: timedEvents } = separateTaskDeadlineEvents(taskDeadlineEvents);

            return timedEvents.map((event) => {
              if (!event.time) return null;

              const layout = eventLayout.find(l => l.event.id === event.id);
              if (!layout) return null;

              const { top: baseTop } = getTimeSlotPosition(event.time, START_HOUR, END_HOUR);
              const top = baseTop + 1;
              const height = event.endTime ? getEventHeight(event.time, event.endTime) : HOUR_HEIGHT * 0.5;
              const color = getEventColor(event);

              const eventWidth = 100 / layout.totalColumns;
              const eventLeft = layout.column * eventWidth;

              return (
                <div
                  key={event.id}
                  style={{
                    position: 'absolute',
                    left: `calc(${eventLeft}% + 8px)`,
                    width: `calc(${eventWidth}% - 16px)`,
                    borderRadius: 'var(--radius-control)',
                    padding: '8px',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    top: `${top}px`,
                    height: `${height}px`,
                    backgroundColor: `${color}30`,
                    zIndex: 9,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    minHeight: 0,
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  title={event.title}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left', width: '100%', lineHeight: 1.3 }}>
                    {event.title}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      <EventDetailModal
        isOpen={selectedEvent !== null}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        courses={courses}
        tasks={allTasks.length > 0 ? allTasks : tasks}
        deadlines={allDeadlines.length > 0 ? allDeadlines : deadlines}
      />
    </div>
  );
}
