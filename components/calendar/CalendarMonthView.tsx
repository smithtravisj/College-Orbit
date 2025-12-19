'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { Course, Task, Deadline, ExcludedDate } from '@/types';
import {
  getDatesInMonth,
  getEventsForDate,
  isInMonth,
  getMonthViewColor,
  getExclusionType,
  getEventColor,
  CalendarEvent,
} from '@/lib/calendarUtils';
import { isToday } from '@/lib/utils';
import EventDetailModal from '@/components/EventDetailModal';

interface CalendarMonthViewProps {
  year: number;
  month: number;
  courses: Course[];
  tasks: Task[];
  deadlines: Deadline[];
  allTasks?: Task[];
  allDeadlines?: Deadline[];
  excludedDates?: ExcludedDate[];
  onSelectDate: (date: Date) => void;
}

export default function CalendarMonthView({
  year,
  month,
  courses,
  tasks,
  deadlines,
  allTasks = [],
  allDeadlines = [],
  excludedDates = [],
  onSelectDate,
}: CalendarMonthViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [maxVisibleDots, setMaxVisibleDots] = useState<Map<string, number>>(new Map());
  const dotsRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const dates = useMemo(() => getDatesInMonth(year, month), [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getEventsForDate>>();
    dates.forEach((date) => {
      const dateStr = date.toISOString().split('T')[0];
      const events = getEventsForDate(date, courses, tasks, deadlines, excludedDates);
      if (events.length > 0) {
        map.set(dateStr, events);
      }
    });
    return map;
  }, [dates, courses, tasks, deadlines, excludedDates]);

  // Measure dots containers to determine how many can fit
  useEffect(() => {
    const measureDots = () => {
      const newMaxDots = new Map<string, number>();

      dotsRefs.current.forEach((container, dateStr) => {
        if (container && container.children.length > 0) {
          const containerHeight = container.clientHeight;
          const containerWidth = container.clientWidth;

          if (containerWidth > 0 && containerHeight > 0) {
            const dotHeight = 6;
            const dotWidth = 6;
            const gap = 4;

            // Estimate how many dots fit: (containerWidth + gap) / (dotWidth + gap) dots per row
            const dotsPerRow = Math.floor((containerWidth + gap) / (dotWidth + gap));

            // Estimate how many rows fit: containerHeight / (dotHeight + gap)
            const rowsAvailable = Math.floor(containerHeight / (dotHeight + gap));

            // Approximate max dots that fit
            const maxFit = Math.max(dotsPerRow, dotsPerRow * rowsAvailable - 1); // -1 to leave room for overflow indicator

            const result = Math.max(maxFit, 1);
            newMaxDots.set(dateStr, result);
          }
        }
      });

      if (newMaxDots.size > 0) {
        setMaxVisibleDots(newMaxDots);
      }
    };

    // Use setTimeout and requestAnimationFrame to ensure DOM is fully laid out
    const timer = setTimeout(() => {
      requestAnimationFrame(measureDots);
    }, 100);

    window.addEventListener('resize', measureDots);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measureDots);
    };
  }, [eventsByDate]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '8px', paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', flexShrink: 0 }}>
        {dayNames.map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text)',
              padding: '6px 0',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', paddingLeft: '12px', paddingRight: '12px', paddingBottom: '8px', flex: 1, overflow: 'hidden', gridAutoRows: 'minmax(0, 1fr)' }}>
        {dates.map((date) => {
          const dateStr = date.toISOString().split('T')[0];
          const isCurrentMonth = isInMonth(date, year, month);
          const isTodayDate = isToday(date);
          const dayEvents = eventsByDate.get(dateStr) || [];
          const exclusionType = getExclusionType(date, excludedDates);

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(date)}
              style={{
                position: 'relative',
                padding: '12px',
                border: `1px solid ${isCurrentMonth ? 'var(--border)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-control)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: isCurrentMonth ? 'var(--panel)' : 'var(--bg)',
                opacity: isCurrentMonth ? 1 : 0.5,
                boxShadow: isTodayDate ? '0 0 0 1px var(--accent)' : 'none',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                if (isCurrentMonth) {
                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (isCurrentMonth) {
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }
              }}
            >
              {/* Date number */}
              <div
                style={{
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                  paddingLeft: '0px',
                  paddingRight: '0px',
                  paddingTop: '0px',
                  paddingBottom: '0px',
                  color: isTodayDate ? 'var(--calendar-current-date-color)' : 'var(--text)',
                  lineHeight: 1,
                }}
              >
                {date.getDate()}
              </div>

              {/* No School indicator */}
              {exclusionType === 'holiday' && (() => {
                const markerColor = getEventColor({ courseId: '' } as any);
                return (
                  <div
                    style={{
                      fontSize: '0.65rem',
                      backgroundColor: `${markerColor}80`,
                      color: 'var(--calendar-event-text)',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      marginBottom: '6px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: 500,
                    }}
                  >
                    No School
                  </div>
                );
              })()}

              {/* Event indicators - colored dots */}
              <div
                ref={(el) => {
                  if (el) dotsRefs.current.set(dateStr, el);
                }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1, alignContent: 'flex-start', minHeight: 0, overflow: 'hidden' }}
              >
                {(() => {
                  let limit = maxVisibleDots.get(dateStr) ?? 100;
                  const shouldShowMore = dayEvents.length > limit;

                  // Reserve space for "+X" indicator by reducing limit by 2 (accounts for text width)
                  if (shouldShowMore && limit > 0) {
                    limit = Math.max(1, limit - 2);
                  }

                  return dayEvents.slice(0, limit).map((event) => {
                    const color = getMonthViewColor(event);

                    return (
                      <div
                        key={event.id}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          flexShrink: 0,
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                        }}
                        title={event.type === 'course' ? `${event.courseCode}: ${event.title}` : event.title}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      />
                    );
                  });
                })()}

                {/* +X more indicator */}
                {(() => {
                  const maxLimit = maxVisibleDots.get(dateStr) ?? 100;
                  let limit = maxLimit;
                  const shouldShow = dayEvents.length > limit;

                  // Reserve space for "+X" indicator by reducing limit by 2
                  if (shouldShow && limit > 0) {
                    limit = Math.max(1, limit - 2);
                  }

                  const moreCount = dayEvents.length - limit;
                  return shouldShow && (
                    <div style={{
                      fontSize: '0.6rem',
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                      lineHeight: 1,
                      paddingTop: '0.5px',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}>
                      +{moreCount}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
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
