'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';

export default function AppLoader({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await useAppStore.getState().initializeStore();
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
          @keyframes wave {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-16px); }
          }
          .dots-line {
            display: flex;
            gap: 12px;
            margin-bottom: 32px;
          }
          .dot {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: #1a2f8a;
            animation: wave 1.2s ease-in-out infinite;
          }
          .dot:nth-child(1) { animation-delay: 0s; }
          .dot:nth-child(2) { animation-delay: 0.1s; }
          .dot:nth-child(3) { animation-delay: 0.2s; }
          .dot:nth-child(4) { animation-delay: 0.3s; }
          .dot:nth-child(5) { animation-delay: 0.4s; }
          .dot:nth-child(6) { animation-delay: 0.5s; }
          .dot:nth-child(7) { animation-delay: 0.6s; }
        `}</style>
        <div style={{
          color: '#1a2f8a',
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '48px'
        }}>
          Loading
        </div>
        <div className="dots-line">
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className="dot" />
          ))}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
