'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { formatDateTime, isOverdue } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select, Textarea } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Trash2 } from 'lucide-react';

export default function DeadlinesPage() {
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    dueAt: '',
    notes: '',
    link: '',
  });
  const [filter, setFilter] = useState('all');

  const { courses, deadlines, addDeadline, deleteDeadline, initializeStore } = useAppStore();

  useEffect(() => {
    initializeStore();
    setMounted(true);
  }, [initializeStore]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.dueAt) return;

    addDeadline({
      title: formData.title,
      courseId: formData.courseId || null,
      dueAt: new Date(formData.dueAt).toISOString(),
      notes: formData.notes,
      link: formData.link || null,
      status: 'open',
    });

    setFormData({ title: '', courseId: '', dueAt: '', notes: '', link: '' });
    setShowForm(false);
  };

  const filtered = deadlines.filter((d) => {
    if (filter === 'overdue') return isOverdue(d.dueAt) && d.status === 'open';
    if (filter === 'done') return d.status === 'done';
    return d.status === 'open';
  });

  return (
    <>
      <PageHeader
        title="Deadlines"
        subtitle="Track your assignments and exams"
        actions={
          <Button variant="primary" size="md" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} />
            New Deadline
          </Button>
        }
      />
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: '24px' }}>
        <div className="grid grid-cols-12 gap-[var(--grid-gap)]">
          {/* Filters sidebar - 3 columns */}
          <div className="col-span-12 lg:col-span-3">
            <Card className="h-full">
              <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Filters</h3>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'overdue', label: 'Overdue' },
                  { value: 'done', label: 'Completed' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`w-full text-left rounded-[var(--radius-control)] text-sm font-medium transition-colors ${
                      filter === f.value
                        ? 'bg-[var(--accent-2)] text-[var(--text)]'
                        : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5'
                    }`}
                    style={{ padding: '12px 16px' }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Deadlines list - 9 columns */}
          <div className="col-span-12 lg:col-span-9 space-y-6">

            {/* Add Deadline Form */}
            {showForm && (
            <Card>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Deadline title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What needs to be done?"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Course (optional)"
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    options={[{ value: '', label: 'No Course' }, ...courses.map((c) => ({ value: c.id, label: c.code }))]}
                  />
                  <Input
                    label="Due date"
                    type="datetime-local"
                    value={formData.dueAt}
                    onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                    required
                  />
                </div>
                <Textarea
                  label="Notes (optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add details..."
                />
                <Input
                  label="Link (optional)"
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://..."
                />
                <div className="flex gap-3 pt-4">
                  <Button variant="primary" type="submit">
                    Add Deadline
                  </Button>
                  <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Deadlines List */}
          {filtered.length > 0 ? (
            <Card className="h-full">
              <div className="space-y-0 divide-y divide-[var(--border)]">
                {filtered.map((d) => {
                  const course = courses.find((c) => c.id === d.courseId);
                  const isOverd = isOverdue(d.dueAt);
                  return (
                    <div key={d.id} className="py-7 first:pt-0 last:pb-0 flex items-start justify-between group hover:bg-[var(--panel-2)] -mx-6 px-6 rounded transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          {isOverd && <Badge variant="danger">Overdue</Badge>}
                          <div className="text-sm font-medium text-[var(--text)]">{d.title}</div>
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">{formatDateTime(d.dueAt)}</div>
                        {course && (
                          <span className="inline-block text-xs text-[var(--text-muted)] bg-[var(--panel-2)] px-2 py-0.5 rounded mt-1">
                            {course.code}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Delete this deadline?')) {
                            deleteDeadline(d.id);
                          }
                        }}
                        className="p-1.5 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 flex-shrink-0 ml-2"
                        title="Delete deadline"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <EmptyState
              title="No deadlines"
              description={
                filter === 'all'
                  ? 'Create a new deadline to get started'
                  : filter === 'overdue'
                    ? 'No overdue deadlines'
                    : 'No completed deadlines'
              }
              action={
                filter !== 'all'
                  ? { label: 'View all deadlines', onClick: () => setFilter('all') }
                  : { label: 'Create a deadline', onClick: () => setShowForm(true) }
              }
            />
          )}
          </div>
        </div>
      </div>
    </>
  );
}
