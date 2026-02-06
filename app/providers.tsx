'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import BrowserTitle from '@/components/BrowserTitle';
import AppLoader from '@/components/AppLoader';
import SessionRegistrar from '@/components/SessionRegistrar';
import { MobileNavProvider } from '@/context/MobileNavContext';
import { PomodoroProvider } from '@/context/PomodoroContext';
import { DeleteToastProvider } from '@/components/DeleteToastProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <MobileNavProvider>
        <PomodoroProvider>
          <AppLoader>
            <BrowserTitle />
            <SessionRegistrar />
            {children}
            <DeleteToastProvider />
          </AppLoader>
        </PomodoroProvider>
      </MobileNavProvider>
    </SessionProvider>
  );
}
