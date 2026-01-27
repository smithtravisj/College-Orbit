'use client';

import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  vacationMode?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function StreakBadge({
  streak,
  vacationMode = false,
  size = 'md',
  showLabel = false,
}: StreakBadgeProps) {
  const getStreakColor = () => {
    if (vacationMode) return 'var(--text-muted)';
    if (streak >= 1) return 'var(--warning)';
    return 'var(--text-muted)';
  };

  const getBackgroundColor = () => {
    if (vacationMode) return 'var(--bg-secondary, rgba(0,0,0,0.1))';
    if (streak >= 1) return 'var(--warning-bg)';
    return 'var(--bg-secondary, rgba(0,0,0,0.1))';
  };

  const sizeStyles = {
    sm: { fontSize: '12px', padding: '2px 6px', gap: '2px', iconSize: 12 },
    md: { fontSize: '14px', padding: '4px 8px', gap: '4px', iconSize: 14 },
    lg: { fontSize: '16px', padding: '6px 12px', gap: '6px', iconSize: 18 },
  };

  const currentSize = sizeStyles[size];

  if (streak === 0 && !vacationMode) {
    return null;
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '9999px',
        fontWeight: 500,
        fontSize: currentSize.fontSize,
        padding: currentSize.padding,
        gap: currentSize.gap,
        backgroundColor: getBackgroundColor(),
      }}
      title={vacationMode ? 'On break - streak paused' : `${streak} day streak`}
    >
      <Flame
        size={currentSize.iconSize}
        style={{ color: getStreakColor() }}
        fill={streak >= 1 && !vacationMode ? 'currentColor' : 'none'}
      />
      <span style={{ color: getStreakColor() }}>
        {vacationMode ? 'Break' : streak}
      </span>
      {showLabel && !vacationMode && (
        <span style={{ color: 'var(--text-muted)', marginLeft: '2px' }}>
          {streak === 1 ? 'day' : 'days'}
        </span>
      )}
    </div>
  );
}
