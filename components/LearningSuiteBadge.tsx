'use client';

import useAppStore from '@/lib/store';

interface LearningSuiteBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * A small badge indicating an item was added from Learning Suite (BYU).
 * Blue color matching BYU branding.
 */
export function LearningSuiteBadge({ size = 'sm', className = '' }: LearningSuiteBadgeProps) {
  const { settings } = useAppStore();

  if (settings.showCanvasBadges === false) {
    return null;
  }

  const fontSize = size === 'sm' ? '10px' : '11px';
  const padding = size === 'sm' ? '2px 6px' : '3px 8px';

  return (
    <span
      title="Added from Learning Suite (BYU)"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding,
        borderRadius: '4px',
        backgroundColor: 'rgba(54, 147, 247, 0.15)',
        color: '#3693f7',
        fontSize,
        fontWeight: 500,
        lineHeight: 1,
        flexShrink: 0,
        letterSpacing: '0.2px',
      }}
    >
      Learning Suite
    </span>
  );
}
