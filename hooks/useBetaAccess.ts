import useAppStore from '@/lib/store';

/**
 * Hook for checking beta program access and future feature gating.
 * Use this to conditionally enable beta features for enrolled users.
 */
export function useBetaAccess() {
  const settings = useAppStore((state) => state.settings);

  return {
    isBetaUser: settings.isBetaUser ?? false,
    // Can expand later for version-based gating
  };
}
