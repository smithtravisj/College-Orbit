import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/** Animated placeholder bar for loading states */
export function Skeleton({ width, height = 16, borderRadius = 4, className = '', style }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--border)',
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

/** Card-shaped skeleton matching the app's card styling */
export function SkeletonCard({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border ${className}`}
      style={{
        background: 'var(--panel)',
        borderColor: 'var(--border)',
        borderLeftWidth: '3px',
        borderLeftColor: 'var(--border)',
        padding: '24px',
      }}
    >
      <Skeleton width="40%" height={20} borderRadius={4} style={{ marginBottom: 12 }} />
      <Skeleton width="60%" height={12} borderRadius={4} style={{ marginBottom: 20 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '45%' : '100%'}
          height={14}
          borderRadius={4}
          style={{ marginBottom: i < lines - 1 ? 10 : 0 }}
        />
      ))}
    </div>
  );
}

/** Generic page skeleton with header + card placeholders */
export function PageSkeleton({ cards = 2, headerWidth = '30%' }: { cards?: number; headerWidth?: string }) {
  return (
    <div style={{ padding: 'var(--page-padding, 24px)', maxWidth: '100%' }}>
      {/* Page header skeleton */}
      <div style={{ marginBottom: 24 }}>
        <Skeleton width={headerWidth} height={28} borderRadius={6} style={{ marginBottom: 8 }} />
        <Skeleton width="50%" height={14} borderRadius={4} />
      </div>

      {/* Card skeletons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} lines={i === 0 ? 4 : 3} />
        ))}
      </div>
    </div>
  );
}

/** List page skeleton (header + filter bar + list items) */
export function ListPageSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div style={{ padding: 'var(--page-padding, 24px)', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Skeleton width={160} height={26} borderRadius={6} style={{ marginBottom: 6 }} />
          <Skeleton width={100} height={13} borderRadius={4} />
        </div>
        <Skeleton width={100} height={36} borderRadius={8} />
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[80, 60, 70, 55].map((w, i) => (
          <Skeleton key={i} width={w} height={30} borderRadius={16} />
        ))}
      </div>

      {/* List items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: items }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-card)] border"
            style={{
              background: 'var(--panel)',
              borderColor: 'var(--border)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Skeleton width={18} height={18} borderRadius={4} />
            <div style={{ flex: 1 }}>
              <Skeleton width={`${55 + (i % 3) * 12}%`} height={15} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width={`${30 + (i % 2) * 15}%`} height={11} borderRadius={4} />
            </div>
            <Skeleton width={60} height={22} borderRadius={10} />
          </div>
        ))}
      </div>
    </div>
  );
}
