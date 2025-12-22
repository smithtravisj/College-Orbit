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
  onChange?: (isOpen: boolean) => void;
  initialOpen?: boolean;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  id,
  title,
  subtitle,
  action,
  children,
  hoverable = false,
  className = '',
  onChange,
  initialOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [mounted, setMounted] = useState(false);

  // Load state from database (via initialOpen prop)
  useEffect(() => {
    setIsOpen(initialOpen);
    setMounted(true);
  }, [id, initialOpen]);

  // Save state to database via onChange callback
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onChange) {
      onChange(newState);
    }
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div
      className={`rounded-[16px] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-sm)] transition-colors w-full flex flex-col ${hoverable ? 'hover:border-[var(--border-hover)] cursor-pointer' : ''} ${!isOpen ? 'cursor-pointer' : ''} ${className}`}
      style={{ position: 'relative', overflow: 'visible' }}
      onClick={() => !isOpen && handleToggle()}
    >
      {/* Inner content wrapper */}
      <div className="flex flex-col" style={{ padding: isOpen ? '24px' : '8px 24px 12px 24px', overflow: 'visible' }}>
        {/* Header block */}
        {title && (
          <div className="flex items-start justify-between gap-4" style={{ marginBottom: isOpen ? '16px' : '0px', paddingTop: isOpen ? '0px' : '8px' }}>
            <div className="space-y-2 flex-1">
              <h3 className="text-lg md:text-xl font-semibold leading-[1.25] text-[var(--text)]">{title}</h3>
              {subtitle && isOpen && <p className="text-sm leading-[1.8] text-[var(--muted)]">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              {action && <div>{action}</div>}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle();
                }}
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
                  marginTop: isOpen ? '0px' : '-4px',
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
