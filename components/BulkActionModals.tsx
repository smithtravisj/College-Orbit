'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import CalendarPicker from '@/components/CalendarPicker';
import TimePicker from '@/components/TimePicker';
import TagInput from '@/components/notes/TagInput';
import { Course } from '@/types';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
}

// Course Selection Modal
interface BulkChangeCourseModalProps extends BaseModalProps {
  courses: Course[];
  onConfirm: (courseId: string | null) => void;
}

export function BulkChangeCourseModal({
  isOpen,
  onClose,
  selectedCount,
  courses,
  onConfirm,
}: BulkChangeCourseModalProps) {
  const [courseId, setCourseId] = useState('');
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(courseId || null);
    setCourseId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-lg max-w-sm w-full">
        <div style={{ padding: '24px' }}>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Change Course</h2>
          <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
            Update course for {selectedCount} item{selectedCount !== 1 ? 's' : ''}
          </p>

          <Select
            label="Course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            options={[
              { value: '', label: 'No Course' },
              ...courses.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` })),
            ]}
          />

          <div className="flex gap-3 justify-end" style={{ marginTop: '24px' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              style={{
                backgroundColor: 'var(--button-secondary)',
                color: 'white',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border)',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tags Modal
interface BulkChangeTagsModalProps extends BaseModalProps {
  allTags: string[];
  onConfirm: (tags: string[], mode: 'add' | 'replace') => void;
}

export function BulkChangeTagsModal({
  isOpen,
  onClose,
  selectedCount,
  allTags,
  onConfirm,
}: BulkChangeTagsModalProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [mode, setMode] = useState<'add' | 'replace'>('add');
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(tags, mode);
    setTags([]);
    setMode('add');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-lg max-w-sm w-full">
        <div style={{ padding: '24px' }}>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Change Tags</h2>
          <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
            Update tags for {selectedCount} item{selectedCount !== 1 ? 's' : ''}
          </p>

          <div style={{ marginBottom: '16px' }}>
            <Select
              label="Mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as 'add' | 'replace')}
              options={[
                { value: 'add', label: 'Add to existing tags' },
                { value: 'replace', label: 'Replace all tags' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-4">Tags</label>
            <TagInput
              tags={tags}
              onTagsChange={setTags}
              allAvailableTags={allTags}
              placeholder="Add tags..."
            />
          </div>

          <div className="flex gap-3 justify-end" style={{ marginTop: '24px' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              style={{
                backgroundColor: 'var(--button-secondary)',
                color: 'white',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border)',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Priority/Importance/Effort Modal
interface BulkChangePriorityModalProps extends BaseModalProps {
  entityType: 'task' | 'deadline';
  onConfirm: (value: string | null) => void;
}

export function BulkChangePriorityModal({
  isOpen,
  onClose,
  selectedCount,
  entityType,
  onConfirm,
}: BulkChangePriorityModalProps) {
  const [value, setValue] = useState('');
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(value || null);
    setValue('');
    onClose();
  };

  const isTask = entityType === 'task';
  const label = isTask ? 'Importance' : 'Effort';
  const options = isTask
    ? [
        { value: '', label: 'None' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ]
    : [
        { value: '', label: 'None' },
        { value: 'large', label: 'Large' },
        { value: 'medium', label: 'Medium' },
        { value: 'small', label: 'Small' },
      ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-lg max-w-sm w-full">
        <div style={{ padding: '24px' }}>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Change {label}</h2>
          <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
            Update {label.toLowerCase()} for {selectedCount} item{selectedCount !== 1 ? 's' : ''}
          </p>

          <Select label={label} value={value} onChange={(e) => setValue(e.target.value)} options={options} />

          <div className="flex gap-3 justify-end" style={{ marginTop: '24px' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              style={{
                backgroundColor: 'var(--button-secondary)',
                color: 'white',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border)',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Date Modal
interface BulkChangeDateModalProps extends BaseModalProps {
  onConfirm: (date: string | null) => void;
}

export function BulkChangeDateModal({ isOpen, onClose, selectedCount, onConfirm }: BulkChangeDateModalProps) {
  const [date, setDate] = useState('');
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(date || null);
    setDate('');
    onClose();
  };

  const handleClear = () => {
    onConfirm(null);
    setDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4" style={{ overflow: 'visible' }}>
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-lg max-w-sm w-full" style={{ overflow: 'visible' }}>
        <div style={{ padding: '24px', overflow: 'visible' }}>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Change Date</h2>
          <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
            Update date for {selectedCount} item{selectedCount !== 1 ? 's' : ''}
          </p>

          <CalendarPicker label="Date" value={date} onChange={setDate} />

          <div className="flex gap-3 justify-end" style={{ marginTop: '24px' }}>
            <Button
              variant="ghost"
              size="md"
              onClick={handleClear}
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
            >
              Clear Date
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              disabled={!date}
              style={{
                backgroundColor: 'var(--button-secondary)',
                color: 'white',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border)',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Time Modal
interface BulkChangeTimeModalProps extends BaseModalProps {
  onConfirm: (time: string | null) => void;
}

export function BulkChangeTimeModal({ isOpen, onClose, selectedCount, onConfirm }: BulkChangeTimeModalProps) {
  const [time, setTime] = useState('');
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(time || null);
    setTime('');
    onClose();
  };

  const handleClear = () => {
    onConfirm(null);
    setTime('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-lg max-w-sm w-full">
        <div style={{ padding: '24px' }}>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Change Time</h2>
          <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
            Update time for {selectedCount} item{selectedCount !== 1 ? 's' : ''}
          </p>

          <TimePicker label="Time" value={time} onChange={setTime} />

          <div className="flex gap-3 justify-end" style={{ marginTop: '24px' }}>
            <Button
              variant="ghost"
              size="md"
              onClick={handleClear}
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
            >
              Clear Time
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              disabled={!time}
              style={{
                backgroundColor: 'var(--button-secondary)',
                color: 'white',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border)',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Link Modal
interface BulkAddLinkModalProps extends BaseModalProps {
  onConfirm: (link: { label: string; url: string }) => void;
}

export function BulkAddLinkModal({ isOpen, onClose, selectedCount, onConfirm }: BulkAddLinkModalProps) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    onConfirm({ label: label || new URL(finalUrl).hostname, url: finalUrl });
    setLabel('');
    setUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-lg max-w-sm w-full">
        <div style={{ padding: '24px' }}>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Add Link</h2>
          <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
            Add a link to {selectedCount} item{selectedCount !== 1 ? 's' : ''}
          </p>

          <div style={{ marginBottom: '12px' }}>
            <Input
              label="Label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Canvas"
            />
          </div>
          <Input
            label="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com or https://..."
          />

          <div className="flex gap-3 justify-end" style={{ marginTop: '24px' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              disabled={!url.trim()}
              style={{
                backgroundColor: 'var(--button-secondary)',
                color: 'white',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border)',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              Add Link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Location Modal (for exams)
interface BulkChangeLocationModalProps extends BaseModalProps {
  onConfirm: (location: string | null) => void;
}

export function BulkChangeLocationModal({
  isOpen,
  onClose,
  selectedCount,
  onConfirm,
}: BulkChangeLocationModalProps) {
  const [location, setLocation] = useState('');
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(location || null);
    setLocation('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-lg max-w-sm w-full">
        <div style={{ padding: '24px' }}>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Change Location</h2>
          <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
            Update location for {selectedCount} item{selectedCount !== 1 ? 's' : ''}
          </p>

          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Room 101"
          />

          <div className="flex gap-3 justify-end" style={{ marginTop: '24px' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              style={{
                backgroundColor: 'var(--button-secondary)',
                color: 'white',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border)',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Term Modal (for courses)
interface BulkChangeTermModalProps extends BaseModalProps {
  allTerms: string[];
  onConfirm: (term: string | null) => void;
}

export function BulkChangeTermModal({
  isOpen,
  onClose,
  selectedCount,
  allTerms,
  onConfirm,
}: BulkChangeTermModalProps) {
  const [term, setTerm] = useState('');
  const [customTerm, setCustomTerm] = useState('');
  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalTerm = term === '__custom__' ? customTerm : term;
    onConfirm(finalTerm || null);
    setTerm('');
    setCustomTerm('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-lg max-w-sm w-full">
        <div style={{ padding: '24px' }}>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Change Term</h2>
          <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
            Update term for {selectedCount} course{selectedCount !== 1 ? 's' : ''}
          </p>

          <Select
            label="Term"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            options={[
              { value: '', label: 'No Term' },
              ...allTerms.map((t) => ({ value: t, label: t })),
              { value: '__custom__', label: 'Custom...' },
            ]}
          />

          {term === '__custom__' && (
            <div style={{ marginTop: '12px' }}>
              <Input
                label="Custom Term"
                value={customTerm}
                onChange={(e) => setCustomTerm(e.target.value)}
                placeholder="e.g., Fall 2024"
              />
            </div>
          )}

          <div className="flex gap-3 justify-end" style={{ marginTop: '24px' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              style={{
                backgroundColor: 'var(--button-secondary)',
                color: 'white',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border)',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
interface BulkDeleteModalProps extends BaseModalProps {
  entityType: string;
  onConfirm: () => void;
}

export function BulkDeleteModal({
  isOpen,
  onClose,
  selectedCount,
  entityType,
  onConfirm,
}: BulkDeleteModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-lg max-w-sm w-full">
        <div style={{ padding: '24px' }}>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Delete {entityType}s</h2>
          <p className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '16px' }}>
            Are you sure you want to delete {selectedCount} {entityType}
            {selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
          </p>

          <div className="flex gap-3 justify-end" style={{ marginTop: '24px' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleConfirm}
              style={{
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
