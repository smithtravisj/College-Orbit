'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import useAppStore from '@/lib/store';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FileUpload from '@/components/ui/FileUpload';
import DaysDropdown from '@/components/DaysDropdown';
import TimePicker from '@/components/TimePicker';
import CalendarPicker from '@/components/CalendarPicker';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Plus, Trash2 } from 'lucide-react';

interface CourseFormProps {
  courseId?: string;
  onClose: () => void;
  hideSubmitButton?: boolean;
  onSave?: (data: any) => void;
}

const CourseFormComponent = forwardRef(function CourseForm(
  { courseId, onClose, hideSubmitButton = false, onSave }: CourseFormProps,
  ref: React.ForwardedRef<{ submit: () => void }>
) {
  const isMobile = useIsMobile();
  const { courses, settings, addCourse, updateCourse } = useAppStore();
  const course = courses.find((c) => c.id === courseId);
  const formRef = useRef<HTMLFormElement>(null);

  useImperativeHandle(ref, () => ({
    submit: () => {
      formRef.current?.requestSubmit();
    },
  }));

  const [form, setForm] = useState({
    code: '',
    name: '',
    term: '',
    startDate: '',
    endDate: '',
    meetingTimes: [{ days: ['Mon'], start: '', end: '', location: '' }],
    links: [{ label: '', url: '' }],
    files: [] as Array<{ name: string; url: string; size: number }>,
    colorTag: '',
  });

  useEffect(() => {
    if (course) {
      setForm({
        code: course.code,
        name: course.name,
        term: course.term,
        startDate: course.startDate ? course.startDate.split('T')[0] : '',
        endDate: course.endDate ? course.endDate.split('T')[0] : '',
        meetingTimes: course.meetingTimes || [{ days: ['Mon'], start: '', end: '', location: '' }],
        links: course.links || [{ label: '', url: '' }],
        files: course.files || [],
        colorTag: course.colorTag || '',
      });
    }
  }, [course]);

  // Helper to add minutes to a time string
  const addMinutesToTime = (time: string, minutesToAdd: number): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + minutesToAdd;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  // Calculate duration in minutes between two time strings
  const getDurationMinutes = (start: string, end: string): number => {
    if (!start || !end) return 60; // Default to 1 hour
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const duration = endTotal - startTotal;
    return duration > 0 ? duration : 60;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const courseData: any = {
      code: form.code,
      name: form.name,
      term: form.term,
      meetingTimes: form.meetingTimes.filter((mt) => mt.days && mt.days.length > 0 && mt.start && mt.end),
      links: form.links
        .filter((l) => l.label && l.url)
        .map((l) => ({
          ...l,
          url: l.url.startsWith('http://') || l.url.startsWith('https://')
            ? l.url
            : `https://${l.url}`,
        })),
      files: form.files,
      colorTag: form.colorTag,
    };

    if (form.startDate) {
      courseData.startDate = form.startDate;
    }
    if (form.endDate) {
      courseData.endDate = form.endDate;
    }

    if (onSave) {
      onSave(courseData);
    } else {
      if (courseId) {
        updateCourse(courseId, courseData);
      } else {
        addCourse(courseData);
      }
      onClose();
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={isMobile ? 'space-y-2' : 'space-y-5'}>
      {/* Code, Name row */}
      <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-3 gap-4'}>
        <Input
          label="Course Code"
          type="text"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="e.g., CHEM 101"
          required
        />
        <Input
          label="Course Name"
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g., Chemistry I"
          required
        />
        {!isMobile && (
          <Input
            label="Term"
            type="text"
            value={form.term}
            onChange={(e) => setForm({ ...form, term: e.target.value })}
            placeholder="e.g., Winter 2026"
          />
        )}
      </div>

      {/* Term and Start/End Date row - mobile */}
      {isMobile && (
        <div className="grid grid-cols-3 gap-2" style={{ overflow: 'visible', paddingTop: '8px' }}>
          <div>
            <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '6px' }}>Term</label>
            <input
              type="text"
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}
              placeholder="e.g., Win 26"
              style={{
                width: '100%',
                height: 'var(--input-height)',
                backgroundColor: 'var(--panel-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
                padding: '8px 10px',
                color: 'var(--text)',
                fontSize: '0.75rem',
              }}
            />
          </div>
          <CalendarPicker
            label="Start Date"
            value={form.startDate}
            onChange={(date) => setForm({ ...form, startDate: date })}
          />
          <CalendarPicker
            label="End Date"
            value={form.endDate}
            onChange={(date) => setForm({ ...form, endDate: date })}
          />
        </div>
      )}

      {/* Start/End Date row - desktop only */}
      {!isMobile && (
        <div className="grid grid-cols-2 gap-4" style={{ paddingTop: '12px' }}>
          <CalendarPicker
            label="Start Date"
            value={form.startDate}
            onChange={(date) => setForm({ ...form, startDate: date })}
          />
          <CalendarPicker
            label="End Date"
            value={form.endDate}
            onChange={(date) => setForm({ ...form, endDate: date })}
          />
        </div>
      )}

      <div style={{ paddingTop: isMobile ? '4px' : '12px' }}>
        <label className={isMobile ? 'block text-sm font-medium text-[var(--text)]' : 'block text-lg font-medium text-[var(--text)]'} style={{ marginBottom: '8px' }}>Meeting Times</label>
        <div className="space-y-2" style={{ overflow: 'visible' }}>
          {form.meetingTimes.map((mt, idx) => (
            <div key={idx} className={isMobile ? 'flex flex-wrap items-end' : 'flex items-center'} style={{ gap: isMobile ? '6px' : '4px', paddingBottom: '4px' }}>
              <DaysDropdown
                label={idx === 0 ? 'Days' : ''}
                value={mt.days}
                onChange={(days) => {
                  const newMeetingTimes = [...form.meetingTimes];
                  newMeetingTimes[idx].days = days;
                  setForm({ ...form, meetingTimes: newMeetingTimes });
                }}
              />
              <TimePicker
                label={idx === 0 ? 'Start' : ''}
                value={mt.start}
                onChange={(time) => {
                  const newMeetingTimes = [...form.meetingTimes];
                  const duration = getDurationMinutes(mt.start, mt.end);
                  newMeetingTimes[idx].start = time;
                  newMeetingTimes[idx].end = addMinutesToTime(time, duration);
                  setForm({ ...form, meetingTimes: newMeetingTimes });
                }}
              />
              <TimePicker
                label={idx === 0 ? 'End' : ''}
                value={mt.end}
                onChange={(time) => {
                  const newMeetingTimes = [...form.meetingTimes];
                  newMeetingTimes[idx].end = time;
                  setForm({ ...form, meetingTimes: newMeetingTimes });
                }}
              />
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                <Input
                  label={idx === 0 ? 'Location' : ''}
                  type="text"
                  value={mt.location}
                  onChange={(e) => {
                    const newMeetingTimes = [...form.meetingTimes];
                    newMeetingTimes[idx].location = e.target.value;
                    setForm({ ...form, meetingTimes: newMeetingTimes });
                  }}
                  placeholder="e.g., Room 101"
                  style={{ minWidth: '100px', maxWidth: '150px' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      ...form,
                      meetingTimes: form.meetingTimes.filter((_, i) => i !== idx),
                    });
                  }}
                  className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                  style={{ padding: '8px', marginBottom: idx === 0 ? '8px' : '0px', marginLeft: isMobile ? '0' : '-6px' }}
                  title="Remove meeting time"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="secondary" size="sm" type="button" onClick={() => {
          setForm({
            ...form,
            meetingTimes: [
              ...form.meetingTimes,
              { days: ['Mon'], start: '', end: '', location: '' },
            ],
          });
        }} style={{ marginTop: '12px', paddingLeft: '16px', paddingRight: '16px' }}>
          <Plus size={16} />
          Add Time
        </Button>
      </div>

      <div style={{ paddingTop: isMobile ? '4px' : '12px' }}>
        <label className={isMobile ? 'block text-sm font-medium text-[var(--text)]' : 'block text-lg font-medium text-[var(--text)]'} style={{ marginBottom: '8px' }}>Links</label>
        <div className="space-y-3">
          {form.links.map((link, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Input
                label={idx === 0 ? 'Label' : ''}
                type="text"
                value={link.label}
                onChange={(e) => {
                  const newLinks = [...form.links];
                  newLinks[idx].label = e.target.value;
                  setForm({ ...form, links: newLinks });
                }}
                placeholder="e.g., Canvas"
                className="w-32"
              />
              <Input
                label={idx === 0 ? 'URL' : ''}
                type="text"
                value={link.url}
                onChange={(e) => {
                  const newLinks = [...form.links];
                  newLinks[idx].url = e.target.value;
                  setForm({ ...form, links: newLinks });
                }}
                placeholder="example.com or https://..."
                className="flex-1"
              />
              <div>
                {idx === 0 && (
                  <label className="block text-sm font-medium text-[var(--text)] mb-2" style={{ height: '20px' }}></label>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      ...form,
                      links: form.links.filter((_, i) => i !== idx),
                    });
                  }}
                  className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                  style={{ padding: '8px', marginTop: isMobile ? '0' : '8px' }}
                  title="Remove link"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="secondary" size="sm" type="button" onClick={() => {
          setForm({
            ...form,
            links: [...form.links, { label: '', url: '' }],
          });
        }} style={{ marginTop: isMobile ? '4px' : '12px', marginBottom: isMobile ? '8px' : '16px', paddingLeft: '16px', paddingRight: '16px' }}>
          <Plus size={16} />
          Add Link
        </Button>
      </div>

      <div style={{ paddingTop: isMobile ? '4px' : '12px' }}>
        <label className={isMobile ? 'block text-sm font-medium text-[var(--text)]' : 'block text-lg font-medium text-[var(--text)]'} style={{ marginBottom: '8px' }}>Files</label>
        <FileUpload
          files={form.files}
          onChange={(files) => setForm({ ...form, files })}
        />
      </div>

      {!hideSubmitButton && (
        <div className="flex gap-3" style={{ paddingTop: isMobile ? '6px' : '8px' }}>
          <Button
            variant="primary"
            size="md"
            type="submit"
            style={{
              backgroundColor: 'var(--button-secondary)',
              color: settings.theme === 'light' ? '#000000' : 'white',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--border)',
              paddingLeft: '16px',
              paddingRight: '16px'
            }}
          >
            {courseId ? 'Update' : 'Add'} Course
          </Button>
          <Button variant="secondary" size="md" type="button" onClick={onClose}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
});

export default CourseFormComponent;
