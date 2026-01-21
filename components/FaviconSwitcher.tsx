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

    updateFavicon(theme === 'dark');
  }, [theme]);

  return null;
}
