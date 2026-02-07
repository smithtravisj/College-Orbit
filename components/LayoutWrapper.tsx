'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Navigation from './Navigation';
import { MobileHeader } from './MobileHeader';
import { FloatingMenuButton } from './FloatingMenuButton';
import { QuickAddButton } from './QuickAddButton';
import MiniPomodoroPlayer from './MiniPomodoroPlayer';
import { MiniSpotifyPlayer, SpotifySyncManager } from './spotify';
import { CanvasSyncManager } from './CanvasSyncManager';
import { BlackboardSyncManager } from './BlackboardSyncManager';
import { MoodleSyncManager } from './MoodleSyncManager';
import { BrightspaceSyncManager } from './BrightspaceSyncManager';
import { AchievementToastContainer, LevelUpToast, Confetti, ChallengeToastContainer } from './gamification';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAnalyticsPageView } from '@/lib/useAnalytics';
import useAppStore from '@/lib/store';
import { usePomodoroContext } from '@/context/PomodoroContext';
import styles from './LayoutWrapper.module.css';
import BackgroundDecoration from './BackgroundDecoration';
import KeyboardShortcutsProvider from './KeyboardShortcutsProvider';
import PetCompanion from './pet/PetCompanion';

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { status } = useSession();
  const loadFromDatabase = useAppStore((state) => state.loadFromDatabase);
  const pendingAchievements = useAppStore((state) => state.pendingAchievements);
  const pendingChallengeToasts = useAppStore((state) => state.pendingChallengeToasts);
  const showConfetti = useAppStore((state) => state.showConfetti);
  const levelUpNotification = useAppStore((state) => state.levelUpNotification);
  const dismissAchievement = useAppStore((state) => state.dismissAchievement);
  const dismissChallengeToast = useAppStore((state) => state.dismissChallengeToast);
  const setShowConfetti = useAppStore((state) => state.setShowConfetti);
  const dismissLevelUp = useAppStore((state) => state.dismissLevelUp);
  const isRefreshing = useRef(false);
  const { hasActiveSession: hasPomodoroSession, isMiniPlayerDismissed } = usePomodoroContext();
  const [toolsTab, setToolsTab] = useState<string>('productivity');

  // Track tools tab for mini player visibility
  useEffect(() => {
    const updateToolsTab = () => {
      const saved = localStorage.getItem('toolsTab');
      if (saved) setToolsTab(saved);
    };

    updateToolsTab();

    // Listen for storage changes (when tab changes on tools page)
    window.addEventListener('storage', updateToolsTab);

    // Also poll for changes since storage event doesn't fire in same tab
    const interval = setInterval(updateToolsTab, 500);

    return () => {
      window.removeEventListener('storage', updateToolsTab);
      clearInterval(interval);
    };
  }, []);

  // Show mini player when timer session is active, not dismissed, and either:
  // - Not on tools page, OR
  // - On tools page but on flashcards or grades tab (not productivity where Pomodoro is)
  const isOnToolsPage = pathname?.startsWith('/tools');
  const isOnPomodoroTab = isOnToolsPage && toolsTab === 'productivity';
  const showMiniPlayer = hasPomodoroSession && !isMiniPlayerDismissed && !isOnPomodoroTab;

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
  const isPartnerPage = pathname === '/clubs' || pathname === '/educators' || pathname === '/partners';
  const isPublicPage = pathname === '/privacy' || pathname === '/terms';
  const isPricingPage = pathname === '/pricing' && status === 'unauthenticated';

  // Partner pages - always full screen, no navigation (even for authenticated users)
  if (isPartnerPage) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg)' }}>
        {children}
      </div>
    );
  }

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
  const gamificationOverlays = (
    <>
      <AchievementToastContainer
        achievements={pendingAchievements}
        onDismiss={dismissAchievement}
      />
      <ChallengeToastContainer
        toasts={pendingChallengeToasts}
        onDismiss={dismissChallengeToast}
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
        <SpotifySyncManager />
        <MobileHeader />
        <Navigation />
        <QuickAddButton />
        <FloatingMenuButton />
        {showMiniPlayer && <MiniPomodoroPlayer />}
        <MiniSpotifyPlayer />
        <main className={styles.mobileMain}>
          {children}
        </main>
        <PetCompanion />
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
        <SpotifySyncManager />
        <Navigation />
        <QuickAddButton />
        {showMiniPlayer && <MiniPomodoroPlayer />}
        <MiniSpotifyPlayer />
        <main style={{ marginLeft: '224px', minWidth: 0 }}>
          {children}
        </main>
        <PetCompanion />
        {gamificationOverlays}
      </div>
    </KeyboardShortcutsProvider>
  );
}
