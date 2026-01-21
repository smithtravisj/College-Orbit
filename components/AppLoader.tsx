'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { applyCustomColors, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';

export default function AppLoader({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLightMode, setIsLightMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('app-theme');
      // Migrate 'system' to 'dark' (system theme removed in v1.2.6)
      const theme = storedTheme === 'system' ? 'dark' : storedTheme;
      const result = theme === 'light';

      // Apply cached colors immediately to prevent flicker
      const cachedIsPremium = localStorage.getItem('app-isPremium') === 'true';
      const cachedUseCustomTheme = localStorage.getItem('app-useCustomTheme') === 'true';
      const cachedCustomColorsStr = localStorage.getItem('app-customColors');

      if (cachedIsPremium && cachedUseCustomTheme && cachedCustomColorsStr) {
        try {
          const customColors = JSON.parse(cachedCustomColorsStr);
          const effectiveTheme = (theme || 'dark') as 'light' | 'dark';
          const colorSet = getCustomColorSetForTheme(customColors as CustomColors, effectiveTheme);
          applyCustomColors(colorSet, effectiveTheme);
        } catch (e) {
          console.warn('[AppLoader] Failed to parse cached custom colors:', e);
        }
      }

      return result;
    }
    return false;
  });

  useEffect(() => {
    // Mark as hydrated after mount
    setIsHydrated(true);

    const initialize = async () => {
      await useAppStore.getState().initializeStore();
      setIsInitialized(true);
    };
    initialize();
  }, []);

  // Listen for theme changes via storage events (when changed in another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-theme') {
        setIsLightMode(e.newValue === 'light');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Don't render loading screen during initial SSR/hydration
  // Only render after hydration completes to avoid mismatch
  if (!isHydrated) {
    return null;
  }

  if (!isInitialized) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isLightMode ? '#f5f5f5' : '#0b0f14',
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
            background-color: var(--accent, #6ba5d9);
            opacity: 0.6;
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
          color: isLightMode ? '#2a2a2a' : '#e6edf6',
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
