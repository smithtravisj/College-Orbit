'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Sync intervals and thresholds (in milliseconds)
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes while active
const STALE_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours - sync if last sync was longer ago
const MIN_SYNC_GAP = 60 * 1000; // Minimum 1 minute between syncs

/**
 * CanvasSyncManager - Handles automatic Canvas LMS synchronization
 *
 * Syncs automatically when:
 * 1. User logs in / loads the app / refreshes the page (always)
 * 2. User returns to the tab after being away (if last sync > 2 hours ago)
 * 3. Periodically while the app is open (every 5 minutes)
 */
export function CanvasSyncManager() {
  const { status } = useSession();
  const syncInProgress = useRef(false);
  const lastSyncAttempt = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const performSync = useCallback(async (reason: string) => {
    // Prevent concurrent syncs and rate limit
    if (syncInProgress.current) {
      console.log('[CanvasSync] Sync already in progress, skipping');
      return;
    }

    const now = Date.now();
    if (now - lastSyncAttempt.current < MIN_SYNC_GAP) {
      console.log('[CanvasSync] Too soon since last sync attempt, skipping');
      return;
    }

    try {
      // Check Canvas connection status
      const statusRes = await fetch('/api/canvas/status');
      if (!statusRes.ok) {
        console.log('[CanvasSync] Failed to fetch Canvas status');
        return;
      }

      const statusData = await statusRes.json();
      if (!statusData.connected || !statusData.syncEnabled) {
        console.log('[CanvasSync] Canvas not connected or sync disabled');
        return;
      }

      // Check if sync is needed based on last sync time
      const lastSyncedAt = statusData.lastSyncedAt ? new Date(statusData.lastSyncedAt).getTime() : 0;
      const timeSinceLastSync = now - lastSyncedAt;

      // Always sync on: initial (page load/refresh), periodic
      // For visibility changes, check threshold to avoid excessive syncing
      if (reason === 'visibility' && timeSinceLastSync < STALE_THRESHOLD) {
        console.log(`[CanvasSync] Last sync was ${Math.round(timeSinceLastSync / 60000)} minutes ago, skipping (${reason})`);
        return;
      }

      console.log(`[CanvasSync] Starting sync (${reason}), last sync was ${Math.round(timeSinceLastSync / 60000)} minutes ago`);

      syncInProgress.current = true;
      lastSyncAttempt.current = now;

      // Perform the sync
      const syncRes = await fetch('/api/canvas/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncCourses: statusData.syncCourses,
          syncAssignments: statusData.syncAssignments,
          syncGrades: statusData.syncGrades,
          syncEvents: statusData.syncEvents,
          syncAnnouncements: statusData.syncAnnouncements,
        }),
      });

      if (syncRes.ok) {
        const result = await syncRes.json();
        console.log('[CanvasSync] Sync completed:', result);
        // Note: We don't call loadFromDatabase here to avoid disrupting the UI
        // The synced data is already in the database and will be loaded on next page load
        // or when the user takes an action that triggers a data refresh
      } else {
        console.error('[CanvasSync] Sync failed:', await syncRes.text());
      }
    } catch (error) {
      console.error('[CanvasSync] Sync error:', error);
    } finally {
      syncInProgress.current = false;
    }
  }, []);

  // Initial sync on mount (login / page load)
  useEffect(() => {
    if (status !== 'authenticated') return;

    // Small delay to let the app settle
    const timeout = setTimeout(() => {
      performSync('initial');
    }, 2000);

    return () => clearTimeout(timeout);
  }, [status, performSync]);

  // Periodic sync while app is open
  useEffect(() => {
    if (status !== 'authenticated') return;

    intervalRef.current = setInterval(() => {
      performSync('periodic');
    }, SYNC_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, performSync]);

  // Sync when user returns to tab (visibility change)
  useEffect(() => {
    if (status !== 'authenticated') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performSync('visibility');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, performSync]);

  // This component doesn't render anything
  return null;
}
