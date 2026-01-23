'use client';

import React, { useState } from 'react';
import { TimelineDayData, TimelineItem as TimelineItemType } from '@/types/timeline';
import { TimelineItem } from './TimelineItem';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TimelineDayProps {
  day: TimelineDayData;
  onToggleComplete?: (item: TimelineItemType) => void;
  onItemClick?: (item: TimelineItemType) => void;
  onFileClick?: (file: { name: string; url: string; size: number }, allFiles: { name: string; url: string; size: number }[], index: number) => void;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const TimelineDay: React.FC<TimelineDayProps> = ({
  day,
  onToggleComplete,
  onItemClick,
  onFileClick,
  collapsible = false,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleHeaderClick = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const hasItems = day.items.length > 0;
  const progressText =
    day.progress.total > 0
      ? `${day.progress.completed}/${day.progress.total}`
      : null;

  return (
    <div style={{ paddingBottom: '8px' }}>
      {/* Day Header */}
      <div
        onClick={handleHeaderClick}
        className={`flex items-center justify-between ${
          collapsible ? 'cursor-pointer hover:opacity-80' : ''
        }`}
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--panel)',
          paddingTop: '2px',
          paddingBottom: '4px',
          zIndex: 10,
        }}
      >
        <div className="flex items-center gap-2">
          {collapsible && (
            <span className="text-[var(--text-muted)]">
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </span>
          )}
          <span
            className="text-sm font-semibold uppercase tracking-wide text-[var(--text)]"
          >
            {day.isToday ? 'Today' : day.dayName}, {day.dateStr}
          </span>
        </div>

        {/* Day progress indicator */}
        {progressText && !isCollapsed && (
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
            {progressText}
          </span>
        )}
      </div>

      {/* Items list */}
      {!isCollapsed && (
        <>
          {hasItems ? (
            <div className="flex flex-col">
              {day.items.map((item) => (
                <TimelineItem
                  key={item.id}
                  item={item}
                  onToggleComplete={onToggleComplete}
                  onItemClick={onItemClick}
                  onFileClick={onFileClick}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]" style={{ paddingLeft: collapsible ? '20px' : '0' }}>
              No items scheduled
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default TimelineDay;
