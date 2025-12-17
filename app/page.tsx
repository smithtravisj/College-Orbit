'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { isToday, formatTime, isOverdue } from '@/lib/utils';
import CaptureInput from '@/components/CaptureInput';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { MapPin, ExternalLink } from 'lucide-react';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const { courses, deadlines, tasks, settings, initializeStore } = useAppStore();

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

  // Get today's tasks
  const todayTasks = tasks
    .filter((t) => t.dueAt && isToday(t.dueAt) && t.status === 'open')
    .sort((_a, b) => (b.pinned ? 1 : -1));

  const pinnedTask = tasks.find((t) => t.pinned);

  // Get quick links
  const quickLinks = courses
    .flatMap((c) => c.links.map((l) => ({ ...l, courseId: c.id, courseName: c.name })))
    .slice(0, 6);

  // Status summary
  const classesLeft = todayClasses.filter((c) => c.start > nowTime).length;
  const overdueCount = deadlines.filter((d) => isOverdue(d.dueAt) && d.status === 'open').length;

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
          <div className="col-span-12 lg:col-span-8 h-full min-h-[240px]">
            <Card title="Today's Tasks" className="h-full flex flex-col">
                {todayTasks.length > 0 || pinnedTask ? (
                  <div className="space-y-4">
                    {pinnedTask && (
                      <div className="mb-3 pb-3 border-b border-[var(--border)] last:border-0">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={pinnedTask.status === 'done'}
                            readOnly
                            className="mt-1 w-4 h-4 accent-[var(--accent)] cursor-default"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-[var(--accent)]">{pinnedTask.title}</div>
                            <span className="inline-block text-xs text-[var(--text-muted)] mt-1 bg-[var(--panel-2)] px-2 py-0.5 rounded">
                              Pinned
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {todayTasks.slice(0, 5).map((t, idx) => (
                      <div
                        key={t.id}
                        className={`py-5 flex items-start gap-4 ${
                          idx < Math.min(5, todayTasks.length) - 1 ? 'border-b border-[var(--border)]' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={t.status === 'done'}
                          readOnly
                          className="mt-1 w-4 h-4 accent-[var(--accent)] cursor-default"
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm ${
                              t.status === 'done'
                                ? 'line-through text-[var(--text-muted)]'
                                : 'text-[var(--text)]'
                            }`}
                          >
                            {t.title}
                          </div>
                        </div>
                      </div>
                    ))}
                    {todayTasks.length > 5 && (
                      <div className="pt-3 border-t border-[var(--border)]">
                        <Link
                          href="/tasks"
                          className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
                        >
                          View all tasks →
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState title="No tasks today" description="Add a task to get started" />
                )}
              </Card>
          </div>

          {/* Quick Links */}
          <div className="col-span-12 lg:col-span-4 h-full min-h-[240px]">
            <Card title="Quick Links" className="h-full flex flex-col">
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

          {/* Capture Input */}
          <div className="col-span-12 min-h-[120px]">
            <CaptureInput />
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
