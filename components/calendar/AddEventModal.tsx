'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import CalendarPicker from '@/components/CalendarPicker';
import TimePicker from '@/components/TimePicker';
import { X, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAnimatedOpen } from '@/hooks/useModalAnimation';
import previewStyles from '@/components/ItemPreviewModal.module.css';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: {
    title: string;
    description: string;
    startAt: string;
    endAt: string | null;
    allDay: boolean;
    location: string | null;
    color: string | null;
    recurrence?: {
      type: string;
      daysOfWeek?: number[];
      daysOfMonth?: number[];
      intervalDays?: number;
      endDate?: string | null;
      occurrenceCount?: number | null;
    };
  }) => Promise<void>;
  initialDate?: Date;
  initialTime?: string;
  initialAllDay?: boolean;
  initialEndTime?: string;
}

const EVENT_COLORS = [
  { value: '#a855f7', label: 'Purple' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#22c55e', label: 'Green' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#14b8a6', label: 'Teal' },
];

export default function AddEventModal({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialTime,
  initialAllDay = false,
  initialEndTime,
}: AddEventModalProps) {
  const isMobile = useIsMobile();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState<string>('');
  const [startTime, setStartTime] = useState(initialTime || '09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(initialAllDay);
  const [location, setLocation] = useState('');
  const [color, setColor] = useState<string>('#a855f7');
  const [saving, setSaving] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('none');
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>([]);
  const [recurrenceDaysOfMonth, setRecurrenceDaysOfMonth] = useState<number[]>([]);
  const [recurrenceInterval, setRecurrenceInterval] = useState(7);
  const [recurrenceEndType, setRecurrenceEndType] = useState<'never' | 'until' | 'count'>('never');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [recurrenceCount, setRecurrenceCount] = useState(10);

  // Helper to convert Date to ISO string (YYYY-MM-DD)
  const dateToString = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to add one hour to a time string
  const addHour = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Reset form when modal opens with new initial values
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setDateStr(dateToString(initialDate || new Date()));
      setStartTime(initialTime || '09:00');
      setEndTime(initialEndTime || (initialTime ? addHour(initialTime) : '10:00'));
      setAllDay(initialAllDay);
      setLocation('');
      setColor('#a855f7');
      setRecurrenceType('none');
      setRecurrenceDaysOfWeek([]);
      setRecurrenceDaysOfMonth([]);
      setRecurrenceInterval(7);
      setRecurrenceEndType('never');
      setRecurrenceEndDate('');
      setRecurrenceCount(10);
    }
  }, [isOpen, initialDate, initialTime, initialAllDay]);

  // Helper to add minutes to a time string
  function addMinutesToTime(time: string, minutesToAdd: number): string {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + minutesToAdd;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  }

  // Calculate duration in minutes between two time strings
  function getDurationMinutes(start: string, end: string): number {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    return endTotal - startTotal;
  }

  // Update end time when start time changes, maintaining the current duration
  const handleStartTimeChange = (newStartTime: string) => {
    // Calculate current duration (default to 60 minutes if no valid duration)
    const currentDuration = getDurationMinutes(startTime, endTime);
    const duration = currentDuration > 0 ? currentDuration : 60;

    setStartTime(newStartTime);
    setEndTime(addMinutesToTime(newStartTime, duration));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      // Build start datetime
      const startDate = new Date(dateStr + 'T00:00:00');
      if (!allDay) {
        const [hours, minutes] = startTime.split(':').map(Number);
        startDate.setHours(hours, minutes, 0, 0);
      } else {
        startDate.setHours(0, 0, 0, 0);
      }

      // Build end datetime
      let endDate: Date | null = null;
      if (!allDay) {
        endDate = new Date(dateStr + 'T00:00:00');
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        endDate.setHours(endHours, endMinutes, 0, 0);
      }

      const eventData: Parameters<typeof onSave>[0] = {
        title: title.trim(),
        description: description.trim(),
        startAt: startDate.toISOString(),
        endAt: endDate?.toISOString() || null,
        allDay,
        location: location.trim() || null,
        color,
      };

      if (recurrenceType !== 'none') {
        eventData.recurrence = {
          type: recurrenceType,
          daysOfWeek: recurrenceDaysOfWeek,
          daysOfMonth: recurrenceDaysOfMonth,
          intervalDays: recurrenceType === 'custom' ? recurrenceInterval : undefined,
          endDate: recurrenceEndType === 'until' && recurrenceEndDate ? new Date(recurrenceEndDate + 'T23:59:59').toISOString() : null,
          occurrenceCount: recurrenceEndType === 'count' ? recurrenceCount : null,
        };
      }

      await onSave(eventData);

      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setSaving(false);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const recurrenceUI = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '8px' }}>
      <div>
        <label style={{ display: 'block', fontSize: isMobile ? '14px' : '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
          Repeat
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={recurrenceType}
            onChange={(e) => setRecurrenceType(e.target.value)}
            style={{
              width: recurrenceType === 'none' ? '100%' : undefined,
              padding: isMobile ? '10px 12px' : '8px 10px',
              paddingRight: isMobile ? '2rem' : '2.5rem',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--panel-2)',
              color: 'var(--text)',
              fontSize: isMobile ? '14px' : '13px',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23adbac7' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: isMobile ? 'right 0.5rem center' : 'right 0.75rem center',
              backgroundSize: isMobile ? '12px 12px' : '14px 14px',
            }}
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>
          {recurrenceType !== 'none' && (
            <>
              <span style={{ fontSize: isMobile ? '13px' : '12px', fontWeight: 500, color: 'var(--text-muted)', flexShrink: 0 }}>Ends</span>
              <select
                value={recurrenceEndType}
                onChange={(e) => setRecurrenceEndType(e.target.value as any)}
                style={{
                  padding: isMobile ? '8px 10px' : '6px 8px',
                  paddingRight: isMobile ? '2rem' : '2.5rem',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--panel-2)',
                  color: 'var(--text)',
                  fontSize: isMobile ? '14px' : '13px',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23adbac7' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: isMobile ? 'right 0.5rem center' : 'right 0.75rem center',
                  backgroundSize: isMobile ? '12px 12px' : '14px 14px',
                }}
              >
                <option value="never">Never</option>
                <option value="until">Until date</option>
                <option value="count">After X times</option>
              </select>
              {recurrenceEndType === 'until' && (
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <CalendarPicker value={recurrenceEndDate} onChange={(d) => setRecurrenceEndDate(d)} />
                </div>
              )}
              {recurrenceEndType === 'count' && (
                <input
                  type="number"
                  min={1}
                  value={recurrenceCount}
                  onChange={(e) => setRecurrenceCount(parseInt(e.target.value) || 1)}
                  style={{
                    width: '80px',
                    padding: isMobile ? '8px 10px' : '6px 8px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    fontSize: isMobile ? '14px' : '13px',
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>

      {recurrenceType === 'weekly' && (
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '13px' : '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>Days of week</label>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {dayNames.map((name, idx) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setRecurrenceDaysOfWeek(prev =>
                    prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                  );
                }}
                style={{
                  padding: isMobile ? '6px 10px' : '4px 8px',
                  borderRadius: 'var(--radius-control)',
                  fontSize: isMobile ? '12px' : '11px',
                  fontWeight: 500,
                  border: '1px solid var(--border)',
                  backgroundColor: recurrenceDaysOfWeek.includes(idx) ? 'var(--accent)' : 'transparent',
                  color: recurrenceDaysOfWeek.includes(idx) ? 'var(--accent-text)' : 'var(--text)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {recurrenceType === 'biweekly' && (
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '13px' : '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>Days of week</label>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {dayNames.map((name, idx) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setRecurrenceDaysOfWeek(prev =>
                    prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                  );
                }}
                style={{
                  padding: isMobile ? '6px 10px' : '4px 8px',
                  borderRadius: 'var(--radius-control)',
                  fontSize: isMobile ? '12px' : '11px',
                  fontWeight: 500,
                  border: '1px solid var(--border)',
                  backgroundColor: recurrenceDaysOfWeek.includes(idx) ? 'var(--accent)' : 'transparent',
                  color: recurrenceDaysOfWeek.includes(idx) ? 'var(--accent-text)' : 'var(--text)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {recurrenceType === 'monthly' && (
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '13px' : '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>Day of month</label>
          <input
            type="number"
            min={1}
            max={31}
            value={recurrenceDaysOfMonth[0] || ''}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val >= 1 && val <= 31) setRecurrenceDaysOfMonth([val]);
            }}
            placeholder="e.g. 15"
            style={{
              width: '80px',
              padding: isMobile ? '8px 10px' : '6px 8px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--panel-2)',
              color: 'var(--text)',
              fontSize: isMobile ? '14px' : '13px',
            }}
          />
        </div>
      )}

      {recurrenceType === 'custom' && (
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '13px' : '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>Every X days</label>
          <input
            type="number"
            min={1}
            value={recurrenceInterval}
            onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
            style={{
              width: '80px',
              padding: isMobile ? '8px 10px' : '6px 8px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--panel-2)',
              color: 'var(--text)',
              fontSize: isMobile ? '14px' : '13px',
            }}
          />
        </div>
      )}

    </div>
  );

  const { visible, closing } = useAnimatedOpen(isOpen);
  if (!visible) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={closing ? previewStyles.backdropClosing : previewStyles.backdrop}
      style={{ zIndex: 9999, padding: isMobile ? '16px' : '24px' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${previewStyles.modal} ${isMobile ? previewStyles.modalNarrow : ''} ${closing ? previewStyles.modalClosing : ''}`}
        style={{ maxHeight: '90vh', overflow: 'auto', overscrollBehavior: 'contain', ...(!isMobile ? { maxWidth: '680px' } : {}) }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '16px 16px 10px' : '16px 20px 10px',
          }}
        >
          <h2 style={{ fontSize: isMobile ? '18px' : '16px', fontWeight: 600, color: 'var(--text)' }}>
            Add Event
          </h2>
          <button onClick={onClose} className={previewStyles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '16px' : '16px 20px' }}>
          {isMobile ? (
            /* Mobile: Single column with More Options collapsible */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input
                label="Event Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's happening?"
                required
                autoFocus
              />
              <CalendarPicker label="Date" value={dateStr} onChange={(d) => setDateStr(d)} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <span style={{ fontSize: '14px', color: 'var(--text)' }}>All day event</span>
              </label>
              {!allDay && (
                <>
                  <TimePicker label="Start Time" value={startTime} onChange={handleStartTimeChange} />
                  <TimePicker label="End Time" value={endTime} onChange={setEndTime} />
                </>
              )}
              <button
                type="button"
                onClick={() => setShowMore(!showMore)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', color: 'var(--text)', fontSize: '14px', fontWeight: 500 }}
              >
                <ChevronDown size={18} style={{ transform: showMore ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                More options
              </button>
              {showMore && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Input label="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where is it?" />
                  <Textarea label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add details..." />
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>Color</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {EVENT_COLORS.map((c) => (
                        <button key={c.value} type="button" onClick={() => setColor(c.value)} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c.value, border: color === c.value ? '3px solid var(--text)' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.1s' }} title={c.label} />
                      ))}
                    </div>
                  </div>
                  {recurrenceUI}
                </div>
              )}
            </div>
          ) : (
            /* Desktop: Two-column layout, all fields visible */
            <>
              <Input
                label="Event Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's happening?"
                required
                autoFocus
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <CalendarPicker label="Date" value={dateStr} onChange={(d) => setDateStr(d)} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text)' }}>All day event</span>
                  </label>
                  {!allDay && (
                    <>
                      <TimePicker label="Start Time" value={startTime} onChange={handleStartTimeChange} />
                      <TimePicker label="End Time" value={endTime} onChange={setEndTime} />
                    </>
                  )}
                </div>
                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recurrenceUI}
                  <Input label="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where is it?" />
                  <Textarea label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add details..." style={{ minHeight: '90px', height: '90px' }} />
                </div>
              </div>
              {/* Color - full width row */}
              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>Color</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {EVENT_COLORS.map((c) => (
                    <button key={c.value} type="button" onClick={() => setColor(c.value)} style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c.value, border: color === c.value ? '3px solid var(--text)' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.1s' }} title={c.label} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: isMobile ? '16px' : '14px' }}>
            <Button variant="secondary" type="button" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving || !title.trim()} style={{ flex: 1 }}>
              {saving ? 'Saving...' : 'Add Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
