'use client';

import { useEffect, useState, useRef } from 'react';
import useAppStore from '@/lib/store';
import Card from './Card';

export default function CaptureInput() {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTask, addDeadline } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && e.ctrlKey === false && e.metaKey === false) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Simple parsing: if it contains a date-like pattern, treat as deadline
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isDeadline = input.match(/\b(today|tomorrow|mon|tue|wed|thu|fri|sat|sun)\b/i);
    const title = input.replace(/\s*(today|tomorrow|\d+:\d+\s*[ap]m?)\s*$/i, '').trim();

    if (isDeadline && title) {
      const dueDate = input.includes('tomorrow') ? tomorrow : today;
      addDeadline({
        title,
        courseId: null,
        dueAt: new Date(
          dueDate.getFullYear(),
          dueDate.getMonth(),
          dueDate.getDate(),
          17,
          0,
          0
        ).toISOString(),
        notes: '',
        link: null,
        status: 'open',
      });
    } else if (title) {
      addTask({
        title,
        courseId: null,
        dueAt: null,
        pinned: false,
        checklist: [],
        notes: '',
        status: 'open',
      });
    }

    setInput('');
    inputRef.current?.focus();
  };

  return (
    <Card title="Add Task or Deadline">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What needs to be done..."
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
          <button
            type="submit"
            className="btn btn-primary"
          >
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Tip: Type "tomorrow" or "today" for quick deadlines
        </p>
      </form>
    </Card>
  );
}
