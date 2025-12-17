'use client';

import { useState, useEffect } from 'react';
import useAppStore from '@/lib/store';
import Input, { Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

interface CourseFormProps {
  courseId?: string;
  onClose: () => void;
}

export default function CourseForm({ courseId, onClose }: CourseFormProps) {
  const { courses, addCourse, updateCourse } = useAppStore();
  const course = courses.find((c) => c.id === courseId);

  const [form, setForm] = useState({
    code: '',
    name: '',
    term: '',
    meetingTimes: [{ day: 'Mon', start: '10:00', end: '10:50', location: '' }],
    links: [{ label: '', url: '' }],
    colorTag: '',
  });

  useEffect(() => {
    if (course) {
      setForm({
        code: course.code,
        name: course.name,
        term: course.term,
        meetingTimes: course.meetingTimes || [{ day: 'Mon', start: '10:00', end: '10:50', location: '' }],
        links: course.links || [{ label: '', url: '' }],
        colorTag: course.colorTag || '',
      });
    }
  }, [course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const courseData = {
      code: form.code,
      name: form.name,
      term: form.term,
      meetingTimes: form.meetingTimes.filter((mt) => mt.location),
      links: form.links.filter((l) => l.label && l.url),
      colorTag: form.colorTag,
    };

    if (courseId) {
      updateCourse(courseId, courseData);
    } else {
      addCourse(courseData);
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Course Code *"
          type="text"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="e.g., CHEM 101"
          required
        />
        <Input
          label="Course Name *"
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

      <div style={{ paddingTop: '12px' }}>
        <label className="block text-base font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Meeting Times</label>
        <div className="space-y-3">
          {form.meetingTimes.map((mt, idx) => (
            <div key={idx} className="flex gap-3 items-end">
              <Select
                label={idx === 0 ? 'Day' : ''}
                value={mt.day}
                onChange={(e) => {
                  const newMeetingTimes = [...form.meetingTimes];
                  newMeetingTimes[idx].day = e.target.value;
                  setForm({ ...form, meetingTimes: newMeetingTimes });
                }}
                options={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => ({ value: d, label: d }))}
                className="w-24"
              />
              <Input
                label={idx === 0 ? 'Start' : ''}
                type="time"
                value={mt.start}
                onChange={(e) => {
                  const newMeetingTimes = [...form.meetingTimes];
                  newMeetingTimes[idx].start = e.target.value;
                  setForm({ ...form, meetingTimes: newMeetingTimes });
                }}
              />
              <Input
                label={idx === 0 ? 'End' : ''}
                type="time"
                value={mt.end}
                onChange={(e) => {
                  const newMeetingTimes = [...form.meetingTimes];
                  newMeetingTimes[idx].end = e.target.value;
                  setForm({ ...form, meetingTimes: newMeetingTimes });
                }}
              />
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
                className="flex-1"
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
                style={{ padding: '8px', marginBottom: 0 }}
                title="Remove meeting time"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        <Button variant="secondary" size="sm" type="button" onClick={() => {
          setForm({
            ...form,
            meetingTimes: [
              ...form.meetingTimes,
              { day: 'Mon', start: '10:00', end: '10:50', location: '' },
            ],
          });
        }} style={{ marginTop: '12px', paddingLeft: '16px', paddingRight: '16px' }}>
          <Plus size={16} />
          Add Time
        </Button>
      </div>

      <div style={{ paddingTop: '12px' }}>
        <label className="block text-base font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Links</label>
        <div className="space-y-3">
          {form.links.map((link, idx) => (
            <div key={idx} className="flex gap-3 items-end">
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
                type="url"
                value={link.url}
                onChange={(e) => {
                  const newLinks = [...form.links];
                  newLinks[idx].url = e.target.value;
                  setForm({ ...form, links: newLinks });
                }}
                placeholder="https://..."
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  setForm({
                    ...form,
                    links: form.links.filter((_, i) => i !== idx),
                  });
                }}
                className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                style={{ padding: '8px', marginBottom: 0 }}
                title="Remove link"
              >
                <Trash2 size={18} />
              </button>
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

      <div className="flex gap-3" style={{ paddingTop: '12px' }}>
        <Button
          variant="primary"
          size="md"
          type="submit"
          style={{
            backgroundColor: '#132343',
            color: 'white',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--border)'
          }}
        >
          {courseId ? 'Update' : 'Add'} Course
        </Button>
        <Button variant="secondary" size="md" type="button" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
