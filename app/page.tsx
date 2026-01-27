'use client';

import { useSession } from 'next-auth/react';
import LandingPage from '@/components/LandingPage';
import AuthenticatedDashboard from '@/components/AuthenticatedDashboard';

export default function HomePage() {
  const { status } = useSession();

  if (status === 'loading') {
    return null;
  }

  if (status === 'unauthenticated') {
    return <LandingPage />;
  }

  return <AuthenticatedDashboard />;
}
