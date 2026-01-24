'use client';

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Course, Task, Deadline, Exam, ExcludedDate, CalendarEvent as CustomCalendarEvent, WorkItem } from '@/types';
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
import dynamic from 'next/dynamic';
import useAppStore from '@/lib/store';

// Lazy load heavy modal - only needed when user clicks an event
const EventDetailModal = dynamic(() => import('@/components/EventDetailModal'), {
  ssr: false,
});
import ExclusionDetailModal from '@/components/ExclusionDetailModal';

interface CalendarWeekViewProps {
  date: Date;
  courses: Course[];
  tasks: Task[];
  deadlines: Deadline[];
  workItems?: WorkItem[];
  exams?: Exam[];
  allTasks?: Task[];
  allDeadlines?: Deadline[];
  allWorkItems?: WorkItem[];
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

const CalendarWeekView = React.memo(function CalendarWeekView({
  date,
  courses,
  tasks,
  deadlines,
  workItems = [],
  exams = [],
  allTasks = [],
  allDeadlines = [],
  allWorkItems = [],
  excludedDates = [],
  calendarEvents = [],
  onEventUpdate,
  onStatusChange,
  onEventReschedule,
}: CalendarWeekViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dayColumnRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedExclusion, setSelectedExclusion] = useState<ExcludedDate | null>(null);
  const [popupState, setPopupState] = useState<{
    type: 'more';
    dateStr: string;
    position: { top: number; left: number };
    hasExclusion?: boolean;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ dateStr: string; top: number; isAllDay: boolean } | null>(null);
  const lastScrolledWeekRef = useRef<string | null>(null);

  // Get colorblind settings
  const settings = useAppStore((state) => state.settings);
  const colorblindMode = settings.colorblindMode as any;
  const colorblindStyle = settings.colorblindStyle as any;
  const theme = (settings.theme || 'dark') as 'light' | 'dark';

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
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
      const events = getEventsForDate(day, courses, tasks, deadlines, exams, excludedDates, calendarEvents, workItems);
      map.set(day.toISOString().split('T')[0], events);
    });
    return map;
  }, [weekDays, courses, tasks, deadlines, workItems, exams, excludedDates, calendarEvents]);

  const eventLayoutsByDay = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateEventLayout>>();
    weekDays.forEach((day) => {
      const dateStr = day.toISOString().split('T')[0];
      const dayEvents = eventsByDay.get(dateStr) || [];
      const courseEvents = dayEvents.filter((e) => e.type === 'course');
      // separateTaskDeadlineEvents now includes custom calendar events with times
      const { timed: timedEvents } = separateTaskDeadlineEvents(dayEvents);
      // Combine all timed events (courses + custom events + timed tasks/deadlines) for unified layout
      const allTimedEvents = [...courseEvents, ...timedEvents];
      const layout = calculateEventLayout(allTimedEvents);
      if (layout.length > 0) {
        map.set(dateStr, layout);
      }
    });
    return map;
  }, [weekDays, eventsByDay]);

  // Calculate the earliest event time across the entire week for scrolling
  const earliestEventHour = useMemo(() => {
    let earliest: number | null = null;

    // Check all days in the week for the earliest timed event
    eventsByDay.forEach((dayEvents) => {
      dayEvents.forEach((event) => {
        if (event.time && !event.allDay) {
          const [hours] = event.time.split(':').map(Number);
          if (earliest === null || hours < earliest) {
            earliest = hours;
          }
        }
      });
    });

    // If no events, default to 8 AM; otherwise scroll to 1 hour before earliest event
    if (earliest === null) {
      return 8;
    }
    return Math.max(0, earliest - 1);
  }, [eventsByDay]);

  useEffect(() => {
    // Scroll to the earliest event time only on mount or when week changes
    // Don't scroll when events are added/removed (preserves scroll position)
    const weekKey = weekStart.toISOString().split('T')[0];
    if (scrollContainerRef.current && lastScrolledWeekRef.current !== weekKey) {
      const scrollPosition = earliestEventHour * HOUR_HEIGHT;
      scrollContainerRef.current.scrollTop = scrollPosition;
      lastScrolledWeekRef.current = weekKey;
    }
  }, [earliestEventHour, weekStart]);

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  // Drag and drop helpers
  const isDraggable = (event: CalendarEvent) => {
    // Only tasks, deadlines, exams, and calendar events are draggable (not courses)
    return event.type !== 'course';
  };

  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    if (!isDraggable(event)) {
      e.preventDefault();
      return;
    }
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: event.type, id: event.id }));
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
      // Position the drag ghost so its top edge aligns with the cursor
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      e.dataTransfer.setDragImage(e.currentTarget, offsetX, 0);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedEvent(null);
    setDropIndicator(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleTimeGridDragOver = (e: React.DragEvent, dateStr: string) => {
    if (!draggedEvent) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const columnRef = dayColumnRefs.current.get(dateStr);
    if (!columnRef) return;

    const rect = columnRef.getBoundingClientRect();
    const y = e.clientY - rect.top - 8; // Account for padding
    // Snap to 15-minute intervals
    const totalMinutes = Math.round((y / HOUR_HEIGHT) * 60 / 15) * 15;
    const snappedY = (totalMinutes / 60) * HOUR_HEIGHT + 8;

    setDropIndicator({ dateStr, top: snappedY, isAllDay: false });
  };

  const handleTimeGridDrop = (e: React.DragEvent, dateStr: string, targetDate: Date) => {
    e.preventDefault();
    if (!draggedEvent || !onEventReschedule) return;

    const columnRef = dayColumnRefs.current.get(dateStr);
    if (!columnRef) return;

    const rect = columnRef.getBoundingClientRect();
    const y = e.clientY - rect.top - 8;
    // Snap to 15-minute intervals
    const totalMinutes = Math.round((y / HOUR_HEIGHT) * 60 / 15) * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Create new date with the dropped time
    const newDate = new Date(targetDate);
    newDate.setHours(hours, minutes, 0, 0);

    onEventReschedule(draggedEvent.type, draggedEvent.id, newDate, false);
    setDraggedEvent(null);
    setDropIndicator(null);
  };

  const handleAllDayDragOver = (e: React.DragEvent, dateStr: string) => {
    if (!draggedEvent) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIndicator({ dateStr, top: 0, isAllDay: true });
  };

  const handleAllDayDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    if (!draggedEvent || !onEventReschedule) return;

    // Create new date at end of day (all-day event)
    const newDate = new Date(targetDate);
    newDate.setHours(23, 59, 0, 0);

    onEventReschedule(draggedEvent.type, draggedEvent.id, newDate, true);
    setDraggedEvent(null);
    setDropIndicator(null);
  };

  const handleDragLeave = (e: React.DragEvent) => {
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
                backgroundColor: isTodayDate ? 'var(--accent-2)' : 'var(--panel)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0px',
              }}
            >
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>{dayName}</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600, color: isTodayDate ? 'var(--link)' : 'var(--text)' }}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day events section */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', backgroundColor: 'var(--panel)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {/* All-day label */}
        <div style={{ borderRight: '1px solid var(--border)', paddingLeft: '8px', paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          All Day
        </div>

        {/* All-day events for each day */}
        {weekDays.map((day, index) => {
          const dateStr = day.toISOString().split('T')[0];
          const dayEvents = eventsByDay.get(dateStr) || [];
          const { allDay: allDayTaskDeadlineEvents } = separateTaskDeadlineEvents(dayEvents);
          const allDayCustomEvents = dayEvents.filter((e) => e.type === 'event' && e.allDay);
          // Deduplicate by event ID
          const seenIds = new Set<string>();
          const allDayEvents = [...allDayTaskDeadlineEvents, ...allDayCustomEvents].filter((e) => {
            if (seenIds.has(e.id)) return false;
            seenIds.add(e.id);
            return true;
          });
          const isLastDay = index === weekDays.length - 1;
          const isTodayDate = isToday(day);
          const exclusionType = getExclusionType(day, excludedDates);

          // Get course code and color for cancelled classes
          let courseCode = '';
          let exclusionCourseId: string | null = null;
          if (exclusionType === 'class-cancelled') {
            const exclusion = excludedDates.find((ex) => {
              const exDateOnly = ex.date.includes('T') ? ex.date.split('T')[0] : ex.date;
              return exDateOnly === dateStr && ex.courseId;
            });
            if (exclusion) {
              const course = courses.find(c => c.id === exclusion.courseId);
              courseCode = course?.code || '';
              exclusionCourseId = exclusion.courseId || null;
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
                backgroundColor: dropIndicator?.isAllDay && dropIndicator?.dateStr === dateStr ? 'var(--accent-2)' : isTodayDate ? 'var(--today-bg)' : undefined,
                overflow: 'hidden',
                transition: 'background-color 0.15s',
              }}
              onDragOver={(e) => handleAllDayDragOver(e, dateStr)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleAllDayDrop(e, day)}
            >
              {exclusionType && (() => {
                let markerColor = getEventColor({ courseId: exclusionCourseId } as any, colorblindMode, theme, colorblindStyle);
                const exclusion = excludedDates.find((ex) => {
                  const exDateOnly = ex.date.includes('T') ? ex.date.split('T')[0] : ex.date;
                  return exDateOnly === dateStr && (exclusionType === 'holiday' ? !ex.courseId : ex.courseId);
                });

                return (
                  <div
                    data-exclusion-type={exclusionType}
                    style={{
                      fontSize: '0.7rem',
                      paddingLeft: '6px',
                      paddingRight: '6px',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                      marginRight: '4px',
                      borderRadius: '2px',
                      backgroundColor: `${markerColor}80`,
                      color: 'var(--calendar-event-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                      fontWeight: 500,
                      flexShrink: 0,
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
              {visibleEvents.map((event, idx) => {
                const color = getEventColor(event, colorblindMode, theme, colorblindStyle);
                const canDrag = isDraggable(event);
                return (
                  <div
                    key={`${dateStr}-allday-${event.id}-${idx}`}
                    data-event-type={event.type}
                    draggable={canDrag}
                    onDragStart={(e) => handleDragStart(e, event)}
                    onDragEnd={handleDragEnd}
                    style={{
                      fontSize: '0.7rem',
                      paddingLeft: '6px',
                      paddingRight: '6px',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                      marginRight: '4px',
                      borderRadius: '2px',
                      backgroundColor: `${color}80`,
                      color: 'var(--calendar-event-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                      cursor: canDrag ? 'grab' : 'pointer',
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
          <div style={{ borderRight: '1px solid var(--border)', paddingTop: '8px', backgroundColor: 'var(--panel)', flexShrink: 0 }}>
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
                ref={(el) => {
                  if (el) dayColumnRefs.current.set(dateStr, el);
                }}
                style={{
                  position: 'relative',
                  borderRight: '1px solid var(--border)',
                  backgroundColor: isTodayDate ? 'var(--today-bg)' : 'var(--panel)',
                  paddingRight: isLastDay ? '8px' : undefined,
                }}
                onDragOver={(e) => handleTimeGridDragOver(e, dateStr)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleTimeGridDrop(e, dateStr, day)}
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

                {/* Current time indicator line (only for today) */}
                {isTodayDate && (() => {
                  const hours = currentTime.getHours();
                  const minutes = currentTime.getMinutes();
                  const totalMinutes = hours * 60 + minutes;
                  const topPosition = (totalMinutes / 60) * HOUR_HEIGHT + 8;

                  return (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: `${topPosition}px`,
                        zIndex: 20,
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
                {dropIndicator && !dropIndicator.isAllDay && dropIndicator.dateStr === dateStr && (
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

                {/* Course events */}
                {courseEvents.map((event) => {
                  if (!event.time || !event.endTime) return null;

                  // Get layout information for this event
                  const layout = eventLayoutsByDay.get(dateStr)?.find(l => l.event.id === event.id);
                  if (!layout) return null;

                  const { top: baseTop } = getTimeSlotPosition(event.time, START_HOUR, END_HOUR);
                  const top = baseTop + 9; // Offset to align with grid lines + 1px spacing
                  const height = getEventHeight(event.time, event.endTime);
                  const color = getEventColor(event, colorblindMode, theme, colorblindStyle);

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
                      key={`${dateStr}-course-${event.id}`}
                      data-event-type={event.type}
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
                        backgroundColor: `${color}80`,
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

                {/* Timed task/deadline/calendar events */}
                {(() => {
                  const dayEvents = eventsByDay.get(dateStr) || [];
                  const { timed: timedEvents } = separateTaskDeadlineEvents(dayEvents);
                  const layout = eventLayoutsByDay.get(dateStr) || [];

                  // Convert 24-hour time to 12-hour format
                  const formatTime = (time: string) => {
                    const [hours, minutes] = time.split(':');
                    const hour = parseInt(hours);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                    return `${displayHour}:${minutes} ${ampm}`;
                  };

                  return timedEvents.map((event) => {
                    if (!event.time) return null;

                    const eventLayout = layout.find(l => l.event.id === event.id);
                    if (!eventLayout) return null;

                    const { top: baseTop } = getTimeSlotPosition(event.time, START_HOUR, END_HOUR);
                    const top = baseTop + 9;
                    const baseHeight = event.endTime ? getEventHeight(event.time, event.endTime) : HOUR_HEIGHT * 0.5;
                    const minHeight = 30; // Minimum height ~30 minutes
                    const height = Math.max(baseHeight, minHeight);
                    const color = getEventColor(event, colorblindMode, theme, colorblindStyle);
                    const canDrag = isDraggable(event);

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
                        key={`${dateStr}-timed-${event.id}`}
                        data-event-type={event.type}
                        draggable={canDrag}
                        onDragStart={(e) => handleDragStart(e, event)}
                        onDragEnd={handleDragEnd}
                        style={{
                          position: 'absolute',
                          left: `calc(${eventLeft}% + 3px)`,
                          width: `calc(${eventWidth}% - 6px)`,
                          borderRadius: 'var(--radius-control)',
                          fontSize: '0.75rem',
                          padding: '4px 6px',
                          overflow: 'hidden',
                          cursor: canDrag ? 'grab' : 'pointer',
                          transition: 'opacity 0.2s',
                          zIndex: 9,
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: `${color}80`,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          boxSizing: 'border-box',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        title={`${event.title}${event.endTime ? ` (${formatTime(event.time)} - ${formatTime(event.endTime)})` : ` (${formatTime(event.time)})`}`}
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

      {/* Popup for more events */}
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
            {(() => {
              const dateStr = popupState.dateStr;
              const dayEvents = eventsByDay.get(dateStr) || [];
              const { allDay: allDayTaskDeadlineEvents } = separateTaskDeadlineEvents(dayEvents);
              const allDayCustomEvents = dayEvents.filter((e) => e.type === 'event' && e.allDay);
              // Deduplicate by event ID
              const seenIds = new Set<string>();
              const allDayEvents = [...allDayTaskDeadlineEvents, ...allDayCustomEvents].filter((e) => {
                if (seenIds.has(e.id)) return false;
                seenIds.add(e.id);
                return true;
              });
              const maxVisibleEvents = popupState.hasExclusion ? 2 : 3;
              const hiddenEvents = allDayEvents.slice(maxVisibleEvents);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                    All-day events
                  </div>
                  {hiddenEvents.map((event, idx) => {
                    const color = getEventColor(event, colorblindMode, theme, colorblindStyle);
                    return (
                      <div
                        key={`${dateStr}-hidden-${event.id}-${idx}`}
                        data-event-type={event.type}
                        style={{
                          fontSize: '0.7rem',
                          paddingLeft: '6px',
                          paddingRight: '6px',
                          paddingTop: '4px',
                          paddingBottom: '4px',
                          borderRadius: '2px',
                          backgroundColor: `${color}80`,
                          color: 'var(--calendar-event-text)',
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
        workItems={allWorkItems && allWorkItems.length > 0 ? allWorkItems : workItems}
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
});

CalendarWeekView.displayName = 'CalendarWeekView';

export default CalendarWeekView;
