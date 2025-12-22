'use client';

import React from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
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
  const isMobile = useIsMobile();
  return (
    <div
      className={`rounded-[16px] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-sm)] transition-colors w-full h-full flex flex-col ${hoverable ? 'hover:border-[var(--border-hover)] cursor-pointer' : ''} ${className}`}
      style={{ position: 'relative', overflow: 'visible', minWidth: isMobile ? '0' : 'auto' }}
    >
      {/* Inner content wrapper: padding is HARDCODED but overridden on mobile */}
      <div className="flex flex-col flex-1" style={{ padding: isMobile ? '14px' : '24px', overflow: 'visible' }}>
        {/* Header block: enforced spacing */}
        {title && (
          <div className="flex items-start justify-between gap-4" style={{ marginBottom: '16px' }}>
            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-semibold leading-[1.25] text-[var(--text)]">{title}</h3>
              {subtitle && <p className="text-sm leading-[1.8] text-[var(--muted)]">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        {/* Children block: enforced spacing with space-y-6 */}
        <div className="text-[var(--text)] flex-1 space-y-6 leading-[var(--line-height-relaxed)]" style={{ overflow: 'visible' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Card;
