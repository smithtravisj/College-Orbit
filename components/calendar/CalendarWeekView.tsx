'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { Course, Task, Deadline } from '@/types';
import {
  getWeekRange,
  getEventsForDate,
  getTimeSlotPosition,
  getEventHeight,
  getEventColor,
  calculateEventLayout,
  separateTaskDeadlineEvents,
  CalendarEvent,
} from '@/lib/calendarUtils';
import { getDayOfWeek, isToday } from '@/lib/utils';
import EventDetailModal from '@/components/EventDetailModal';

interface CalendarWeekViewProps {
  date: Date;
  courses: Course[];
  tasks: Task[];
  deadlines: Deadline[];
  allTasks?: Task[];
  allDeadlines?: Deadline[];
}

const HOUR_HEIGHT = 60; // pixels
const START_HOUR = 0;
const END_HOUR = 24;

export default function CalendarWeekView({
  date,
  courses,
  tasks,
  deadlines,
  allTasks = [],
  allDeadlines = [],
}: CalendarWeekViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    // Scroll to 8 AM on mount
    if (scrollContainerRef.current) {
      const scrollPosition = 8 * HOUR_HEIGHT; // 8 AM
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

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

  const eventLayoutsByDay = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateEventLayout>>();
    weekDays.forEach((day) => {
      const dateStr = day.toISOString().split('T')[0];
      const dayEvents = eventsByDay.get(dateStr) || [];
      const courseEvents = dayEvents.filter((e) => e.type === 'course');
      const layout = calculateEventLayout(courseEvents);
      if (layout.length > 0) {
        map.set(dateStr, layout);
      }
    });
    return map;
  }, [weekDays, eventsByDay]);

  const timedEventLayoutsByDay = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateEventLayout>>();
    weekDays.forEach((day) => {
      const dateStr = day.toISOString().split('T')[0];
      const dayEvents = eventsByDay.get(dateStr) || [];
      const { timed: timedEvents } = separateTaskDeadlineEvents(dayEvents);
      const layout = calculateEventLayout(timedEvents);
      map.set(dateStr, layout);
    });
    return map;
  }, [weekDays, eventsByDay]);

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--panel)', overflow: 'hidden' }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', flexShrink: 0 }}>
        {/* Empty corner */}
        <div style={{ borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', paddingLeft: '8px' }} />

        {/* Day headers */}
        {weekDays.map((day, index) => {
          const dateStr = day.toISOString().split('T')[0];
          const isTodayDate = isToday(day);
          const dayName = getDayOfWeek(day);
          const isLastDay = index === weekDays.length - 1;

          return (
            <div
              key={dateStr}
              style={{
                borderBottom: '1px solid var(--border)',
                borderRight: '1px solid var(--border)',
                paddingLeft: '8px',
                paddingRight: isLastDay ? '16px' : '8px',
                paddingTop: '12px',
                paddingBottom: '12px',
                textAlign: 'center',
                backgroundColor: isTodayDate ? 'var(--accent-2)' : 'var(--panel-2)',
              }}
            >
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>{dayName}</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600, color: isTodayDate ? 'var(--accent)' : 'var(--text)' }}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day events section */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', backgroundColor: 'var(--panel-2)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {/* All-day label */}
        <div style={{ borderRight: '1px solid var(--border)', paddingLeft: '8px', paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          All Day
        </div>

        {/* All-day events for each day */}
        {weekDays.map((day, index) => {
          const dateStr = day.toISOString().split('T')[0];
          const dayEvents = eventsByDay.get(dateStr) || [];
          const { allDay: allDayEvents } = separateTaskDeadlineEvents(dayEvents);
          const isLastDay = index === weekDays.length - 1;

          return (
            <div
              key={`allday-${dateStr}`}
              style={{
                borderRight: '1px solid var(--border)',
                paddingRight: isLastDay ? '8px' : undefined,
                paddingLeft: '4px',
                paddingTop: '4px',
                paddingBottom: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                minHeight: allDayEvents.length > 0 ? '32px' : '24px',
              }}
            >
              {allDayEvents.map((event) => {
                const color = getEventColor(event);
                return (
                  <div
                    key={event.id}
                    style={{
                      fontSize: '0.7rem',
                      paddingLeft: '6px',
                      paddingRight: '6px',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                      borderRadius: '2px',
                      backgroundColor: `${color}30`,
                      color: 'white',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                      cursor: 'pointer',
                    }}
                    title={event.title}
                    onClick={() => setSelectedEvent(event)}
                  >
                    {event.title.substring(0, 16)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div ref={scrollContainerRef} style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)' }}>
          {/* Time column */}
          <div style={{ borderRight: '1px solid var(--border)', paddingTop: '8px', backgroundColor: 'var(--panel-2)', flexShrink: 0 }}>
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
                    paddingTop: '2px',
                    borderTop: '1px solid var(--border)',
                  }}
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

            const isLastDay = weekDays.length - 1 === weekDays.indexOf(day);
            return (
              <div
                key={dateStr}
                style={{
                  position: 'relative',
                  borderRight: '1px solid var(--border)',
                  backgroundColor: isTodayDate ? 'rgba(83, 155, 245, 0.05)' : 'var(--panel)',
                  paddingRight: isLastDay ? '8px' : undefined,
                }}
              >
                {/* Hour grid lines */}
                {hours.map((hour) => (
                  <div
                    key={`line-${hour}`}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      borderTop: '1px solid var(--border)',
                      top: `${(hour - START_HOUR) * HOUR_HEIGHT + 8}px`,
                      height: '0',
                    }}
                  />
                ))}

                {/* Course events */}
                {courseEvents.map((event) => {
                  if (!event.time || !event.endTime) return null;

                  // Get layout information for this event
                  const layout = eventLayoutsByDay.get(dateStr)?.find(l => l.event.id === event.id);
                  if (!layout) return null;

                  const { top: baseTop } = getTimeSlotPosition(event.time, START_HOUR, END_HOUR);
                  const top = baseTop + 9; // Offset to align with grid lines + 1px spacing
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
                        left: `calc(${eventLeft}% + 4px)`,
                        width: `calc(${eventWidth}% - 8px)`,
                        borderRadius: 'var(--radius-control)',
                        fontSize: '0.75rem',
                        padding: '6px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        zIndex: 10,
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: `${color}40`,
                        boxSizing: 'border-box',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      title={event.title}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: layout.totalColumns > 1 ? 'clip' : 'ellipsis', whiteSpace: layout.totalColumns > 1 ? 'normal' : 'nowrap', lineHeight: 1.2, wordBreak: 'break-word' }}>
                        {event.courseCode}
                      </div>
                      {layout.totalColumns === 1 && (
                        <div style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                          {formatTime(event.time)} - {formatTime(event.endTime)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Timed task/deadline events */}
                {(() => {
                  const dayEvents = eventsByDay.get(dateStr) || [];
                  const { timed: timedEvents } = separateTaskDeadlineEvents(dayEvents);
                  const layout = timedEventLayoutsByDay.get(dateStr) || [];

                  return timedEvents.map((event) => {
                    if (!event.time) return null;

                    const eventLayout = layout.find(l => l.event.id === event.id);
                    if (!eventLayout) return null;

                    const { top: baseTop } = getTimeSlotPosition(event.time, START_HOUR, END_HOUR);
                    const top = baseTop + 9;
                    const height = event.endTime ? getEventHeight(event.time, event.endTime) : HOUR_HEIGHT * 0.5;
                    const color = getEventColor(event);

                    const eventWidth = 100 / eventLayout.totalColumns;
                    const eventLeft = eventLayout.column * eventWidth;

                    return (
                      <div
                        key={event.id}
                        style={{
                          position: 'absolute',
                          left: `calc(${eventLeft}% + 4px)`,
                          width: `calc(${eventWidth}% - 8px)`,
                          borderRadius: 'var(--radius-control)',
                          fontSize: '0.75rem',
                          padding: '6px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transition: 'opacity 0.2s',
                          zIndex: 9,
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: `${color}30`,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        title={event.title}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2, textAlign: 'center' }}>
                          {event.title.substring(0, 20)}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            );
          })}
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
