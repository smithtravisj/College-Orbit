'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { isToday, formatDate, isOverdue, extractDomain } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { MapPin, ExternalLink, Edit2, Trash2, Plus } from 'lucide-react';
import CalendarPicker from '@/components/CalendarPicker';
import TimePicker from '@/components/TimePicker';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showDeadlineForm, setShowDeadlineForm] = useState(false);
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const [hidingTasks, setHidingTasks] = useState<Set<string>>(new Set());
  const [toggledTasks, setToggledTasks] = useState<Set<string>>(new Set());
  const [hidingDeadlines, setHidingDeadlines] = useState<Set<string>>(new Set());
  const [toggledDeadlines, setToggledDeadlines] = useState<Set<string>>(new Set());
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    courseId: '',
    dueDate: '',
    dueTime: '',
    notes: '',
    link: '',
  });
  const [deadlineFormData, setDeadlineFormData] = useState({
    title: '',
    courseId: '',
    dueDate: '',
    dueTime: '',
    notes: '',
    link: '',
  });
  const { courses, deadlines, tasks, settings, initializeStore, addTask, updateTask, deleteTask, toggleTaskDone, updateDeadline, deleteDeadline } = useAppStore();

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

    let dueAt: string | null = null;
    // Only set dueAt if we have a valid date string (not empty, not null, not whitespace)
    if (taskFormData.dueDate && taskFormData.dueDate.trim()) {
      try {
        // If date is provided but time is not, default to 11:59 PM
        const dateTimeString = taskFormData.dueTime ? `${taskFormData.dueDate}T${taskFormData.dueTime}` : `${taskFormData.dueDate}T23:59`;
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
      taskFormData.dueTime = '';
    }

    // Handle link - normalize empty string to null
    const link = taskFormData.link?.trim() ? (
      taskFormData.link.startsWith('http://') || taskFormData.link.startsWith('https://')
        ? taskFormData.link
        : `https://${taskFormData.link}`
    ) : null;

    if (editingTaskId) {
      await updateTask(editingTaskId, {
        title: taskFormData.title,
        courseId: taskFormData.courseId || null,
        dueAt,
        notes: taskFormData.notes,
        link,
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
        link,
        status: 'open',
      });
    }

    setTaskFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '', link: '' });
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
      link: task.link || '',
    });
    setShowTaskForm(true);
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setTaskFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '', link: '' });
    setShowTaskForm(false);
  };

  const handleDeadlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadlineFormData.title.trim()) return;

    let dueAt: string | null = null;
    // Only set dueAt if we have a valid date string (not empty, not null, not whitespace)
    if (deadlineFormData.dueDate && deadlineFormData.dueDate.trim()) {
      try {
        const dateTimeString = deadlineFormData.dueTime ? `${deadlineFormData.dueDate}T${deadlineFormData.dueTime}` : `${deadlineFormData.dueDate}T23:59`;
        const dateObj = new Date(dateTimeString);
        // Verify it's a valid date and not the epoch
        if (dateObj.getTime() > 0) {
          dueAt = dateObj.toISOString();
        }
      } catch (err) {
        console.error('Date parsing error:', err);
      }
    } else if (deadlineFormData.dueTime) {
      deadlineFormData.dueTime = '';
    }

    const link = deadlineFormData.link?.trim() ? (
      deadlineFormData.link.startsWith('http://') || deadlineFormData.link.startsWith('https://')
        ? deadlineFormData.link
        : `https://${deadlineFormData.link}`
    ) : null;

    if (editingDeadlineId) {
      await updateDeadline(editingDeadlineId, {
        title: deadlineFormData.title,
        courseId: deadlineFormData.courseId || null,
        dueAt,
        notes: deadlineFormData.notes,
        link,
      });
      setEditingDeadlineId(null);
    } else {
      await updateDeadline(editingDeadlineId || '', {
        title: deadlineFormData.title,
        courseId: deadlineFormData.courseId || null,
        dueAt,
        notes: deadlineFormData.notes,
        link,
      });
    }

    setDeadlineFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '', link: '' });
    setShowDeadlineForm(false);
  };

  const cancelEditDeadline = () => {
    setEditingDeadlineId(null);
    setDeadlineFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '', link: '' });
    setShowDeadlineForm(false);
  };

  // Get next class
  const today = new Date();
  const todayClasses = courses.flatMap((course) =>
    (course.meetingTimes || [])
      .filter((mt) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return mt.days?.includes(days[today.getDay()]) || false;
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
      if (!d.dueAt) return false;
      const dueDate = new Date(d.dueAt);
      const windowEnd = new Date();
      windowEnd.setDate(windowEnd.getDate() + settings.dueSoonWindowDays);
      const isInWindow = dueDate <= windowEnd;
      // Keep toggled deadlines visible regardless of status
      if (toggledDeadlines.has(d.id)) {
        return isInWindow;
      }
      return isInWindow && d.status === 'open';
    })
    .sort((a, b) => {
      if (!a.dueAt || !b.dueAt) return 0;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    })
    .slice(0, 5);

  // Get today's tasks and overdue tasks
  const todayTasks = tasks
    .filter((t) => {
      // Keep toggled tasks visible regardless of status
      if (toggledTasks.has(t.id)) {
        return t.dueAt && (isToday(t.dueAt) || isOverdue(t.dueAt));
      }
      return t.dueAt && (isToday(t.dueAt) || isOverdue(t.dueAt)) && t.status === 'open';
    })
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
  const overdueCount = overdueTasks.length + deadlines.filter((d) => d.dueAt && isOverdue(d.dueAt) && d.status === 'open').length;

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
              {showDeadlineForm && (
                <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                  <form onSubmit={handleDeadlineSubmit} className="space-y-5">
                    <Input
                      label="Deadline title"
                      value={deadlineFormData.title}
                      onChange={(e) => setDeadlineFormData({ ...deadlineFormData, title: e.target.value })}
                      placeholder="What needs to be done?"
                      required
                    />
                    <div style={{ paddingTop: '12px' }}>
                      <Select
                        label="Course (optional)"
                        value={deadlineFormData.courseId}
                        onChange={(e) => setDeadlineFormData({ ...deadlineFormData, courseId: e.target.value })}
                        options={[{ value: '', label: 'No Course' }, ...courses.map((c) => ({ value: c.id, label: c.name }))]}
                      />
                    </div>
                    <div style={{ paddingTop: '12px' }}>
                      <Textarea
                        label="Notes (optional)"
                        value={deadlineFormData.notes}
                        onChange={(e) => setDeadlineFormData({ ...deadlineFormData, notes: e.target.value })}
                        placeholder="Add details..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <CalendarPicker
                        label="Due date (optional)"
                        value={deadlineFormData.dueDate}
                        onChange={(date) => setDeadlineFormData({ ...deadlineFormData, dueDate: date })}
                      />
                      <TimePicker
                        label="Due time (optional)"
                        value={deadlineFormData.dueTime}
                        onChange={(time) => setDeadlineFormData({ ...deadlineFormData, dueTime: time })}
                      />
                    </div>
                    <div style={{ paddingTop: '12px' }}>
                      <Input
                        label="Link (optional)"
                        type="text"
                        value={deadlineFormData.link}
                        onChange={(e) => setDeadlineFormData({ ...deadlineFormData, link: e.target.value })}
                        placeholder="example.com or https://..."
                      />
                    </div>
                    <div className="flex gap-3" style={{ paddingTop: '8px' }}>
                      <Button
                        variant="primary"
                        type="submit"
                        size="sm"
                        style={{
                          backgroundColor: '#132343',
                          color: 'white',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: 'var(--border)',
                          paddingLeft: '24px',
                          paddingRight: '24px'
                        }}
                      >
                        {editingDeadlineId ? 'Save Changes' : 'Add Deadline'}
                      </Button>
                      <Button variant="secondary" type="button" onClick={cancelEditDeadline} size="sm">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}
              {dueSoon.length > 0 ? (
                <div className="space-y-4 divide-y divide-[var(--border)]">
                  {dueSoon.slice(0, 3).map((d) => {
                    const course = courses.find((c) => c.id === d.courseId);
                    const dueHours = new Date(d.dueAt!).getHours();
                    const dueMinutes = new Date(d.dueAt!).getMinutes();
                    const dueTime = new Date(d.dueAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const isOverdueDeadline = d.dueAt && isOverdue(d.dueAt) && d.status === 'open';
                    const shouldShowTime = dueTime && !(dueHours === 23 && dueMinutes === 59);
                    return (
                      <div key={d.id} style={{ paddingTop: '10px', paddingBottom: '10px', opacity: hidingDeadlines.has(d.id) ? 0.5 : 1, transition: 'opacity 0.3s ease' }} className="first:pt-0 last:pb-0 flex items-center gap-4 group">
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
                            if (!isCurrentlyDone) {
                              setTimeout(() => {
                                setHidingDeadlines(prev => new Set(prev).add(d.id));
                              }, 50);
                            } else {
                              setHidingDeadlines(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(d.id);
                                return newSet;
                              });
                            }
                          }}
                          style={{
                            appearance: 'none',
                            width: '16px',
                            height: '16px',
                            border: d.status === 'done' ? 'none' : '2px solid var(--border)',
                            borderRadius: '3px',
                            backgroundColor: d.status === 'done' ? '#132343' : 'transparent',
                            cursor: 'pointer',
                            flexShrink: 0,
                            backgroundImage: d.status === 'done' ? 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22white%22%3E%3Cpath fill-rule=%22evenodd%22 d=%22M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z%22 clip-rule=%22evenodd%22 /%3E%3C/svg%3E")' : 'none',
                            backgroundSize: '100%',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            transition: 'all 0.3s ease'
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className={`text-sm font-medium ${d.status === 'done' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>{d.title}</div>
                            {isOverdueDeadline && <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: '600', color: 'var(--danger)', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap' }}>Overdue</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-[var(--text-muted)] bg-[var(--panel-2)] px-2 py-0.5 rounded">
                              {formatDate(d.dueAt!)}
                            </span>
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
                            onClick={() => deleteDeadline(d.id)}
                            className="p-1.5 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                            title="Delete deadline"
                          >
                            <Trash2 size={14} />
                          </button>
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

          {/* Second row - Today's Tasks & Quick Links */}
          <div className="col-span-12 lg:col-span-6 lg:flex">
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
                  <div style={{ paddingTop: '12px' }}>
                    <Select
                      label="Course (optional)"
                      value={taskFormData.courseId}
                      onChange={(e) => setTaskFormData({ ...taskFormData, courseId: e.target.value })}
                      options={[{ value: '', label: 'No Course' }, ...courses.map((c) => ({ value: c.id, label: c.name }))]}
                    />
                  </div>
                  <div style={{ paddingTop: '12px' }}>
                    <Textarea
                      label="Notes (optional)"
                      value={taskFormData.notes}
                      onChange={(e) => setTaskFormData({ ...taskFormData, notes: e.target.value })}
                      placeholder="Add any additional notes..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <CalendarPicker
                      label="Due date (optional)"
                      value={taskFormData.dueDate}
                      onChange={(date) => setTaskFormData({ ...taskFormData, dueDate: date })}
                    />
                    <TimePicker
                      label="Due time (optional)"
                      value={taskFormData.dueTime}
                      onChange={(time) => setTaskFormData({ ...taskFormData, dueTime: time })}
                    />
                  </div>
                  <div style={{ paddingTop: '12px' }}>
                    <Input
                      label="Link (optional)"
                      type="text"
                      value={taskFormData.link}
                      onChange={(e) => setTaskFormData({ ...taskFormData, link: e.target.value })}
                      placeholder="example.com or https://..."
                    />
                  </div>
                  <div className="flex gap-3" style={{ paddingTop: '8px' }}>
                    <Button
                      variant="primary"
                      type="submit"
                      size="sm"
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
                          width: '16px',
                          height: '16px',
                          border: t.status === 'done' ? 'none' : '2px solid var(--border)',
                          borderRadius: '3px',
                          backgroundColor: t.status === 'done' ? '#132343' : 'transparent',
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
                          {isOverdueTask && t.dueAt && (
                            <span className="text-xs text-[var(--text-muted)] bg-[var(--panel-2)] px-2 py-0.5 rounded">
                              {formatDate(t.dueAt)}
                            </span>
                          )}
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
                          {t.link && (
                            <a
                              href={t.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] bg-[var(--panel-2)] px-2 py-0.5 rounded"
                            >
                              {extractDomain(t.link)}
                            </a>
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
          <div className="col-span-12 lg:col-span-6 lg:flex">
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

          {/* Upcoming This Week - Full Width */}
          <div className="col-span-12 lg:flex">
            <Card title="Upcoming This Week" subtitle="Your schedule for the next 7 days" className="h-full flex flex-col w-full">
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
