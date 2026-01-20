import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = React.memo(({ variant = 'neutral', children, className = '' }) => {
  const variantStyles = {
    success: 'bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success)]',
    warning: 'bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning)]',
    danger: 'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger)]',
    neutral: 'bg-[var(--panel-2)] text-[var(--text-secondary)] border border-[var(--border)]',
  };

  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-xs)] text-xs font-medium ${variantStyles[variant]} ${className}`}
      style={{ padding: '4px 8px' }}
      data-status={variant !== 'neutral' ? variant : undefined}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;
