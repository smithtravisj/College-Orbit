'use client';

import useAppStore from '@/lib/store';

interface LearningSuiteBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * A small badge/icon indicating an item was added from Learning Suite.
 * Uses link color for a subtle appearance.
 */
export function LearningSuiteBadge({ size = 'sm', className = '' }: LearningSuiteBadgeProps) {
  const { settings } = useAppStore();

  // Check if Canvas badges should be shown (reuse this setting for all LMS badges)
  if (settings.showCanvasBadges === false) {
    return null;
  }

  const fontSize = size === 'sm' ? '10px' : '11px';
  const padding = size === 'sm' ? '2px 6px' : '3px 8px';

  return (
    <span
      title="Added from Learning Suite"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding,
        borderRadius: '4px',
        backgroundColor: 'color-mix(in srgb, var(--link) 15%, transparent)',
        color: 'var(--link)',
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
      Learning Suite
    </span>
  );
}
