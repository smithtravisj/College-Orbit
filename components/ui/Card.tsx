'use client';

import React from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useSubscription } from '@/hooks/useSubscription';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import { getThemeColors } from '@/lib/visualThemes';
import { useIsLightMode } from '@/hooks/useEffectiveTheme';

interface CardProps {
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary';
  noAccent?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const Card: React.FC<CardProps> = React.memo(({
  title,
  subtitle,
  action,
  children,
  hoverable = false,
  className = '',
  variant = 'primary',
  noAccent = false,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const isMobile = useIsMobile();
  const { isPremium } = useSubscription();
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';
  const isLightMode = useIsLightMode();
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

  return (
    <div
      className={`group card-hover rounded-[var(--radius-card)] border transition-all duration-300 w-full h-full flex flex-col min-h-0 animate-fade-in-up ${hoverable ? 'hover:border-[var(--border-hover)] cursor-pointer' : ''} ${className}`}
      style={{
        position: 'relative',
        minWidth: isMobile ? '0' : 'auto',
        background: 'var(--panel)',
        borderColor: 'var(--border)',
        borderLeftWidth: noAccent ? '1px' : '3px',
        borderLeftColor: noAccent ? 'var(--border)' : `${accentColor}55`,
        boxShadow: isLightMode ? '0 1px 4px rgba(0,0,0,0.04)' : '0 2px 8px rgba(0,0,0,0.15)',
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex flex-col flex-1 min-h-0" style={{ padding: isMobile ? '14px' : isPrimary ? '24px 24px 20px 24px' : '18px 20px 16px 20px' }}>
        {title && (
          <div className="flex items-start justify-between gap-3" style={{ marginBottom: isPrimary ? '10px' : '8px' }}>
            <div className="space-y-1">
              <h3 className={`font-bold leading-[1.25] text-[var(--text)]`} style={{ fontSize: isPrimary ? (isMobile ? '16px' : '17px') : (isMobile ? '14px' : '15px') }}>{title}</h3>
              {subtitle && <p className="leading-[1.6]" style={{ fontSize: '12px', color: 'var(--text-muted)', opacity: 0.7 }}>{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        <div className="text-[var(--text)] flex-1 space-y-6 leading-[var(--line-height-relaxed)] flex flex-col min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
