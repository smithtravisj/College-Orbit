'use client';

import { Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import styles from './NaturalLanguageInput.module.css';

interface NaturalLanguageInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  autoFocus?: boolean;
}

export default function NaturalLanguageInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  autoFocus = false,
}: NaturalLanguageInputProps) {
  const isMobile = useIsMobile();

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <Sparkles size={isMobile ? 14 : 16} className={styles.icon} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={styles.input}
          autoFocus={autoFocus}
        />
      </div>
    </div>
  );
}
