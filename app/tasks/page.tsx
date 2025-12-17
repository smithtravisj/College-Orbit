'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { isToday, formatDate, isOverdue } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function TasksPage() {
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    dueDate: '',
    dueTime: '',
    notes: '',
  });
  const [filter, setFilter] = useState('all');

  const { courses, tasks, addTask, updateTask, deleteTask, toggleTaskDone, initializeStore } = useAppStore();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    let dueAt = null;
    if (formData.dueDate) {
      const dateTimeString = formData.dueTime ? `${formData.dueDate}T${formData.dueTime}` : `${formData.dueDate}T23:59`;
      dueAt = new Date(dateTimeString).toISOString();
    }

    if (editingId) {
      await updateTask(editingId, {
        title: formData.title,
        courseId: formData.courseId || null,
        dueAt,
        notes: formData.notes,
      });
      setEditingId(null);
    } else {
      await addTask({
        title: formData.title,
        courseId: formData.courseId || null,
        dueAt,
        pinned: false,
        checklist: [],
        notes: formData.notes,
        status: 'open',
      });
    }

    setFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '' });
    setShowForm(false);
  };

  const startEdit = (task: any) => {
    setEditingId(task.id);
    setFormData({
      title: task.title,
      courseId: task.courseId || '',
      dueDate: task.dueAt ? new Date(task.dueAt).toISOString().split('T')[0] : '',
      dueTime: task.dueAt ? new Date(task.dueAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
      notes: task.notes,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '' });
    setShowForm(false);
  };

  const filtered = tasks
    .filter((t) => {
      if (filter === 'today') return t.dueAt && isToday(t.dueAt) && t.status === 'open';
      if (filter === 'done') return t.status === 'done';
      if (filter === 'overdue') {
        return t.dueAt && new Date(t.dueAt) < new Date() && t.status === 'open';
      }
      return t.status === 'open';
    })
    .sort((a, b) => {
      // Sort by due date first
      const aHasDue = !!a.dueAt;
      const bHasDue = !!b.dueAt;

      if (aHasDue && bHasDue) {
        return new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime();
      }

      if (aHasDue && !bHasDue) return -1; // Tasks with dates come first
      if (!aHasDue && bHasDue) return 1; // Tasks without dates come last

      // Both don't have due dates, sort alphabetically
      return a.title.localeCompare(b.title);
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
              <h3 className="text-sm font-semibold text-[var(--text)]" style={{ marginBottom: '16px' }}>Filters</h3>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Tasks' },
                  { value: 'today', label: 'Today' },
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

          {/* Task list - 9 columns */}
          <div className="col-span-12 lg:col-span-9 space-y-6">

            {/* Add Task Form */}
            {showForm && (
            <Card>
              <form onSubmit={handleSubmit} className="space-y-5" style={{ paddingBottom: '20px' }}>
                <Input
                  label="Task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What needs to be done?"
                  required
                />
                <Select
                  label="Course (optional)"
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  options={[{ value: '', label: 'No Course' }, ...courses.map((c) => ({ value: c.id, label: c.code }))]}
                />
                <Textarea
                  label="Notes (optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Due date (optional)"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                  <Input
                    label="Due time (optional)"
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="primary" type="submit">
                    {editingId ? 'Save Changes' : 'Add Task'}
                  </Button>
                  <Button variant="secondary" type="button" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Task List */}
          {filtered.length > 0 ? (
            <Card className="h-full">
              <div className="space-y-4 divide-y divide-[var(--border)]">
                {filtered.map((t) => {
                  const course = courses.find((c) => c.id === t.courseId);
                  const dueTime = t.dueAt ? new Date(t.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
                  const isOverdueTask = t.dueAt && isOverdue(t.dueAt) && t.status === 'open';
                  const shouldShowTime = dueTime && !dueTime.startsWith('23:59');
                  return (
                    <div key={t.id} className="py-5 pb-6 first:pt-0 last:pb-0 flex items-center gap-4 group hover:bg-[var(--panel-2)] -mx-6 px-6 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={t.status === 'done'}
                        onChange={() => toggleTaskDone(t.id)}
                        className="w-5 h-5 cursor-pointer flex-shrink-0 appearance-none border-2 border-[var(--border)] rounded-sm checked:bg-[var(--accent)] checked:border-[var(--accent)] transition-colors"
                        title={t.status === 'done' ? 'Mark as incomplete' : 'Mark as complete'}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div
                            className={`text-sm font-medium ${
                              t.status === 'done' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'
                            }`}
                          >
                            {t.title}
                          </div>
                          {isOverdueTask && <Badge variant="danger">Overdue</Badge>}
                        </div>
                        {t.notes && (
                          <div className="text-xs text-[var(--text-muted)] mt-1">
                            {t.notes}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {t.dueAt && (
                            <span className="text-xs text-[var(--text-muted)] bg-[var(--panel-2)] px-2 py-0.5 rounded">
                              {formatDate(t.dueAt)} {shouldShowTime && `at ${dueTime}`}
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
                          onClick={() => startEdit(t)}
                          className="p-1.5 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--accent)] hover:bg-white/5 transition-colors"
                          title="Edit task"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteTask(t.id)}
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
