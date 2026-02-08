'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Google Calendar syncs once per day (not every 5 minutes like Canvas)
const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
const MIN_SYNC_GAP = 60 * 1000; // Minimum 1 minute between syncs

/**
 * GoogleCalendarSyncManager - Handles automatic Google Calendar synchronization
 *
 * Syncs automatically when:
 * 1. User logs in / loads the app (if last sync was > 24 hours ago)
 * 2. User returns to the tab after being away (if last sync > 24 hours ago)
 */
export function GoogleCalendarSyncManager() {
  const { status } = useSession();
  const syncInProgress = useRef(false);
  const lastSyncAttempt = useRef<number>(0);

  const performSync = useCallback(async (reason: string) => {
    if (syncInProgress.current) return;

    const now = Date.now();
    if (now - lastSyncAttempt.current < MIN_SYNC_GAP) return;

    try {
      const statusRes = await fetch('/api/google-calendar/status');
      if (!statusRes.ok) return;

      const statusData = await statusRes.json();
      if (!statusData.connected) return;

      // Check if sync is needed (> 24 hours since last sync)
      const lastSyncedAt = statusData.lastSyncedAt ? new Date(statusData.lastSyncedAt).getTime() : 0;
      const timeSinceLastSync = now - lastSyncedAt;

      if (timeSinceLastSync < STALE_THRESHOLD) {
        console.log(`[GoogleCalendarSync] Last sync was ${Math.round(timeSinceLastSync / 3600000)} hours ago, skipping (${reason})`);
        return;
      }

      console.log(`[GoogleCalendarSync] Starting sync (${reason}), last sync was ${Math.round(timeSinceLastSync / 3600000)} hours ago`);

      syncInProgress.current = true;
      lastSyncAttempt.current = now;

      const syncRes = await fetch('/api/google-calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (syncRes.ok) {
        const result = await syncRes.json();
        console.log('[GoogleCalendarSync] Sync completed:', result);
      } else {
        console.error('[GoogleCalendarSync] Sync failed:', await syncRes.text());
      }
    } catch (error) {
      console.error('[GoogleCalendarSync] Sync error:', error);
    } finally {
      syncInProgress.current = false;
    }
  }, []);

  // Initial sync on mount
  useEffect(() => {
    if (status !== 'authenticated') return;

    const timeout = setTimeout(() => {
      performSync('initial');
    }, 4000); // Slight delay after Canvas sync managers

    return () => clearTimeout(timeout);
  }, [status, performSync]);

  // Sync when user returns to tab
  useEffect(() => {
    if (status !== 'authenticated') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performSync('visibility');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status, performSync]);

  return null;
}
