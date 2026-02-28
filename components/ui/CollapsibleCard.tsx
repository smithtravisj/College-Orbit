'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import HelpTooltip from './HelpTooltip';
import React from 'react';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import { getThemeColors } from '@/lib/visualThemes';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsLightMode } from '@/hooks/useEffectiveTheme';

interface CollapsibleCardProps {
  id: string;
  title?: string;
  subtitle?: string;
  helpTooltip?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  onChange?: (isOpen: boolean) => void;
  initialOpen?: boolean;
  variant?: 'primary' | 'secondary';
  collapsible?: boolean;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = React.memo(({
  id,
  title,
  subtitle,
  helpTooltip,
  action,
  children,
  hoverable = false,
  className = '',
  onChange,
  initialOpen = true,
  variant = 'primary',
  collapsible = true,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [shouldRender, setShouldRender] = useState(initialOpen);
  // Initialize mounted to true to prevent flash of empty content on remount
  // The SSR check below handles hydration
  const [mounted, setMounted] = useState(typeof window !== 'undefined');
  const contentRef = useRef<HTMLDivElement>(null);
  const { isPremium } = useSubscription();
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';
  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);
  const savedVisualTheme = useAppStore((state) => state.settings.visualTheme);

  // Custom theme and visual theme only apply for premium users
  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;
  const visualTheme = isPremium ? savedVisualTheme : null;

  const colorPalette = getCollegeColorPalette(university || null, theme);
  // Visual theme takes priority
  const accentColor = (() => {
    if (visualTheme && visualTheme !== 'default') {
      const themeColors = getThemeColors(visualTheme, theme);
      if (themeColors.accent) return themeColors.accent;
    }
    if (useCustomTheme && customColors) {
      return getCustomColorSetForTheme(customColors as CustomColors, theme).accent;
    }
    return colorPalette.accent;
  })();
  const isPrimary = variant === 'primary';
  const isLightMode = useIsLightMode();

  // Load state from database (via initialOpen prop)
  useEffect(() => {
    setIsOpen(initialOpen);
    if (initialOpen) setShouldRender(true);
    setMounted(true);
  }, [id, initialOpen]);

  // When opening, mount content immediately so it can animate in
  // When closing, keep content mounted until animation completes
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return undefined;
    }
    if (!collapsible) {
      return undefined;
    }
    const timer = setTimeout(() => setShouldRender(false), 300);
    return () => clearTimeout(timer);
  }, [isOpen, collapsible]);

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
      id={id}
      className={`card-hover rounded-[var(--radius-card)] border transition-all duration-300 w-full flex flex-col ${hoverable ? 'hover:border-[var(--border-hover)] cursor-pointer' : ''} ${!isOpen && collapsible ? 'cursor-pointer' : ''} ${className}`}
      style={{
        position: 'relative',
        overflow: 'visible',
        background: 'var(--panel)',
        borderColor: 'var(--border)',
        borderLeftWidth: '3px',
        borderLeftColor: `${accentColor}55`,
        boxShadow: isLightMode ? '0 1px 4px rgba(0,0,0,0.04)' : '0 2px 8px rgba(0,0,0,0.15)',
      }}
      onClick={() => collapsible && !isOpen && handleToggle()}
    >
      {/* Inner content wrapper */}
      <div className="flex flex-col" style={{ padding: (isOpen || !collapsible) ? (isPrimary ? '24px' : '18px 20px') : '8px 24px 12px 24px', overflow: 'visible', transition: collapsible ? 'padding 0.3s ease' : undefined }}>
        {/* Header block */}
        {title && (
          <div className="flex items-start justify-between gap-4" style={{ marginBottom: (isOpen || !collapsible) ? '16px' : '0px', paddingTop: (isOpen || !collapsible) ? '0px' : '8px', transition: collapsible ? 'margin-bottom 0.3s ease, padding-top 0.3s ease' : undefined }}>
            <div className="space-y-1 flex-1">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 className="font-bold leading-[1.25] text-[var(--text)]" style={{ fontSize: '17px', margin: 0 }}>{title}</h3>
                {helpTooltip && (
                  <HelpTooltip text={helpTooltip} />
                )}
              </div>
              {subtitle && (
                <p className="leading-[1.6]" style={{
                  fontSize: '12px',
                  color: theme === 'light' ? 'var(--text-muted)' : 'rgba(255, 255, 255, 0.6)',
                  ...(!collapsible ? {} : {
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.3s ease, opacity 0.3s ease',
                    opacity: isOpen ? 1 : 0,
                    overflow: 'hidden',
                  }),
                }}>
                  <span style={collapsible ? { minHeight: 0, overflow: 'hidden' } : undefined}>{subtitle}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {action && <div>{action}</div>}
              {collapsible && (
                <button
                  className="icon-btn"
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
              )}
            </div>
          </div>
        )}

        {/* Content - animated collapse/expand */}
        {!collapsible ? (
          <div
            className="text-[var(--text)] flex-1 space-y-6 leading-[var(--line-height-relaxed)]"
            style={{ overflow: 'visible' }}
          >
            {children}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateRows: isOpen ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.3s ease',
            }}
          >
            <div ref={contentRef} style={{ overflow: 'hidden', minHeight: 0 }}>
              {shouldRender && (
                <div
                  className="text-[var(--text)] flex-1 space-y-6 leading-[var(--line-height-relaxed)]"
                  style={{
                    overflow: 'visible',
                    opacity: isOpen ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  {children}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

CollapsibleCard.displayName = 'CollapsibleCard';

export default CollapsibleCard;
