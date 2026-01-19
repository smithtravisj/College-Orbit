'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { Course, Task, Deadline, Exam, ExcludedDate, CalendarEvent as CustomCalendarEvent } from '@/types';
import { useIsMobile } from '@/hooks/useMediaQuery';
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
import ExclusionDetailModal from '@/components/ExclusionDetailModal';

interface CalendarDayViewProps {
  date: Date;
  courses: Course[];
  tasks: Task[];
  deadlines: Deadline[];
  exams?: Exam[];
  allTasks?: Task[];
  allDeadlines?: Deadline[];
  excludedDates?: ExcludedDate[];
  calendarEvents?: CustomCalendarEvent[];
  onTimeSlotClick?: (date: Date, time?: string, allDay?: boolean) => void;
  onEventUpdate?: (updatedEvent: CustomCalendarEvent) => void;
  onStatusChange?: () => void;
  onEventReschedule?: (eventType: string, eventId: string, newDate: Date, allDay: boolean) => void;
}

const HOUR_HEIGHT = 60; // pixels
const START_HOUR = 0;
const END_HOUR = 24;

export default function CalendarDayView({
  date,
  courses,
  tasks,
  deadlines,
  exams = [],
  allTasks = [],
  allDeadlines = [],
  excludedDates = [],
  calendarEvents = [],
  onEventUpdate,
  onStatusChange,
  onEventReschedule,
}: CalendarDayViewProps) {
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timeGridRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedExclusion, setSelectedExclusion] = useState<ExcludedDate | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ top: number; isAllDay: boolean } | null>(null);

  // Check if the viewed date is today
  const isViewingToday = useMemo(() => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }, [date]);

  // Update current time every minute
  useEffect(() => {
    if (!isViewingToday) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isViewingToday]);

  const events = useMemo(
    () => getEventsForDate(date, courses, tasks, deadlines, exams, excludedDates, calendarEvents),
    [date, courses, tasks, deadlines, exams, excludedDates, calendarEvents]
  );

  const courseEvents = useMemo(() => events.filter((e) => e.type === 'course'), [events]);
  // Get custom calendar events that have times (not all-day)
  const customEvents = useMemo(() => events.filter((e) => e.type === 'event' && !e.allDay && e.time), [events]);
  // Get all-day custom calendar events
  const allDayCustomEvents = useMemo(() => events.filter((e) => e.type === 'event' && e.allDay), [events]);
  const taskDeadlineEvents = useMemo(() => events.filter((e) => e.type !== 'course' && e.type !== 'event'), [events]);
  const { timed: timedTaskDeadlineEvents } = useMemo(() => separateTaskDeadlineEvents(taskDeadlineEvents), [taskDeadlineEvents]);

  // Combine all timed events (courses + custom events + timed tasks/deadlines) for unified layout
  const allTimedEvents = useMemo(() => [...courseEvents, ...customEvents, ...timedTaskDeadlineEvents], [courseEvents, customEvents, timedTaskDeadlineEvents]);
  const eventLayout = useMemo(() => calculateEventLayout(allTimedEvents), [allTimedEvents]);

  // Calculate the earliest event time for scrolling
  const earliestEventHour = useMemo(() => {
    let earliest: number | null = null;

    // Check all timed events for the earliest start time
    allTimedEvents.forEach((event) => {
      if (event.time) {
        const [hours] = event.time.split(':').map(Number);
        if (earliest === null || hours < earliest) {
          earliest = hours;
        }
      }
    });

    // If no events, default to 8 AM; otherwise scroll to 1 hour before earliest event
    if (earliest === null) {
      return 8;
    }
    return Math.max(0, earliest - 1);
  }, [allTimedEvents]);

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const mobileHourHeight = 40;
  const hourHeight = isMobile ? mobileHourHeight : HOUR_HEIGHT;

  useEffect(() => {
    // Scroll to the earliest event time on mount or when date changes
    if (scrollContainerRef.current) {
      const scrollPosition = earliestEventHour * hourHeight;
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, [earliestEventHour, date, hourHeight]);

  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Drag and drop helpers
  const isDraggable = (event: CalendarEvent) => {
    // Only tasks, deadlines, exams, and calendar events are draggable (not courses)
    return event.type !== 'course' && !isMobile;
  };

  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    if (!isDraggable(event)) {
      e.preventDefault();
      return;
    }
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: event.type, id: event.id }));
    // Make the drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedEvent(null);
    setDropIndicator(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleTimeGridDragOver = (e: React.DragEvent) => {
    if (!draggedEvent) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Calculate time from Y position
    const rect = timeGridRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;
    // Snap to 15-minute intervals
    const totalMinutes = Math.round((y / hourHeight) * 60 / 15) * 15;
    const snappedY = (totalMinutes / 60) * hourHeight;

    setDropIndicator({ top: snappedY, isAllDay: false });
  };

  const handleTimeGridDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedEvent || !onEventReschedule) return;

    const rect = timeGridRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;
    // Snap to 15-minute intervals
    const totalMinutes = Math.round((y / hourHeight) * 60 / 15) * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Create new date with the dropped time
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);

    onEventReschedule(draggedEvent.type, draggedEvent.id, newDate, false);
    setDraggedEvent(null);
    setDropIndicator(null);
  };

  const handleAllDayDragOver = (e: React.DragEvent) => {
    if (!draggedEvent) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIndicator({ top: 0, isAllDay: true });
  };

  const handleAllDayDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedEvent || !onEventReschedule) return;

    // Create new date at start of day (all-day event)
    const newDate = new Date(date);
    newDate.setHours(23, 59, 0, 0);

    onEventReschedule(draggedEvent.type, draggedEvent.id, newDate, true);
    setDraggedEvent(null);
    setDropIndicator(null);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setDropIndicator(null);
    }
  };

  const exclusionType = getExclusionType(date, excludedDates);

  // Get course code and color for cancelled classes
  let courseCode = '';
  let exclusionCourseId: string | null = null;
  if (exclusionType === 'class-cancelled') {
    const dateYear = date.getFullYear();
    const dateMonth = String(date.getMonth() + 1).padStart(2, '0');
    const dateDay = String(date.getDate()).padStart(2, '0');
    const dateKey = `${dateYear}-${dateMonth}-${dateDay}`;
    const exclusion = excludedDates.find((ex) => ex.date === dateKey && ex.courseId);
    if (exclusion) {
      const course = courses.find(c => c.id === exclusion.courseId);
      courseCode = course?.code || '';
      exclusionCourseId = exclusion.courseId || null;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '100%', backgroundColor: 'var(--panel)', overflow: isMobile ? 'visible' : 'auto' }}>
      {/* Header */}
      <div style={{ paddingLeft: isMobile ? '8px' : '16px', paddingRight: isMobile ? '8px' : '16px', paddingTop: isMobile ? '6px' : '12px', paddingBottom: isMobile ? '6px' : '12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h2 style={{ fontSize: isMobile ? '0.875rem' : '1.125rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{dateStr}</h2>
      </div>

      {(() => {
        const { allDay: allDayTaskDeadlineEvents } = separateTaskDeadlineEvents(taskDeadlineEvents);
        const allDayEvents = [...allDayTaskDeadlineEvents, ...allDayCustomEvents];
        if (allDayEvents.length === 0 && !exclusionType) return null;

        return (
          <div
            style={{
              paddingLeft: isMobile ? '8px' : '16px',
              paddingRight: isMobile ? '8px' : '16px',
              paddingTop: isMobile ? '6px' : '12px',
              paddingBottom: isMobile ? '6px' : '12px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: dropIndicator?.isAllDay ? 'var(--accent-2)' : 'var(--panel)',
              flexShrink: 0,
              transition: 'background-color 0.15s',
            }}
            onDragOver={handleAllDayDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleAllDayDrop}
          >
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: isMobile ? '4px' : '8px' }}>All Day</p>
            <div style={{ display: 'flex', gap: isMobile ? '2px' : '4px', flexWrap: 'wrap', alignItems: 'center' }}>
              {exclusionType && (() => {
                let markerColor = getEventColor({ courseId: exclusionCourseId } as any);
                const dateYear = date.getFullYear();
                const dateMonth = String(date.getMonth() + 1).padStart(2, '0');
                const dateDay = String(date.getDate()).padStart(2, '0');
                const dateKey = `${dateYear}-${dateMonth}-${dateDay}`;
                const exclusion = excludedDates.find((ex) => {
                  const exDateOnly = ex.date.includes('T') ? ex.date.split('T')[0] : ex.date;
                  return exDateOnly === dateKey && (exclusionType === 'holiday' ? !ex.courseId : ex.courseId);
                });

                return (
                  <div
                    style={{
                      paddingLeft: isMobile ? '4px' : '8px',
                      paddingRight: isMobile ? '4px' : '8px',
                      paddingTop: isMobile ? '1px' : '4px',
                      paddingBottom: isMobile ? '1px' : '4px',
                      borderRadius: 'var(--radius-control)',
                      fontSize: isMobile ? '0.65rem' : '0.875rem',
                      backgroundColor: `${markerColor}80`,
                      color: 'var(--calendar-event-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: '0 0 auto',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                    onClick={() => {
                      if (exclusion) setSelectedExclusion(exclusion);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    {exclusionType === 'holiday' ? 'No School' : `Class Cancelled${courseCode ? ': ' + courseCode : ''}`}
                  </div>
                );
              })()}
              {allDayEvents.map((event) => {
                const color = getEventColor(event);
                const canDrag = isDraggable(event);
                return (
                  <div
                    key={event.id}
                    draggable={canDrag}
                    onDragStart={(e) => handleDragStart(e, event)}
                    onDragEnd={handleDragEnd}
                    style={{
                      paddingLeft: isMobile ? '6px' : '8px',
                      paddingRight: isMobile ? '6px' : '8px',
                      paddingTop: isMobile ? '2px' : '4px',
                      paddingBottom: isMobile ? '2px' : '4px',
                      borderRadius: 'var(--radius-control)',
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      backgroundColor: `${color}80`,
                      color: 'var(--calendar-event-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: '0 0 auto',
                      cursor: canDrag ? 'grab' : 'pointer',
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
      <div ref={scrollContainerRef} style={{ display: 'flex', flex: isMobile ? 'none' : 1, overflow: 'auto', ...(isMobile ? { height: '200px' } : {}) }}>
        {/* Time column */}
        <div style={{ width: isMobile ? '50px' : '80px', paddingTop: isMobile ? '4px' : '8px', paddingLeft: isMobile ? '4px' : '8px', flexShrink: 0 }}>
          {hours.map((hour) => {
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            return (
              <div
                key={hour}
                style={{
                  height: `${hourHeight}px`,
                  paddingRight: isMobile ? '4px' : '8px',
                  fontSize: isMobile ? '0.65rem' : '0.75rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  paddingTop: isMobile ? '2px' : '4px',
                }}
              >
                {displayHour} {ampm}
              </div>
            );
          })}
        </div>

        {/* Events column */}
        <div
          ref={timeGridRef}
          style={{ flex: 1, position: 'relative', paddingTop: isMobile ? '4px' : '8px', paddingRight: isMobile ? '4px' : '8px' }}
          onDragOver={handleTimeGridDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleTimeGridDrop}
        >
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
                  top: `${(hour - START_HOUR) * hourHeight}px`,
                  height: `${hourHeight}px`,
                }}
              />
            );
          })}

          {/* Current time indicator line */}
          {isViewingToday && (() => {
            const hours = currentTime.getHours();
            const minutes = currentTime.getMinutes();
            const totalMinutes = hours * 60 + minutes;
            const topPosition = (totalMinutes / 60) * hourHeight;

            return (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${topPosition}px`,
                  zIndex: 10,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--link)',
                    marginLeft: '-4px',
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: 'var(--link)',
                  }}
                />
              </div>
            );
          })()}

          {/* Drop indicator line */}
          {dropIndicator && !dropIndicator.isAllDay && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${dropIndicator.top}px`,
                zIndex: 25,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  marginLeft: '-5px',
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: 'var(--accent)',
                }}
              />
            </div>
          )}

          {/* Course events as blocks */}
          {courseEvents.map((event) => {
            if (!event.time || !event.endTime) return null;

            // Get layout information for this event
            const layout = eventLayout.find(l => l.event.id === event.id);
            if (!layout) return null;

            const { top: baseTop } = getTimeSlotPosition(event.time, START_HOUR, END_HOUR);
            const baseHeight = getEventHeight(event.time, event.endTime);
            const scaleFactor = hourHeight / HOUR_HEIGHT;
            const top = (baseTop + 1) * scaleFactor;
            const height = baseHeight * scaleFactor;
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
                  left: `calc(${eventLeft}% + ${isMobile ? '4px' : '8px'})`,
                  width: `calc(${eventWidth}% - ${isMobile ? '8px' : '16px'})`,
                  borderRadius: isMobile ? '6px' : 'var(--radius-control)',
                  padding: isMobile ? '4px 4px 2px 4px' : '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  top: `${top}px`,
                  height: `${height}px`,
                  backgroundColor: `${color}50`,
                  zIndex: 10,
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                title={event.title}
                onClick={() => setSelectedEvent(event)}
              >
                <div style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.1 }}>
                  {event.courseCode}
                </div>
                <div style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.1 }}>
                  {formatTime(event.time)} - {formatTime(event.endTime)}
                </div>
                {!isMobile && event.location && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.1 }}>
                    {event.location}
                  </div>
                )}
              </div>
            );
          })}

          {/* Custom calendar events (non-all-day) */}
          {customEvents.map((event) => {
            if (!event.time) return null;

            const layout = eventLayout.find(l => l.event.id === event.id);
            if (!layout) return null;

            const { top: baseTop } = getTimeSlotPosition(event.time, START_HOUR, END_HOUR);
            const baseHeight = event.endTime ? getEventHeight(event.time, event.endTime) : HOUR_HEIGHT * 0.5;
            const scaleFactor = hourHeight / HOUR_HEIGHT;
            const top = (baseTop + 1) * scaleFactor;
            const minHeight = 30; // Minimum height ~30 minutes
            const height = Math.max(baseHeight * scaleFactor, minHeight);
            const isCompact = baseHeight * scaleFactor < minHeight;
            const color = getEventColor(event);
            const canDrag = isDraggable(event);

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
                draggable={canDrag}
                onDragStart={(e) => handleDragStart(e, event)}
                onDragEnd={handleDragEnd}
                style={{
                  position: 'absolute',
                  left: `calc(${eventLeft}% + ${isMobile ? '4px' : '8px'})`,
                  width: `calc(${eventWidth}% - ${isMobile ? '8px' : '16px'})`,
                  borderRadius: isMobile ? '6px' : 'var(--radius-control)',
                  padding: isMobile ? '4px 4px 2px 4px' : '6px 8px',
                  overflow: 'hidden',
                  cursor: canDrag ? 'grab' : 'pointer',
                  transition: 'opacity 0.2s',
                  top: `${top}px`,
                  height: `${height}px`,
                  backgroundColor: `${color}50`,
                  zIndex: 10,
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: isCompact ? 'row' : 'column',
                  alignItems: isCompact ? 'center' : 'flex-start',
                  gap: isCompact ? '8px' : '0',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                title={`${event.title}${event.endTime ? ` (${formatTime(event.time)} - ${formatTime(event.endTime)})` : ''}`}
                onClick={() => setSelectedEvent(event)}
              >
                <div style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: isCompact ? '0 1 auto' : undefined, lineHeight: 1.1 }}>
                  {event.title}
                </div>
                {!isCompact && (
                  <div style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.1 }}>
                    {formatTime(event.time)}{event.endTime ? ` - ${formatTime(event.endTime)}` : ''}
                  </div>
                )}
                {!isCompact && !isMobile && event.location && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.1 }}>
                    {event.location}
                  </div>
                )}
                {isCompact && (
                  <div style={{ fontSize: isMobile ? '0.6rem' : '0.7rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '0 1 auto', lineHeight: 1.1 }}>
                    {formatTime(event.time)}
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
              const baseHeight = event.endTime ? getEventHeight(event.time, event.endTime) : HOUR_HEIGHT * 0.5;
              const scaleFactor = hourHeight / HOUR_HEIGHT;
              const top = (baseTop + 1) * scaleFactor;
              const height = baseHeight * scaleFactor;
              const color = getEventColor(event);
              const canDrag = isDraggable(event);

              const eventWidth = 100 / layout.totalColumns;
              const eventLeft = layout.column * eventWidth;

              return (
                <div
                  key={event.id}
                  draggable={canDrag}
                  onDragStart={(e) => handleDragStart(e, event)}
                  onDragEnd={handleDragEnd}
                  style={{
                    position: 'absolute',
                    left: `calc(${eventLeft}% + ${isMobile ? '4px' : '8px'})`,
                    width: `calc(${eventWidth}% - ${isMobile ? '8px' : '16px'})`,
                    borderRadius: isMobile ? '6px' : 'var(--radius-control)',
                    padding: isMobile ? '4px 4px 2px 4px' : '8px',
                    cursor: canDrag ? 'grab' : 'pointer',
                    transition: 'opacity 0.2s',
                    top: `${top}px`,
                    height: `${height}px`,
                    backgroundColor: `${color}50`,
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
                  <div style={{ fontSize: isMobile ? '0.65rem' : '0.8rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left', width: '100%', lineHeight: 1.3 }}>
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
        exams={exams}
        calendarEvents={calendarEvents}
        onEventUpdate={onEventUpdate}
        onStatusChange={onStatusChange}
      />

      <ExclusionDetailModal
        isOpen={selectedExclusion !== null}
        exclusion={selectedExclusion}
        courses={courses}
        onClose={() => setSelectedExclusion(null)}
      />
    </div>
  );
}
