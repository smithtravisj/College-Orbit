'use client';

import { useRef, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface DaysDropdownProps {
  value: string[];
  onChange: (days: string[]) => void;
  label?: string;
}

export default function DaysDropdown({ value, onChange, label }: DaysDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDay = (day: string) => {
    if (value.includes(day)) {
      onChange(value.filter(d => d !== day));
    } else {
      onChange([...value, day]);
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full" style={{ minWidth: '140px' }}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '12px' }}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[var(--input-height)] bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)] rounded-[var(--radius-control)] transition-colors hover:border-[var(--border-hover)] focus:outline-none flex items-center justify-between"
        style={{ padding: '10px 12px' }}
      >
        <span className="text-sm font-medium">Days</span>
        <ChevronDown
          size={18}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ opacity: 0.7 }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-[var(--panel-2)] border border-[var(--border)] rounded-[var(--radius-control)] shadow-lg"
          style={{ minWidth: '140px', zIndex: 9999 }}
        >
          <div className="p-2 space-y-1">
            {days.map((day) => (
              <label
                key={day}
                className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-[var(--panel)] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={value.includes(day)}
                  onChange={() => handleToggleDay(day)}
                />
                <span className="text-sm text-[var(--text)]">{day}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
