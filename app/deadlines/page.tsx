'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { formatDate, isOverdue, extractDomain } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function DeadlinesPage() {
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hidingDeadlines, setHidingDeadlines] = useState<Set<string>>(new Set());
  const [toggledDeadlines, setToggledDeadlines] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    dueDate: '',
    dueTime: '',
    notes: '',
    link: '',
  });
  const [filter, setFilter] = useState('all');

  const { courses, deadlines, addDeadline, updateDeadline, deleteDeadline, initializeStore } = useAppStore();

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

    console.log('[Deadlines] Form submission started');
    console.log('[Deadlines] Form data:', JSON.stringify(formData, null, 2));

    let dueAt: string | null = null;
    // Only set dueAt if we have a valid date string (not empty, not null, not whitespace)
    if (formData.dueDate && formData.dueDate.trim()) {
      try {
        // If date is provided but time is not, default to 11:59 PM
        const dateTimeString = formData.dueTime ? `${formData.dueDate}T${formData.dueTime}` : `${formData.dueDate}T23:59`;
        console.log('[Deadlines] Date time string:', dateTimeString);
        const dateObj = new Date(dateTimeString);
        console.log('[Deadlines] Parsed date:', dateObj.toISOString(), 'getTime():', dateObj.getTime());
        // Verify it's a valid date and not the epoch
        if (dateObj.getTime() > 0) {
          dueAt = dateObj.toISOString();
          console.log('[Deadlines] Valid dueAt set to:', dueAt);
        } else {
          console.log('[Deadlines] Date getTime() <= 0, rejecting');
        }
      } catch (err) {
        // If date parsing fails, leave dueAt as null
        console.error('[Deadlines] Date parsing error:', err);
      }
    } else {
      // If time is provided but date is not, ignore the time
      console.log('[Deadlines] No date provided, dueAt will be null');
      formData.dueTime = '';
    }

    console.log('[Deadlines] Final dueAt before API call:', dueAt);

    // Handle link - normalize empty string to null
    const link = formData.link?.trim() ? (
      formData.link.startsWith('http://') || formData.link.startsWith('https://')
        ? formData.link
        : `https://${formData.link}`
    ) : null;

    const payload = {
      title: formData.title,
      courseId: formData.courseId || null,
      dueAt,
      notes: formData.notes,
      link,
      status: 'open' as const,
    };

    console.log('[Deadlines] Payload being sent:', JSON.stringify(payload, null, 2));

    if (editingId) {
      console.log('[Deadlines] Updating deadline:', editingId);
      await updateDeadline(editingId, {
        title: formData.title,
        courseId: formData.courseId || null,
        dueAt,
        notes: formData.notes,
        link,
      });
      setEditingId(null);
    } else {
      console.log('[Deadlines] Creating new deadline');
      await addDeadline(payload);
    }

    setFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '', link: '' });
    setShowForm(false);
  };

  const startEdit = (deadline: any) => {
    setEditingId(deadline.id);
    const dueDate = deadline.dueAt ? new Date(deadline.dueAt) : null;
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
      title: deadline.title,
      courseId: deadline.courseId || '',
      dueDate: dateStr,
      dueTime: timeStr,
      notes: deadline.notes,
      link: deadline.link || '',
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '', link: '' });
    setShowForm(false);
  };

  const filtered = deadlines
    .filter((d) => {
      // Always include toggled deadlines (keep them visible after status change)
      if (toggledDeadlines.has(d.id)) {
        return true;
      }

      if (filter === 'overdue') return d.dueAt && isOverdue(d.dueAt) && d.status === 'open';
      if (filter === 'done') return d.status === 'done';
      return d.status === 'open';
    })
    .sort((a, b) => {
      // Sort by due date first
      const aHasDue = !!a.dueAt;
      const bHasDue = !!b.dueAt;

      if (aHasDue && bHasDue) {
        return new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime();
      }

      if (aHasDue && !bHasDue) return -1; // Deadlines with dates come first
      if (!aHasDue && bHasDue) return 1; // Deadlines without dates come last

      // Both don't have due dates, sort alphabetically
      return a.title.localeCompare(b.title);
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
          <div className="col-span-12 lg:col-span-3" style={{ height: 'fit-content' }}>
            <Card>
              <h3 className="text-sm font-semibold text-[var(--text)]" style={{ marginBottom: '16px' }}>Filters</h3>
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
            <div style={{ marginBottom: '24px' }}>
              <Card>
                <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Deadline title"
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
                  placeholder="Add details..."
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
                <Input
                  label="Link (optional)"
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="example.com or https://..."
                />
                <div className="flex gap-3" style={{ paddingTop: '12px' }}>
                  <Button variant="primary" type="submit">
                    {editingId ? 'Save Changes' : 'Add Deadline'}
                  </Button>
                  <Button variant="secondary" type="button" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </form>
              </Card>
            </div>
          )}

          {/* Deadlines List */}
          {filtered.length > 0 ? (
            <Card className="h-full">
              <div className="space-y-4 divide-y divide-[var(--border)]">
                {filtered.map((d) => {
                  const course = courses.find((c) => c.id === d.courseId);
                  const dueHours = d.dueAt ? new Date(d.dueAt).getHours() : null;
                  const dueMinutes = d.dueAt ? new Date(d.dueAt).getMinutes() : null;
                  const dueTime = d.dueAt ? new Date(d.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
                  const isOverdueDeadline = d.dueAt && isOverdue(d.dueAt) && d.status === 'open';
                  const shouldShowTime = dueTime && !(dueHours === 23 && dueMinutes === 59);
                  return (
                    <div key={d.id} style={{ paddingTop: '10px', paddingBottom: '10px', opacity: hidingDeadlines.has(d.id) ? 0.5 : 1, transition: 'opacity 0.3s ease' }} className="first:pt-0 last:pb-0 flex items-center gap-4 group hover:bg-[var(--panel-2)] -mx-6 px-6 rounded transition-colors border-b border-[var(--border)] last:border-b-0">
                      <input
                        type="checkbox"
                        checked={d.status === 'done'}
                        onChange={() => {
                          const isCurrentlyDone = d.status === 'done';
                          setToggledDeadlines(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(d.id)) {
                              newSet.delete(d.id);
                            } else {
                              newSet.add(d.id);
                            }
                            return newSet;
                          });
                          updateDeadline(d.id, {
                            status: isCurrentlyDone ? 'open' : 'done',
                          });
                          // Only fade out when marking as done, not when unchecking
                          if (!isCurrentlyDone) {
                            setTimeout(() => {
                              setHidingDeadlines(prev => new Set(prev).add(d.id));
                            }, 50);
                          } else {
                            // Remove from hiding when unchecking
                            setHidingDeadlines(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(d.id);
                              return newSet;
                            });
                          }
                        }}
                        style={{
                          appearance: 'none',
                          width: '20px',
                          height: '20px',
                          border: d.status === 'done' ? 'none' : '2px solid var(--border)',
                          borderRadius: '4px',
                          backgroundColor: d.status === 'done' ? '#4a7c59' : 'transparent',
                          cursor: 'pointer',
                          flexShrink: 0,
                          backgroundImage: d.status === 'done' ? 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22white%22%3E%3Cpath fill-rule=%22evenodd%22 d=%22M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z%22 clip-rule=%22evenodd%22 /%3E%3C/svg%3E")' : 'none',
                          backgroundSize: '100%',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          transition: 'all 0.3s ease'
                        }}
                        title={d.status === 'done' ? 'Mark as incomplete' : 'Mark as complete'}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-sm font-medium ${
                              d.status === 'done' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'
                            }`}
                          >
                            {d.title}
                          </div>
                          {isOverdueDeadline && <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: '600', color: 'var(--danger)', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap' }}>Overdue</span>}
                        </div>
                        {d.notes && (
                          <div className="text-xs text-[var(--text-muted)] mt-1">
                            {d.notes}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {d.dueAt && (
                            <span className="text-xs text-[var(--text-muted)] bg-[var(--panel-2)] px-2 py-0.5 rounded">
                              {formatDate(d.dueAt)} {shouldShowTime && `at ${dueTime}`}
                            </span>
                          )}
                          {course && (
                            <span className="text-xs text-[var(--text-muted)] bg-[var(--panel-2)] px-2 py-0.5 rounded">
                              {course.code}
                            </span>
                          )}
                          {d.link && (
                            <a
                              href={d.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] bg-[var(--panel-2)] px-2 py-0.5 rounded"
                            >
                              {extractDomain(d.link)}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => startEdit(d)}
                          className="p-1.5 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--accent)] hover:bg-white/5 transition-colors"
                          title="Edit deadline"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteDeadline(d.id)}
                          className="p-1.5 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                          title="Delete deadline"
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
