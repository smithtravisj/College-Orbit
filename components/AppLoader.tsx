'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';

export default function AppLoader({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const loading = useAppStore((state) => state.loading);
  const initializeStore = useAppStore((state) => state.initializeStore);

  useEffect(() => {
    const initialize = async () => {
      await initializeStore();
      setIsInitialized(true);
    };
    initialize();
  }, [initializeStore]);

  if (!isInitialized || loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
