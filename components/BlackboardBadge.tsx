'use client';

import useAppStore from '@/lib/store';

interface BlackboardBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * A small badge/icon indicating an item was synced from Blackboard Learn LMS.
 * Subtle, transparent design that blends with the UI.
 */
export function BlackboardBadge({ size = 'sm', className = '' }: BlackboardBadgeProps) {
  const { settings } = useAppStore();

  // Check if Canvas badges should be shown (reuse same setting for all LMS badges)
  if (settings.showCanvasBadges === false) {
    return null;
  }

  const fontSize = size === 'sm' ? '10px' : '11px';
  const padding = size === 'sm' ? '2px 6px' : '3px 8px';

  return (
    <span
      title="Synced from Blackboard Learn LMS"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding,
        borderRadius: '4px',
        backgroundColor: 'var(--warning-bg)',
        color: 'var(--warning)',
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
      Blackboard Sync
    </span>
  );
}
