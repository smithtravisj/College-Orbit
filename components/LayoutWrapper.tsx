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

  if (isAuthPage && isUnauthenticated) {
    // Full-width centered layout for login/signup
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflow: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '550px' }}>
          {children}
        </div>
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
