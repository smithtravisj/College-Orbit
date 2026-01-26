'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Deadlines have been merged into the Work page
// This page redirects to /work for backwards compatibility
export default function DeadlinesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/work');
  }, [router]);

  return null;
}
