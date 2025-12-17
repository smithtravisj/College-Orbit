import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  padding = 'md',
  hoverable = false,
  className = '',
}) => {
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={`bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius-card)] transition-colors ${hoverable ? 'hover:border-[var(--border-hover)] cursor-pointer' : ''} ${paddingStyles[padding]} ${className}`}
    >
      {title && (
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
            {subtitle && <p className="text-xs text-[var(--muted)] mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="text-[var(--text)]">{children}</div>
    </div>
  );
};

export default Card;
