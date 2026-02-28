'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { toLocalDateString } from '@/lib/utils';

interface CalendarPickerProps {
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void;
  label?: string;
}

export default function CalendarPicker({ value, onChange, label }: CalendarPickerProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value) {
      return new Date(value + 'T00:00:00');
    }
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Update input value when value changes
  useEffect(() => {
    if (value) {
      const date = new Date(value + 'T00:00:00');
      setInputValue(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    } else {
      setInputValue('');
    }
  }, [value]);

  // Parse typed date input (supports formats like "1/15", "Jan 15", "01-15-2025", "January 15, 2025", etc.)
  const parseDateInput = (input: string): Date | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    // Helper to pick current or next year if date already passed
    const pickYear = (month: number, day: number): number => {
      const thisYearDate = new Date(currentYear, month, day);
      thisYearDate.setHours(23, 59, 59, 999);
      if (thisYearDate < now) {
        return currentYear + 1;
      }
      return currentYear;
    };

    // Try MM/DD or MM-DD format first
    const slashMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
    if (slashMatch) {
      const month = parseInt(slashMatch[1]) - 1;
      const day = parseInt(slashMatch[2]);
      let year: number;
      if (slashMatch[3]) {
        year = parseInt(slashMatch[3]);
        if (year < 100) year += 2000;
      } else {
        year = pickYear(month, day);
      }
      if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        return new Date(year, month, day);
      }
    }

    // Try "Mon DD" or "Month DD" format
    const lower = trimmed.toLowerCase();
    for (let i = 0; i < monthNames.length; i++) {
      const shortMatch = lower.match(new RegExp(`^${monthNames[i]}[a-z]*\\.?\\s+(\\d{1,2})(?:[,\\s]+(\\d{2,4}))?$`));
      if (shortMatch) {
        const day = parseInt(shortMatch[1]);
        let year: number;
        if (shortMatch[2]) {
          year = parseInt(shortMatch[2]);
          if (year < 100) year += 2000;
        } else {
          year = pickYear(i, day);
        }
        if (day >= 1 && day <= 31) {
          return new Date(year, i, day);
        }
      }
    }

    // Try "DD Mon" format
    for (let i = 0; i < monthNames.length; i++) {
      const dayFirstMatch = lower.match(new RegExp(`^(\\d{1,2})\\s+${monthNames[i]}[a-z]*\\.?(?:[,\\s]+(\\d{2,4}))?$`));
      if (dayFirstMatch) {
        const day = parseInt(dayFirstMatch[1]);
        let year: number;
        if (dayFirstMatch[2]) {
          year = parseInt(dayFirstMatch[2]);
          if (year < 100) year += 2000;
        } else {
          year = pickYear(i, day);
        }
        if (day >= 1 && day <= 31) {
          return new Date(year, i, day);
        }
      }
    }

    // Try parsing with built-in Date as fallback (for full date strings like "January 15, 2025")
    const directParse = new Date(trimmed);
    if (!isNaN(directParse.getTime()) && directParse.getFullYear() >= currentYear - 1) {
      return directParse;
    }

    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const parsed = parseDateInput(inputValue);
    if (parsed) {
      const dateString = toLocalDateString(parsed);
      onChange(dateString);
      setCurrentMonth(parsed);
      setInputValue(parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    } else if (inputValue.trim() === '') {
      onChange('');
      setInputValue('');
    } else {
      // Invalid input, revert to current value
      if (selectedDate) {
        setInputValue(selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
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
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isOpen]);

  // Close popup on Escape key or click outside
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

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleSelectDate = (day: number) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = toLocalDateString(selected);
    onChange(dateString);
    setInputValue(selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    setIsOpen(false);
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'block', width: '100%', overflow: 'visible' }}>
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
              top: rect.bottom + 8,
              left: rect.left,
            });
          }
          setIsOpen(true);
        }}
        placeholder={isMobile ? 'e.g. 1/15, Jan 15' : 'e.g. 1/15, Jan 15, 2025'}
        style={{
          width: '100%',
          height: 'var(--input-height)',
          backgroundColor: 'var(--panel-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-control)',
          padding: isMobile ? '8px 10px' : '10px 12px',
          color: 'var(--text)',
          fontSize: isMobile ? '0.75rem' : '0.875rem',
          fontWeight: 500,
          transition: 'border-color 0.2s',
        }}
      />

      {mounted && isOpen && createPortal(
        <div
          ref={dropdownRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            backgroundColor: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-control)',
            padding: '12px',
            zIndex: 99999,
            minWidth: '260px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'auto',
          }}
        >
          {/* Month Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <button
              className="icon-btn"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrevMonth();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>
              {monthName}
            </div>
            <button
              className="icon-btn"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNextMonth();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px',
              marginBottom: '8px',
            }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                  padding: '4px 0',
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px',
            }}
          >
            {/* Empty cells for days before month starts */}
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} style={{ height: '28px' }} />
            ))}

            {/* Day cells */}
            {days.map((day) => {
              const isSelected =
                selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentMonth.getMonth() &&
                selectedDate.getFullYear() === currentMonth.getFullYear();

              const isToday =
                today.getDate() === day &&
                today.getMonth() === currentMonth.getMonth() &&
                today.getFullYear() === currentMonth.getFullYear();

              return (
                <button
                  key={day}
                  onClick={() => handleSelectDate(day)}
                  style={{
                    height: '28px',
                    padding: 0,
                    border: isSelected
                      ? '1px solid var(--link)'
                      : isToday
                        ? '2px solid var(--link)'
                        : '1px solid transparent',
                    borderRadius: '6px',
                    backgroundColor: isSelected ? 'var(--link)' : 'transparent',
                    color: isSelected ? '#ffffff' : isToday ? 'var(--link)' : 'var(--text)',
                    fontSize: '0.75rem',
                    fontWeight: isToday ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--nav-active)';
                      e.currentTarget.style.borderColor = 'var(--link)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = isToday ? 'var(--link)' : 'transparent';
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

        </div>,
        document.body
      )}
    </div>
  );
}
