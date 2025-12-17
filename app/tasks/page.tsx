'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { isToday, formatDate } from '@/lib/utils';

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
    return <div className="p-6">Loading...</div>;
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
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Task
        </button>
      </div>

      <div className="flex gap-2">
        {['all', 'today', 'done'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded px-3 py-1 text-sm ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950"
        >
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Task title"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            required
          />
          <div className="mt-2 flex gap-2">
            <select
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              className="w-1/3 rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">No Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={formData.dueAt}
              onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
              placeholder="Due (optional)"
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notes (optional)"
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            rows={2}
          />
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {filtered.map((t) => {
          const course = courses.find((c) => c.id === t.courseId);
          return (
            <div
              key={t.id}
              className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={t.status === 'done'}
                  onChange={() => toggleTaskDone(t.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div
                    className={`font-semibold ${
                      t.status === 'done'
                        ? 'line-through text-gray-500'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {t.title}
                  </div>
                  {t.dueAt && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Due: {formatDate(t.dueAt)}
                    </div>
                  )}
                  {course && (
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {course.code}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleTaskPin(t.id)}
                    className={`text-xs ${
                      t.pinned
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    📌
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this task?')) {
                        deleteTask(t.id);
                      }
                    }}
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
