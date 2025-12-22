'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import useAppStore from '@/lib/store';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
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
        colorTag: course.colorTag || '',
      });
    }
  }, [course]);

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
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div style={{ paddingTop: '12px' }}>
        <Input
          label="Term"
          type="text"
          value={form.term}
          onChange={(e) => setForm({ ...form, term: e.target.value })}
          placeholder="e.g., Winter 2026"
        />
      </div>

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

      <div style={{ paddingTop: '20px' }}>
        <label className="block text-lg font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Meeting Times</label>
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
                  newMeetingTimes[idx].start = time;
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

      <div style={{ paddingTop: '20px' }}>
        <label className="block text-lg font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Links</label>
        <div className="space-y-3">
          {form.links.map((link, idx) => (
            <div key={idx} className="flex gap-3 items-center">
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
        }} style={{ marginTop: '12px', paddingLeft: '16px', paddingRight: '16px' }}>
          <Plus size={16} />
          Add Link
        </Button>
      </div>

      {!hideSubmitButton && (
        <div className="flex gap-3" style={{ paddingTop: '20px' }}>
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
