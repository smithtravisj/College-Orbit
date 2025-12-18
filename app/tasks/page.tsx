'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { isToday, formatDate, isOverdue } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import CalendarPicker from '@/components/CalendarPicker';
import TimePicker from '@/components/TimePicker';

export default function TasksPage() {
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hidingTasks, setHidingTasks] = useState<Set<string>>(new Set());
  const [toggledTasks, setToggledTasks] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    dueDate: '',
    dueTime: '',
    notes: '',
    links: [{ label: '', url: '' }],
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

    let dueAt: string | null = null;
    // Only set dueAt if we have a valid date string (not empty, not null, not whitespace)
    if (formData.dueDate && formData.dueDate.trim()) {
      try {
        // If date is provided but time is not, default to 11:59 PM
        const dateTimeString = formData.dueTime ? `${formData.dueDate}T${formData.dueTime}` : `${formData.dueDate}T23:59`;
        const dateObj = new Date(dateTimeString);
        // Verify it's a valid date and not the epoch
        if (dateObj.getTime() > 0) {
          dueAt = dateObj.toISOString();
        }
      } catch (err) {
        // If date parsing fails, leave dueAt as null
        console.error('Date parsing error:', err);
      }
    } else {
      // If time is provided but date is not, ignore the time
      formData.dueTime = '';
    }

    // Handle links - normalize and add https:// if needed
    const links = formData.links
      .filter((l) => l.url && l.url.trim())
      .map((l) => ({
        label: l.label,
        url: l.url.startsWith('http://') || l.url.startsWith('https://')
          ? l.url
          : `https://${l.url}`
      }));

    if (editingId) {
      await updateTask(editingId, {
        title: formData.title,
        courseId: formData.courseId || null,
        dueAt,
        notes: formData.notes,
        links,
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
        links,
        status: 'open',
      });
    }

    setFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '', links: [{ label: '', url: '' }] });
    setShowForm(false);
  };

  const startEdit = (task: any) => {
    setEditingId(task.id);
    const dueDate = task.dueAt ? new Date(task.dueAt) : null;
    let dateStr = '';
    let timeStr = '';
    if (dueDate) {
      const year = dueDate.getFullYear();
      const month = String(dueDate.getMonth() + 1).padStart(2, '0');
      const date = String(dueDate.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${date}`;
      timeStr = `${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}`;
    }
    setFormData({
      title: task.title,
      courseId: task.courseId || '',
      dueDate: dateStr,
      dueTime: timeStr,
      notes: task.notes,
      links: task.links && task.links.length > 0 ? task.links : [{ label: '', url: '' }],
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '', links: [{ label: '', url: '' }] });
    setShowForm(false);
  };

  const filtered = tasks
    .filter((t) => {
      // Always include toggled tasks (keep them visible after status change)
      if (toggledTasks.has(t.id)) {
        return true;
      }

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
          <Button variant="secondary" size="md" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} />
            New Task
          </Button>
        }
      />
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: '24px', overflow: 'visible' }}>
        <div className="grid grid-cols-12 gap-[var(--grid-gap)]" style={{ overflow: 'visible' }}>
          {/* Filters sidebar - 3 columns */}
          <div className="col-span-12 lg:col-span-3" style={{ height: 'fit-content' }}>
            <Card>
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
          <div className="col-span-12 lg:col-span-9 space-y-6" style={{ overflow: 'visible' }}>

            {/* Add Task Form */}
            {showForm && (
            <div style={{ marginBottom: '24px', overflow: 'visible' }}>
              <Card>
                <form onSubmit={handleSubmit} className="space-y-5" style={{ overflow: 'visible' }}>
                <Input
                  label="Task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What needs to be done?"
                  required
                />
                <div style={{ paddingTop: '12px' }}>
                  <Select
                    label="Course (optional)"
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    options={[{ value: '', label: 'No Course' }, ...courses.map((c) => ({ value: c.id, label: c.name }))]}
                  />
                </div>
                <div style={{ paddingTop: '12px' }}>
                  <Textarea
                    label="Notes (optional)"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any additional notes..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4" style={{ overflow: 'visible' }}>
                  <CalendarPicker
                    label="Due Date (optional)"
                    value={formData.dueDate}
                    onChange={(date) => setFormData({ ...formData, dueDate: date })}
                  />
                  <TimePicker
                    label="Due Time (optional)"
                    value={formData.dueTime}
                    onChange={(time) => setFormData({ ...formData, dueTime: time })}
                  />
                </div>
                <div style={{ paddingTop: '20px' }}>
                  <label className="block text-lg font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>Links (optional)</label>
                  <div className="space-y-3">
                    {formData.links.map((link, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <Input
                          label={idx === 0 ? 'Label' : ''}
                          type="text"
                          value={link.label}
                          onChange={(e) => {
                            const newLinks = [...formData.links];
                            newLinks[idx].label = e.target.value;
                            setFormData({ ...formData, links: newLinks });
                          }}
                          placeholder="e.g., Canvas"
                          className="w-32"
                        />
                        <Input
                          label={idx === 0 ? 'URL' : ''}
                          type="text"
                          value={link.url}
                          onChange={(e) => {
                            const newLinks = [...formData.links];
                            newLinks[idx].url = e.target.value;
                            setFormData({ ...formData, links: newLinks });
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
                              setFormData({
                                ...formData,
                                links: formData.links.filter((_, i) => i !== idx),
                              });
                            }}
                            className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                            style={{ padding: '8px' }}
                            title="Remove link"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" size="sm" type="button" onClick={() => {
                    setFormData({
                      ...formData,
                      links: [...formData.links, { label: '', url: '' }],
                    });
                  }} style={{ marginTop: '12px', paddingLeft: '16px', paddingRight: '16px' }}>
                    <Plus size={16} />
                    Add Link
                  </Button>
                </div>
                <div className="flex gap-3" style={{ paddingTop: '12px' }}>
                  <Button
                    variant="primary"
                    type="submit"
                    style={{
                      backgroundColor: '#132343',
                      color: 'white',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: 'var(--border)',
                      paddingLeft: '16px',
                      paddingRight: '16px'
                    }}
                  >
                    {editingId ? 'Save Changes' : 'Add Task'}
                  </Button>
                  <Button variant="secondary" type="button" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </form>
              </Card>
            </div>
          )}

          {/* Task List */}
          {filtered.length > 0 ? (
            <Card className="h-full">
              <div className="space-y-4 divide-y divide-[var(--border)]">
                {filtered.map((t) => {
                  const course = courses.find((c) => c.id === t.courseId);
                  const dueHours = t.dueAt ? new Date(t.dueAt).getHours() : null;
                  const dueMinutes = t.dueAt ? new Date(t.dueAt).getMinutes() : null;
                  const dueTime = t.dueAt ? new Date(t.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
                  const isOverdueTask = t.dueAt && isOverdue(t.dueAt) && t.status === 'open';
                  const shouldShowTime = dueTime && !(dueHours === 23 && dueMinutes === 59);
                  return (
                    <div key={t.id} style={{ paddingTop: '10px', paddingBottom: '10px', opacity: hidingTasks.has(t.id) ? 0.5 : 1, transition: 'opacity 0.3s ease' }} className="first:pt-0 last:pb-0 flex items-center gap-4 group hover:bg-[var(--panel-2)] -mx-6 px-6 rounded transition-colors border-b border-[var(--border)] last:border-b-0">
                      <input
                        type="checkbox"
                        checked={t.status === 'done'}
                        onChange={() => {
                          const isCurrentlyDone = t.status === 'done';
                          setToggledTasks(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(t.id)) {
                              newSet.delete(t.id);
                            } else {
                              newSet.add(t.id);
                            }
                            return newSet;
                          });
                          toggleTaskDone(t.id);
                          // Only fade out when marking as done, not when unchecking
                          if (!isCurrentlyDone) {
                            setTimeout(() => {
                              setHidingTasks(prev => new Set(prev).add(t.id));
                            }, 50);
                          } else {
                            // Remove from hiding when unchecking
                            setHidingTasks(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(t.id);
                              return newSet;
                            });
                          }
                        }}
                        style={{
                          appearance: 'none',
                          width: '20px',
                          height: '20px',
                          border: t.status === 'done' ? 'none' : '2px solid var(--border)',
                          borderRadius: '4px',
                          backgroundColor: t.status === 'done' ? '#132343' : 'transparent',
                          cursor: 'pointer',
                          flexShrink: 0,
                          backgroundImage: t.status === 'done' ? 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22white%22%3E%3Cpath fill-rule=%22evenodd%22 d=%22M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z%22 clip-rule=%22evenodd%22 /%3E%3C/svg%3E")' : 'none',
                          backgroundSize: '100%',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          transition: 'all 0.3s ease'
                        }}
                        title={t.status === 'done' ? 'Mark as incomplete' : 'Mark as complete'}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-sm font-medium ${
                              t.status === 'done' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'
                            }`}
                          >
                            {t.title}
                          </div>
                          {isOverdueTask && <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: '600', color: 'var(--danger)', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap' }}>Overdue</span>}
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
                        {t.links && t.links.length > 0 && (
                          <div className="flex flex-col gap-1 mt-2">
                            {t.links.map((link: any) => (
                              <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] bg-[var(--panel-2)] px-2 py-0.5 rounded"
                              >
                                {link.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => startEdit(t)}
                          className="p-1.5 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--accent)] hover:bg-white/5 transition-colors -ml-2"
                          title="Edit task"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="p-1.5 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 size={20} />
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
