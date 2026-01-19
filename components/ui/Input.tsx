import React, { useMemo } from 'react';
import useAppStore from '@/lib/store';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
}

const Input = React.memo(React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', labelClassName = 'text-sm', labelStyle = {}, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className={`block font-medium text-[var(--text)] ${labelClassName}`} style={{ marginBottom: '6px', ...labelStyle }}>
            {label}
            {props.required && <span className="text-[var(--danger)]"> *</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full h-[var(--input-height)] bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] rounded-[var(--radius-control)] transition-colors focus:outline-none disabled:bg-[var(--panel)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed ${error ? 'border-[var(--danger)]' : ''} ${className}`}
          style={{ padding: '10px 12px' }}
          {...props}
        />
        {error && <p className="text-xs text-[var(--danger)] mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-[var(--text-muted)] mt-1">{helperText}</p>}
      </div>
    );
  }
));

Input.displayName = 'Input';

export default Input;

// Textarea variant
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  autoExpand?: boolean;
  maxHeight?: number;
}

export const Textarea = React.memo(React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', labelClassName = 'text-sm', labelStyle = {}, style, autoExpand, maxHeight = 200, onChange, ...props }, ref) => {
    const isMobile = useIsMobile();
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (textarea && autoExpand) {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        // Set height to scrollHeight, but cap at maxHeight
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;
      }
    }, [autoExpand, maxHeight, textareaRef]);

    // Adjust height on mount and when value changes
    React.useEffect(() => {
      adjustHeight();
    }, [props.value, adjustHeight]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(e);
      }
      if (autoExpand) {
        adjustHeight();
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className={`block font-medium text-[var(--text)] ${labelClassName}`} style={{ marginBottom: '6px', ...labelStyle }}>
            {label}
            {props.required && <span className="text-[var(--danger)]"> *</span>}
          </label>
        )}
        <textarea
          ref={textareaRef}
          className={`w-full bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] rounded-[var(--radius-control)] transition-colors focus:outline-none disabled:bg-[var(--panel)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed resize-none ${error ? 'border-[var(--danger)]' : ''} ${className}`}
          style={{ padding: '10px 12px', minHeight: isMobile ? '64px' : '96px', overflowY: autoExpand ? 'auto' : undefined, ...style }}
          onChange={handleChange}
          {...props}
        />
        {error && <p className="text-xs text-[var(--danger)] mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-[var(--text-muted)] mt-1">{helperText}</p>}
      </div>
    );
  }
));

Textarea.displayName = 'Textarea';

// Select variant
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
}

export const Select = React.memo(React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', labelClassName = 'text-sm', labelStyle = {}, ...props }, ref) => {
    const isMultiple = (props as any).multiple;
    const { settings } = useAppStore();
    const isMobile = useIsMobile();
    const hasValue = props.value !== undefined && props.value !== '';

    const selectStyle = useMemo(() => ({
      padding: isMobile ? '0 8px' : '10px 12px',
      backgroundColor: 'var(--panel-2)',
      textOverflow: 'ellipsis',
      lineHeight: isMobile ? 'var(--input-height)' : undefined,
      color: hasValue ? 'var(--text)' : 'var(--text-muted)',
      ...(isMultiple ? {} : {
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${settings.theme === 'light' ? '%23656666' : '%23adbac7'}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: isMobile ? 'right 0.5rem center' : 'right 0.75rem center',
        backgroundSize: isMobile ? '12px 12px' : '16px 16px',
        paddingRight: isMobile ? '1.75rem' : '2.5rem',
      })
    }), [settings.theme, isMultiple, isMobile, hasValue]);

    return (
      <div className="w-full">
        {label && (
          <label className={`block font-medium text-[var(--text)] ${labelClassName}`} style={{ marginBottom: '6px', ...labelStyle }}>
            {label}
            {props.required && <span className="text-[var(--danger)]"> *</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full ${isMultiple ? (isMobile ? 'min-h-[100px]' : 'min-h-[150px]') : 'h-[var(--input-height)]'} border border-[var(--border)] rounded-[var(--radius-control)] transition-colors focus:outline-none disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed ${!isMultiple ? 'appearance-none' : ''} cursor-pointer ${error ? 'border-[var(--danger)]' : ''} ${className}`}
          style={selectStyle}
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
));

Select.displayName = 'Select';
