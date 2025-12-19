'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { Course, Task, Deadline, ExcludedDate } from '@/types';
import {
  getWeekRange,
  getEventsForDate,
  getTimeSlotPosition,
  getEventHeight,
  getEventColor,
  calculateEventLayout,
  separateTaskDeadlineEvents,
  getExclusionType,
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
  excludedDates?: ExcludedDate[];
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
  excludedDates = [],
}: CalendarWeekViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [popupState, setPopupState] = useState<{
    type: 'exclusion' | 'more';
    dateStr: string;
    position: { top: number; left: number };
    hasExclusion?: boolean;
  } | null>(null);

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
      const events = getEventsForDate(day, courses, tasks, deadlines, excludedDates);
      map.set(day.toISOString().split('T')[0], events);
    });
    return map;
  }, [weekDays, courses, tasks, deadlines, excludedDates]);

  const eventLayoutsByDay = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateEventLayout>>();
    weekDays.forEach((day) => {
      const dateStr = day.toISOString().split('T')[0];
      const dayEvents = eventsByDay.get(dateStr) || [];
      const courseEvents = dayEvents.filter((e) => e.type === 'course');
      const { timed: timedEvents } = separateTaskDeadlineEvents(dayEvents);
      // Combine all timed events (courses + timed tasks/deadlines) for unified layout
      const allTimedEvents = [...courseEvents, ...timedEvents];
      const layout = calculateEventLayout(allTimedEvents);
      if (layout.length > 0) {
        map.set(dateStr, layout);
      }
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
                display: 'flex',
                flexDirection: 'column',
                gap: '0px',
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
          const isTodayDate = isToday(day);
          const exclusionType = getExclusionType(day, excludedDates);

          // Get course code and color for cancelled classes
          let courseCode = '';
          let exclusionCourseId = '';
          if (exclusionType === 'class-cancelled') {
            const exclusion = excludedDates.find((ex) => {
              const exDateOnly = ex.date.includes('T') ? ex.date.split('T')[0] : ex.date;
              return exDateOnly === dateStr && ex.courseId;
            });
            if (exclusion) {
              const course = courses.find(c => c.id === exclusion.courseId);
              courseCode = course?.code || '';
              exclusionCourseId = exclusion.courseId;
            }
          }

          // Calculate how many items we can show (max 3 total, including exclusion badge)
          const hasExclusion = !!exclusionType;
          const maxVisibleEvents = hasExclusion ? 2 : 3;
          const visibleEvents = allDayEvents.slice(0, maxVisibleEvents);
          const hiddenCount = allDayEvents.length - visibleEvents.length;

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
                minHeight: allDayEvents.length > 0 || exclusionType ? '32px' : '24px',
                backgroundColor: isTodayDate ? 'rgba(83, 155, 245, 0.05)' : undefined,
                overflow: 'hidden',
              }}
            >
              {exclusionType && (() => {
                let markerColor = exclusionCourseId
                  ? getEventColor({ courseId: exclusionCourseId } as any)
                  : '#13234350';

                return (
                  <div
                    style={{
                      fontSize: '0.7rem',
                      paddingLeft: '6px',
                      paddingRight: '6px',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                      marginRight: '4px',
                      borderRadius: '2px',
                      backgroundColor: exclusionCourseId ? `${markerColor}50` : markerColor,
                      color: 'white',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                      fontWeight: 500,
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setPopupState({
                        type: 'exclusion',
                        dateStr,
                        position: { top: rect.bottom + 4, left: rect.left },
                      });
                    }}
                  >
                    {exclusionType === 'holiday' ? 'No School' : `Class Cancelled${courseCode ? ': ' + courseCode : ''}`}
                  </div>
                );
              })()}
              {visibleEvents.map((event) => {
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
                      marginRight: '4px',
                      borderRadius: '2px',
                      backgroundColor: `${color}50`,
                      color: 'white',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                    title={event.title}
                    onClick={() => setSelectedEvent(event)}
                  >
                    {event.title.substring(0, 16)}
                  </div>
                );
              })}
              {hiddenCount > 0 && (
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    lineHeight: 1,
                    paddingTop: '4px',
                    paddingLeft: '2px',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setPopupState({
                      type: 'more',
                      dateStr,
                      position: { top: rect.bottom + 4, left: rect.left },
                      hasExclusion,
                    });
                  }}
                >
                  +{hiddenCount} more
                </div>
              )}
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
                        left: `calc(${eventLeft}% + 3px)`,
                        width: `calc(${eventWidth}% - 6px)`,
                        borderRadius: 'var(--radius-control)',
                        fontSize: '0.75rem',
                        padding: '6px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        zIndex: 10,
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: `${color}60`,
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
                  const layout = eventLayoutsByDay.get(dateStr) || [];

                  return timedEvents.map((event) => {
                    if (!event.time) return null;

                    const eventLayout = layout.find(l => l.event.id === event.id);
                    if (!eventLayout) return null;

                    const { top: baseTop } = getTimeSlotPosition(event.time, START_HOUR, END_HOUR);
                    const top = baseTop + 9;
                    const height = event.endTime ? getEventHeight(event.time, event.endTime) : HOUR_HEIGHT * 0.5;
                    const color = getEventColor(event);

                    // Check if there are any other events overlapping this one in time
                    const eventStart = parseInt(event.time.split(':')[0]) * 60 + parseInt(event.time.split(':')[1]);
                    const eventEnd = event.endTime
                      ? parseInt(event.endTime.split(':')[0]) * 60 + parseInt(event.endTime.split(':')[1])
                      : eventStart + 60;

                    const overlappingEvents = layout.filter(l => {
                      if (l.event.id === event.id || !l.event.time) return false;
                      const otherStart = parseInt(l.event.time.split(':')[0]) * 60 + parseInt(l.event.time.split(':')[1]);
                      const otherEnd = l.event.endTime
                        ? parseInt(l.event.endTime.split(':')[0]) * 60 + parseInt(l.event.endTime.split(':')[1])
                        : otherStart + 60;
                      return !(eventEnd <= otherStart || eventStart >= otherEnd);
                    });

                    const shouldExpand = overlappingEvents.length === 0;

                    const eventWidth = shouldExpand ? 100 : 100 / eventLayout.totalColumns;
                    const eventLeft = shouldExpand ? 0 : eventLayout.column * (100 / eventLayout.totalColumns);

                    return (
                      <div
                        key={event.id}
                        style={{
                          position: 'absolute',
                          left: `calc(${eventLeft}% + 3px)`,
                          width: `calc(${eventWidth}% - 6px)`,
                          borderRadius: 'var(--radius-control)',
                          fontSize: '0.75rem',
                          padding: '6px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transition: 'opacity 0.2s',
                          zIndex: 9,
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: `${color}50`,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          boxSizing: 'border-box',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        title={event.title}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2, width: '100%', minWidth: 0 }}>
                          {event.title}
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

      {/* Popup for exclusion details or more events */}
      {popupState && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setPopupState(null)}
          />
          {/* Popup */}
          <div
            style={{
              position: 'fixed',
              top: `${popupState.position.top}px`,
              left: `${popupState.position.left}px`,
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              padding: '12px',
              minWidth: '200px',
              maxWidth: '300px',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {popupState.type === 'exclusion' && (() => {
              const exclusion = excludedDates.find((ex) => {
                const exDateOnly = ex.date.includes('T') ? ex.date.split('T')[0] : ex.date;
                return exDateOnly === popupState.dateStr;
              });

              if (!exclusion) return null;

              const exclusionType = exclusion.courseId ? 'class-cancelled' : 'holiday';
              let courseName = '';
              if (exclusionType === 'class-cancelled' && exclusion.courseId) {
                const course = courses.find(c => c.id === exclusion.courseId);
                courseName = course?.code || course?.name || '';
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
                    {exclusionType === 'holiday' ? 'No School' : 'Class Cancelled'}
                  </div>
                  {courseName && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {courseName}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {exclusion.description}
                  </div>
                </div>
              );
            })()}

            {popupState.type === 'more' && (() => {
              const dateStr = popupState.dateStr;
              const dayEvents = eventsByDay.get(dateStr) || [];
              const { allDay: allDayEvents } = separateTaskDeadlineEvents(dayEvents);
              const maxVisibleEvents = popupState.hasExclusion ? 2 : 3;
              const hiddenEvents = allDayEvents.slice(maxVisibleEvents);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                    All-day events
                  </div>
                  {hiddenEvents.map((event) => {
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
                          backgroundColor: `${color}50`,
                          color: 'white',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setSelectedEvent(event);
                          setPopupState(null);
                        }}
                      >
                        {event.title}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </>
      )}

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
