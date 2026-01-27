import { useState, useEffect, useCallback } from 'react';
import useAppStore from '@/lib/store';

interface VersionInfo {
  version: string;
  isBetaOnly: boolean;
}

// Cache versions globally to avoid re-fetching
let cachedVersions: VersionInfo[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Hook for version-based feature gating.
 *
 * Usage:
 * const { hasAccessToFeature } = useBetaAccess();
 *
 * {hasAccessToFeature('1.3.4') && <BetaFeature />}
 *
 * - If version is released to all (isBetaOnly: false): everyone sees the feature
 * - If version is beta-only: only beta users see the feature
 */
export function useBetaAccess() {
  const settings = useAppStore((state) => state.settings);
  const isBetaUser = settings.isBetaUser ?? false;
  const [versions, setVersions] = useState<VersionInfo[]>(cachedVersions || []);
  const [loaded, setLoaded] = useState(cachedVersions !== null);

  useEffect(() => {
    const fetchVersions = async () => {
      // Use cache if still valid
      if (cachedVersions && Date.now() - cacheTimestamp < CACHE_DURATION) {
        setVersions(cachedVersions);
        setLoaded(true);
        return;
      }

      try {
        // Fetch all versions release status (public endpoint)
        const response = await fetch('/api/versions');
        if (response.ok) {
          const data = await response.json();
          const versionInfos = data.versions.map((v: { version: string; isBetaOnly: boolean }) => ({
            version: v.version,
            isBetaOnly: v.isBetaOnly,
          }));
          cachedVersions = versionInfos;
          cacheTimestamp = Date.now();
          setVersions(versionInfos);
        }
      } catch (error) {
        console.error('Failed to fetch versions for feature gating:', error);
      } finally {
        setLoaded(true);
      }
    };

    fetchVersions();
  }, []);

  /**
   * Check if user has access to features from a specific version.
   * - Released versions (isBetaOnly: false): accessible to everyone
   * - Beta-only versions: accessible only to beta users
   */
  const hasAccessToFeature = useCallback((version: string): boolean => {
    // If versions not loaded yet, default to showing for beta users only
    if (!loaded) {
      return isBetaUser;
    }

    const versionInfo = versions.find(v => v.version === version);

    // If version not found, assume it's beta-only (safer default for unreleased features)
    // Only beta users get access to features from unknown versions
    if (!versionInfo) {
      return isBetaUser;
    }

    // If released to all, everyone has access
    if (!versionInfo.isBetaOnly) {
      return true;
    }

    // If beta-only, only beta users have access
    return isBetaUser;
  }, [versions, isBetaUser, loaded]);

  return {
    isBetaUser,
    hasAccessToFeature,
    loaded,
  };
}
