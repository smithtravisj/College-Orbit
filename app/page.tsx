'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { isToday, formatTime, isOverdue } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input, { Select, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { MapPin, ExternalLink, Edit2, Trash2, Plus } from 'lucide-react';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [hidingTasks, setHidingTasks] = useState<Set<string>>(new Set());
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    courseId: '',
    dueDate: '',
    dueTime: '',
    notes: '',
  });
  const { courses, deadlines, tasks, settings, initializeStore, addTask, updateTask, deleteTask, toggleTaskDone } = useAppStore();

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

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormData.title.trim()) return;

    let dueAt = null;
    if (taskFormData.dueDate) {
      const dateTimeString = taskFormData.dueTime ? `${taskFormData.dueDate}T${taskFormData.dueTime}` : `${taskFormData.dueDate}T23:59`;
      dueAt = new Date(dateTimeString).toISOString();
    }

    if (editingTaskId) {
      await updateTask(editingTaskId, {
        title: taskFormData.title,
        courseId: taskFormData.courseId || null,
        dueAt,
        notes: taskFormData.notes,
      });
      setEditingTaskId(null);
    } else {
      await addTask({
        title: taskFormData.title,
        courseId: taskFormData.courseId || null,
        dueAt,
        pinned: false,
        checklist: [],
        notes: taskFormData.notes,
        status: 'open',
      });
    }

    setTaskFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '' });
    setShowTaskForm(false);
  };

  const startEditTask = (task: any) => {
    setEditingTaskId(task.id);
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
    setTaskFormData({
      title: task.title,
      courseId: task.courseId || '',
      dueDate: dateStr,
      dueTime: timeStr,
      notes: task.notes,
    });
    setShowTaskForm(true);
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setTaskFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '' });
    setShowTaskForm(false);
  };

  // Get next class
  const today = new Date();
  const todayClasses = courses.flatMap((course) =>
    (course.meetingTimes || [])
      .filter((mt) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return mt.day === days[today.getDay()];
      })
      .map((mt) => ({
        ...mt,
        courseCode: course.code,
        courseName: course.name,
      }))
  );

  const now = new Date();
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const nextClass = todayClasses
    .filter((c) => c.start > nowTime)
    .sort((a, b) => a.start.localeCompare(b.start))[0] || null;

  // Get due soon items
  const dueSoon = deadlines
    .filter((d) => {
      const dueDate = new Date(d.dueAt);
      const windowEnd = new Date();
      windowEnd.setDate(windowEnd.getDate() + settings.dueSoonWindowDays);
      return dueDate <= windowEnd && d.status === 'open';
    })
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 5);

  // Get today's tasks and overdue tasks
  const todayTasks = tasks
    .filter((t) => t.dueAt && (isToday(t.dueAt) || isOverdue(t.dueAt)) && (t.status === 'open' || hidingTasks.has(t.id)))
    .sort((a, b) => {
      // Sort by due time if both have times
      if (a.dueAt && b.dueAt) {
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      // Otherwise sort alphabetically
      return a.title.localeCompare(b.title);
    });

  const overdueTasks = tasks.filter((d) => d.dueAt && isOverdue(d.dueAt) && d.status === 'open');

  // Get quick links
  const quickLinks = courses
    .flatMap((c) => c.links.map((l) => ({ ...l, courseId: c.id, courseName: c.name })))
    .slice(0, 6);

  // Status summary
  const classesLeft = todayClasses.filter((c) => c.start > nowTime).length;
  const overdueCount = overdueTasks.length + deadlines.filter((d) => isOverdue(d.dueAt) && d.status === 'open').length;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Welcome back. Here's your schedule and tasks for today." />
      <div className="mx-auto w-full max-w-[1400px] min-h-[calc(100vh-var(--header-h))] flex flex-col" style={{ padding: '24px' }}>
        <div className="grid grid-cols-12 gap-[var(--grid-gap)] flex-1">
          {/* Top row - 3 cards */}
          <div className="col-span-12 lg:col-span-4 h-full min-h-[220px]">
            <Card title="Next Class" className="h-full flex flex-col">
              {nextClass ? (
                <div className="flex flex-col gap-6">
                  <div className="space-y-3">
                    <div className="text-xs text-[var(--muted)] uppercase tracking-wide font-medium leading-relaxed">
                      {nextClass.start} - {nextClass.end}
                    </div>
                    <div className="text-xl font-semibold text-[var(--text)] leading-tight">{nextClass.courseCode}</div>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{nextClass.location}</span>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(nextClass.location || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button variant="primary" size="md">
                      Directions
                      <ExternalLink size={16} />
                    </Button>
                  </a>
                </div>
              ) : (
                <EmptyState title="No classes today" description="You're free for the rest of the day!" />
              )}
            </Card>
          </div>

          {/* Due Soon */}
          <div className="col-span-12 lg:col-span-4 h-full min-h-[220px]">
            <Card title="Due Soon" className="h-full flex flex-col">
              {dueSoon.length > 0 ? (
                <div className="space-y-0">
                  {dueSoon.slice(0, 3).map((d, idx) => {
                    const course = courses.find((c) => c.id === d.courseId);
                    const isOverd = isOverdue(d.dueAt);
                    return (
                      <div key={d.id} className={`py-6 ${idx < dueSoon.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-3">
                            {isOverd && <Badge variant="danger">Overdue</Badge>}
                            <div className="text-sm font-medium leading-tight text-[var(--text)] truncate">{d.title}</div>
                            {course && <div className="text-xs text-[var(--text-muted)] leading-relaxed">{course.code}</div>}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] flex-shrink-0 text-right leading-relaxed">{formatTime(d.dueAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="No deadlines soon" description="You're all caught up!" />
              )}
            </Card>
          </div>

          {/* Overview */}
          <div className="col-span-12 lg:col-span-4 h-full min-h-[220px]">
            <Card title="Overview" className="h-full flex flex-col">
              <div className="space-y-0">
                <div className="flex items-center justify-between border-b border-[var(--border)] first:pt-0" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                  <div className="text-sm text-[var(--muted)] leading-relaxed">Classes remaining</div>
                  <div className="text-base font-semibold tabular-nums text-[var(--accent)]">{classesLeft}</div>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border)]" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                  <div className="text-sm text-[var(--muted)] leading-relaxed">Due soon</div>
                  <div className="text-base font-semibold tabular-nums text-[var(--text)]">{dueSoon.length}</div>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border)]" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                  <div className="text-sm text-[var(--muted)] leading-relaxed">Overdue</div>
                  <div className={`text-base font-semibold tabular-nums ${overdueCount > 0 ? 'text-[var(--danger)]' : 'text-[var(--text)]'}`}>
                    {overdueCount}
                  </div>
                </div>
                <div className="flex items-center justify-between last:pb-0" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                  <div className="text-sm text-[var(--muted)] leading-relaxed">Tasks today</div>
                  <div className="text-base font-semibold tabular-nums text-[var(--text)]">{todayTasks.length}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Second row - Tasks and Quick Links */}
          <div className="col-span-12 lg:flex lg:gap-[var(--grid-gap)]">
            <div className="col-span-12 lg:col-span-8 lg:flex">
              <Card title="Today's Tasks" className="h-full flex flex-col w-full">
              {/* Task Form */}
              {showTaskForm && (
                <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                  <form onSubmit={handleTaskSubmit} className="space-y-5">
                    <Input
                      label="Task title"
                      value={taskFormData.title}
                      onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                      placeholder="What needs to be done?"
                      required
                    />
                    <Select
                      label="Course (optional)"
                      value={taskFormData.courseId}
                      onChange={(e) => setTaskFormData({ ...taskFormData, courseId: e.target.value })}
                      options={[{ value: '', label: 'No Course' }, ...courses.map((c) => ({ value: c.id, label: c.code }))]}
                    />
                    <Textarea
                      label="Notes (optional)"
                      value={taskFormData.notes}
                      onChange={(e) => setTaskFormData({ ...taskFormData, notes: e.target.value })}
                      placeholder="Add any additional notes..."
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Due date (optional)"
                        type="date"
                        value={taskFormData.dueDate}
                        onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                      />
                      <Input
                        label="Due time (optional)"
                        type="time"
                        value={taskFormData.dueTime}
                        onChange={(e) => setTaskFormData({ ...taskFormData, dueTime: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-3" style={{ paddingTop: '8px' }}>
                      <Button variant="primary" type="submit" size="sm">
                        {editingTaskId ? 'Save Changes' : 'Add Task'}
                      </Button>
                      <Button variant="secondary" type="button" onClick={cancelEditTask} size="sm">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {todayTasks.length > 0 || showTaskForm ? (
                <div className="space-y-4 divide-y divide-[var(--border)]">
                  {todayTasks.slice(0, 5).map((t) => {
                    const dueHours = t.dueAt ? new Date(t.dueAt).getHours() : null;
                    const dueMinutes = t.dueAt ? new Date(t.dueAt).getMinutes() : null;
                    const dueTime = t.dueAt ? new Date(t.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
                    const isOverdueTask = t.dueAt && isOverdue(t.dueAt) && t.status === 'open';
                    const shouldShowTime = dueTime && !(dueHours === 23 && dueMinutes === 59);
                    const course = courses.find((c) => c.id === t.courseId);
                    return (
                      <div key={t.id} style={{ paddingTop: '10px', paddingBottom: '10px', opacity: hidingTasks.has(t.id) ? 0.5 : 1, transition: 'opacity 0.3s ease' }} className="first:pt-0 last:pb-0 flex items-center gap-4 group border-b border-[var(--border)] last:border-b-0">
                        <input
                          type="checkbox"
                          checked={t.status === 'done'}
                          onChange={() => {
                            toggleTaskDone(t.id);
                            setTimeout(() => {
                              setHidingTasks(prev => new Set(prev).add(t.id));
                            }, 50);
                          }}
                          style={{
                            appearance: 'none',
                            width: '16px',
                            height: '16px',
                            border: t.status === 'done' ? 'none' : '2px solid var(--border)',
                            borderRadius: '3px',
                            backgroundColor: t.status === 'done' ? '#4a7c59' : 'transparent',
                            cursor: 'pointer',
                            flexShrink: 0,
                            backgroundImage: t.status === 'done' ? 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22white%22%3E%3Cpath fill-rule=%22evenodd%22 d=%22M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z%22 clip-rule=%22evenodd%22 /%3E%3C/svg%3E")' : 'none',
                            backgroundSize: '100%',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            transition: 'all 0.3s ease'
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div
                              className={`text-sm font-medium ${
                                t.status === 'done'
                                  ? 'line-through text-[var(--text-muted)]'
                                  : 'text-[var(--text)]'
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
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {shouldShowTime && (
                              <span className="text-xs text-[var(--text-muted)] bg-[var(--panel-2)] px-2 py-0.5 rounded">
                                {dueTime}
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
                            onClick={() => startEditTask(t)}
                            className="p-1.5 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--accent)] hover:bg-white/5 transition-colors"
                            title="Edit task"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteTask(t.id)}
                            className="p-1.5 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                            title="Delete task"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ paddingTop: '16px', display: 'flex', gap: '8px' }}>
                    {!showTaskForm && (
                      <Button variant="secondary" size="sm" onClick={() => setShowTaskForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px' }}>
                        <Plus size={14} />
                        Add Task
                      </Button>
                    )}
                    {todayTasks.length > 5 && (
                      <Link href="/tasks" className="inline-flex">
                        <Button variant="secondary" size="sm">
                          View all →
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <EmptyState title="No tasks today" description="Add a task to get started" action={{ label: 'Add Task', onClick: () => setShowTaskForm(true) }} />
              )}
              </Card>
            </div>

            {/* Quick Links */}
            <div className="col-span-12 lg:col-span-4 lg:flex">
              <Card title="Quick Links" className="h-full flex flex-col w-full">
              {quickLinks.length > 0 ? (
                <div className="space-y-3">
                  {quickLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-4 rounded-[var(--radius-control)] hover:bg-white/5 transition-colors group text-sm"
                    >
                      <span className="text-[var(--muted)] group-hover:text-[var(--text)] truncate">{link.label}</span>
                      <ExternalLink size={16} className="text-[var(--muted)] group-hover:text-[var(--accent)] flex-shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No quick links"
                  description="Add links in your courses"
                  action={{ label: 'Go to Courses', onClick: () => (window.location.href = '/courses') }}
                />
              )}
              </Card>
            </div>
          </div>

          {/* Upcoming This Week */}
          <div className="col-span-12 min-h-[180px]">
            <Card title="Upcoming This Week" subtitle="Your schedule for the next 7 days" className="h-full flex flex-col">
              <div className="text-sm text-[var(--muted)]">
                <p>No upcoming events</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
