'use client';

import { Suspense } from 'react';
import CalendarContent from '@/components/calendar/CalendarContent';

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    }>
      <CalendarContent />
    </Suspense>
  );
}
