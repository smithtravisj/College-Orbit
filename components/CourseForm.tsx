'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import useAppStore from '@/lib/store';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import DaysDropdown from '@/components/DaysDropdown';
import TimePicker from '@/components/TimePicker';
import CalendarPicker from '@/components/CalendarPicker';
import FilePreviewModal from '@/components/FilePreviewModal';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Plus, Trash2, Upload, X, FileIcon, ChevronDown } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [previewingFile, setPreviewingFile] = useState<{ file: { name: string; url: string; size: number }; allFiles: { name: string; url: string; size: number }[]; index: number } | null>(null);
  const [showMore, setShowMore] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.size > 10 * 1024 * 1024) continue; // 10MB limit

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      try {
        const response = await fetch('/api/files', {
          method: 'POST',
          body: formDataUpload,
        });
        if (response.ok) {
          const data = await response.json();
          setForm(prev => ({ ...prev, files: [...(prev.files || []), data.file] }));
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    <form ref={formRef} onSubmit={handleSubmit} className={isMobile ? 'space-y-2' : 'space-y-4'}>
      {/* Code, Name row - Always visible */}
      <div className="grid grid-cols-2 gap-3">
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

      {/* Term */}
      <div style={{ paddingTop: isMobile ? '8px' : '12px' }}>
        <Input
          label="Term"
          type="text"
          value={form.term}
          onChange={(e) => setForm({ ...form, term: e.target.value })}
          placeholder="e.g., Winter 2026"
        />
      </div>

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
        <div className={isMobile ? 'space-y-2' : 'space-y-4'}>
          {/* Start/End Date row */}
          <div className="grid grid-cols-2 gap-3" style={{ overflow: 'visible' }}>
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

          <div style={{ paddingTop: isMobile ? '12px' : '16px' }}>
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

          <div style={{ paddingTop: isMobile ? '12px' : '16px' }}>
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

          {/* File list display */}
          {form.files && form.files.length > 0 && (
            <div style={{ paddingTop: isMobile ? '4px' : '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {form.files.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: isMobile ? '4px 8px' : '6px 10px',
                    backgroundColor: 'var(--panel-2)',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--border)',
                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPreviewingFile({ file, allFiles: form.files, index })}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}
                    title="Preview file"
                  >
                    <FileIcon size={14} />
                  </button>
                  <input
                    type="text"
                    value={file.name}
                    onChange={(e) => {
                      const newFiles = [...form.files];
                      newFiles[index] = { ...newFiles[index], name: e.target.value };
                      setForm({ ...form, files: newFiles });
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--text)',
                      fontSize: 'inherit',
                      padding: 0,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, files: form.files.filter((_, i) => i !== index) })}
                    style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!hideSubmitButton && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: isMobile ? '6px' : '8px' }}>
          <div className="flex gap-3">
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
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <Button variant="secondary" size="md" type="button" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />
            Add Files
          </Button>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewingFile?.file ?? null}
        files={previewingFile?.allFiles}
        currentIndex={previewingFile?.index ?? 0}
        onClose={() => setPreviewingFile(null)}
        onNavigate={(file, index) => setPreviewingFile(prev => prev ? { ...prev, file, index } : null)}
      />
    </form>
  );
});

export default CourseFormComponent;
