'use client';

import { useEffect } from 'react';
import { useSpotifyContext } from '@/context/SpotifyContext';

/**
 * Background component that manages Spotify sync lifecycle.
 * The actual polling logic is in SpotifyContext.
 * This component handles additional sync behaviors like:
 * - Refreshing status when the user returns to the app after a long time
 * - Handling storage events for cross-tab synchronization
 */
export function SpotifySyncManager() {
  const { isConnected, refreshStatus } = useSpotifyContext();

  // Re-sync when the user comes back to the app after being away
  useEffect(() => {
    if (!isConnected) return;

    let lastActiveTime = Date.now();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const now = Date.now();
        const timeSinceActive = now - lastActiveTime;

        // If more than 30 seconds have passed, refresh status
        if (timeSinceActive > 30000) {
          refreshStatus();
        }
      } else {
        lastActiveTime = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, refreshStatus]);

  // Listen for storage changes (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'spotifyMiniPlayerDismissed' || e.key === 'spotifyMiniPlayerSize') {
        // Context already handles localStorage, but we could trigger a refresh here if needed
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // This is a background component, no UI
  return null;
}
