'use client';

import { Suspense } from 'react';
import CalendarContent from '@/components/calendar/CalendarContent';
import PremiumGate from '@/components/subscription/PremiumGate';

export default function CalendarPage() {
  return (
    <PremiumGate feature="Calendar">
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
        </div>
      }>
        <CalendarContent />
      </Suspense>
    </PremiumGate>
  );
}
