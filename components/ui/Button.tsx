import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', disabled = false, loading = false, className = '', children, ...props }, ref) => {
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
      primary: 'bg-[var(--accent)] text-white hover:brightness-110 active:translate-y-[1px]',
      secondary: 'bg-white/5 text-[var(--text)] hover:bg-white/8 border border-[var(--border)] active:translate-y-[1px]',
      danger: 'bg-[var(--danger)] text-white hover:brightness-110 active:translate-y-[1px]',
      ghost: 'bg-transparent hover:bg-white/5 text-[var(--muted)] hover:text-[var(--text)] active:translate-y-[1px]',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        style={{ padding: sizePadding[size] }}
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
