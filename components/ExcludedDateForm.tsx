'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import useAppStore from '@/lib/store';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import CalendarPicker from '@/components/CalendarPicker';
import { getDateRange } from '@/lib/calendarUtils';
import { useFormatters } from '@/hooks/useFormatters';
import { useAnimatedOpen } from '@/hooks/useModalAnimation';
import previewStyles from '@/components/ItemPreviewModal.module.css';

interface ExcludedDateFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExcludedDateForm({ isOpen, onClose }: ExcludedDateFormProps) {
  const { courses, settings, addExcludedDate, addExcludedDateRange } = useAppStore();
  const { getCourseDisplayName } = useFormatters();
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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({ courseId: '', singleDate: '', startDate: '', endDate: '', description: '' });
      setDateMode('single');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const selectStyle = useMemo(() => ({
    width: '100%',
    padding: '8px 32px 8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--panel-2)',
    color: 'var(--text)',
    fontSize: '14px',
    cursor: 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${settings.theme === 'light' ? '%23000000' : '%23e6edf6'}' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 16px center',
    backgroundSize: '20px',
  }), [settings.theme]);

  const radioStyle = (isChecked: boolean) => ({
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    backgroundColor: isChecked ? 'var(--accent)' : 'var(--panel-2)',
    backgroundImage: isChecked ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='white'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E\")" : 'none',
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'center',
    backgroundSize: '14px',
    border: '1.5px solid var(--border)',
    borderRadius: '4px',
    outline: 'none' as const,
    transition: 'all 150ms ease',
    flexShrink: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
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

  // Escape key to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const { visible, closing } = useAnimatedOpen(isOpen);
  if (!visible) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={closing ? previewStyles.backdropClosing : previewStyles.backdrop}
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className={`${previewStyles.modal} ${previewStyles.modalNarrow} ${closing ? previewStyles.modalClosing : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={previewStyles.header}>
          <div className={previewStyles.headerInfo}>
            <h2 className={previewStyles.title}>Add Excluded Date</h2>
            <p className={previewStyles.subtitle}>Mark days where you have no classes</p>
          </div>
          <button className={previewStyles.closeButton} onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className={previewStyles.content}>
            {error && (
              <div style={{
                padding: '10px 14px',
                backgroundColor: 'var(--danger-bg, #fee2e2)',
                borderRadius: '8px',
                color: 'var(--danger, #991b1b)',
                fontSize: '13px',
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>
                Scope
              </label>
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                style={selectStyle}
              >
                <option value="">All Courses (School Holiday)</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {getCourseDisplayName(course)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>
                Date Type
              </label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="single"
                    checked={dateMode === 'single'}
                    onChange={() => setDateMode('single')}
                    style={radioStyle(dateMode === 'single')}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--text)' }}>Single Date</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="range"
                    checked={dateMode === 'range'}
                    onChange={() => setDateMode('range')}
                    style={radioStyle(dateMode === 'range')}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--text)' }}>Date Range</span>
                </label>
              </div>
            </div>

            {dateMode === 'single' ? (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>
                  Date
                </label>
                <CalendarPicker
                  value={form.singleDate}
                  onChange={(date) => setForm({ ...form, singleDate: date })}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>
                    Start Date
                  </label>
                  <CalendarPicker
                    value={form.startDate}
                    onChange={(date) => setForm({ ...form, startDate: date })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>
                    End Date
                  </label>
                  <CalendarPicker
                    value={form.endDate}
                    onChange={(date) => setForm({ ...form, endDate: date })}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>
                Description
              </label>
              <Input
                type="text"
                placeholder="e.g., Thanksgiving Break, Spring Break, No class"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className={previewStyles.footer}>
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
