'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTimelineData } from '@/hooks/useTimelineData';
import { TimelineRange, TimelineItem as TimelineItemType, TimelineItemType as ItemType, TimelineDayData } from '@/types/timeline';
import { TimelineDay } from './TimelineDay';
import { TimelineItem } from './TimelineItem';
import { TimelineProgress } from './TimelineProgress';
import useAppStore from '@/lib/store';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsMobile } from '@/hooks/useMediaQuery';
import EmptyState from '@/components/ui/EmptyState';
import { Task, Deadline, Course, Exam, CalendarEvent, WorkItem } from '@/types';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import { Search } from 'lucide-react';

interface TimelineProps {
  onTaskClick?: (task: Task) => void;
  onDeadlineClick?: (deadline: Deadline) => void;
  onWorkItemClick?: (workItem: WorkItem) => void;
  onClassClick?: (course: Course, meetingTime: any) => void;
  onExamClick?: (exam: Exam) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onFileClick?: (file: { name: string; url: string; size: number }, allFiles: { name: string; url: string; size: number }[], index: number) => void;
  defaultRange?: TimelineRange;
  showProgress?: boolean;
  showRangeToggle?: boolean;
  itemTypes?: ItemType[];
  maxHeight?: number;
}

export const Timeline: React.FC<TimelineProps> = ({
  onTaskClick,
  onDeadlineClick,
  onWorkItemClick,
  onClassClick,
  onExamClick,
  onEventClick,
  onFileClick,
  defaultRange = 'today',
  showProgress = true,
  showRangeToggle = true,
  itemTypes,
  maxHeight,
}) => {
  const { isPremium } = useSubscription();
  const isMobile = useIsMobile();
  const toggleTaskDone = useAppStore((state) => state.toggleTaskDone);
  const updateDeadline = useAppStore((state) => state.updateDeadline);
  const toggleWorkItemComplete = useAppStore((state) => state.toggleWorkItemComplete);

  // Single selector for all settings to reduce subscriptions
  const settings = useAppStore((state) => state.settings);
  const theme = settings.theme || 'dark';

  // Memoize accent color calculation
  const { accentColor, glowScale, glowOpacity } = useMemo(() => {
    const useCustomTheme = isPremium && settings.useCustomTheme;
    const customColors = isPremium ? settings.customColors : null;
    const colorPalette = getCollegeColorPalette(settings.university || null, theme);
    const accent = useCustomTheme && customColors
      ? getCustomColorSetForTheme(customColors as CustomColors, theme).accent
      : colorPalette.accent;
    const scale = (settings.glowIntensity ?? 50) / 50;
    const opacity = Math.round(Math.min(255, 40 * scale)).toString(16).padStart(2, '0');
    return { accentColor: accent, glowScale: scale, glowOpacity: opacity };
  }, [isPremium, settings, theme]);

  // Initialize range from localStorage
  const [range, setRange] = useState<TimelineRange>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('timelineRange') as TimelineRange;
      if (saved && (saved === 'today' || saved === 'week')) {
        return saved;
      }
    }
    return defaultRange;
  });

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Save range to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('timelineRange', range);
  }, [range]);

  const { groupedData, isLoading } = useTimelineData({
    range,
    itemTypes,
  });

  // Refs and state for smooth first day header scroll-away effect
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const firstDayHeaderRef = useRef<HTMLDivElement>(null);
  const nextDayHeaderRef = useRef<HTMLDivElement>(null);
  const [firstDayHeaderOffset, setFirstDayHeaderOffset] = useState(0);

  // Ref for auto-scrolling to next event
  const nextEventRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolled = useRef(false);

  // Attach scroll listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const header = firstDayHeaderRef.current;
    if (!scrollContainer || !header) return;

    const handleScroll = () => {
      const nextHeader = nextDayHeaderRef.current;

      // If there's no next day header, don't hide the first day header
      if (!nextHeader) {
        setFirstDayHeaderOffset(0);
        return;
      }

      // Use getBoundingClientRect for accurate visual positioning
      const headerRect = header.getBoundingClientRect();
      const nextHeaderRect = nextHeader.getBoundingClientRect();

      // Calculate how much the next header overlaps with the first header
      const overlap = headerRect.bottom - nextHeaderRect.top;

      if (overlap > 0) {
        // Next header is touching or overlapping - push the first header up
        const offset = Math.min(overlap, headerRect.height);
        setFirstDayHeaderOffset(offset);
      } else {
        setFirstDayHeaderOffset(0);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [groupedData]);

  // Reset offset when range changes
  useEffect(() => {
    setFirstDayHeaderOffset(0);
    hasAutoScrolled.current = false; // Allow auto-scroll again when range changes
  }, [range]);

  // Auto-scroll to next relevant event on initial load only (not when items change)
  const initialLoadComplete = useRef(false);
  useEffect(() => {
    // Only run once when data first loads
    if (initialLoadComplete.current || isLoading || !scrollContainerRef.current) return;
    if (groupedData.days.length === 0) return;

    // Mark as complete so we don't scroll again
    initialLoadComplete.current = true;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayItems = groupedData.days[0]?.items || [];

    let targetItemId: string | null = null;

    // First, look for the first non-completed overdue item
    for (const item of todayItems) {
      if (item.isOverdue && !item.isCompleted) {
        targetItemId = item.id;
        break;
      }
    }

    // If no overdue items, find the next upcoming event
    if (!targetItemId) {
      for (const item of todayItems) {
        if (item.isCompleted) continue;
        if (item.isCurrent) {
          targetItemId = item.id;
          break;
        }
        if (item.time && item.time >= currentTime) {
          targetItemId = item.id;
          break;
        }
      }
    }

    // Scroll to the target item within the container (not the whole page)
    if (targetItemId && nextEventRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        const container = scrollContainerRef.current;
        const target = nextEventRef.current;
        if (container && target) {
          const containerRect = container.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const scrollTop = container.scrollTop + (targetRect.top - containerRect.top);
          container.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [groupedData, isLoading]);

  const handleToggleComplete = async (item: TimelineItemType) => {
    // Check if this item came from a WorkItem (has a type field like 'task', 'assignment', 'reading', 'project')
    const isWorkItem = item.originalItem && 'type' in item.originalItem &&
      ['task', 'assignment', 'reading', 'project'].includes((item.originalItem as WorkItem).type);

    if (isWorkItem) {
      await toggleWorkItemComplete(item.originalItem.id);
    } else if (item.type === 'task') {
      await toggleTaskDone(item.originalItem.id);
    } else if (item.type === 'deadline') {
      const currentStatus = item.originalItem.status;
      await updateDeadline(item.originalItem.id, {
        status: currentStatus === 'done' ? 'open' : 'done',
      });
    }
  };

  const handleItemClick = (item: TimelineItemType) => {
    if (item.type === 'task' && onTaskClick) {
      onTaskClick(item.originalItem as Task);
    } else if (item.type === 'deadline' && onDeadlineClick) {
      onDeadlineClick(item.originalItem as Deadline);
    } else if ((item.type === 'reading' || item.type === 'project') && onWorkItemClick) {
      onWorkItemClick(item.originalItem as WorkItem);
    } else if (item.type === 'class' && onClassClick) {
      onClassClick(item.originalItem, item.originalItem.meetingTime);
    } else if (item.type === 'exam' && onExamClick) {
      onExamClick(item.originalItem as Exam);
    } else if (item.type === 'event' && onEventClick) {
      onEventClick(item.originalItem as CalendarEvent);
    }
  };

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Filter items based on search query
  const filteredGroupedData = useMemo(() => {
    if (!searchQuery.trim()) return groupedData;

    const query = searchQuery.toLowerCase().trim();

    const filterItem = (item: TimelineItemType): boolean => {
      // Search in title
      if (item.title.toLowerCase().includes(query)) return true;

      // Search in course name/code
      if (item.courseName?.toLowerCase().includes(query)) return true;
      if (item.courseCode?.toLowerCase().includes(query)) return true;

      // Search in location
      if (item.location?.toLowerCase().includes(query)) return true;

      // Search in time
      if (item.time?.includes(query)) return true;

      // Search in type
      if (item.type.toLowerCase().includes(query)) return true;

      // Search for "overdue" status
      if (item.isOverdue && 'overdue'.includes(query)) return true;

      // Search for "completed" or "done" status
      if (item.isCompleted && ('completed'.includes(query) || 'done'.includes(query))) return true;

      // Search by effort level (e.g., "low effort", "high effort")
      if ('effort'.includes(query)) {
        const original = item.originalItem;
        if (original?.effort) return true;
      }

      // Search by priority (e.g., "priority", "high priority")
      if ('priority'.includes(query)) {
        const original = item.originalItem;
        if (original?.priority !== undefined) return true;
      }

      // Search for Canvas items
      if ('canvas'.includes(query)) {
        const original = item.originalItem;
        if (original?.canvasAssignmentId || original?.canvasCourseId || original?.canvasEventId) return true;
      }

      // Search in original item fields
      const original = item.originalItem;
      if (original) {
        // Notes
        if (original.notes?.toLowerCase().includes(query)) return true;

        // Effort (tasks/deadlines)
        if (original.effort?.toLowerCase().includes(query)) return true;

        // Importance (tasks)
        if (original.importance?.toLowerCase().includes(query)) return true;

        // Priority (deadlines)
        if (original.priority !== undefined && String(original.priority).includes(query)) return true;

        // Tags
        if (Array.isArray(original.tags)) {
          if (original.tags.some((tag: string) => tag.toLowerCase().includes(query))) return true;
        }
      }

      // Search in links
      if (item.links && Array.isArray(item.links)) {
        if (item.links.some(link =>
          link.label?.toLowerCase().includes(query) ||
          link.url?.toLowerCase().includes(query)
        )) return true;
      }

      // Search in files
      if (item.files && Array.isArray(item.files)) {
        if (item.files.some(file => file.name?.toLowerCase().includes(query))) return true;
      }

      return false;
    };

    const filteredDays: TimelineDayData[] = groupedData.days.map(day => ({
      ...day,
      items: day.items.filter(filterItem),
    })).filter(day => day.items.length > 0);

    return {
      ...groupedData,
      days: filteredDays,
    };
  }, [groupedData, searchQuery]);

  const hasAnyItems = filteredGroupedData.days.some((day) => day.items.length > 0);

  // Calculate which item is the "next event" to scroll to (only today's items)
  const nextEventId = useMemo(() => {
    if (groupedData.days.length === 0) return null;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Only look at today's items - don't scroll to future days
    const todayItems = groupedData.days[0]?.items || [];

    // First, look for the first non-completed overdue item
    for (const item of todayItems) {
      if (item.isOverdue && !item.isCompleted) {
        return item.id;
      }
    }

    // If no overdue items, find the next upcoming event
    for (const item of todayItems) {
      if (item.isCompleted) continue;

      // For classes currently in session
      if (item.isCurrent) return item.id;

      // For timed items, check if time is >= current time
      if (item.time && item.time >= currentTime) {
        return item.id;
      }

      // For all-day items that aren't completed
      if (item.isAllDay && !item.isCompleted) {
        return item.id;
      }
    }

    return null;
  }, [groupedData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header with toggle, search, and progress */}
      <div className="flex items-center justify-between shrink-0" style={{ marginBottom: '12px', position: 'relative', zIndex: 20 }}>
        {/* Range toggle */}
        {showRangeToggle && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { key: 'today' as TimelineRange, label: 'Today' },
              { key: 'week' as TimelineRange, label: 'Week' },
            ].map((tab) => {
              const isActive = range === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setRange(tab.key)}
                  className={`rounded-[var(--radius-control)] font-medium transition-all duration-150 ${
                    isActive ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: 'none',
                    backgroundColor: isActive ? accentColor : 'transparent',
                    backgroundImage: isActive
                      ? (theme === 'light'
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)'
                        : 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)')
                      : 'none',
                    boxShadow: isActive ? `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}` : undefined,
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Right side: search input, search icon, and progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search input (appears when open) */}
          {isSearchOpen && (
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              style={{
                width: isMobile ? '100px' : '120px',
                marginLeft: isMobile ? '8px' : '0',
                backgroundColor: 'var(--panel-2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                outline: 'none',
                fontSize: '12px',
                color: 'var(--text)',
                padding: '5px 8px',
              }}
            />
          )}

          {/* Search icon (toggle) */}
          <button
            onClick={() => {
              if (isSearchOpen) {
                setIsSearchOpen(false);
                setSearchQuery('');
              } else {
                setIsSearchOpen(true);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isSearchOpen ? 'var(--text)' : 'var(--text-muted)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = isSearchOpen ? 'var(--text)' : 'var(--text-muted)'}
            title="Search timeline"
          >
            <Search size={15} />
          </button>

          {/* Progress indicator */}
          {showProgress && groupedData.totalProgress.total > 0 && (
            <TimelineProgress
              progress={groupedData.totalProgress}
              variant="bar"
              size="sm"
            />
          )}
        </div>
      </div>

      {/* Timeline content */}
      {hasAnyItems ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {filteredGroupedData.days.slice(0, 1).map((day) => (
            <div key={day.dateKey} className="flex flex-col min-h-0 flex-1">
              {/* First day header - smoothly scrolls away */}
              <div
                ref={firstDayHeaderRef}
                className="flex items-center justify-between shrink-0"
                style={{
                  backgroundColor: 'var(--panel)',
                  paddingBottom: '4px',
                  transform: `translateY(-${firstDayHeaderOffset}px)`,
                  marginBottom: -firstDayHeaderOffset,
                }}
              >
                <span className="text-sm font-semibold uppercase tracking-wide text-[var(--text)]">
                  {day.isToday ? 'Today' : day.dayName}, {day.dateStr}
                </span>
                {day.progress.total > 0 && (
                  <span
                    className="text-xs"
                    style={{
                      color:
                        day.progress.percentage === 100
                          ? 'var(--success)'
                          : day.progress.hasOverdue
                          ? 'var(--danger)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {day.progress.completed}/{day.progress.total}
                  </span>
                )}
              </div>
              {/* Day items - scrollable */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto min-h-0"
                style={maxHeight ? { maxHeight: `${maxHeight - 30 + firstDayHeaderOffset}px` } : undefined}
              >
                  {day.items.length > 0 ? (
                    <div className="flex flex-col">
                      {day.items.map((item) => (
                        <div key={item.id} ref={item.id === nextEventId ? nextEventRef : undefined}>
                          <TimelineItem
                            item={item}
                            onToggleComplete={handleToggleComplete}
                            onItemClick={handleItemClick}
                            onFileClick={onFileClick}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">No items scheduled</p>
                  )}
                  {/* Render remaining days inside the scroll area */}
                  {filteredGroupedData.days.slice(1).map((remainingDay, remainingIndex) => (
                    <div key={remainingDay.dateKey} ref={remainingIndex === 0 ? nextDayHeaderRef : undefined}>
                      <TimelineDay
                        day={remainingDay}
                        onToggleComplete={handleToggleComplete}
                        onItemClick={handleItemClick}
                        onFileClick={onFileClick}
                        collapsible={isMobile && range === 'week' && !remainingDay.isToday}
                        defaultCollapsed={isMobile && range === 'week' && !remainingDay.isToday && remainingIndex > 1}
                      />
                    </div>
                  ))}
                </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0" style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}>
          <EmptyState
            title={searchQuery ? 'No results found' : (range === 'today' ? 'Nothing scheduled today' : 'Nothing scheduled this week')}
            description={
              searchQuery
                ? `No items match "${searchQuery}"`
                : (range === 'today'
                  ? "You're all caught up!"
                  : 'Your week is clear!')
            }
          />
        </div>
      )}
    </div>
  );
};

export default Timeline;
