import React from 'react';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';

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

    const theme = settings.theme || 'dark';
    const isLightMode = theme === 'light';
    const colorPalette = getCollegeColorPalette(settings.university || null, theme);

    // Compute accent color (text color uses theme defaults)
    let accentColor = colorPalette.accent;
    const accentTextColor = isLightMode ? '#000000' : '#ffffff';

    if (settings.useCustomTheme && settings.customColors) {
      const colorSet = getCustomColorSetForTheme(settings.customColors as CustomColors, theme);
      accentColor = colorSet.accent;
    }

    // Get intensity settings (0-100, default 50)
    const gradientIntensity = settings.gradientIntensity ?? 50;
    const glowIntensity = settings.glowIntensity ?? 50;

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
      primary: `bg-[var(--accent)] hover:brightness-110 active:translate-y-[1px]`,
      secondary: 'bg-white/5 text-[var(--text)] hover:bg-white/8 border border-[var(--border)] active:translate-y-[1px]',
      danger: `${isLightMode ? 'bg-[var(--danger)]' : 'bg-[#660000]'} text-white hover:brightness-110 active:translate-y-[1px]`,
      ghost: 'bg-transparent hover:bg-white/5 text-[var(--muted)] hover:text-[var(--text)] active:translate-y-[1px]',
    };

    // Gradient and glow for buttons (scaled by intensity settings)
    // Intensity 0 = none, 50 = default, 100 = max
    const gradientScale = Math.pow(gradientIntensity / 50, 2); // quadratic: 50% = 1x, 100% = 4x
    const glowScale = glowIntensity / 50; // 0-2 multiplier

    const gradientStyle = (() => {
      const lightOpacity = Math.round(0.08 * gradientScale * 100) / 100;
      const darkOpacity = Math.round(0.12 * gradientScale * 100) / 100;
      const secondaryLightOpacity = Math.round(0.04 * gradientScale * 100) / 100;
      const secondaryDarkOpacity = Math.round(0.06 * gradientScale * 100) / 100;
      const glowOpacity = Math.min(255, Math.round(0.5 * glowScale * 255)).toString(16).padStart(2, '0');

      if (variant === 'primary') {
        return {
          backgroundImage: gradientIntensity > 0
            ? `linear-gradient(135deg, rgba(255,255,255,${lightOpacity}) 0%, transparent 50%, rgba(0,0,0,${darkOpacity}) 100%)`
            : 'none',
          boxShadow: glowIntensity > 0 ? `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}` : 'none',
          border: '1px solid var(--border)',
          color: accentTextColor,
        };
      }
      if (variant === 'danger') {
        const dangerGlowOpacity = isLightMode ? 0.4 * glowScale : 0.6 * glowScale;
        return {
          backgroundImage: gradientIntensity > 0
            ? `linear-gradient(135deg, rgba(255,255,255,${lightOpacity}) 0%, transparent 50%, rgba(0,0,0,${darkOpacity}) 100%)`
            : 'none',
          boxShadow: glowIntensity > 0
            ? (isLightMode
              ? `0 0 ${Math.round(10 * glowScale)}px rgba(229, 83, 75, ${dangerGlowOpacity})`
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
