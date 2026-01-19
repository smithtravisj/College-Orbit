'use client';

import React from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useSubscription } from '@/hooks/useSubscription';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary';
  noAccent?: boolean;
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
}) => {
  const isMobile = useIsMobile();
  const { isPremium } = useSubscription();
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';
  const isLightMode = theme === 'light';
  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);

  // Custom theme only applies for premium users
  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;

  const colorPalette = getCollegeColorPalette(university || null, theme);

  // Use custom accent color if custom theme is enabled
  const accentColor = useCustomTheme && customColors
    ? getCustomColorSetForTheme(customColors as CustomColors, theme).accent
    : colorPalette.accent;

  const isPrimary = variant === 'primary';

  return (
    <div
      className={`group card-hover rounded-[16px] border transition-all duration-300 w-full flex flex-col min-h-0 animate-fade-in-up ${hoverable ? 'hover:border-[var(--border-hover)] cursor-pointer' : ''} ${className}`}
      style={{
        position: 'relative',
        minWidth: isMobile ? '0' : 'auto',
        background: 'var(--panel)',
        borderColor: 'var(--border)',
        borderLeftWidth: noAccent ? '1px' : '3px',
        borderLeftColor: noAccent ? 'var(--border)' : `${accentColor}55`,
        boxShadow: isLightMode ? '0 1px 4px rgba(0,0,0,0.04)' : '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <div className="flex flex-col flex-1 min-h-0" style={{ padding: isMobile ? '14px' : isPrimary ? '24px 24px 20px 24px' : '18px 20px 16px 20px' }}>
        {title && (
          <div className="flex items-start justify-between gap-3" style={{ marginBottom: isPrimary ? '16px' : '12px' }}>
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
