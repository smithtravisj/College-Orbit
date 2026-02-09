'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import CalendarPicker from '@/components/CalendarPicker';
import TimePicker from '@/components/TimePicker';
import { X, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';

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
  }) => Promise<void>;
  initialDate?: Date;
  initialTime?: string;
  initialAllDay?: boolean;
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
      setEndTime(initialTime ? addHour(initialTime) : '10:00');
      setAllDay(initialAllDay);
      setLocation('');
      setColor('#a855f7');
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

      await onSave({
        title: title.trim(),
        description: description.trim(),
        startAt: startDate.toISOString(),
        endAt: endDate?.toISOString() || null,
        allDay,
        location: location.trim() || null,
        color,
      });

      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: isMobile ? '16px' : '24px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--panel-solid, var(--panel))',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '16px' : '12px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ fontSize: isMobile ? '18px' : '16px', fontWeight: 600, color: 'var(--text)' }}>
            Add Event
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--text-muted)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '16px' : '16px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '10px' }}>
            <Input
              label="Event Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's happening?"
              required
              autoFocus
            />

            {/* Date */}
            <CalendarPicker
              label="Date"
              value={dateStr}
              onChange={(d) => setDateStr(d)}
            />

            {/* Time Pickers (only if not all day) */}
            {!allDay && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <TimePicker label="Start Time" value={startTime} onChange={handleStartTimeChange} />
                <TimePicker label="End Time" value={endTime} onChange={setEndTime} />
              </div>
            )}

            {/* More Options Toggle */}
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                padding: '10px 0',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: isMobile ? '14px' : '14px',
                fontWeight: 500,
              }}
            >
              <ChevronDown
                size={18}
                style={{
                  transform: showMore ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
              More options
            </button>

            {/* More Options Section */}
            {showMore && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '10px' }}>
                {/* All Day Toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                    style={{ width: isMobile ? '18px' : '16px', height: isMobile ? '18px' : '16px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: isMobile ? '14px' : '13px', color: 'var(--text)' }}>All day event</span>
                </label>

                <Input
                  label="Location (optional)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where is it?"
                />

                <Textarea
                  label="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details..."
                  style={!isMobile ? { minHeight: '60px', height: '60px' } : undefined}
                />

                {/* Color Picker */}
                <div>
                  <label style={{ display: 'block', fontSize: isMobile ? '14px' : '13px', fontWeight: 500, color: 'var(--text)', marginBottom: isMobile ? '8px' : '6px' }}>
                    Color
                  </label>
                  <div style={{ display: 'flex', gap: isMobile ? '6px' : '6px', flexWrap: 'wrap' }}>
                    {EVENT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setColor(c.value)}
                        style={{
                          width: isMobile ? '28px' : '24px',
                          height: isMobile ? '28px' : '24px',
                          borderRadius: '50%',
                          backgroundColor: c.value,
                          border: color === c.value ? '3px solid var(--text)' : '2px solid transparent',
                          cursor: 'pointer',
                          transition: 'transform 0.1s',
                        }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: isMobile ? '16px' : '14px' }}>
            <Button variant="primary" type="submit" disabled={saving || !title.trim()}>
              {saving ? 'Saving...' : 'Add Event'}
            </Button>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
