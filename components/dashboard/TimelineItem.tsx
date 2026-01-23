'use client';

import React from 'react';
import { TimelineItem as TimelineItemType, TimelineItemType as ItemType } from '@/types/timeline';
import { useFormatters } from '@/hooks/useFormatters';
import useAppStore from '@/lib/store';
import { formatTimeString, TimeFormat } from '@/lib/utils';
import { CanvasBadge } from '@/components/CanvasBadge';
import { getEventTypeColors } from '@/lib/collegeColors';

interface TimelineItemProps {
  item: TimelineItemType;
  onToggleComplete?: (item: TimelineItemType) => void;
  onItemClick?: (item: TimelineItemType) => void;
  onFileClick?: (file: { name: string; url: string; size: number }, allFiles: { name: string; url: string; size: number }[], index: number) => void;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  item,
  onToggleComplete,
  onItemClick,
  onFileClick,
}) => {
  const settings = useAppStore((state) => state.settings);
  const { showCourseCode } = useFormatters();

  // Get colorblind-aware colors
  const eventColors = getEventTypeColors(
    settings.colorblindMode as any,
    (settings.theme || 'dark') as 'light' | 'dark',
    settings.colorblindStyle as any
  );

  // Map timeline item type to event color
  const colorMap: Record<ItemType, string> = {
    class: eventColors.course,
    task: eventColors.task,
    exam: eventColors.exam,
    deadline: eventColors.deadline,
    event: eventColors.event,
    reading: eventColors.reading,
    project: eventColors.project,
  };
  const borderColor = colorMap[item.type];

  const formatTime = (time: string | null | undefined): string => {
    if (!time) return '';
    return formatTimeString(time, (settings.timeFormat || '12h') as TimeFormat);
  };

  const getTimeDisplay = (): string => {
    if (item.isAllDay) return 'All day';
    if (!item.time) return '';

    const startTime = formatTime(item.time);
    if (item.endTime) {
      return `${startTime} – ${formatTime(item.endTime)}`;
    }
    return startTime;
  };

  const getCourseDisplay = (): string | null => {
    if (!item.courseId) return null;
    return showCourseCode ? item.courseCode || null : item.courseName || item.courseCode || null;
  };

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.canComplete && onToggleComplete) {
      onToggleComplete(item);
    }
  };

  const handleClick = () => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const courseDisplay = getCourseDisplay();
  const timeDisplay = getTimeDisplay();

  // Map item type to event type for colorblind patterns
  const eventType = item.type === 'class' ? 'course' : item.type;

  return (
    <div
      onClick={handleClick}
      className="group flex items-start gap-3 rounded transition-colors hover:bg-[var(--panel-2)] cursor-pointer w-full"
      style={{
        padding: '8px 10px 8px 0',
        opacity: item.isCompleted ? 0.6 : 1,
        position: 'relative',
      }}
    >
      {/* Accent indicator with colorblind pattern */}
      <div
        data-event-type={eventType}
        style={{
          width: '4px',
          alignSelf: 'stretch',
          backgroundColor: borderColor,
          borderRadius: '2px',
          flexShrink: 0,
          marginLeft: '8px',
        }}
      />
      {/* Checkbox for completable items */}
      {item.canComplete ? (
        <input
          type="checkbox"
          checked={item.isCompleted}
          onClick={handleCheckboxChange}
          onChange={() => {}}
          style={{
            appearance: 'none',
            width: '16px',
            height: '16px',
            border: item.isCompleted ? 'none' : '2px solid var(--text-muted)',
            borderRadius: '3px',
            backgroundColor: item.isCompleted ? 'var(--button-secondary)' : 'transparent',
            cursor: 'pointer',
            flexShrink: 0,
            marginTop: '1px',
            backgroundImage: item.isCompleted
              ? 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22white%22%3E%3Cpath fill-rule=%22evenodd%22 d=%22M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z%22 clip-rule=%22evenodd%22 /%3E%3C/svg%3E")'
              : 'none',
            backgroundSize: '100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            transition: 'all 0.2s ease',
          }}
        />
      ) : (
        <div
          style={{
            width: '16px',
            height: '16px',
            flexShrink: 0,
            marginTop: '1px',
          }}
        />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium ${
              item.isCompleted ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'
            }`}
          >
            {item.title}
          </span>

          {/* Current class indicator */}
          {item.isCurrent && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '10px',
                fontWeight: '600',
                color: 'var(--success)',
                backgroundColor: 'var(--success-bg)',
                padding: '1px 5px',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
              }}
            >
              In Progress
            </span>
          )}

          {/* Overdue indicator with due date */}
          {item.isOverdue && !item.isCompleted && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '10px',
                fontWeight: '600',
                color: 'var(--danger)',
                backgroundColor: 'var(--danger-bg)',
                padding: '1px 5px',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
              }}
            >
              Overdue
              {item.originalItem?.dueAt && (() => {
                const dueDate = new Date(item.originalItem.dueAt);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDateOnly = new Date(dueDate);
                dueDateOnly.setHours(0, 0, 0, 0);
                // Only show date if it's not today
                if (dueDateOnly.getTime() !== today.getTime()) {
                  return ` · ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                }
                return null;
              })()}
            </span>
          )}

          {/* Type badge for exams */}
          {item.type === 'exam' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '10px',
                fontWeight: '600',
                color: eventColors.exam,
                backgroundColor: `${eventColors.exam}26`,
                padding: '1px 5px',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
              }}
            >
              Exam
            </span>
          )}

          {/* Canvas badge for assignments synced from Canvas */}
          {item.type === 'deadline' && item.originalItem?.canvasAssignmentId && (
            <CanvasBadge size="sm" />
          )}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: '2px' }}>
          {timeDisplay && (
            <span className="text-xs text-[var(--text-secondary)]">{timeDisplay}</span>
          )}
          {courseDisplay && item.type !== 'class' && (
            <span className="text-xs text-[var(--text-secondary)]">{courseDisplay}</span>
          )}
          {item.location && (
            <span className="text-xs text-[var(--text-secondary)]">{item.location}</span>
          )}
        </div>

        {/* Links */}
        {item.links && item.links.length > 0 && (
          <div
            className="flex flex-col items-start w-fit"
            style={{ gap: '0px', marginTop: '4px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {item.links.slice(0, 2).map((link, idx) => (
              <a
                key={`${link.url}-${idx}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--link)] hover:text-blue-400"
              >
                {link.label || link.url}
              </a>
            ))}
            {item.links.length > 2 && (
              <span className="text-xs text-[var(--text-muted)]">
                +{item.links.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Files */}
        {item.files && item.files.length > 0 && (
          <div
            className="flex flex-col items-start w-fit"
            style={{ gap: '0px', marginTop: '4px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {item.files.slice(0, 2).map((file, idx) => (
              onFileClick ? (
                <button
                  key={`${file.url}-${idx}`}
                  type="button"
                  onClick={() => onFileClick(file, item.files!, idx)}
                  className="text-[var(--link)] hover:text-blue-400"
                  style={{ fontSize: '12px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                >
                  {file.name}
                </button>
              ) : (
                <a
                  key={`${file.url}-${idx}`}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={file.name}
                  className="text-[var(--link)] hover:text-blue-400"
                  style={{ fontSize: '12px' }}
                >
                  {file.name}
                </a>
              )
            ))}
            {item.files.length > 2 && (
              <span className="text-[var(--text-muted)]" style={{ fontSize: '12px' }}>
                +{item.files.length - 2} more files
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineItem;
