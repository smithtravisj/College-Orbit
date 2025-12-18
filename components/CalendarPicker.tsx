'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarPickerProps {
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void;
  label?: string;
}

export default function CalendarPicker({ value, onChange, label }: CalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value) {
      return new Date(value + 'T00:00:00');
    }
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
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
    const dateString = selected.toISOString().split('T')[0];
    onChange(dateString);
    setIsOpen(false);
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '';

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'block', width: '100%' }}>
      {label && (
        <div style={{ marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>
          {label}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          height: 'var(--input-height)',
          backgroundColor: 'var(--panel-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-control)',
          padding: '10px 12px',
          color: 'var(--text)',
          fontSize: '0.875rem',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        {displayValue || 'Select date...'}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '8px',
            backgroundColor: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-control)',
            padding: '12px',
            zIndex: 9999,
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
              onClick={handlePrevMonth}
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
              onClick={handleNextMonth}
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

              return (
                <button
                  key={day}
                  onClick={() => handleSelectDate(day)}
                  style={{
                    height: '28px',
                    padding: 0,
                    border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                    borderRadius: '6px',
                    backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'rgba(83, 155, 245, 0.1)';
                      e.currentTarget.style.borderColor = 'var(--accent)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
