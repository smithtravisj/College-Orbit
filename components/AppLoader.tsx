'use client';

import { useEffect, useState, useRef } from 'react';
import useAppStore from '@/lib/store';
import { applyCustomColors, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';

const MAX_LOAD_TIME = 30000; // 30 seconds max before forcing render

export default function AppLoader({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isInitializedRef = useRef(false);
  const [isLightMode, setIsLightMode] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
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
      } catch (e) {
        console.warn('[AppLoader] Failed to read localStorage:', e);
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    // Mark as hydrated after mount
    setIsHydrated(true);

    // Set a timeout to force render if initialization takes too long
    const timeoutId = setTimeout(() => {
      if (!isInitializedRef.current) {
        console.error('[AppLoader] Initialization timed out after 30s, forcing render');
        setLoadError('Loading took too long. Some features may not work correctly.');
        setIsInitialized(true);
        isInitializedRef.current = true;
      }
    }, MAX_LOAD_TIME);

    const initialize = async () => {
      try {
        await useAppStore.getState().initializeStore();
        if (!isInitializedRef.current) {
          setIsInitialized(true);
          isInitializedRef.current = true;
        }
      } catch (error) {
        console.error('[AppLoader] Failed to initialize:', error);
        if (!isInitializedRef.current) {
          setLoadError('Failed to load app data. Please refresh the page.');
          setIsInitialized(true);
          isInitializedRef.current = true;
        }
      }
    };
    initialize();

    return () => clearTimeout(timeoutId);
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

  // Show error banner if there was a loading issue
  if (loadError) {
    return (
      <>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fef3c7',
          color: '#92400e',
          padding: '12px 16px',
          textAlign: 'center',
          fontSize: '14px',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}>
          <span>{loadError}</span>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#92400e',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Refresh
          </button>
        </div>
        <div style={{ paddingTop: '48px' }}>
          {children}
        </div>
      </>
    );
  }

  return <>{children}</>;
}
