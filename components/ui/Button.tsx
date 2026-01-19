'use client';

import React from 'react';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import { useSubscription } from '@/hooks/useSubscription';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', disabled = false, loading = false, className = '', style, children, ...props }, ref) => {
    // Get settings - use a single selector to avoid multiple subscriptions
    const settings = useAppStore((state) => state.settings);
    const { isPremium } = useSubscription();

    const theme = settings.theme || 'dark';
    const isLightMode = theme === 'light';
    const colorPalette = getCollegeColorPalette(settings.university || null, theme);

    // Custom theme and visual effects are only active for premium users
    const useCustomTheme = isPremium ? settings.useCustomTheme : false;
    const customColors = isPremium ? settings.customColors : null;

    // Compute accent color (text color uses theme defaults)
    let accentColor = colorPalette.accent;
    const accentTextColor = isLightMode ? '#000000' : '#ffffff';

    if (useCustomTheme && customColors) {
      const colorSet = getCustomColorSetForTheme(customColors as CustomColors, theme);
      accentColor = colorSet.accent;
    }

    // Get intensity settings (0-100, default 50) - only for premium users
    const gradientIntensity = isPremium ? (settings.gradientIntensity ?? 50) : 50;
    const glowIntensity = isPremium ? (settings.glowIntensity ?? 50) : 50;

    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition active:translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none';

    const sizeStyles = {
      sm: 'h-9 text-xs rounded-[var(--radius-control)]',
      md: 'h-[var(--button-height)] text-sm rounded-[var(--radius-control)]',
      lg: 'h-12 text-base rounded-[var(--radius-control)]',
    };

    const sizePadding = {
      sm: '8px 12px',
      md: '10px 16px',
      lg: '12px 20px',
    };

    const variantStyles = {
      primary: `hover:brightness-110 active:translate-y-[1px]`,
      secondary: 'bg-white/5 text-[var(--text)] hover:bg-white/8 border border-[var(--border)] active:translate-y-[1px]',
      danger: `bg-[var(--delete-button)] text-white hover:brightness-110 active:translate-y-[1px]`,
      ghost: 'bg-transparent hover:bg-white/5 text-[var(--muted)] hover:text-[var(--text)] active:translate-y-[1px]',
    };

    // Gradient and glow for buttons (scaled by intensity settings)
    // Intensity 0 = none, 50 = default, 100 = max
    const gradientScale = Math.pow(gradientIntensity / 50, 2); // quadratic: 50% = 1x, 100% = 4x
    const glowScale = glowIntensity / 50; // 0-2 multiplier
    // Reduce glow intensity when no college is selected (default theme)
    const noCollegeSelected = !settings.university;
    const glowReduction = noCollegeSelected ? 0.5 : 1; // 50% less glow when no college selected

    const gradientStyle = (() => {
      // Use subtler values in dark mode
      const lightOpacity = Math.round(0.08 * gradientScale * 100) / 100;
      const darkOpacity = Math.round(0.12 * gradientScale * 100) / 100;
      const secondaryLightOpacity = Math.round(0.04 * gradientScale * 100) / 100;
      const secondaryDarkOpacity = Math.round(0.06 * gradientScale * 100) / 100;
      const glowOpacity = isLightMode
        ? Math.min(255, Math.round(0.5 * glowScale * glowReduction * 255)).toString(16).padStart(2, '0')
        : Math.min(255, Math.round(0.2 * glowScale * glowReduction * 255)).toString(16).padStart(2, '0');

      if (variant === 'primary') {
        const gradient = `linear-gradient(135deg, rgba(255,255,255,${lightOpacity}) 0%, transparent 50%, rgba(0,0,0,${darkOpacity}) 100%)`;
        const darkOverlay = 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2))';
        return {
          backgroundColor: accentColor,
          backgroundImage: gradientIntensity > 0
            ? (isLightMode ? gradient : `${darkOverlay}, ${gradient}`)
            : (isLightMode ? 'none' : darkOverlay),
          boxShadow: glowIntensity > 0 ? `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}` : 'none',
          border: '1px solid var(--border)',
          color: accentTextColor,
        };
      }
      if (variant === 'danger') {
        const dangerGlowOpacity = isLightMode ? 0.4 * glowScale : 0.6 * glowScale;
        // Use CSS variable for glow color - extract rgb values
        // Default fallback colors: light mode #dc2626 (220, 38, 38), dark mode #660000 (102, 0, 0)
        return {
          backgroundImage: gradientIntensity > 0
            ? `linear-gradient(135deg, rgba(255,255,255,${lightOpacity}) 0%, transparent 50%, rgba(0,0,0,${darkOpacity}) 100%)`
            : 'none',
          boxShadow: glowIntensity > 0
            ? (isLightMode
              ? `0 0 ${Math.round(10 * glowScale)}px rgba(220, 38, 38, ${dangerGlowOpacity})`
              : `0 0 ${Math.round(10 * glowScale)}px rgba(102, 0, 0, ${dangerGlowOpacity})`)
            : 'none',
        };
      }
      if (variant === 'secondary') {
        return {
          backgroundImage: gradientIntensity > 0
            ? `linear-gradient(135deg, rgba(255,255,255,${secondaryLightOpacity}) 0%, transparent 50%, rgba(0,0,0,${secondaryDarkOpacity}) 100%)`
            : 'none',
        };
      }
      return {};
    })();

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        style={{ padding: sizePadding[size], ...gradientStyle, ...style }}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
