'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import React from 'react';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsLightMode } from '@/hooks/useEffectiveTheme';

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
  variant?: 'primary' | 'secondary';
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = React.memo(({
  id,
  title,
  subtitle,
  action,
  children,
  hoverable = false,
  className = '',
  onChange,
  initialOpen = true,
  variant = 'primary',
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  // Initialize mounted to true to prevent flash of empty content on remount
  // The SSR check below handles hydration
  const [mounted, setMounted] = useState(typeof window !== 'undefined');
  const { isPremium } = useSubscription();
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';
  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);

  // Custom theme only applies for premium users
  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;

  const colorPalette = getCollegeColorPalette(university || null, theme);
  const accentColor = useCustomTheme && customColors
    ? getCustomColorSetForTheme(customColors as CustomColors, theme).accent
    : colorPalette.accent;
  const isPrimary = variant === 'primary';
  const isLightMode = useIsLightMode();

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
      className={`card-hover rounded-[16px] border transition-all duration-300 w-full flex flex-col ${hoverable ? 'hover:border-[var(--border-hover)] cursor-pointer' : ''} ${!isOpen ? 'cursor-pointer' : ''} ${className}`}
      style={{
        position: 'relative',
        overflow: 'visible',
        background: 'var(--panel)',
        borderColor: 'var(--border)',
        borderLeftWidth: '3px',
        borderLeftColor: `${accentColor}55`,
        boxShadow: isLightMode ? '0 1px 4px rgba(0,0,0,0.04)' : '0 2px 8px rgba(0,0,0,0.15)',
      }}
      onClick={() => !isOpen && handleToggle()}
    >
      {/* Inner content wrapper */}
      <div className="flex flex-col" style={{ padding: isOpen ? (isPrimary ? '24px' : '18px 20px') : '8px 24px 12px 24px', overflow: 'visible' }}>
        {/* Header block */}
        {title && (
          <div className="flex items-start justify-between gap-4" style={{ marginBottom: isOpen ? '16px' : '0px', paddingTop: isOpen ? '0px' : '8px' }}>
            <div className="space-y-1 flex-1">
              <h3 className="font-bold leading-[1.25] text-[var(--text)]" style={{ fontSize: '17px' }}>{title}</h3>
              {subtitle && isOpen && <p className="leading-[1.6]" style={{ fontSize: '12px', color: theme === 'light' ? 'var(--text-muted)' : 'rgba(255, 255, 255, 0.6)' }}>{subtitle}</p>}
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
});

CollapsibleCard.displayName = 'CollapsibleCard';

export default CollapsibleCard;
