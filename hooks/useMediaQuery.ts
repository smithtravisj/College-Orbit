'use client';

import { useLayoutEffect, useState } from 'react';

/**
 * Hook to detect viewport width using matchMedia API
 * Uses useLayoutEffect to set initial value before paint, preventing layout flash
 * @param query - Media query string (e.g., '(max-width: 767px)')
 * @returns boolean - true if media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with actual value if window exists (prevents flash on client navigation)
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  // Use useLayoutEffect to update before paint (prevents visible flash)
  useLayoutEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value synchronously before paint
    setMatches(media.matches);

    // Listen for changes
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/**
 * Convenience hook for detecting mobile viewport
 * @returns boolean - true if viewport width is <= 767px (mobile)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Convenience hook for detecting desktop viewport
 * @returns boolean - true if viewport width is >= 768px (desktop)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)');
}
