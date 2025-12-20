'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import Navigation from './Navigation';
import { useAnalyticsPageView } from '@/lib/useAnalytics';

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Track page views for analytics
  useAnalyticsPageView();

  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password';
  const isPublicPage = pathname === '/privacy' || pathname === '/terms';

  if (isAuthPage) {
    // Full-width centered layout for login/signup
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 16px', overflowY: 'auto', zIndex: 50 }}>
        <div style={{ width: '100%', maxWidth: '550px' }}>
          {children}
        </div>
      </div>
    );
  }

  if (isPublicPage) {
    // Full-width layout for public pages (privacy, terms)
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
        {children}
      </div>
    );
  }

  // Standard layout with sidebar for authenticated users
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '264px 1fr', gap: 0, minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navigation />
      <main style={{ minWidth: 0, paddingBottom: '80px' }}>
        {children}
      </main>
    </div>
  );
}
