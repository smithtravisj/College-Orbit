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
    <Card title="Quick Capture">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add task or deadline... (press / to focus)"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-500 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
          />
          <button
            type="submit"
            className="btn btn-primary"
          >
            Add
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          💡 Tip: Type "tomorrow" or "today" for quick deadlines
        </p>
      </form>
    </Card>
  );
}
