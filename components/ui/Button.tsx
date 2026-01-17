import React from 'react';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette } from '@/lib/collegeColors';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', disabled = false, loading = false, className = '', style, children, ...props }, ref) => {
    const { settings } = useAppStore();
    const isLightMode = settings.theme === 'light';
    const colorPalette = getCollegeColorPalette(settings.university || null, settings.theme || 'dark');

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
      primary: `bg-[var(--accent)] ${isLightMode ? 'text-black' : 'text-white'} hover:brightness-110 active:translate-y-[1px]`,
      secondary: 'bg-white/5 text-[var(--text)] hover:bg-white/8 border border-[var(--border)] active:translate-y-[1px]',
      danger: 'bg-[var(--danger)] text-white hover:brightness-110 active:translate-y-[1px]',
      ghost: 'bg-transparent hover:bg-white/5 text-[var(--muted)] hover:text-[var(--text)] active:translate-y-[1px]',
    };

    // Gradient and glow for buttons
    const gradientStyle = (() => {
      if (variant === 'primary') {
        return {
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
          boxShadow: `0 0 10px ${colorPalette.accent}80`,
        };
      }
      if (variant === 'danger') {
        return {
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
          boxShadow: '0 0 10px rgba(220, 38, 38, 0.5)',
        };
      }
      if (variant === 'secondary') {
        return {
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
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
