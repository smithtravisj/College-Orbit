'use client';

import { useEffect } from 'react';
import useAppStore from '@/lib/store';

export default function FaviconSwitcher() {
  const theme = useAppStore((state) => state.settings.theme);

  useEffect(() => {
    const updateFavicon = (isDark: boolean) => {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      const appleFavicon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      const newHref = isDark ? '/favicon-dark.svg' : '/favicon-light.svg';

      if (favicon) {
        favicon.href = newHref;
      }
      if (appleFavicon) {
        appleFavicon.href = newHref;
      }
    };

    // Determine if dark mode based on theme setting
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      updateFavicon(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => updateFavicon(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      updateFavicon(theme === 'dark');
      return undefined;
    }
  }, [theme]);

  return null;
}
