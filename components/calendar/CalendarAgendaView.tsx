'use client';

import React, { useMemo, useState } from 'react';
import { Course, Task, Deadline, Exam, ExcludedDate, CalendarEvent as CustomCalendarEvent, WorkItem } from '@/types';
import {
  getEventsForDate,
  getEventColor,
  getExclusionType,
  CalendarEvent,
} from '@/lib/calendarUtils';
import { toLocalDateString } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import dynamic from 'next/dynamic';
import useAppStore from '@/lib/store';
import { useCalendarContextMenu, CalendarContextMenuPortal } from './CalendarContextMenu';

const EventDetailModal = dynamic(() => import('@/components/EventDetailModal'), {
  ssr: false,
});

const ExclusionDetailModal = dynamic(() => import('@/components/ExclusionDetailModal'), {
  ssr: false,
});

interface CalendarAgendaViewProps {
  year: number;
  month: number;
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
  onEventUpdate?: (updatedEvent: CustomCalendarEvent) => void;
  onStatusChange?: () => void;
  searchQuery?: string;
}

interface AgendaExclusion {
  type: 'exclusion';
  exclusionType: 'holiday' | 'class-cancelled';
  label: string;
  courseCode: string;
  exclusion: ExcludedDate;
  color: string;
}

const CalendarAgendaView = React.memo(function CalendarAgendaView({
  year,
  month,
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
  searchQuery = '',
}: CalendarAgendaViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedExclusion, setSelectedExclusion] = useState<ExcludedDate | null>(null);
  const isMobile = useIsMobile();

  const settings = useAppStore((state) => state.settings);
  const colorblindMode = settings.colorblindMode as any;
  const colorblindStyle = settings.colorblindStyle as any;
  const theme = (settings.theme || 'dark') as 'light' | 'dark';

  const { contextMenu, setContextMenu, handleContextMenu, getMenuItems, handleAction, pendingEditScope } = useCalendarContextMenu({
    workItems,
    setSelectedEvent,
    onStatusChange,
  });

  // Search match helper
  const matchesSearch = (event: CalendarEvent) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      event.title?.toLowerCase().includes(q) ||
      event.courseCode?.toLowerCase().includes(q) ||
      event.location?.toLowerCase().includes(q) ||
      event.description?.toLowerCase().includes(q)
    );
  };

  const matchesExclusionSearch = (label: string, courseCode: string) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return label.toLowerCase().includes(q) || courseCode.toLowerCase().includes(q);
  };

  // Get today + next 30 days
  const daysToShow = useMemo(() => {
    const days: Date[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let d = 0; d <= 30; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + d);
      days.push(day);
    }
    return days;
  }, [year, month]);

  // Group events + exclusions by date
  const eventsByDate = useMemo(() => {
    const groups: { date: Date; dateStr: string; events: CalendarEvent[]; exclusions: AgendaExclusion[] }[] = [];
    daysToShow.forEach((day) => {
      const events = getEventsForDate(day, courses, tasks, deadlines, exams, excludedDates, calendarEvents, workItems);
      const filtered = searchQuery ? events.filter(matchesSearch) : events;

      // Get exclusions for this date
      const dateStr = toLocalDateString(day);
      const exclusionType = getExclusionType(day, excludedDates);
      const exclusions: AgendaExclusion[] = [];

      if (exclusionType) {
        const matchingExclusions = excludedDates.filter((ex) => {
          const exDateOnly = ex.date.includes('T') ? ex.date.split('T')[0] : ex.date;
          return exDateOnly === dateStr;
        });

        matchingExclusions.forEach((ex) => {
          const isHoliday = !ex.courseId;
          const course = ex.courseId ? courses.find(c => c.id === ex.courseId) : null;
          const courseCode = course?.code || '';
          const label = isHoliday ? 'No School' : `Class Cancelled${courseCode ? ': ' + courseCode : ''}`;
          const color = getEventColor({ courseId: ex.courseId || '' } as any, colorblindMode, theme, colorblindStyle);

          if (!searchQuery || matchesExclusionSearch(label, courseCode)) {
            exclusions.push({
              type: 'exclusion',
              exclusionType: isHoliday ? 'holiday' : 'class-cancelled',
              label,
              courseCode,
              exclusion: ex,
              color,
            });
          }
        });
      }

      if (filtered.length > 0 || exclusions.length > 0) {
        groups.push({
          date: day,
          dateStr,
          events: filtered,
          exclusions,
        });
      }
    });
    return groups;
  }, [daysToShow, courses, tasks, deadlines, workItems, exams, excludedDates, calendarEvents, searchQuery]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  };

  const getEventTypeLabel = (event: CalendarEvent) => {
    switch (event.type) {
      case 'course': return 'Class';
      case 'task': return 'Task';
      case 'deadline': return 'Assignment';
      case 'exam': return 'Exam';
      case 'event': return 'Event';
      case 'reading': return 'Reading';
      case 'project': return 'Project';
      default: return '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', position: 'relative' }}>
      {eventsByDate.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 16px',
          color: 'var(--text-muted)',
          gap: '8px',
        }}>
          <div style={{ fontSize: '0.875rem' }}>
            {searchQuery ? 'No matching events found.' : 'No upcoming events in the next 30 days.'}
          </div>
        </div>
      ) : (
        eventsByDate.map(({ date, dateStr, events, exclusions }) => {
          const todayDate = isToday(date);
          return (
            <div key={dateStr} style={{ paddingBottom: '8px' }}>
              {/* Date header - sticky like timeline */}
              <div style={{
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--panel)',
                paddingTop: '2px',
                paddingBottom: '4px',
                zIndex: 10,
                padding: isMobile ? '8px 12px' : '8px 20px',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text)',
                  }}>
                    {date.toLocaleDateString('en-US', { weekday: 'long' })} - {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </span>
                  {todayDate && (
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      color: 'var(--text)',
                      backgroundColor: 'var(--panel-2)',
                      padding: '1px 8px',
                      borderRadius: '999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}>
                      Today
                    </span>
                  )}
                </div>
              </div>

              {/* Items list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: isMobile ? '6px 12px' : '6px 20px' }}>
                {/* Exclusion items */}
                {exclusions.map((exc, idx) => (
                  <div
                    key={`exc-${dateStr}-${idx}`}
                    onClick={() => setSelectedExclusion(exc.exclusion)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '10px' : '12px',
                      padding: isMobile ? '8px 12px' : '8px 14px',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: 'var(--panel-2)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                      borderLeft: `3px solid ${exc.color}`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--border)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--panel-2)'; }}
                  >
                    <div style={{
                      width: isMobile ? '70px' : '90px',
                      flexShrink: 0,
                      fontSize: isMobile ? '0.7rem' : '0.8rem',
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                    }}>
                      All day
                    </div>
                    <div style={{
                      flex: 1,
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      fontWeight: 600,
                      color: 'var(--text)',
                    }}>
                      {exc.label}
                    </div>
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      color: exc.color,
                      backgroundColor: `${exc.color}18`,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      flexShrink: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}>
                      {exc.exclusionType === 'holiday' ? 'Holiday' : 'Cancelled'}
                    </span>
                  </div>
                ))}

                {/* Regular events */}
                {events.map((event, idx) => {
                  const color = getEventColor(event, colorblindMode, theme, colorblindStyle);
                  const isEffectivelyAllDay = event.allDay || event.time === '23:59';
                  const timeStr = (event.time && !isEffectivelyAllDay) ? formatTime(event.time) : (isEffectivelyAllDay ? 'All day' : '');
                  const endStr = event.endTime ? formatTime(event.endTime) : '';
                  const typeLabel = getEventTypeLabel(event);

                  return (
                    <div
                      key={`${dateStr}-${event.id}-${idx}`}
                      data-event-type={event.type}
                      onClick={() => setSelectedEvent(event)}
                      onContextMenu={(e) => handleContextMenu(event, e)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '10px' : '12px',
                        padding: isMobile ? '8px 12px' : '8px 14px',
                        borderRadius: 'var(--radius-control)',
                        backgroundColor: 'var(--panel-2)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        borderLeft: `3px solid ${color}`,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--border)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--panel-2)'; }}
                    >
                      {/* Time column */}
                      <div style={{
                        width: isMobile ? '70px' : '90px',
                        flexShrink: 0,
                        fontSize: isMobile ? '0.7rem' : '0.8rem',
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                      }}>
                        {timeStr}
                        {endStr && (
                          <>
                            <br />
                            <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', opacity: 0.7 }}>{endStr}</span>
                          </>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: isMobile ? '0.8rem' : '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {event.type === 'course' ? `${event.courseCode} - ${event.title}` : event.title}
                        </div>
                        {event.location && (
                          <div style={{
                            fontSize: isMobile ? '0.65rem' : '0.75rem',
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: '1px',
                          }}>
                            {event.location}
                          </div>
                        )}
                      </div>

                      {/* Type badge */}
                      {typeLabel && (
                        <span style={{
                          fontSize: '0.6rem',
                          fontWeight: 600,
                          color: color,
                          backgroundColor: `${color}18`,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          flexShrink: 0,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}>
                          {typeLabel}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
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
        initialEditScope={pendingEditScope}
      />

      <ExclusionDetailModal
        isOpen={selectedExclusion !== null}
        exclusion={selectedExclusion}
        courses={courses}
        onClose={() => setSelectedExclusion(null)}
      />

      <CalendarContextMenuPortal
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        getMenuItems={getMenuItems}
        handleAction={handleAction}
      />
    </div>
  );
});

CalendarAgendaView.displayName = 'CalendarAgendaView';

export default CalendarAgendaView;
