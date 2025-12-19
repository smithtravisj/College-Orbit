'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import BrowserTitle from '@/components/BrowserTitle';
import AppLoader from '@/components/AppLoader';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppLoader>
        <BrowserTitle />
        {children}
      </AppLoader>
    </SessionProvider>
  );
}
