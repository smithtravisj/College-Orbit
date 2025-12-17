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
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs rounded-[10px]',
      md: 'h-10 px-4 text-sm rounded-[10px]',
      lg: 'h-11 px-5 text-base rounded-[10px]',
    };

    const variantStyles = {
      primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:bg-[var(--accent-muted)]',
      secondary: 'bg-transparent border border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel-2)] hover:border-[var(--border-hover)] active:bg-[var(--panel-3)]',
      danger: 'bg-[var(--danger)] text-white hover:bg-[#d64941] active:bg-[#c63d37]',
      ghost: 'bg-transparent text-[var(--text)] hover:bg-[var(--panel-2)] active:bg-[var(--panel-3)]',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="animate-spin">⚙️</span>
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
