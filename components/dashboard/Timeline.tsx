'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTimelineData } from '@/hooks/useTimelineData';
import { TimelineRange, TimelineItem as TimelineItemType, TimelineItemType as ItemType } from '@/types/timeline';
import { TimelineDay } from './TimelineDay';
import { TimelineItem } from './TimelineItem';
import { TimelineProgress } from './TimelineProgress';
import useAppStore from '@/lib/store';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsMobile } from '@/hooks/useMediaQuery';
import EmptyState from '@/components/ui/EmptyState';
import { Task, Deadline, Course, Exam, CalendarEvent } from '@/types';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';

interface TimelineProps {
  onTaskClick?: (task: Task) => void;
  onDeadlineClick?: (deadline: Deadline) => void;
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
  }, [range]);

  const handleToggleComplete = async (item: TimelineItemType) => {
    if (item.type === 'task') {
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
    } else if (item.type === 'class' && onClassClick) {
      onClassClick(item.originalItem, item.originalItem.meetingTime);
    } else if (item.type === 'exam' && onExamClick) {
      onExamClick(item.originalItem as Exam);
    } else if (item.type === 'event' && onEventClick) {
      onEventClick(item.originalItem as CalendarEvent);
    }
  };

  const hasAnyItems = groupedData.days.some((day) => day.items.length > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header with toggle and progress */}
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

        {/* Progress indicator */}
        {showProgress && groupedData.totalProgress.total > 0 && (
          <TimelineProgress
            progress={groupedData.totalProgress}
            variant="bar"
            size="sm"
          />
        )}
      </div>

      {/* Timeline content */}
      {hasAnyItems ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {groupedData.days.slice(0, 1).map((day) => (
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
                        <TimelineItem
                          key={item.id}
                          item={item}
                          onToggleComplete={handleToggleComplete}
                          onItemClick={handleItemClick}
                          onFileClick={onFileClick}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">No items scheduled</p>
                  )}
                  {/* Render remaining days inside the scroll area */}
                  {groupedData.days.slice(1).map((remainingDay, remainingIndex) => (
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
            title={range === 'today' ? 'Nothing scheduled today' : 'Nothing scheduled this week'}
            description={
              range === 'today'
                ? "You're all caught up!"
                : 'Your week is clear!'
            }
          />
        </div>
      )}
    </div>
  );
};

export default Timeline;
