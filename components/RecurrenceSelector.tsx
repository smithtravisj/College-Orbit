'use client';

import { RecurringTaskFormData, RecurringDeadlineFormData, RecurringExamFormData } from '@/types';
import { Select } from '@/components/ui/Input';
import CalendarPicker from './CalendarPicker';
import useAppStore from '@/lib/store';
import { useIsMobile } from '@/hooks/useMediaQuery';

type RecurringFormData = RecurringTaskFormData | RecurringDeadlineFormData | RecurringExamFormData;

interface RecurrenceSelectorProps {
  value: RecurringFormData;
  onChange: (data: RecurringFormData) => void;
  disabled?: boolean;
}

export default function RecurrenceSelector({ value, onChange, disabled }: RecurrenceSelectorProps) {
  const isMobile = useIsMobile();
  const theme = useAppStore((state) => state.settings.theme);

  const handleChange = (updates: Partial<RecurringFormData>) => {
    onChange({ ...value, ...updates } as RecurringFormData);
  };

  // In light mode, use dark text on accent background; in dark mode, use white
  const selectedTextColor = theme === 'light' ? '#000000' : 'white';

  // Get the time field value (dueTime for tasks/deadlines, examTime for exams)
  const getTimeValue = (): string => {
    if ('dueTime' in value) return value.dueTime;
    if ('examTime' in value) return value.examTime;
    return '23:59';
  };

  // Get the time field name for display
  const getTimeLabel = (): string => {
    if ('examTime' in value) return 'Exam time for each occurrence';
    return 'Due time for each occurrence';
  };

  const getPreviewText = (): string => {
    let freq = '';
    switch (value.recurrenceType) {
      case 'weekly':
        freq = 'every week';
        break;
      case 'monthly':
        freq = 'every 30 days';
        break;
      case 'custom':
        freq = `every ${value.customIntervalDays} days`;
        break;
    }

    let end = '';
    switch (value.endCondition) {
      case 'never':
        end = 'continuing indefinitely';
        break;
      case 'date':
        end = `until ${new Date(value.endDate).toLocaleDateString()}`;
        break;
      case 'count':
        end = `for ${value.occurrenceCount} occurrences`;
        break;
    }

    return `This will repeat ${freq}, ${end}.`;
  };

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-control)',
        padding: isMobile ? '10px' : '16px',
        backgroundColor: 'var(--panel-2)',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      <label
        style={{
          display: 'block',
          fontSize: isMobile ? '12px' : '14px',
          fontWeight: '600',
          color: 'var(--text)',
          marginBottom: isMobile ? '6px' : '12px',
        }}
      >
        Repeat Pattern
      </label>

      {/* Recurrence Type */}
      <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
        <Select
          label="Frequency"
          value={value.recurrenceType}
          onChange={(e) => handleChange({ recurrenceType: e.target.value as any })}
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly (every 30 days)' },
            { value: 'custom', label: 'Custom interval' },
          ]}
        />
      </div>

      {/* Start Date */}
      <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
        <CalendarPicker
          label="Start date"
          value={value.startDate}
          onChange={(date) => handleChange({ startDate: date })}
        />
      </div>

      {/* Days of Week Selector */}
      {value.recurrenceType === 'weekly' && (
        <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: '500',
              color: 'var(--text)',
              marginBottom: isMobile ? '4px' : '8px',
            }}
          >
            Repeat on
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
              gap: isMobile ? '4px' : '8px',
            }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <label
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '3px' : '6px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '11px' : '13px',
                  padding: isMobile ? '4px 6px' : '8px',
                  backgroundColor: value.daysOfWeek.includes(index)
                    ? 'var(--accent)'
                    : 'var(--panel)',
                  border: `1px solid ${value.daysOfWeek.includes(index) ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  color: value.daysOfWeek.includes(index) ? selectedTextColor : 'var(--text)',
                }}
              >
                <input
                  type="checkbox"
                  checked={value.daysOfWeek.includes(index)}
                  onChange={(e) => {
                    const newDays = e.target.checked
                      ? [...value.daysOfWeek, index].sort()
                      : value.daysOfWeek.filter((d) => d !== index);
                    handleChange({ daysOfWeek: newDays });
                  }}
                  style={{
                    cursor: 'pointer',
                  }}
                />
                {day}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Days of Month Selector */}
      {value.recurrenceType === 'monthly' && (
        <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: '500',
              color: 'var(--text)',
              marginBottom: isMobile ? '3px' : '8px',
            }}
          >
            Repeat on
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '6px',
            }}
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => {
                  const newDays = value.daysOfMonth.includes(day)
                    ? value.daysOfMonth.filter((d) => d !== day)
                    : [...value.daysOfMonth, day].sort((a, b) => a - b);
                  handleChange({ daysOfMonth: newDays });
                }}
                style={{
                  padding: '8px',
                  backgroundColor: value.daysOfMonth.includes(day)
                    ? 'var(--accent)'
                    : 'var(--panel)',
                  border: `1px solid ${value.daysOfMonth.includes(day) ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '6px',
                  color: value.daysOfMonth.includes(day) ? selectedTextColor : 'var(--text)',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Interval */}
      {value.recurrenceType === 'custom' && (
        <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: '500',
              color: 'var(--text)',
              marginBottom: isMobile ? '3px' : '6px',
            }}
          >
            Repeat every (days)
          </label>
          <input
            type="number"
            max="365"
            value={value.customIntervalDays || ''}
            onChange={(e) => handleChange({ customIntervalDays: e.target.value ? parseInt(e.target.value) : 0 })}
            placeholder="Leave empty for 1 day"
            style={{
              width: '100%',
              height: 'var(--input-height)',
              backgroundColor: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              padding: '10px 12px',
              color: 'var(--text)',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
            onWheel={(e) => e.currentTarget.blur()}
          />
          <style>{`
            input[type="number"]::-webkit-outer-spin-button,
            input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            input[type="number"] {
              -moz-appearance: textfield;
            }
          `}</style>
        </div>
      )}

      {/* Due/Exam Time */}
      <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: '500',
            color: 'var(--text)',
            marginBottom: isMobile ? '3px' : '6px',
          }}
        >
          {getTimeLabel()}
        </label>
        <input
          type="time"
          value={getTimeValue()}
          onChange={(e) => {
            if ('dueTime' in value) {
              handleChange({ dueTime: e.target.value });
            } else if ('examTime' in value) {
              handleChange({ examTime: e.target.value });
            }
          }}
          style={{
            width: '100%',
            height: 'var(--input-height)',
            backgroundColor: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-control)',
            padding: '10px 12px',
            color: 'var(--text)',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* End Condition */}
      <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
        <Select
          label="Ends"
          value={value.endCondition}
          onChange={(e) => handleChange({ endCondition: e.target.value as any })}
          options={[
            { value: 'never', label: 'Never' },
            { value: 'date', label: 'On specific date' },
            { value: 'count', label: 'After number of occurrences' },
          ]}
        />
      </div>

      {/* End Date */}
      {value.endCondition === 'date' && (
        <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
          <CalendarPicker
            label="End date"
            value={value.endDate}
            onChange={(date) => handleChange({ endDate: date })}
          />
        </div>
      )}

      {/* Occurrence Count */}
      {value.endCondition === 'count' && (
        <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: '500',
              color: 'var(--text)',
              marginBottom: isMobile ? '3px' : '6px',
            }}
          >
            Number of occurrences
          </label>
          <input
            type="number"
            max="365"
            value={value.occurrenceCount || ''}
            onChange={(e) => handleChange({ occurrenceCount: e.target.value ? parseInt(e.target.value) : 0 })}
            placeholder="Leave empty for unlimited"
            style={{
              width: '100%',
              height: 'var(--input-height)',
              backgroundColor: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              padding: '10px 12px',
              color: 'var(--text)',
              fontSize: '14px',
              boxSizing: 'border-box',
              /* Remove number input arrows */
            }}
            onWheel={(e) => e.currentTarget.blur()}
          />
          <style>{`
            input[type="number"]::-webkit-outer-spin-button,
            input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            input[type="number"] {
              -moz-appearance: textfield;
            }
          `}</style>
        </div>
      )}

      {/* Preview */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: 'var(--panel)',
          borderRadius: '8px',
          fontSize: '13px',
          color: 'var(--text-muted)',
        }}
      >
        <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '4px' }}>
          Preview:
        </strong>
        {getPreviewText()}
      </div>
    </div>
  );
}
