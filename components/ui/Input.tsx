import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--text)] mb-2">
            {label}
            {props.required && <span className="text-[var(--danger)]"> *</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full h-[var(--input-height)] bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] rounded-[var(--radius-control)] transition-colors focus:outline-none focus:border-[var(--border-active)] focus:ring-2 focus:ring-[var(--ring)] disabled:bg-[var(--panel)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed ${error ? 'border-[var(--danger)]' : ''} ${className}`}
          style={{ padding: '10px 12px' }}
          {...props}
        />
        {error && <p className="text-xs text-[var(--danger)] mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-[var(--text-muted)] mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

// Textarea variant
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--text)] mb-2">
            {label}
            {props.required && <span className="text-[var(--danger)]"> *</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full min-h-24 bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] rounded-[var(--radius-control)] transition-colors focus:outline-none focus:border-[var(--border-active)] focus:ring-2 focus:ring-[var(--ring)] disabled:bg-[var(--panel)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed resize-none ${error ? 'border-[var(--danger)]' : ''} ${className}`}
          style={{ padding: '10px 12px' }}
          {...props}
        />
        {error && <p className="text-xs text-[var(--danger)] mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-[var(--text-muted)] mt-1">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Select variant
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', ...props }, ref) => {
    const isMultiple = (props as any).multiple;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--text)] mb-2">
            {label}
            {props.required && <span className="text-[var(--danger)]"> *</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full ${isMultiple ? 'min-h-[150px]' : 'h-[var(--input-height)]'} bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)] rounded-[var(--radius-control)] transition-colors focus:outline-none focus:border-[var(--border-active)] focus:ring-2 focus:ring-[var(--ring)] disabled:bg-[var(--panel)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed ${!isMultiple ? 'appearance-none' : ''} cursor-pointer ${error ? 'border-[var(--danger)]' : ''} ${className}`}
          style={{
            padding: '10px 12px',
            ...(isMultiple ? {} : {
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23adbac7' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '16px 16px',
              paddingRight: '2.5rem',
            })
          }}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-[var(--danger)] mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-[var(--text-muted)] mt-1">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
