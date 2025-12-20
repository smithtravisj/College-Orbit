'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import OnboardingTour from '@/components/OnboardingTour';
import { isToday, formatDate, isOverdue } from '@/lib/utils';
import { isDateExcluded } from '@/lib/calendarUtils';
import { getQuickLinks } from '@/lib/quickLinks';
import { getDashboardCardSpan } from '@/lib/dashboardLayout';
import { DASHBOARD_CARDS, DEFAULT_VISIBLE_DASHBOARD_CARDS } from '@/lib/customizationConstants';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { Trash2, Plus } from 'lucide-react';
import CalendarPicker from '@/components/CalendarPicker';
import TimePicker from '@/components/TimePicker';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
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
    links: [{ label: '', url: '' }],
  });
  const [deadlineFormData, setDeadlineFormData] = useState({
    title: '',
    courseId: '',
    dueDate: '',
    dueTime: '',
    notes: '',
    links: [{ label: '', url: '' }],
  });
  const { courses, deadlines, tasks, settings, excludedDates, initializeStore, addTask, updateTask, deleteTask, toggleTaskDone, updateDeadline, deleteDeadline } = useAppStore();
  const visibleDashboardCards = settings.visibleDashboardCards || DEFAULT_VISIBLE_DASHBOARD_CARDS;

  useEffect(() => {
    initializeStore();
    setMounted(true);
  }, [initializeStore]);

  // Check if user needs onboarding after mount
  useEffect(() => {
    if (mounted && !settings.hasCompletedOnboarding) {
      // Small delay to ensure DOM is fully rendered and IDs are available
      setTimeout(() => {
        setShowOnboarding(true);
      }, 800);
    }
  }, [mounted, settings.hasCompletedOnboarding]);

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

    // Handle links - normalize and add https:// if needed
    const links = taskFormData.links
      .filter((l) => l.url && l.url.trim())
      .map((l) => ({
        label: l.label,
        url: l.url.startsWith('http://') || l.url.startsWith('https://')
          ? l.url
          : `https://${l.url}`
      }));

    if (editingTaskId) {
      await updateTask(editingTaskId, {
        title: taskFormData.title,
        courseId: taskFormData.courseId || null,
        dueAt,
        notes: taskFormData.notes,
        links,
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
        links,
        status: 'open',
      });
    }

    setTaskFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '', links: [{ label: '', url: '' }] });
    setShowTaskForm(false);
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setTaskFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '', links: [{ label: '', url: '' }] });
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

    // Handle links - normalize and add https:// if needed
    const links = deadlineFormData.links
      .filter((l) => l.url && l.url.trim())
      .map((l) => ({
        label: l.label,
        url: l.url.startsWith('http://') || l.url.startsWith('https://')
          ? l.url
          : `https://${l.url}`
      }));

    if (editingDeadlineId) {
      await updateDeadline(editingDeadlineId, {
        title: deadlineFormData.title,
        courseId: deadlineFormData.courseId || null,
        dueAt,
        notes: deadlineFormData.notes,
        links,
      });
      setEditingDeadlineId(null);
    }

    setDeadlineFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '', links: [{ label: '', url: '' }] });
    setShowDeadlineForm(false);
  };

  const cancelEditDeadline = () => {
    setEditingDeadlineId(null);
    setDeadlineFormData({ title: '', courseId: '', dueDate: '', dueTime: '', notes: '', links: [{ label: '', url: '' }] });
    setShowDeadlineForm(false);
  };

  // Helper function to format 24-hour time to 12-hour format
  const formatTime12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const isPM = hours >= 12;
    const hours12 = hours % 12 || 12;
    const ampm = isPM ? 'PM' : 'AM';
    return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

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

  // Helper function to check if a course is active on a specific date
  const isCourseCurrent = (course: any, checkDate?: Date) => {
    const dateToCheck = checkDate ? new Date(checkDate) : new Date();
    const dateStr = dateToCheck.toISOString().split('T')[0]; // YYYY-MM-DD format

    if (course.startDate) {
      const startStr = course.startDate.split('T')[0]; // Handle both timestamp and date string formats
      if (startStr > dateStr) return false; // Course hasn't started
    }

    if (course.endDate) {
      const endStr = course.endDate.split('T')[0]; // Handle both timestamp and date string formats
      if (endStr < dateStr) return false; // Course has ended (endDate is before this date)
    }

    // Check if date is excluded
    if (isDateExcluded(dateToCheck, course.id, excludedDates)) {
      return false;
    }

    return true;
  };

  // Get next class
  const today = new Date();
  const todayClasses = courses
    .filter((course) => isCourseCurrent(course))
    .flatMap((course) =>
      (course.meetingTimes || [])
        .filter((mt) => {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return mt.days?.includes(days[today.getDay()]) || false;
        })
        .map((mt) => ({
          ...mt,
          courseCode: course.code,
          courseName: course.name,
          courseLinks: course.links,
        }))
    );

  const now = new Date();
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const nextClass = todayClasses
    .filter((c) => c.start > nowTime)
    .sort((a, b) => a.start.localeCompare(b.start))[0] || null;

  const overdueTasks = tasks.filter((d) => d.dueAt && isOverdue(d.dueAt) && d.status === 'open');

  // Get quick links - use hardcoded BYU resources
  const quickLinks = getQuickLinks(settings.university);

  // Status summary
  const classesLeft = todayClasses.filter((c) => c.start > nowTime).length;
  const overdueCount = overdueTasks.length + deadlines.filter((d) => d.dueAt && isOverdue(d.dueAt) && d.status === 'open').length;

  return (
    <>
      <OnboardingTour
        shouldRun={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      <PageHeader title="Dashboard" subtitle="Welcome back. Here's your schedule and tasks for today." />
      <div className="mx-auto w-full max-w-[1400px] min-h-[calc(100vh-var(--header-h))] flex flex-col" style={{ padding: 'clamp(12px, 4%, 24px)' }}>
        <div className="grid grid-cols-12 gap-[var(--grid-gap)] flex-1">
          {/* Top row - 3 cards */}
          {visibleDashboardCards.includes(DASHBOARD_CARDS.NEXT_CLASS) && (
          <div className={`${getDashboardCardSpan(DASHBOARD_CARDS.NEXT_CLASS, visibleDashboardCards)} h-full min-h-[220px]`} data-tour="next-class">
            <Card title="Next Class" className="h-full flex flex-col">
              {nextClass ? (
                <div className="flex flex-col gap-4">
                  {/* Course Code & Name */}
                  <div>
                    <div className="text-sm font-medium text-[var(--text)]">
                      {nextClass.courseCode}{nextClass.courseName ? ` - ${nextClass.courseName}` : ''}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-sm text-[var(--text-secondary)]">
                    {formatTime12Hour(nextClass.start)} – {formatTime12Hour(nextClass.end)}
                  </div>

                  {/* Location */}
                  <div className="text-sm text-[var(--text-secondary)]">
                    {nextClass.location}
                  </div>

                  {/* Course Links */}
                  {nextClass.courseLinks && nextClass.courseLinks.length > 0 && (
                    <div className="flex flex-col pt-2" style={{ gap: '2px' }}>
                      {nextClass.courseLinks.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-[var(--link)] hover:text-blue-400 transition-colors"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState title="No classes today" description="You're free for the rest of the day!" />
              )}
            </Card>
          </div>
          )}

          {/* Due Soon */}
          {visibleDashboardCards.includes(DASHBOARD_CARDS.DUE_SOON) && (
          <div className={`${getDashboardCardSpan(DASHBOARD_CARDS.DUE_SOON, visibleDashboardCards)} h-full min-h-[220px]`} data-tour="due-soon">
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
                    <div className="grid grid-cols-2 gap-4" style={{ paddingTop: '12px' }}>
                      <CalendarPicker
                        label="Due Date (optional)"
                        value={deadlineFormData.dueDate}
                        onChange={(date) => setDeadlineFormData({ ...deadlineFormData, dueDate: date })}
                      />
                      <TimePicker
                        label="Due Time (optional)"
                        value={deadlineFormData.dueTime}
                        onChange={(time) => setDeadlineFormData({ ...deadlineFormData, dueTime: time })}
                      />
                    </div>
                    <div style={{ paddingTop: '12px' }}>
                      <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Links (optional)</label>
                      <div className="space-y-2">
                        {deadlineFormData.links.map((link, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <Input
                              type="text"
                              value={link.label}
                              onChange={(e) => {
                                const newLinks = [...deadlineFormData.links];
                                newLinks[idx].label = e.target.value;
                                setDeadlineFormData({ ...deadlineFormData, links: newLinks });
                              }}
                              placeholder="Label"
                              className="w-24"
                              style={{ marginBottom: '0' }}
                            />
                            <Input
                              type="text"
                              value={link.url}
                              onChange={(e) => {
                                const newLinks = [...deadlineFormData.links];
                                newLinks[idx].url = e.target.value;
                                setDeadlineFormData({ ...deadlineFormData, links: newLinks });
                              }}
                              placeholder="example.com"
                              className="flex-1"
                              style={{ marginBottom: '0' }}
                            />
                            {deadlineFormData.links.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeadlineFormData({
                                    ...deadlineFormData,
                                    links: deadlineFormData.links.filter((_, i) => i !== idx),
                                  });
                                }}
                                className="text-[var(--muted)] hover:text-[var(--danger)]"
                                style={{ padding: '4px' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {deadlineFormData.links.length < 3 && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeadlineFormData({
                              ...deadlineFormData,
                              links: [...deadlineFormData.links, { label: '', url: '' }],
                            });
                          }}
                          className="text-xs text-[var(--link)] hover:text-blue-400 mt-1"
                        >
                          + Add link
                        </button>
                      )}
                    </div>
                    <div style={{ paddingTop: '12px' }}>
                      <Textarea
                        label="Notes (optional)"
                        value={deadlineFormData.notes}
                        onChange={(e) => setDeadlineFormData({ ...deadlineFormData, notes: e.target.value })}
                        placeholder="Add details..."
                      />
                    </div>
                    <div className="flex gap-3" style={{ paddingTop: '8px' }}>
                      <Button
                        variant="primary"
                        type="submit"
                        size="sm"
                        style={{
                          backgroundColor: 'var(--button-secondary)',
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
                            backgroundColor: d.status === 'done' ? 'var(--button-secondary)' : 'transparent',
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
                            {isOverdueDeadline && <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', fontWeight: '600', color: 'var(--danger)', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap' }}>Overdue</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-[var(--text-muted)]">
                              {formatDate(d.dueAt!)}
                            </span>
                            {shouldShowTime && (
                              <span className="text-xs text-[var(--text-muted)]">
                                {dueTime}
                              </span>
                            )}
                            {course && (
                              <span className="text-xs text-[var(--text-muted)]">
                                {course.code}
                              </span>
                            )}
                          </div>
                          {d.links && d.links.length > 0 && (
                            <div className="flex flex-col mt-2" style={{ gap: '0px' }}>
                              {d.links.map((link: any) => (
                                <a
                                  key={link.url}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[var(--link)] hover:text-blue-400"
                                >
                                  {link.label}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => deleteDeadline(d.id)}
                            className="p-1.5 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors -ml-2"
                            title="Delete deadline"
                          >
                            <Trash2 size={16} />
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
          )}

          {/* Overview */}
          {visibleDashboardCards.includes(DASHBOARD_CARDS.OVERVIEW) && (
          <div className={`${getDashboardCardSpan(DASHBOARD_CARDS.OVERVIEW, visibleDashboardCards)} h-full min-h-[220px]`} data-tour="overview">
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
          )}

          {/* Second row - Today's Tasks & Quick Links */}
          {visibleDashboardCards.includes(DASHBOARD_CARDS.TODAY_TASKS) && (
          <div className={`${getDashboardCardSpan(DASHBOARD_CARDS.TODAY_TASKS, visibleDashboardCards)} lg:flex`} data-tour="today-tasks">
            <Card title="Today's Tasks" className="h-full flex flex-col w-full">
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
                          backgroundColor: t.status === 'done' ? 'var(--button-secondary)' : 'transparent',
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
                          {isOverdueTask && <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', fontWeight: '600', color: 'var(--danger)', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap' }}>Overdue</span>}
                        </div>
                        {t.notes && (
                          <div className="text-xs text-[var(--text-muted)] mt-1">
                            {t.notes}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {isOverdueTask && t.dueAt && (
                            <span className="text-xs text-[var(--text-muted)]">
                              {formatDate(t.dueAt)}
                            </span>
                          )}
                          {shouldShowTime && (
                            <span className="text-xs text-[var(--text-muted)]">
                              {dueTime}
                            </span>
                          )}
                          {course && (
                            <span className="text-xs text-[var(--text-muted)]">
                              {course.code}
                            </span>
                          )}
                        </div>
                        {t.links && t.links.length > 0 && (
                          <div className="flex flex-col mt-2" style={{ gap: '0px' }}>
                            {t.links.map((link: any) => (
                              <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[var(--link)] hover:text-blue-400"
                              >
                                {link.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="p-1.5 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors -ml-2"
                          title="Delete task"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div style={{ paddingTop: '16px', display: 'flex', gap: '8px' }}>
                  {!showTaskForm && (
                    <Button variant="secondary" size="sm" onClick={() => setShowTaskForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px', color: settings.theme === 'light' ? '#000000 !important' : 'var(--text)' }}>
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

            {/* Task Form */}
            {showTaskForm && (
              <div style={{ marginTop: '12px' }}>
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
                  <div className="grid grid-cols-2 gap-4" style={{ paddingTop: '12px' }}>
                    <CalendarPicker
                      label="Due Date (optional)"
                      value={taskFormData.dueDate}
                      onChange={(date) => setTaskFormData({ ...taskFormData, dueDate: date })}
                    />
                    <TimePicker
                      label="Due Time (optional)"
                      value={taskFormData.dueTime}
                      onChange={(time) => setTaskFormData({ ...taskFormData, dueTime: time })}
                    />
                  </div>
                  <div style={{ paddingTop: '12px' }}>
                    <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '4px' }}>Links (optional)</label>
                    <div className="space-y-2">
                      {taskFormData.links.map((link, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Input
                            type="text"
                            value={link.label}
                            onChange={(e) => {
                              const newLinks = [...taskFormData.links];
                              newLinks[idx].label = e.target.value;
                              setTaskFormData({ ...taskFormData, links: newLinks });
                            }}
                            placeholder="Label"
                            className="w-24"
                            style={{ marginBottom: '0' }}
                          />
                          <Input
                            type="text"
                            value={link.url}
                            onChange={(e) => {
                              const newLinks = [...taskFormData.links];
                              newLinks[idx].url = e.target.value;
                              setTaskFormData({ ...taskFormData, links: newLinks });
                            }}
                            placeholder="example.com"
                            className="flex-1"
                            style={{ marginBottom: '0' }}
                          />
                          {taskFormData.links.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setTaskFormData({
                                  ...taskFormData,
                                  links: taskFormData.links.filter((_, i) => i !== idx),
                                });
                              }}
                              className="text-[var(--muted)] hover:text-[var(--danger)]"
                              style={{ padding: '4px' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {taskFormData.links.length < 3 && (
                      <button
                        type="button"
                        onClick={() => {
                          setTaskFormData({
                            ...taskFormData,
                            links: [...taskFormData.links, { label: '', url: '' }],
                          });
                        }}
                        className="text-xs text-[var(--link)] hover:text-blue-400 mt-1"
                      >
                        + Add link
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3" style={{ paddingTop: '8px' }}>
                    <Button
                      variant="primary"
                      type="submit"
                      size="sm"
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
                      {editingTaskId ? 'Save Changes' : 'Add Task'}
                    </Button>
                    <Button variant="secondary" type="button" onClick={cancelEditTask} size="sm">
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}
            </Card>
          </div>
          )}

          {/* Quick Links */}
          {visibleDashboardCards.includes(DASHBOARD_CARDS.QUICK_LINKS) && (
          <div className={`${getDashboardCardSpan(DASHBOARD_CARDS.QUICK_LINKS, visibleDashboardCards)} lg:flex`}>
            <Card title="Quick Links" subtitle={settings.university ? `Resources for ${settings.university}` : 'Select a college to view quick links'} className="h-full flex flex-col w-full">
              {settings.university ? (
                <div className="grid grid-cols-2 gap-3">
                  {quickLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-[12px] text-center text-sm font-medium transition-colors hover:opacity-80"
                      style={{ display: 'block', padding: '12px', backgroundColor: settings.theme === 'light' ? 'var(--panel)' : 'var(--panel-2)', color: 'var(--text)', border: '2px solid var(--border)' }}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Quick Links"
                  description="Go to settings to select a university to add quick links."
                  action={{
                    label: "Go to Settings",
                    onClick: () => window.location.href = '/settings'
                  }}
                />
              )}
            </Card>
          </div>
          )}

          {/* Upcoming This Week - Full Width */}
          {visibleDashboardCards.includes(DASHBOARD_CARDS.UPCOMING_WEEK) && (
          <div className={`${getDashboardCardSpan(DASHBOARD_CARDS.UPCOMING_WEEK, visibleDashboardCards)} lg:flex`}>
            <Card title="Upcoming This Week" subtitle="Your schedule for the next 7 days" className="h-full flex flex-col w-full">
              {(() => {
                // Get classes for the next 7 days, including days with no classes
                const daysList: Array<{ dateKey: string; date: Date; classes: Array<any> }> = [];
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                for (let i = 0; i < 7; i++) {
                  const date = new Date(today);
                  date.setDate(date.getDate() + i);
                  const dateKey = date.toISOString().split('T')[0];
                  const dayIndex = date.getDay();
                  const dayAbbrev = dayNames[dayIndex];

                  const classesOnDay = courses
                    .filter((course) => isCourseCurrent(course, date))
                    .flatMap((course) =>
                      (course.meetingTimes || [])
                        .filter((mt) => mt.days?.includes(dayAbbrev))
                        .map((mt) => ({
                          ...mt,
                          courseCode: course.code,
                          courseName: course.name,
                          courseLinks: course.links,
                        }))
                    )
                    .sort((a, b) => a.start.localeCompare(b.start));

                  daysList.push({
                    dateKey,
                    date,
                    classes: classesOnDay,
                  });
                }

                const hasAnyClasses = daysList.some((day) => day.classes.length > 0);

                return hasAnyClasses ? (
                  <div style={{ padding: '0 -24px' }}>
                    {daysList.map(({ dateKey, date, classes }) => {
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      return (
                        <div key={dateKey} style={{ paddingBottom: '28px' }}>
                          <div className="text-base font-semibold text-[var(--text)] uppercase tracking-wide" style={{ marginBottom: classes.length > 0 ? '12px' : '6px' }}>
                            {dayName}, {dateStr}
                          </div>
                          {classes.length > 0 ? (
                            <div style={{ paddingLeft: '8px' }}>
                              {classes.map((cls, idx) => (
                                <div key={idx} style={{ marginBottom: idx !== classes.length - 1 ? '16px' : '0px' }}>
                                  <div className="text-sm font-medium text-[var(--text)]">
                                    {cls.courseCode}{cls.courseName ? ` - ${cls.courseName}` : ''}
                                  </div>
                                  <div className="text-sm text-[var(--text-secondary)]" style={{ marginTop: '3px' }}>
                                    {formatTime12Hour(cls.start)} – {formatTime12Hour(cls.end)}
                                  </div>
                                  <div className="text-sm text-[var(--text-secondary)]" style={{ marginTop: '2px' }}>
                                    {cls.location}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-[var(--text-muted)]">No classes</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState title="No classes this week" description="You have a free week ahead!" />
                );
              })()}
            </Card>
          </div>
          )}
        </div>
      </div>
    </>
  );
}
