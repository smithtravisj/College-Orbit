'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect viewport width using matchMedia API
 * @param query - Media query string (e.g., '(max-width: 767px)')
 * @returns boolean - true if media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
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
