'use client';

import React, { CSSProperties } from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  accentColor?: string;
  style?: CSSProperties;
  className?: string;
}

const Checkbox = React.memo(function Checkbox({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  accentColor = 'var(--accent)',
  style,
  className,
}: CheckboxProps) {
  const sizes = {
    sm: { box: 14, check: 8, stroke: 1.5 },
    md: { box: 18, check: 12, stroke: 2 },
    lg: { box: 22, check: 14, stroke: 2 },
  };

  const s = sizes[size];

  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={className}
      style={{
        width: s.box,
        height: s.box,
        borderRadius: '4px',
        border: `2px solid ${checked ? accentColor : 'var(--border)'}`,
        backgroundColor: checked ? accentColor : 'var(--panel-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
        ...style,
      }}
    >
      {checked && (
        <svg width={s.check} height={s.check} viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6L5 9L10 3"
            stroke="var(--accent-text, white)"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
