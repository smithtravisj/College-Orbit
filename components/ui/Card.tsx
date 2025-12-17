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
  hoverable = false,
  className = '',
}) => {
  return (
    <div
      className={`rounded-[16px] border border-[var(--border)] bg-[var(--panel)] p-6 lg:p-8 transition-colors ${hoverable ? 'hover:border-[var(--border-hover)] cursor-pointer' : ''} ${className}`}
    >
      {title && (
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-base font-semibold leading-tight text-[var(--text)]">{title}</h3>
            {subtitle && <p className="text-xs text-[var(--muted)] leading-relaxed">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="text-[var(--text)]">{children}</div>
    </div>
  );
};

export default Card;
