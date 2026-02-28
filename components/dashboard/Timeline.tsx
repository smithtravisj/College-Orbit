'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTimelineData } from '@/hooks/useTimelineData';
import { TimelineRange, TimelineItem as TimelineItemType, TimelineItemType as ItemType, TimelineDayData } from '@/types/timeline';
import { TimelineDay } from './TimelineDay';
import { TimelineProgress } from './TimelineProgress';
import useAppStore from '@/lib/store';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsMobile } from '@/hooks/useMediaQuery';
import EmptyState from '@/components/ui/EmptyState';
import { Task, Deadline, Course, Exam, CalendarEvent, WorkItem } from '@/types';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import { getThemeColors } from '@/lib/visualThemes';
import { Search, RefreshCw, Plus, Check, X as XIcon, Sparkles, ExternalLink, Trash2 } from 'lucide-react';
import { QuickAddModal } from '@/components/QuickAddModal';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

interface TimelineProps {
  onTaskClick?: (task: Task) => void;
  onDeadlineClick?: (deadline: Deadline) => void;
  onWorkItemClick?: (workItem: WorkItem) => void;
  onClassClick?: (course: Course, meetingTime: any) => void;
  onExamClick?: (exam: Exam) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onFileClick?: (file: { name: string; url: string; size: number }, allFiles: { name: string; url: string; size: number }[], index: number) => void;
  onBreakdown?: (item: TimelineItemType) => void;
  onDeleteEvent?: (eventId: string) => void;
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
  onBreakdown,
  onDeleteEvent,
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
  const deleteCalendarEvent = useAppStore((state) => state.deleteCalendarEvent);
  const loadFromDatabase = useAppStore((state) => state.loadFromDatabase);
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ item: TimelineItemType; x: number; y: number } | null>(null);

  // Use specific selectors for settings that affect accent color
  const theme = useAppStore((state) => state.settings.theme) || 'dark';
  const university = useAppStore((state) => state.settings.university);
  const useCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const customColors = useAppStore((state) => state.settings.customColors);
  const visualTheme = useAppStore((state) => state.settings.visualTheme);
  const glowIntensity = useAppStore((state) => state.settings.glowIntensity) ?? 50;

  // Calculate accent color - visual theme takes priority
  const { accentColor, glowScale, glowOpacity } = useMemo(() => {
    const effectiveUseCustomTheme = isPremium && useCustomTheme;
    const effectiveCustomColors = isPremium ? customColors : null;
    const effectiveVisualTheme = isPremium ? visualTheme : null;
    const colorPalette = getCollegeColorPalette(university || null, theme);
    // Visual theme takes priority
    let accent = colorPalette.accent;
    if (effectiveVisualTheme && effectiveVisualTheme !== 'default') {
      const themeColors = getThemeColors(effectiveVisualTheme, theme);
      if (themeColors.accent) accent = themeColors.accent;
    } else if (effectiveUseCustomTheme && effectiveCustomColors) {
      accent = getCustomColorSetForTheme(effectiveCustomColors as CustomColors, theme).accent;
    }
    const scale = glowIntensity / 50;
    const opacity = Math.round(Math.min(255, 40 * scale)).toString(16).padStart(2, '0');
    return { accentColor: accent, glowScale: scale, glowOpacity: opacity };
  }, [isPremium, useCustomTheme, customColors, visualTheme, university, glowIntensity, theme]);

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
  const refreshBtnRef = useRef<HTMLButtonElement>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Save range to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('timelineRange', range);
  }, [range]);

  const { groupedData, isLoading } = useTimelineData({
    range,
    itemTypes,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const handleContextMenu = (item: TimelineItemType, e: React.MouseEvent) => {
    // Clamp position to keep menu within viewport
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    setContextMenu({ item, x, y });
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;
    const { item } = contextMenu;
    setContextMenu(null);

    switch (action) {
      case 'complete':
        handleToggleComplete(item);
        break;
      case 'breakdown':
        onBreakdown?.(item);
        break;
      case 'viewInWork':
        router.push(`/work?preview=${item.originalItem.id}`);
        break;
      case 'viewCourse':
        router.push(`/courses?preview=${item.originalItem.id}`);
        break;
      case 'viewExam':
        router.push(`/exams?preview=${item.originalItem.id}`);
        break;
      case 'openEvent':
        if (onEventClick) onEventClick(item.originalItem as CalendarEvent);
        break;
      case 'deleteEvent':
        if (onDeleteEvent) {
          onDeleteEvent(item.originalItem.id);
        } else {
          deleteCalendarEvent(item.originalItem.id);
        }
        break;
    }
  };

  const getContextMenuItems = (item: TimelineItemType) => {
    const items: { key: string; label: string; icon: React.ReactNode; danger?: boolean }[] = [];
    const type = item.type;

    if (type === 'task' || type === 'deadline' || type === 'reading' || type === 'project') {
      items.push({
        key: 'complete',
        label: item.isCompleted ? 'Mark Incomplete' : 'Mark Complete',
        icon: item.isCompleted ? <XIcon size={14} /> : <Check size={14} />,
      });
      items.push({
        key: 'breakdown',
        label: 'AI Breakdown',
        icon: <Sparkles size={14} />,
      });
      items.push({
        key: 'viewInWork',
        label: 'View in Work',
        icon: <ExternalLink size={14} />,
      });
    } else if (type === 'class') {
      items.push({
        key: 'viewCourse',
        label: 'View Course',
        icon: <ExternalLink size={14} />,
      });
    } else if (type === 'exam') {
      items.push({
        key: 'viewExam',
        label: 'View in Exams',
        icon: <ExternalLink size={14} />,
      });
    } else if (type === 'event') {
      items.push({
        key: 'openEvent',
        label: 'Edit Event',
        icon: <ExternalLink size={14} />,
      });
      items.push({
        key: 'deleteEvent',
        label: 'Delete Event',
        icon: <Trash2 size={14} />,
        danger: true,
      });
    }

    return items;
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

    // Fallback: if all timed items are past, scroll to first incomplete all-day item
    for (const item of todayItems) {
      if ((item.isAllDay || !item.time) && !item.isCompleted) {
        return item.id;
      }
    }

    // If all items are completed, don't scroll
    return null;
  }, [groupedData]);

  // Auto-scroll to next relevant event on initial load only (not when items change)
  const initialLoadComplete = useRef(false);
  useEffect(() => {
    // Only run once when data first loads
    if (initialLoadComplete.current || isLoading) return;
    if (groupedData.days.length === 0) return;

    // If no target item, nothing to scroll to - mark complete
    if (!nextEventId) {
      initialLoadComplete.current = true;
      return;
    }

    // Mark as complete immediately to prevent multiple attempts
    initialLoadComplete.current = true;

    // Wait for DOM to be ready, then scroll within the container
    // Use querySelector to find element by data attribute (more reliable than ref timing)
    requestAnimationFrame(() => {
      setTimeout(() => {
        const container = scrollContainerRef.current;
        const target = container?.querySelector(`[data-timeline-item-id="${nextEventId}"]`) as HTMLElement;

        if (container && target) {
          // Calculate scroll position relative to container
          const containerRect = container.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const scrollTop = container.scrollTop + (targetRect.top - containerRect.top);
          container.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
      }, 100);
    });
  }, [groupedData, isLoading, nextEventId]);

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
                    isActive ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '2px' : '8px' }}>
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

          {/* Refresh button */}
          <button
            ref={(el) => { refreshBtnRef.current = el; }}
            onClick={async () => {
              if (isRefreshing) return;
              setIsRefreshing(true);
              try {
                await loadFromDatabase();
              } finally {
                setIsRefreshing(false);
                if (refreshBtnRef.current) {
                  refreshBtnRef.current.style.color = 'var(--text-muted)';
                }
              }
            }}
            className={isRefreshing ? 'animate-spin' : ''}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: isRefreshing ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { if (!isRefreshing) e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            title="Refresh timeline"
            disabled={isRefreshing}
          >
            <RefreshCw size={14} />
          </button>

          {/* Quick add button */}
          <button
            onClick={() => setIsQuickAddOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            title="Quick add"
          >
            <Plus size={16} />
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
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto min-h-0"
          style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}
        >
          {filteredGroupedData.days.map((day, dayIndex) => (
            <TimelineDay
              key={day.dateKey}
              day={day}
              onToggleComplete={handleToggleComplete}
              onItemClick={handleItemClick}
              onFileClick={onFileClick}
              onContextMenu={handleContextMenu}
              collapsible={isMobile && range === 'week' && !day.isToday}
              defaultCollapsed={isMobile && range === 'week' && !day.isToday && dayIndex > 2}
            />
          ))}
          {range === 'today' && (
            <div style={{
              textAlign: 'center',
              padding: '16px 0 8px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              opacity: 0.7,
            }}>
              That&apos;s all for today!
            </div>
          )}
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

      {createPortal(
        <QuickAddModal
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
        />,
        document.body
      )}

      {/* Context menu */}
      {contextMenu && createPortal(
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
          />
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              backgroundColor: 'var(--panel-solid, var(--panel))',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.1)',
              zIndex: 9999,
              minWidth: '180px',
              padding: '4px 0',
              animation: 'contextMenuIn 100ms ease-out',
            }}
          >
            {getContextMenuItems(contextMenu.item).map((menuItem) => (
              <button
                key={menuItem.key}
                onClick={() => handleContextMenuAction(menuItem.key)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: menuItem.danger ? 'var(--danger)' : 'var(--text)',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>{menuItem.icon}</span>
                {menuItem.label}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default Timeline;
