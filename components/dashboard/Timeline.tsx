'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTimelineData } from '@/hooks/useTimelineData';
import { TimelineRange, TimelineItem as TimelineItemType, TimelineItemType as ItemType } from '@/types/timeline';
import { TimelineDay } from './TimelineDay';
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
    <div className="flex flex-col h-full">
      {/* Header with toggle and progress */}
      <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
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
      <div className="flex-1 overflow-y-auto" style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}>
        {hasAnyItems ? (
          <div>
            {groupedData.days.map((day, index) => (
              <TimelineDay
                key={day.dateKey}
                day={day}
                onToggleComplete={handleToggleComplete}
                onItemClick={handleItemClick}
                collapsible={isMobile && range === 'week' && !day.isToday}
                defaultCollapsed={isMobile && range === 'week' && !day.isToday && index > 2}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={range === 'today' ? 'Nothing scheduled today' : 'Nothing scheduled this week'}
            description={
              range === 'today'
                ? "You're all caught up!"
                : 'Your week is clear!'
            }
          />
        )}
      </div>
    </div>
  );
};

export default Timeline;
