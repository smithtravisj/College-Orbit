'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';
import Navigation from './Navigation';

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isUnauthenticated = !session;
  const showSidebar = !(isAuthPage && isUnauthenticated);

  if (isAuthPage && isUnauthenticated) {
    // Full-width centered layout for login/signup
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    );
  }

  // Standard layout with sidebar for authenticated users
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'grid', gridTemplateColumns: '264px 1fr', gap: 0 }}>
      <Navigation />
      <main style={{ minWidth: 0, paddingBottom: '80px' }}>
        {children}
      </main>
    </div>
  );
}
