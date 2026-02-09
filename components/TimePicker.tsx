'use client';

import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import useAppStore from '@/lib/store';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
}

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const isMobile = useIsMobile();
  const timeFormat = useAppStore((state) => state.settings.timeFormat) || '12h';
  const is24Hour = timeFormat === '24h';

  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');
  const [isPM, setIsPM] = useState(true);
  const [inputValue, setInputValue] = useState<string>('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromParent = useRef(false);

  // Track client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Convert 24-hour to 12-hour format for display
  const convert24To12 = (h: string): { hours12: string; isPM: boolean } => {
    const hours24 = parseInt(h);
    const isPM = hours24 >= 12;
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;
    return { hours12: String(hours12).padStart(2, '0'), isPM };
  };

  // Convert 12-hour to 24-hour format for storage
  const convert12To24 = (h: string, pm: boolean): string => {
    let hours24 = parseInt(h);
    if (pm && hours24 !== 12) {
      hours24 += 12;
    } else if (!pm && hours24 === 12) {
      hours24 = 0;
    }
    return String(hours24).padStart(2, '0');
  };

  // Parse the initial value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      isUpdatingFromParent.current = true;

      if (is24Hour) {
        setHours(h.padStart(2, '0'));
        setMinutes(m);
        setInputValue(`${h.padStart(2, '0')}:${m}`);
      } else {
        const { hours12, isPM: ispm } = convert24To12(h);
        setHours(hours12);
        setMinutes(m);
        setIsPM(ispm);
        setInputValue(`${hours12}:${m} ${ispm ? 'PM' : 'AM'}`);
      }
    }
  }, [value, is24Hour]);

  // Parse typed input (supports formats like "2:30pm", "2:30 PM", "14:30", "230pm", etc.)
  const parseTimeInput = (input: string): { hours24: string; minutes: string; hours12?: string; isPM?: boolean } | null => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return null;

    // Check for AM/PM indicator
    const hasAM = trimmed.includes('am') || trimmed.endsWith('a');
    const hasPM = trimmed.includes('pm') || trimmed.endsWith('p');
    const cleanInput = trimmed.replace(/[ap]m?/gi, '').trim();

    // Try to parse time
    let h: number, m: number;

    if (cleanInput.includes(':')) {
      // Format: "2:30" or "14:30"
      const [hourPart, minPart] = cleanInput.split(':');
      h = parseInt(hourPart) || 0;
      m = parseInt(minPart) || 0;
    } else if (cleanInput.length <= 2) {
      // Format: "2" or "14" (just hours)
      h = parseInt(cleanInput) || 0;
      m = 0;
    } else if (cleanInput.length === 3) {
      // Format: "230" -> 2:30
      h = parseInt(cleanInput[0]) || 0;
      m = parseInt(cleanInput.slice(1)) || 0;
    } else if (cleanInput.length === 4) {
      // Format: "1430" -> 14:30 or "0230" -> 2:30
      h = parseInt(cleanInput.slice(0, 2)) || 0;
      m = parseInt(cleanInput.slice(2)) || 0;
    } else {
      return null;
    }

    // Validate minutes
    if (m > 59) m = 59;

    // For 24-hour format
    if (is24Hour) {
      // If explicit AM/PM given, convert
      if (hasAM && h === 12) h = 0;
      if (hasPM && h < 12) h += 12;
      if (h > 23) h = 23;

      return {
        hours24: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
      };
    }

    // For 12-hour format
    let isPMResult: boolean;
    let hours12: number;

    if (hasAM) {
      isPMResult = false;
      hours12 = h > 12 ? h % 12 || 12 : h;
      if (hours12 === 0) hours12 = 12;
    } else if (hasPM) {
      isPMResult = true;
      hours12 = h > 12 ? h % 12 || 12 : h;
      if (hours12 === 0) hours12 = 12;
    } else if (h > 12) {
      // 24-hour format entered in 12-hour mode
      isPMResult = h >= 12;
      hours12 = h % 12 || 12;
    } else if (h === 0) {
      // Midnight
      hours12 = 12;
      isPMResult = false;
    } else {
      // Default to current isPM state
      hours12 = h;
      isPMResult = isPM;
    }

    if (hours12 > 12) hours12 = 12;
    if (hours12 < 1) hours12 = 12;

    const hours24 = convert12To24(String(hours12), isPMResult);

    return {
      hours24,
      minutes: String(m).padStart(2, '0'),
      hours12: String(hours12).padStart(2, '0'),
      isPM: isPMResult,
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const parsed = parseTimeInput(inputValue);
    if (parsed) {
      if (is24Hour) {
        setHours(parsed.hours24);
        setMinutes(parsed.minutes);
        setInputValue(`${parsed.hours24}:${parsed.minutes}`);
      } else {
        setHours(parsed.hours12!);
        setMinutes(parsed.minutes);
        setIsPM(parsed.isPM!);
        setInputValue(`${parsed.hours12}:${parsed.minutes} ${parsed.isPM ? 'PM' : 'AM'}`);
      }
      onChange(`${parsed.hours24}:${parsed.minutes}`);
    } else if (inputValue.trim() === '') {
      // Clear the time
      setHours('');
      setMinutes('');
      setInputValue('');
      onChange('');
    } else {
      // Invalid input, revert to current value
      if (hours && minutes) {
        if (is24Hour) {
          setInputValue(`${hours}:${minutes}`);
        } else {
          setInputValue(`${hours}:${minutes} ${isPM ? 'PM' : 'AM'}`);
        }
      } else {
        setInputValue('');
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      setIsOpen(false);
    }
  };

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [isOpen]);

  // Close dropdown on Escape key or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      if (isOutsideContainer && isOutsideDropdown) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTimeChange = (h: string, m: string, pm: boolean = isPM) => {
    const formattedMinutes = String(parseInt(m) || 0).padStart(2, '0');
    let hours24: string;
    let displayValue: string;

    if (is24Hour) {
      hours24 = String(parseInt(h) || 0).padStart(2, '0');
      displayValue = `${hours24}:${formattedMinutes}`;
    } else {
      const formattedHours = String(parseInt(h) || 12).padStart(2, '0');
      hours24 = convert12To24(formattedHours, pm);
      displayValue = `${formattedHours}:${formattedMinutes} ${pm ? 'PM' : 'AM'}`;
    }

    setInputValue(displayValue);
    onChange(`${hours24}:${formattedMinutes}`);
  };

  const incrementHours = () => {
    const currentHours = parseInt(hours) || 0;
    const currentMinutes = parseInt(minutes) || 0;
    let newHours: number;

    if (is24Hour) {
      newHours = (currentHours + 1) % 24;
    } else {
      newHours = currentHours + 1;
      if (newHours > 12) newHours = 1;
      if (newHours === 0) newHours = 1;
    }

    const formattedHours = String(newHours).padStart(2, '0');
    const formattedMinutes = String(currentMinutes).padStart(2, '0');
    setHours(formattedHours);
    setMinutes(formattedMinutes);
    handleTimeChange(formattedHours, formattedMinutes);
  };

  const decrementHours = () => {
    const currentHours = parseInt(hours) || 0;
    const currentMinutes = parseInt(minutes) || 0;
    let newHours: number;

    if (is24Hour) {
      newHours = (currentHours - 1 + 24) % 24;
    } else {
      newHours = currentHours - 1;
      if (newHours < 1) newHours = 12;
    }

    const formattedHours = String(newHours).padStart(2, '0');
    const formattedMinutes = String(currentMinutes).padStart(2, '0');
    setHours(formattedHours);
    setMinutes(formattedMinutes);
    handleTimeChange(formattedHours, formattedMinutes);
  };

  const incrementMinutes = () => {
    const currentHours = parseInt(hours) || (is24Hour ? 0 : 1);
    const currentMinutes = parseInt(minutes) || 0;
    const newMinutes = (currentMinutes + 5) % 60;
    const formattedHours = String(currentHours).padStart(2, '0');
    const formattedMinutes = String(newMinutes).padStart(2, '0');
    setHours(formattedHours);
    setMinutes(formattedMinutes);
    handleTimeChange(formattedHours, formattedMinutes);
  };

  const decrementMinutes = () => {
    const currentHours = parseInt(hours) || (is24Hour ? 0 : 1);
    const currentMinutes = parseInt(minutes) || 0;
    const newMinutes = (currentMinutes - 5 + 60) % 60;
    const formattedHours = String(currentHours).padStart(2, '0');
    const formattedMinutes = String(newMinutes).padStart(2, '0');
    setHours(formattedHours);
    setMinutes(formattedMinutes);
    handleTimeChange(formattedHours, formattedMinutes);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text on focus so typing replaces the value
    e.target.select();
  };

  const handleHourInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(-2);

    if (val !== '') {
      const numVal = parseInt(val);
      if (is24Hour) {
        if (numVal > 23) val = '23';
      } else {
        if (numVal > 12) val = '12';
      }
    }
    setHours(val);
  };

  const handleHourBlur = () => {
    let val = hours;
    if (is24Hour) {
      if (val === '') val = '00';
      else val = String(parseInt(val)).padStart(2, '0');
    } else {
      if (val === '' || parseInt(val) < 1) val = '01';
      else val = String(parseInt(val)).padStart(2, '0');
    }
    setHours(val);
    handleTimeChange(val, minutes.padStart(2, '0') || '00');
  };

  const handleMinuteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(-2);
    if (val !== '') {
      const numVal = parseInt(val);
      if (numVal > 59) val = '59';
    }
    setMinutes(val);
  };

  const handleMinuteBlur = () => {
    let val = minutes;
    if (val === '') {
      val = '00';
    } else {
      val = String(parseInt(val)).padStart(2, '0');
    }
    setMinutes(val);
    handleTimeChange(hours.padStart(2, '0') || (is24Hour ? '00' : '01'), val);
  };

  const placeholder = is24Hour
    ? (isMobile ? 'e.g. 14:30' : 'e.g. 14:30, 2:30pm')
    : (isMobile ? 'e.g. 2:30pm' : 'e.g. 2:30pm, 14:30');

  return (
    <div ref={containerRef} className="relative w-full" style={{ minWidth: '120px', overflow: 'visible' }}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '6px' }}>
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        onFocus={() => {
          if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPosition({
              top: rect.bottom + 4,
              left: rect.left,
            });
          }
          setIsOpen(true);
        }}
        placeholder={placeholder}
        className="w-full h-[var(--input-height)] bg-[var(--panel-2)] border border-[var(--border)] rounded-[var(--radius-control)] transition-colors hover:border-[var(--border-hover)] focus:outline-none focus:border-[var(--border-hover)]"
        style={{
          padding: isMobile ? '8px 10px' : '10px 12px',
          fontSize: isMobile ? '0.75rem' : '0.875rem',
          fontWeight: 500,
          color: 'var(--text)',
        }}
      />

      {mounted && isOpen && createPortal(
        <div
          ref={dropdownRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="bg-[var(--panel-2)] border border-[var(--border)] rounded-[var(--radius-control)] shadow-lg"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            minWidth: '180px',
            zIndex: 99999,
          }}
        >
          <div style={{ padding: '16px' }}>
            <div className="flex items-center gap-4 justify-center">
              {/* Hours */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={incrementHours}
                  className="p-1 rounded text-[var(--muted)] hover:text-[var(--edit-hover)] hover:bg-white/5 transition-colors"
                >
                  <ChevronUp size={18} />
                </button>
                <input
                  type="text"
                  value={hours}
                  onChange={handleHourInput}
                  onFocus={handleFocus}
                  onBlur={handleHourBlur}
                  placeholder="00"
                  className="w-12 text-center bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] rounded-[var(--radius-control)] text-sm font-semibold"
                  style={{ padding: '6px' }}
                  maxLength={2}
                />
                <button
                  type="button"
                  onClick={decrementHours}
                  className="p-1 rounded text-[var(--muted)] hover:text-[var(--edit-hover)] hover:bg-white/5 transition-colors"
                >
                  <ChevronDown size={18} />
                </button>
                <span className="text-xs text-[var(--text-muted)]" style={{ marginTop: '4px' }}>hours</span>
              </div>

              {/* Separator */}
              <div className="text-[var(--text)] text-lg font-semibold">:</div>

              {/* Minutes */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={incrementMinutes}
                  className="p-1 rounded text-[var(--muted)] hover:text-[var(--edit-hover)] hover:bg-white/5 transition-colors"
                >
                  <ChevronUp size={18} />
                </button>
                <input
                  type="text"
                  value={minutes}
                  onChange={handleMinuteInput}
                  onFocus={handleFocus}
                  onBlur={handleMinuteBlur}
                  placeholder="00"
                  className="w-12 text-center bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] rounded-[var(--radius-control)] text-sm font-semibold"
                  style={{ padding: '6px' }}
                  maxLength={2}
                />
                <button
                  type="button"
                  onClick={decrementMinutes}
                  className="p-1 rounded text-[var(--muted)] hover:text-[var(--edit-hover)] hover:bg-white/5 transition-colors"
                >
                  <ChevronDown size={18} />
                </button>
                <span className="text-xs text-[var(--text-muted)]" style={{ marginTop: '4px' }}>minutes</span>
              </div>
            </div>

            {/* AM/PM Toggle - only show for 12-hour format */}
            {!is24Hour && (
              <div className="flex gap-2 justify-center border-t border-[var(--border)]" style={{ marginTop: '12px', paddingTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsPM(false);
                    handleTimeChange(hours, minutes, false);
                  }}
                  className={`text-sm font-medium transition-colors ${
                    !isPM
                      ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                      : 'bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                  }`}
                  style={{ padding: '8px 16px', borderRadius: '6px' }}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPM(true);
                    handleTimeChange(hours, minutes, true);
                  }}
                  className={`text-sm font-medium transition-colors ${
                    isPM
                      ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                      : 'bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                  }`}
                  style={{ padding: '8px 16px', borderRadius: '6px' }}
                >
                  PM
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
