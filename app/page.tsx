'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { isToday, formatTime, isOverdue } from '@/lib/utils';
import CaptureInput from '@/components/CaptureInput';
import Card from '@/components/Card';
import Link from 'next/link';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const { courses, deadlines, tasks, settings, initializeStore } = useAppStore();

  useEffect(() => {
    initializeStore();
    setMounted(true);
  }, [initializeStore]);

  if (!mounted) {
    return <div className="p-6">Loading...</div>;
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
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const nextClass = todayClasses
    .filter((c) => c.start > nowTime)
    .sort((a, b) => a.start.localeCompare(b.start))[0] || null;

  // Get due soon items
  const dueSoon = deadlines
    .filter((d) => {
      const dueDate = new Date(d.dueAt);
      const windowEnd = new Date();
      windowEnd.setDate(
        windowEnd.getDate() + settings.dueSoonWindowDays
      );
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
    .flatMap((c) => c.links.map((l) => ({ ...l, courseId: c.id })))
    .slice(0, 6);

  // Status summary
  const classesLeft = todayClasses
    .filter((c) => c.start > nowTime)
    .length;
  const overdueCount = deadlines.filter(
    (d) => isOverdue(d.dueAt) && d.status === 'open'
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            Welcome back. Here's your schedule and tasks for today.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid gap-6 md:grid-cols-2">
        {/* Next Class */}
        <Card title="Next Class">
          {nextClass ? (
            <div className="space-y-2">
              <div className="text-sm font-semibold">
                {nextClass.start} - {nextClass.end}
              </div>
              <div className="text-lg font-bold">{nextClass.courseCode}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {nextClass.location}
              </div>
              <div className="mt-3 flex gap-2">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    nextClass.location || ''
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                >
                  Directions
                </a>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              No classes today
            </div>
          )}
        </Card>

        {/* Due Soon */}
        <Card title="Due Soon">
          {dueSoon.length > 0 ? (
            <ul className="space-y-2">
              {dueSoon.map((d) => {
                const course = courses.find((c) => c.id === d.courseId);
                const isOverd = isOverdue(d.dueAt);
                return (
                  <li
                    key={d.id}
                    className="border-l-2 border-red-500 py-1 pl-2 text-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {isOverd && (
                          <span className="inline-block bg-red-100 px-2 py-1 text-xs font-bold text-red-700 dark:bg-red-900 dark:text-red-200">
                            ■ OVERDUE
                          </span>
                        )}
                        <div className="font-semibold">{d.title}</div>
                        {course && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {course.code}
                          </div>
                        )}
                      </div>
                      <div className="whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                        {formatTime(d.dueAt)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              No deadlines soon
            </div>
          )}
        </Card>
      </div>

      {/* Today Tasks */}
      <Card title="Today Tasks">
        {todayTasks.length > 0 || pinnedTask ? (
          <ul className="space-y-2">
            {pinnedTask && (
              <li className="rounded bg-blue-50 p-2 dark:bg-blue-950">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={pinnedTask.status === 'done'}
                    readOnly
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-bold">📌 {pinnedTask.title}</div>
                  </div>
                </div>
              </li>
            )}
            {todayTasks.slice(0, 7).map((t) => (
              <li key={t.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={t.status === 'done'}
                  readOnly
                  className="mt-1"
                />
                <span
                  className={`text-sm ${
                    t.status === 'done'
                      ? 'line-through text-gray-500'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {t.title}
                </span>
              </li>
            ))}
            {todayTasks.length > 7 && (
              <li className="text-xs text-blue-600 dark:text-blue-400">
                <Link href="/tasks">View all →</Link>
              </li>
            )}
          </ul>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            No tasks today
          </div>
        )}
      </Card>

      {/* Quick Links */}
      <Card title="Quick Links">
        {quickLinks.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Add course links in Courses page
          </div>
        )}
      </Card>

      {/* Capture Input */}
      <CaptureInput />

      {/* Status Summary */}
      <Card title="Status">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <div>
            {classesLeft} class{classesLeft !== 1 ? 'es' : ''} left,{' '}
            {dueSoon.length} due soon
            {overdueCount > 0 && `, ${overdueCount} overdue`}
          </div>
        </div>
      </Card>
      </div>
      </div>
    </div>
  );
}
