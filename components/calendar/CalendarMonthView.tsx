'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { Course, Task, Deadline, Exam, ExcludedDate } from '@/types';
import { useIsMobile } from '@/hooks/useMediaQuery';
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
  exams?: Exam[];
  allTasks?: Task[];
  allDeadlines?: Deadline[];
  excludedDates?: ExcludedDate[];
  onSelectDate: (date: Date) => void;
  selectedDate?: Date; // For mobile: highlight selected day
}

export default function CalendarMonthView({
  year,
  month,
  courses,
  tasks,
  deadlines,
  exams = [],
  allTasks = [],
  allDeadlines = [],
  excludedDates = [],
  onSelectDate,
  selectedDate,
}: CalendarMonthViewProps) {
  const isMobile = useIsMobile();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [maxVisibleDots, setMaxVisibleDots] = useState<Map<string, number>>(new Map());
  const [popupState, setPopupState] = useState<{
    dateStr: string;
    position: { top: number; left: number };
  } | null>(null);
  const dotsRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const dates = useMemo(() => getDatesInMonth(year, month), [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getEventsForDate>>();
    dates.forEach((date) => {
      const dateStr = date.toISOString().split('T')[0];
      const events = getEventsForDate(date, courses, tasks, deadlines, exams, excludedDates);
      if (events.length > 0) {
        map.set(dateStr, events);
      }
    });
    return map;
  }, [dates, courses, tasks, deadlines, exams, excludedDates]);

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: isMobile ? '4px' : '8px', paddingLeft: isMobile ? '6px' : '12px', paddingRight: isMobile ? '6px' : '12px', paddingTop: isMobile ? '4px' : '8px', flexShrink: 0 }}>
        {dayNames.map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: isMobile ? '0.7rem' : '0.875rem',
              fontWeight: 600,
              color: 'var(--text)',
              padding: isMobile ? '2px 0' : '6px 0',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', paddingLeft: isMobile ? '6px' : '12px', paddingRight: isMobile ? '6px' : '12px', paddingBottom: isMobile ? '4px' : '8px', flex: 1, overflow: 'hidden', gridAutoRows: 'minmax(0, 1fr)' }}>
        {dates.map((date) => {
          const dateStr = date.toISOString().split('T')[0];
          const isCurrentMonth = isInMonth(date, year, month);
          const isTodayDate = isToday(date);
          const isSelectedDate = selectedDate && date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
          const dayEvents = eventsByDate.get(dateStr) || [];
          const exclusionType = getExclusionType(date, excludedDates);

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(date)}
              style={{
                position: 'relative',
                padding: isMobile ? '4px' : '12px',
                border: `1px solid ${isSelectedDate ? 'var(--accent)' : isCurrentMonth ? 'var(--border)' : 'var(--border)'}`,
                borderRadius: isMobile ? '4px' : 'var(--radius-control)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: isSelectedDate ? 'var(--accent-2)' : isCurrentMonth ? 'var(--panel)' : 'var(--bg)',
                opacity: isCurrentMonth ? 1 : 0.5,
                boxShadow: isTodayDate && !isSelectedDate ? '0 0 0 1px var(--accent)' : isSelectedDate ? '0 0 0 2px var(--accent)' : 'none',
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
                  if (isSelectedDate) {
                    e.currentTarget.style.backgroundColor = 'var(--accent-2)';
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  } else {
                    e.currentTarget.style.backgroundColor = 'var(--panel)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }
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
                if (isMobile) {
                  return (
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        flexShrink: 0,
                        marginBottom: '2px',
                      }}
                      title="Holiday/No School"
                    />
                  );
                }

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
                          cursor: isMobile ? 'default' : 'pointer',
                          transition: isMobile ? 'none' : 'transform 0.2s',
                        }}
                        title={isMobile ? undefined : (event.type === 'course' ? `${event.courseCode}: ${event.title}` : event.title)}
                        onClick={(e) => {
                          if (!isMobile) {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.transform = 'scale(1.5)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.transform = 'scale(1)';
                          }
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
                    <div
                      style={{
                        fontSize: '0.6rem',
                        color: 'var(--accent)',
                        fontWeight: 600,
                        lineHeight: 1,
                        paddingTop: '0.5px',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        cursor: isMobile ? 'default' : 'pointer',
                        transition: isMobile ? 'none' : 'all 0.2s',
                        pointerEvents: isMobile ? 'none' : 'auto',
                      }}
                      onClick={(e) => {
                        if (!isMobile) {
                          e.stopPropagation();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setPopupState({
                            dateStr,
                            position: { top: rect.bottom + 4, left: rect.left },
                          });
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.opacity = '0.8';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                    >
                      +{moreCount}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
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
              const dayEvents = eventsByDate.get(dateStr) || [];
              const maxLimit = maxVisibleDots.get(dateStr) ?? 100;
              let limit = maxLimit;
              const shouldShow = dayEvents.length > limit;

              if (shouldShow && limit > 0) {
                limit = Math.max(1, limit - 2);
              }

              const hiddenEvents = dayEvents.slice(limit);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                    {hiddenEvents.length} more event{hiddenEvents.length !== 1 ? 's' : ''}
                  </div>
                  {hiddenEvents.map((event) => {
                    const color = getMonthViewColor(event);
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
                          backgroundColor: `${color}80`,
                          color: 'var(--calendar-event-text)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        title={event.title}
                        onClick={() => {
                          setSelectedEvent(event);
                          setPopupState(null);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        {event.title.substring(0, 20)}
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
        exams={exams}
      />
    </div>
  );
}
