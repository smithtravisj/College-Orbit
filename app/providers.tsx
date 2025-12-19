'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import BrowserTitle from '@/components/BrowserTitle';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <BrowserTitle />
      {children}
    </SessionProvider>
  );
}
