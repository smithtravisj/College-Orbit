'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { isToday, formatDate } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Star, Trash2 } from 'lucide-react';

export default function TasksPage() {
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    dueAt: '',
    notes: '',
  });
  const [filter, setFilter] = useState('all');

  const { courses, tasks, addTask, deleteTask, toggleTaskDone, toggleTaskPin, initializeStore } = useAppStore();

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
    if (!formData.title.trim()) return;

    addTask({
      title: formData.title,
      courseId: formData.courseId || null,
      dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null,
      pinned: false,
      checklist: [],
      notes: formData.notes,
      status: 'open',
    });

    setFormData({ title: '', courseId: '', dueAt: '', notes: '' });
    setShowForm(false);
  };

  const filtered = tasks.filter((t) => {
    if (filter === 'today') return t.dueAt && isToday(t.dueAt) && t.status === 'open';
    if (filter === 'done') return t.status === 'done';
    return t.status === 'open';
  });

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Organize your work"
        actions={
          <Button variant="primary" size="md" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} />
            New Task
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
                  { value: 'all', label: 'All Tasks' },
                  { value: 'today', label: 'Today' },
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

          {/* Task list - 9 columns */}
          <div className="col-span-12 lg:col-span-9 space-y-6">

            {/* Add Task Form */}
            {showForm && (
            <Card>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Task title"
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
                    label="Due date (optional)"
                    type="datetime-local"
                    value={formData.dueAt}
                    onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                  />
                </div>
                <Textarea
                  label="Notes (optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                />
                <div className="flex gap-3 pt-4">
                  <Button variant="primary" type="submit">
                    Add Task
                  </Button>
                  <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Task List */}
          {filtered.length > 0 ? (
            <Card className="h-full">
              <div className="space-y-0 divide-y divide-[var(--border)]">
                {filtered.map((t) => {
                  const course = courses.find((c) => c.id === t.courseId);
                  return (
                    <div key={t.id} className="py-7 first:pt-0 last:pb-0 flex items-start gap-5 group hover:bg-[var(--panel-2)] -mx-6 px-6 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={t.status === 'done'}
                        onChange={() => toggleTaskDone(t.id)}
                        className="mt-1 w-5 h-5 accent-[var(--accent)] cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-medium ${
                            t.status === 'done' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'
                          }`}
                        >
                          {t.title}
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          {t.dueAt && (
                            <span className="text-xs text-[var(--text-muted)] bg-[var(--panel-2)] px-2 py-0.5 rounded">
                              {formatDate(t.dueAt)}
                            </span>
                          )}
                          {course && (
                            <span className="text-xs text-[var(--text-muted)] bg-[var(--panel-2)] px-2 py-0.5 rounded">
                              {course.code}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => toggleTaskPin(t.id)}
                          className={`p-1.5 rounded-[var(--radius-control)] transition-colors ${
                            t.pinned ? 'text-[var(--accent)] bg-[var(--accent-2)]' : 'text-[var(--muted)] hover:text-[var(--accent)] hover:bg-white/5'
                          }`}
                          title={t.pinned ? 'Unpin task' : 'Pin task'}
                        >
                          <Star size={18} fill={t.pinned ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this task?')) {
                              deleteTask(t.id);
                            }
                          }}
                          className="p-1.5 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <EmptyState
              title="No tasks"
              description={
                filter === 'all'
                  ? 'Create a new task to get started'
                  : filter === 'today'
                    ? 'No tasks due today'
                    : 'No completed tasks yet'
              }
              action={
                filter !== 'all'
                  ? { label: 'View all tasks', onClick: () => setFilter('all') }
                  : { label: 'Create a task', onClick: () => setShowForm(true) }
              }
            />
          )}
          </div>
        </div>
      </div>
    </>
  );
}
