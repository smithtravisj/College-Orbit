'use client';

import { useState } from 'react';
import useAppStore from '@/lib/store';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import CalendarPicker from '@/components/CalendarPicker';
import { getDateRange } from '@/lib/calendarUtils';

interface ExcludedDateFormProps {
  onClose: () => void;
}

export default function ExcludedDateForm({ onClose }: ExcludedDateFormProps) {
  const { courses, addExcludedDate, addExcludedDateRange } = useAppStore();
  const [dateMode, setDateMode] = useState<'single' | 'range'>('single');
  const [form, setForm] = useState({
    courseId: '', // Empty string = global
    singleDate: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validation
      if (!form.description.trim()) {
        setError('Description is required');
        setIsSubmitting(false);
        return;
      }

      if (dateMode === 'single') {
        if (!form.singleDate) {
          setError('Please select a date');
          setIsSubmitting(false);
          return;
        }

        await addExcludedDate({
          courseId: form.courseId || null,
          date: form.singleDate,
          description: form.description.trim(),
        });
      } else {
        if (!form.startDate || !form.endDate) {
          setError('Please select start and end dates');
          setIsSubmitting(false);
          return;
        }

        const start = new Date(form.startDate);
        const end = new Date(form.endDate);
        if (start > end) {
          setError('Start date must be before end date');
          setIsSubmitting(false);
          return;
        }

        const dateArray = getDateRange(form.startDate, form.endDate);
        await addExcludedDateRange(
          dateArray.map((date) => ({
            courseId: form.courseId || null,
            date,
            description: form.description.trim(),
          }))
        );
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create excluded date');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fee2e2',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Scope
        </label>
        <select
          value={form.courseId}
          onChange={(e) => setForm({ ...form, courseId: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 32px 8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            color: 'var(--text)',
            fontSize: '14px',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e6edf6' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            backgroundSize: '20px',
          }}
        >
          <option value="">All Courses (School Holiday)</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Date Type
        </label>
        <div style={{ display: 'flex', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="radio"
              value="single"
              checked={dateMode === 'single'}
              onChange={() => setDateMode('single')}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                background: dateMode === 'single' ? '#122343' : 'var(--panel-2)',
                backgroundImage: dateMode === 'single' ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='white'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E\")" : 'none',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: '14px',
                border: '1.5px solid var(--border)',
                borderRadius: '4px',
                outline: 'none',
                transition: 'all 150ms ease',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '14px', color: 'var(--text)' }}>Single Date</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="radio"
              value="range"
              checked={dateMode === 'range'}
              onChange={() => setDateMode('range')}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                background: dateMode === 'range' ? '#122343' : 'var(--panel-2)',
                backgroundImage: dateMode === 'range' ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='white'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E\")" : 'none',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: '14px',
                border: '1.5px solid var(--border)',
                borderRadius: '4px',
                outline: 'none',
                transition: 'all 150ms ease',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '14px', color: 'var(--text)' }}>Date Range</span>
          </label>
        </div>
      </div>

      {dateMode === 'single' ? (
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Select Date
          </label>
          <CalendarPicker
            value={form.singleDate}
            onChange={(date) => setForm({ ...form, singleDate: date })}
          />
        </div>
      ) : (
        <>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Start Date
            </label>
            <CalendarPicker
              value={form.startDate}
              onChange={(date) => setForm({ ...form, startDate: date })}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              End Date
            </label>
            <CalendarPicker
              value={form.endDate}
              onChange={(date) => setForm({ ...form, endDate: date })}
            />
          </div>
        </>
      )}

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Description/Label
        </label>
        <Input
          type="text"
          placeholder="e.g., Thanksgiving Break, Spring Break, No class"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <Button
          type="button"
          onClick={onClose}
          style={{
            backgroundColor: 'var(--background-secondary)',
            color: 'var(--text)',
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          style={{
            backgroundColor: '#122343',
            color: '#ffffff',
            border: '1px solid #202d48',
            padding: '8px 20px',
          }}
        >
          {isSubmitting ? 'Creating...' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
