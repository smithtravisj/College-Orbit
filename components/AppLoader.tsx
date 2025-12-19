'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';

export default function AppLoader({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const startTime = Date.now();
      await useAppStore.getState().initializeStore();

      // Ensure loading screen displays for at least 800ms
      const elapsedTime = Date.now() - startTime;
      const minDisplayTime = 800;

      if (elapsedTime < minDisplayTime) {
        await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsedTime));
      }

      setIsInitialized(true);
    };
    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .loader-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 20px;
          }
        `}</style>
        <div className="loader-spinner" />
        <div style={{ color: 'var(--text)', fontSize: '16px', fontWeight: '500', letterSpacing: '0.05em' }}>
          Loading
          <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>.</span>
          <span style={{ animation: 'pulse 1.5s ease-in-out infinite 0.3s' }}>.</span>
          <span style={{ animation: 'pulse 1.5s ease-in-out infinite 0.6s' }}>.</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
