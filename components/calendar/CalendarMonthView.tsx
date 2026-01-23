'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Course, Task, Deadline, Exam, ExcludedDate, CalendarEvent as CustomCalendarEvent, WorkItem } from '@/types';
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
import dynamic from 'next/dynamic';
import useAppStore from '@/lib/store';

// Lazy load heavy modal - only needed when user clicks an event
const EventDetailModal = dynamic(() => import('@/components/EventDetailModal'), {
  ssr: false,
});
import ExclusionDetailModal from '@/components/ExclusionDetailModal';

interface CalendarMonthViewProps {
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
  onSelectDate: (date: Date) => void;
  selectedDate?: Date; // For mobile: highlight selected day
  onEventUpdate?: (updatedEvent: CustomCalendarEvent) => void;
  onStatusChange?: () => void;
}

const CalendarMonthView = React.memo(function CalendarMonthView({
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
  onSelectDate,
  selectedDate,
  onEventUpdate,
  onStatusChange,
}: CalendarMonthViewProps) {
  const isMobile = useIsMobile();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedExclusion, setSelectedExclusion] = useState<ExcludedDate | null>(null);
  const [maxVisibleDots, setMaxVisibleDots] = useState<Map<string, number>>(new Map());
  const [popupState, setPopupState] = useState<{
    dateStr: string;
    position: { top: number; left: number };
  } | null>(null);
  const [ghostPreview, setGhostPreview] = useState<{
    dateStr: string;
    position: { top?: number; bottom?: number; left?: number; right?: number };
  } | null>(null);
  const ghostPreviewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dotsRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Get colorblind settings
  const settings = useAppStore((state) => state.settings);
  const colorblindMode = settings.colorblindMode as any;
  const colorblindStyle = settings.colorblindStyle as any;
  const theme = (settings.theme || 'dark') as 'light' | 'dark';

  const dates = useMemo(() => getDatesInMonth(year, month), [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getEventsForDate>>();
    dates.forEach((date) => {
      const dateStr = date.toISOString().split('T')[0];
      const events = getEventsForDate(date, courses, tasks, deadlines, exams, excludedDates, calendarEvents, workItems);
      if (events.length > 0) {
        map.set(dateStr, events);
      }
    });
    return map;
  }, [dates, courses, tasks, deadlines, workItems, exams, excludedDates, calendarEvents]);

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
    <div style={{ display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '100%', minHeight: isMobile ? '100%' : undefined, overflow: isMobile ? 'visible' : 'hidden' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', paddingLeft: isMobile ? '6px' : '12px', paddingRight: isMobile ? '6px' : '12px', paddingBottom: isMobile ? '4px' : '8px', flex: isMobile ? 'none' : 1, overflow: 'hidden', gridAutoRows: isMobile ? 'minmax(38px, 1fr)' : 'minmax(0, 1fr)' }}>
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
                boxShadow: isTodayDate && !isSelectedDate ? '0 0 0 1px var(--link)' : isSelectedDate ? '0 0 0 2px var(--accent)' : 'none',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                if (isCurrentMonth) {
                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                  e.currentTarget.style.borderColor = 'var(--border-hover)';

                  // Show ghost preview after a short delay (desktop only)
                  if (!isMobile && dayEvents.length > 0) {
                    if (ghostPreviewTimerRef.current) {
                      clearTimeout(ghostPreviewTimerRef.current);
                    }
                    const rect = e.currentTarget.getBoundingClientRect();
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    // Position to the right of the cell, or left if near right edge
                    const isNearRightEdge = rect.right + 260 > viewportWidth;
                    // Position from bottom if near bottom edge
                    const isNearBottomEdge = rect.top + 300 > viewportHeight;
                    ghostPreviewTimerRef.current = setTimeout(() => {
                      setGhostPreview({
                        dateStr,
                        position: {
                          top: isNearBottomEdge ? undefined : rect.top,
                          bottom: isNearBottomEdge ? viewportHeight - rect.bottom : undefined,
                          left: isNearRightEdge ? undefined : rect.right + 8,
                          right: isNearRightEdge ? viewportWidth - rect.left + 8 : undefined,
                        },
                      });
                    }, 300);
                  }
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
                // Clear ghost preview with a short delay to allow moving to the preview
                if (ghostPreviewTimerRef.current) {
                  clearTimeout(ghostPreviewTimerRef.current);
                }
                ghostPreviewTimerRef.current = setTimeout(() => {
                  setGhostPreview(null);
                }, 100);
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
                  color: isTodayDate ? 'var(--link)' : 'var(--text)',
                  lineHeight: 1,
                }}
              >
                {date.getDate()}
              </div>

              {/* No School indicator */}
              {exclusionType === 'holiday' && (() => {
                const exclusion = excludedDates.find((ex) => {
                  const exDateOnly = ex.date.includes('T') ? ex.date.split('T')[0] : ex.date;
                  return exDateOnly === dateStr && !ex.courseId;
                });

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
                        cursor: 'pointer',
                      }}
                      title="Holiday/No School"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (exclusion) setSelectedExclusion(exclusion);
                      }}
                    />
                  );
                }

                const markerColor = getEventColor({ courseId: '' } as any, colorblindMode, theme, colorblindStyle);
                return (
                  <div
                    data-exclusion-type="holiday"
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
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (exclusion) setSelectedExclusion(exclusion);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
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
                    const color = getMonthViewColor(event, colorblindMode, theme, colorblindStyle);

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
                        color: 'var(--link)',
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
                    const color = getMonthViewColor(event, colorblindMode, theme, colorblindStyle);
                    return (
                      <div
                        key={event.id}
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

      {/* Ghost preview on day hover */}
      {ghostPreview && (() => {
        const unsortedEvents = eventsByDate.get(ghostPreview.dateStr) || [];
        // Sort by time first, then by type
        const typeOrder: Record<string, number> = { course: 0, exam: 1, deadline: 2, task: 3, 'calendar-event': 4 };
        const getEventTime = (event: typeof unsortedEvents[0]) => {
          if (event.time) return event.time;
          // Extract time from dueAt, examAt, or startAt
          const dateStr = event.dueAt || event.examAt || event.startAt;
          if (dateStr && dateStr.includes('T')) {
            const timePart = dateStr.split('T')[1];
            if (timePart) return timePart.substring(0, 5); // HH:MM
          }
          return null;
        };
        const previewEvents = [...unsortedEvents].sort((a, b) => {
          // Convert time to minutes for comparison (null/undefined = end of day)
          const getMinutes = (time: string | null) => {
            if (!time) return 24 * 60; // No time = end of day
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
          };
          const timeA = getMinutes(getEventTime(a));
          const timeB = getMinutes(getEventTime(b));
          if (timeA !== timeB) return timeA - timeB;
          // Same time, sort by type
          return (typeOrder[a.type] ?? 5) - (typeOrder[b.type] ?? 5);
        });
        const previewDate = new Date(ghostPreview.dateStr + 'T00:00:00');
        const dayName = previewDate.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = previewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return (
          <div
            style={{
              position: 'fixed',
              top: ghostPreview.position.top != null ? `${ghostPreview.position.top}px` : 'auto',
              bottom: ghostPreview.position.bottom != null ? `${ghostPreview.position.bottom}px` : 'auto',
              left: ghostPreview.position.left != null ? `${ghostPreview.position.left}px` : 'auto',
              right: ghostPreview.position.right != null ? `${ghostPreview.position.right}px` : 'auto',
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              padding: '12px',
              paddingTop: '0px',
              minWidth: '200px',
              maxWidth: '250px',
              maxHeight: '280px',
              overflowY: 'auto',
              zIndex: 998,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              animation: 'ghostFadeIn 0.15s ease-out',
            }}
            onMouseEnter={() => {
              // Keep preview open when hovering over it
              if (ghostPreviewTimerRef.current) {
                clearTimeout(ghostPreviewTimerRef.current);
                ghostPreviewTimerRef.current = null;
              }
            }}
            onMouseLeave={() => {
              setGhostPreview(null);
            }}
          >
            <style>{`
              @keyframes ghostFadeIn {
                from { transform: translateX(-4px); }
                to { transform: translateX(0); }
              }
            `}</style>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', position: 'sticky', top: '0px', backgroundColor: 'var(--panel)', paddingTop: '12px', paddingBottom: '4px', marginLeft: '-12px', marginRight: '-12px', paddingLeft: '12px', paddingRight: '12px' }}>
              {dayName}, {monthDay}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {previewEvents.map((event) => {
                const color = getMonthViewColor(event, colorblindMode, theme, colorblindStyle);
                const eventTime = getEventTime(event);
                const timeStr = eventTime
                  ? new Date(`2000-01-01T${eventTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                  : event.allDay ? 'All day' : 'Due';

                return (
                  <div
                    key={event.id}
                    data-event-type={event.type}
                    onClick={() => {
                      setSelectedEvent(event);
                      setGhostPreview(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      backgroundColor: `${color}15`,
                      borderLeft: `3px solid ${color}`,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${color}25`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${color}15`;
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {event.type === 'course' ? event.courseCode : event.title}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-2)', marginTop: '2px' }}>
                        {timeStr}
                        {event.type === 'course' && event.location && ` · ${event.location}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

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

CalendarMonthView.displayName = 'CalendarMonthView';

export default CalendarMonthView;
