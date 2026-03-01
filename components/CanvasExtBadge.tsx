'use client';

import useAppStore from '@/lib/store';

interface CanvasExtBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * A small badge indicating an item was added from Canvas via the browser extension.
 * Uses the same red Canvas color but says "Canvas" (without "Sync").
 */
export function CanvasExtBadge({ size = 'sm', className = '' }: CanvasExtBadgeProps) {
  const { settings } = useAppStore();

  if (settings.showCanvasBadges === false) {
    return null;
  }

  const fontSize = size === 'sm' ? '10px' : '11px';
  const padding = size === 'sm' ? '2px 6px' : '3px 8px';

  return (
    <span
      title="Added from Canvas via browser extension"
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
        verticalAlign: 'middle',
        position: 'relative' as const,
        top: '-1px',
        letterSpacing: '0.2px',
      }}
    >
      Canvas
    </span>
  );
}
