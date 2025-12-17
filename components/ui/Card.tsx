import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  padding?: 'small' | 'default' | 'large';
  hoverable?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  padding = 'large',
  hoverable = false,
  className = '',
}) => {
  const paddingClasses = {
    small: 'p-6',
    default: 'p-8',
    large: 'p-10',
  };

  return (
    <div
      className={`rounded-[16px] border border-[var(--border)] bg-[var(--panel)] transition-colors h-full flex flex-col ${hoverable ? 'hover:border-[var(--border-hover)] cursor-pointer' : ''} ${className}`}
    >
      {/* Inner content wrapper with enforced padding - cannot be overridden */}
      <div className={`${paddingClasses[padding]} flex flex-col flex-1`}>
        {/* Header block */}
        {title && (
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h3 className="text-base font-semibold leading-tight text-[var(--text)]">{title}</h3>
              {subtitle && <p className="text-sm text-[var(--muted)] leading-[1.75]">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        {/* Children block with enforced vertical rhythm and relaxed line-height */}
        <div className="text-[var(--text)] flex-1 space-y-6 leading-[1.75]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Card;
