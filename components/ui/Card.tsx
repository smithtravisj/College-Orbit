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
  padding = 'lg',
  hoverable = false,
  className = '',
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8 lg:p-10',
  };

  return (
    <div
      className={`rounded-[16px] border border-[var(--border)] bg-[var(--panel)] transition-colors h-full flex flex-col ${hoverable ? 'hover:border-[var(--border-hover)] cursor-pointer' : ''} ${className}`}
    >
      {/* Inner content wrapper with padding */}
      <div className={`${paddingClasses[padding]} flex flex-col flex-1`}>
        {/* Header block */}
        {title && (
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold leading-tight text-[var(--text)]">{title}</h3>
              {subtitle && <p className="text-sm text-[var(--muted)] leading-relaxed">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        {/* Children block with enforced vertical rhythm */}
        <div className="text-[var(--text)] flex-1 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Card;
