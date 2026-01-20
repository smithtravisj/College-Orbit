'use client';

import React from 'react';
import { TimelineProgress as TimelineProgressType } from '@/types/timeline';

interface TimelineProgressProps {
  progress: TimelineProgressType;
  variant?: 'bar' | 'circular';
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const TimelineProgress: React.FC<TimelineProgressProps> = ({
  progress,
  variant = 'bar',
  size = 'sm',
  showLabel = true,
}) => {
  const { completed, total, percentage, hasOverdue } = progress;

  // Determine bar color based on status
  const getBarColor = (): string => {
    if (hasOverdue) return 'var(--danger)';
    if (percentage === 100) return 'var(--success)';
    return 'var(--text-secondary)';
  };

  // Text color is simpler - just show status
  const getTextColor = (): string => {
    if (hasOverdue) return 'var(--danger)';
    if (percentage === 100) return 'var(--success)';
    return 'var(--text-muted)';
  };

  const barColor = getBarColor();
  const textColor = getTextColor();

  // Don't show anything if there's nothing to track
  if (total === 0) {
    return null;
  }

  if (variant === 'circular') {
    const circleSize = size === 'sm' ? 32 : 44;
    const strokeWidth = size === 'sm' ? 3 : 4;
    const radius = (circleSize - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex items-center gap-2">
        <svg
          width={circleSize}
          height={circleSize}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background circle */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke={barColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        {showLabel && (
          <span className="text-xs text-[var(--text-muted)]">
            {completed}/{total}
          </span>
        )}
      </div>
    );
  }

  // Bar variant
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{
          height: size === 'sm' ? '4px' : '6px',
          backgroundColor: 'var(--border)',
          minWidth: '50px',
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      {showLabel && (
        <span
          className="text-xs whitespace-nowrap"
          style={{ color: textColor }}
        >
          {completed}/{total}
        </span>
      )}
    </div>
  );
};

export default TimelineProgress;
