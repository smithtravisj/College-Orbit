'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Navigation from './Navigation';
import { MobileHeader } from './MobileHeader';
import { FloatingMenuButton } from './FloatingMenuButton';
import { QuickAddButton } from './QuickAddButton';
import { CanvasSyncManager } from './CanvasSyncManager';
import { BlackboardSyncManager } from './BlackboardSyncManager';
import { MoodleSyncManager } from './MoodleSyncManager';
import { BrightspaceSyncManager } from './BrightspaceSyncManager';
import { AchievementToastContainer, LevelUpToast, Confetti } from './gamification';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { useAnalyticsPageView } from '@/lib/useAnalytics';
import useAppStore from '@/lib/store';
import styles from './LayoutWrapper.module.css';
import BackgroundDecoration from './BackgroundDecoration';
import KeyboardShortcutsProvider from './KeyboardShortcutsProvider';

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { status } = useSession();
  const loadFromDatabase = useAppStore((state) => state.loadFromDatabase);
  const pendingAchievements = useAppStore((state) => state.pendingAchievements);
  const showConfetti = useAppStore((state) => state.showConfetti);
  const levelUpNotification = useAppStore((state) => state.levelUpNotification);
  const dismissAchievement = useAppStore((state) => state.dismissAchievement);
  const setShowConfetti = useAppStore((state) => state.setShowConfetti);
  const dismissLevelUp = useAppStore((state) => state.dismissLevelUp);
  const { hasAccessToFeature } = useBetaAccess();
  const hasGamification = hasAccessToFeature('1.2.0');
  const isRefreshing = useRef(false);

  // Track page views for analytics
  useAnalyticsPageView();

  // Mobile auto-refresh: poll database every 60 seconds and refresh on visibility change
  useEffect(() => {
    if (!isMobile || status !== 'authenticated') return;

    let interval: ReturnType<typeof setInterval> | null = null;

    const refreshData = async () => {
      if (isRefreshing.current) return;
      isRefreshing.current = true;
      try {
        await loadFromDatabase();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      } finally {
        isRefreshing.current = false;
      }
    };

    // Delay polling start by 10s to let initial load complete (Safari mobile performance)
    const startDelay = setTimeout(() => {
      // Poll every 60 seconds (reduced from 10s for Safari mobile performance)
      interval = setInterval(refreshData, 60000);
    }, 10000);

    // Also refresh when app comes back to foreground
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(startDelay);
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMobile, status, loadFromDatabase]);

  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password';
  const isPublicPage = pathname === '/privacy' || pathname === '/terms';
  const isPricingPage = pathname === '/pricing' && status === 'unauthenticated';

  // Landing page detection - show for unauthenticated users on root path
  // Wait for session to be determined (not loading) before deciding
  const isLandingPage = pathname === '/' && status === 'unauthenticated';

  // Landing page - full screen, no navigation
  if (isLandingPage) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg)' }}>
        {children}
      </div>
    );
  }

  if (isAuthPage) {
    // Full-width centered layout for login/signup
    return (
      <>
        <style>{`
          :root {
            --bg: #0a0a0b !important;
            --panel: #111113 !important;
            --panel-2: #0f0f11 !important;
            --border: #252528 !important;
            --text: #fafafa !important;
            --text-muted: #a1a1aa !important;
          }
        `}</style>
        <div style={{ minHeight: '100dvh', width: '100%', backgroundColor: '#0a0a0b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 16px', overflowY: 'auto', zIndex: 50 }}>
          <div style={{ width: '100%', maxWidth: '550px' }}>
            {children}
          </div>
        </div>
      </>
    );
  }

  if (isPublicPage || isPricingPage) {
    // Full-width layout for public pages (privacy, terms, pricing for unauthenticated)
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg)' }}>
        {children}
      </div>
    );
  }

  // Gamification overlays (toasts and confetti)
  const gamificationOverlays = hasGamification && (
    <>
      <AchievementToastContainer
        achievements={pendingAchievements}
        onDismiss={dismissAchievement}
      />
      {levelUpNotification && (
        <LevelUpToast
          level={levelUpNotification}
          onDismiss={dismissLevelUp}
        />
      )}
      <Confetti
        active={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </>
  );

  // Mobile layout with header
  if (isMobile) {
    return (
      <KeyboardShortcutsProvider>
        <BackgroundDecoration />
        <CanvasSyncManager />
        <BlackboardSyncManager />
        <MoodleSyncManager />
        <BrightspaceSyncManager />
        <MobileHeader />
        <Navigation />
        <QuickAddButton />
        <FloatingMenuButton />
        <main className={styles.mobileMain}>
          {children}
        </main>
        {gamificationOverlays}
      </KeyboardShortcutsProvider>
    );
  }

  // Desktop layout with floating sidebar
  return (
    <KeyboardShortcutsProvider>
      <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg)' }}>
        <BackgroundDecoration />
        <CanvasSyncManager />
        <BlackboardSyncManager />
        <MoodleSyncManager />
        <BrightspaceSyncManager />
        <Navigation />
        <QuickAddButton />
        <main style={{ marginLeft: '224px', minWidth: 0 }}>
          {children}
        </main>
        {gamificationOverlays}
      </div>
    </KeyboardShortcutsProvider>
  );
}
