'use client';

import useAppStore from '@/lib/store';

interface CanvasBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * A small badge/icon indicating an item was synced from Canvas LMS.
 * Subtle, transparent design that blends with the UI.
 */
export function CanvasBadge({ size = 'sm', className = '' }: CanvasBadgeProps) {
  const { settings } = useAppStore();

  // Check if Canvas badges should be shown (defaults to true)
  if (settings.showCanvasBadges === false) {
    return null;
  }

  const fontSize = size === 'sm' ? '10px' : '11px';
  const padding = size === 'sm' ? '2px 6px' : '3px 8px';

  return (
    <span
      title="Synced from Canvas LMS"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding,
        borderRadius: '4px',
        backgroundColor: 'var(--danger-bg)',
        color: 'var(--danger)',
        fontSize,
        fontWeight: 500,
        lineHeight: 1,
        flexShrink: 0,
        letterSpacing: '0.2px',
      }}
    >
      Canvas
    </span>
  );
}
