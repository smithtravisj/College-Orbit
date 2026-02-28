'use client';

import { Suspense } from 'react';
import CalendarContent from '@/components/calendar/CalendarContent';
import PremiumGate from '@/components/subscription/PremiumGate';
import { PageSkeleton } from '@/components/ui/Skeleton';

export default function CalendarPage() {
  return (
    <PremiumGate feature="Calendar">
      <Suspense fallback={<PageSkeleton cards={1} headerWidth="25%" />}>
        <CalendarContent />
      </Suspense>
    </PremiumGate>
  );
}
