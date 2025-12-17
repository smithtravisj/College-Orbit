import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '' }) => {
  const variantStyles = {
    success: 'bg-[rgba(87,171,90,0.2)] text-[var(--success)] border border-[var(--success)]',
    warning: 'bg-[rgba(198,144,38,0.2)] text-[var(--warning)] border border-[var(--warning)]',
    danger: 'bg-[rgba(229,83,75,0.2)] text-[var(--danger)] border border-[var(--danger)]',
    neutral: 'bg-[var(--panel-2)] text-[var(--text-secondary)] border border-[var(--border)]',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-[6px] text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
