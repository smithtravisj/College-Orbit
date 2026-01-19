'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export default function ColorPicker({ label, value, onChange, disabled = false }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync hex input with value prop
  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setHexInput(newColor);
    onChange(newColor);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let hex = e.target.value;
    setHexInput(hex);

    // Validate hex format
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex);
    }
  };

  const handleHexInputBlur = () => {
    // On blur, ensure we have a valid hex or revert to the current value
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexInput)) {
      setHexInput(value);
    }
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputGroup}>
        <div
          className={`${styles.colorSwatch} ${disabled ? styles.disabled : ''}`}
          style={{ backgroundColor: value }}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="color"
            value={value}
            onChange={handleColorChange}
            disabled={disabled}
            className={styles.colorInput}
          />
        </div>
        <input
          type="text"
          value={hexInput}
          onChange={handleHexInputChange}
          onBlur={handleHexInputBlur}
          disabled={disabled}
          className={styles.hexInput}
          placeholder="#000000"
          maxLength={7}
        />
      </div>
    </div>
  );
}
