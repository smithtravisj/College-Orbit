'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  text: string;
  size?: number;
  width?: number;
  position?: 'above' | 'below';
}

export default function HelpTooltip({ text, size = 15, width = 220, position = 'above' }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    // Small delay to prevent immediate closing from the same click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div ref={tooltipRef} className="relative" style={{ display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={handleClick}
        className="text-[var(--text-muted)] hover:text-[var(--text)]"
        style={{
          background: 'none',
          border: 'none',
          padding: '2px',
          cursor: 'help',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.15s',
        }}
        aria-label="Help"
      >
        <HelpCircle size={size} />
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            ...(position === 'above' ? { bottom: '100%', marginBottom: '8px' } : { top: '100%', marginTop: '8px' }),
            padding: '8px 12px',
            fontSize: '12px',
            color: 'var(--text)',
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            whiteSpace: 'normal',
            width: `${width}px`,
            textAlign: 'left',
            lineHeight: '1.4',
            zIndex: 50,
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
