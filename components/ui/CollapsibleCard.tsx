'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import React from 'react';

interface CollapsibleCardProps {
  id: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  id,
  title,
  subtitle,
  action,
  children,
  hoverable = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`card-${id}-open`);
    if (stored !== null) {
      setIsOpen(stored === 'true');
    }
    setMounted(true);
  }, [id]);

  // Save state to localStorage when it changes
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem(`card-${id}-open`, String(newState));
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div
      className={`rounded-[16px] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-sm)] transition-colors w-full h-full flex flex-col ${hoverable ? 'hover:border-[var(--border-hover)] cursor-pointer' : ''} ${className}`}
      style={{ position: 'relative', overflow: 'visible' }}
    >
      {/* Inner content wrapper */}
      <div className="flex flex-col flex-1" style={{ padding: '24px', overflow: 'visible' }}>
        {/* Header block */}
        {title && (
          <div className="flex items-start justify-between gap-4" style={{ marginBottom: '16px' }}>
            <div className="space-y-2 flex-1">
              <h3 className="text-lg md:text-xl font-semibold leading-[1.25] text-[var(--text)]">{title}</h3>
              {subtitle && <p className="text-sm leading-[1.8] text-[var(--muted)]">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              {action && <div>{action}</div>}
              <button
                onClick={handleToggle}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  transition: 'color 0.2s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget).style.color = 'var(--text)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget).style.color = 'var(--text-muted)';
                }}
                title={isOpen ? 'Collapse' : 'Expand'}
              >
                <ChevronDown
                  size={20}
                  style={{
                    transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.3s ease',
                  }}
                />
              </button>
            </div>
          </div>
        )}

        {/* Content - conditionally rendered based on isOpen */}
        {isOpen && (
          <div
            className="text-[var(--text)] flex-1 space-y-6 leading-[var(--line-height-relaxed)]"
            style={{ overflow: 'visible' }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollapsibleCard;
