'use client';

import { useRef, useEffect, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
}

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState<string>('10');
  const [minutes, setMinutes] = useState<string>('0');
  const [isPM, setIsPM] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromParent = useRef(false);

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
      const { hours12, isPM: ispm } = convert24To12(h);
      isUpdatingFromParent.current = true;
      setHours(hours12);
      setMinutes(m);
      setIsPM(ispm);
    }
  }, [value]);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleTimeChange = (h: string, m: string, pm: boolean = isPM) => {
    const formattedMinutes = String(parseInt(m) || 0).padStart(2, '0');
    const hours24 = convert12To24(h, pm);
    const timeValue = `${hours24}:${formattedMinutes}`;
    onChange(timeValue);
  };

  const incrementHours = () => {
    let newHours = parseInt(hours) + 1;
    if (newHours > 12) newHours = 1;
    const formattedHours = String(newHours).padStart(2, '0');
    setHours(formattedHours);
    handleTimeChange(formattedHours, minutes);
  };

  const decrementHours = () => {
    let newHours = parseInt(hours) - 1;
    if (newHours < 1) newHours = 12;
    const formattedHours = String(newHours).padStart(2, '0');
    setHours(formattedHours);
    handleTimeChange(formattedHours, minutes);
  };

  const incrementMinutes = () => {
    const newMinutes = (parseInt(minutes) + 5) % 60;
    const formattedMinutes = String(newMinutes).padStart(2, '0');
    setMinutes(formattedMinutes);
    handleTimeChange(hours, formattedMinutes);
  };

  const decrementMinutes = () => {
    const newMinutes = (parseInt(minutes) - 5 + 60) % 60;
    const formattedMinutes = String(newMinutes).padStart(2, '0');
    setMinutes(formattedMinutes);
    handleTimeChange(hours, formattedMinutes);
  };

  const handleHourInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(-2);
    const numVal = parseInt(val) || 0;
    if (numVal > 12) val = '12';
    if (numVal < 1 && val !== '') val = '1';
    setHours(val);
    handleTimeChange(val.padStart(2, '0'), minutes.padStart(2, '0'));
  };

  const handleMinuteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(-2);
    const numVal = parseInt(val) || 0;
    if (numVal > 59) val = '59';
    setMinutes(val);
    handleTimeChange(hours, val.padStart(2, '0'));
  };

  return (
    <div ref={dropdownRef} className="relative w-full" style={{ minWidth: '120px', overflow: 'visible' }}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '6px', paddingTop: '4px', paddingBottom: '3px' }}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[var(--input-height)] bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)] rounded-[var(--radius-control)] transition-colors hover:border-[var(--border-hover)] focus:outline-none focus:border-[var(--border-active)] focus:ring-2 focus:ring-[var(--ring)] flex items-center justify-between"
        style={{ padding: '10px 12px' }}
      >
        <span className="text-sm font-medium">{hours.padStart(2, '0')}:{minutes.padStart(2, '0')} {isPM ? 'PM' : 'AM'}</span>
        <ChevronUp
          size={18}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ opacity: 0.7 }}
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute top-full left-0 bg-[var(--panel-2)] border border-[var(--border)] rounded-[var(--radius-control)] shadow-lg"
          style={{ marginTop: '4px', minWidth: '180px', zIndex: 9999 }}
        >
          <div style={{ padding: '16px' }}>
            <div className="flex items-center gap-4 justify-center">
              {/* Hours */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={incrementHours}
                  className="p-1 rounded text-[var(--muted)] hover:text-[var(--accent)] hover:bg-white/5 transition-colors"
                >
                  <ChevronUp size={18} />
                </button>
                <input
                  type="text"
                  value={hours.padStart(2, '0')}
                  onChange={handleHourInput}
                  className="w-12 text-center bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] rounded-[var(--radius-control)] text-sm font-semibold"
                  style={{ padding: '6px' }}
                  maxLength={3}
                />
                <button
                  type="button"
                  onClick={decrementHours}
                  className="p-1 rounded text-[var(--muted)] hover:text-[var(--accent)] hover:bg-white/5 transition-colors"
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
                  className="p-1 rounded text-[var(--muted)] hover:text-[var(--accent)] hover:bg-white/5 transition-colors"
                >
                  <ChevronUp size={18} />
                </button>
                <input
                  type="text"
                  value={minutes.padStart(2, '0')}
                  onChange={handleMinuteInput}
                  className="w-12 text-center bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] rounded-[var(--radius-control)] text-sm font-semibold"
                  style={{ padding: '6px' }}
                  maxLength={3}
                />
                <button
                  type="button"
                  onClick={decrementMinutes}
                  className="p-1 rounded text-[var(--muted)] hover:text-[var(--accent)] hover:bg-white/5 transition-colors"
                >
                  <ChevronDown size={18} />
                </button>
                <span className="text-xs text-[var(--text-muted)]" style={{ marginTop: '4px' }}>minutes</span>
              </div>
            </div>

            {/* AM/PM Toggle */}
            <div className="flex gap-2 justify-center border-t border-[var(--border)]" style={{ marginTop: '12px', paddingTop: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsPM(false);
                  handleTimeChange(hours, minutes, false);
                }}
                className={`text-sm font-medium transition-colors ${
                  !isPM
                    ? 'bg-[var(--accent)] text-white'
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
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                }`}
                style={{ padding: '8px 16px', borderRadius: '6px' }}
              >
                PM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
