'use client';

import useAppStore from '@/lib/store';

/**
 * Hook to check if the current theme is light mode
 */
export function useIsLightMode(): boolean {
  const theme = useAppStore((state) => state.settings.theme);
  return theme === 'light';
}

/**
 * Hook to get the current theme
 */
export function useEffectiveTheme(): 'light' | 'dark' {
  const theme = useAppStore((state) => state.settings.theme);
  return theme === 'light' ? 'light' : 'dark';
}
