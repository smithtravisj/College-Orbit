'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import BrowserTitle from '@/components/BrowserTitle';
import AppLoader from '@/components/AppLoader';
import { MobileNavProvider } from '@/context/MobileNavContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <MobileNavProvider>
        <AppLoader>
          <BrowserTitle />
          {children}
        </AppLoader>
      </MobileNavProvider>
    </SessionProvider>
  );
}
