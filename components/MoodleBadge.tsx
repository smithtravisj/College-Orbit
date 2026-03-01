'use client';

import useAppStore from '@/lib/store';

interface MoodleBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * A small badge/icon indicating an item was synced from Moodle LMS.
 * Subtle, transparent design that blends with the UI.
 */
export function MoodleBadge({ size = 'sm', className = '' }: MoodleBadgeProps) {
  const { settings } = useAppStore();

  // Check if Canvas badges should be shown (reuse same setting for all LMS badges)
  if (settings.showCanvasBadges === false) {
    return null;
  }

  const fontSize = size === 'sm' ? '10px' : '11px';
  const padding = size === 'sm' ? '2px 6px' : '3px 8px';

  return (
    <span
      title="Synced from Moodle LMS"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding,
        borderRadius: '4px',
        backgroundColor: 'rgba(246, 130, 31, 0.15)', // Moodle orange
        color: '#f6821f',
        fontSize,
        fontWeight: 500,
        lineHeight: 1,
        flexShrink: 0,
        verticalAlign: 'middle',
        position: 'relative' as const,
        top: '-1px',
        letterSpacing: '0.2px',
      }}
    >
      Moodle Sync
    </span>
  );
}
