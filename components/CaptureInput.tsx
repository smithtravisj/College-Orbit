'use client';

import { useEffect, useState, useRef } from 'react';
import useAppStore from '@/lib/store';
import Card from './ui/Card';
import Button from './ui/Button';
import { Plus } from 'lucide-react';

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
    <Card>
      <form onSubmit={handleSubmit} className="flex items-center gap-5">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What needs to be done..."
          className="flex-1 h-11 bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--muted)] rounded-[var(--radius-control)] transition-colors focus:outline-none focus:border-[var(--border-active)] focus:ring-2 focus:ring-[var(--ring)]"
          style={{ padding: '8px 12px' }}
        />
        <Button variant="primary" size="md" type="submit">
          <Plus size={18} />
          Add
        </Button>
      </form>
      <p className="text-xs text-[var(--muted)]" style={{ marginTop: '16px' }}>
        Tip: Type "tomorrow" or "today" for quick deadlines
      </p>
    </Card>
  );
}
