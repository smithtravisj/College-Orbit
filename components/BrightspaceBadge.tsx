'use client';

import useAppStore from '@/lib/store';

interface BrightspaceBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * A small badge/icon indicating an item was synced from Brightspace (D2L) LMS.
 * Subtle, transparent design that blends with the UI.
 */
export function BrightspaceBadge({ size = 'sm', className = '' }: BrightspaceBadgeProps) {
  const { settings } = useAppStore();

  // Check if Canvas badges should be shown (reuse same setting for all LMS badges)
  if (settings.showCanvasBadges === false) {
    return null;
  }

  const fontSize = size === 'sm' ? '10px' : '11px';
  const padding = size === 'sm' ? '2px 6px' : '3px 8px';

  return (
    <span
      title="Synced from Brightspace (D2L) LMS"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding,
        borderRadius: '4px',
        backgroundColor: 'rgba(0, 150, 214, 0.15)', // Brightspace blue
        color: '#0096d6',
        fontSize,
        fontWeight: 500,
        lineHeight: 1,
        flexShrink: 0,
        letterSpacing: '0.2px',
      }}
    >
      Brightspace Sync
    </span>
  );
}
