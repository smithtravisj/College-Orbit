import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { logPageView } from './analytics';

/**
 * Hook to automatically log page views
 * Call this in your layout to track all page visits
 */
export function useAnalyticsPageView() {
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    // Don't log on auth pages
    if (pathname === '/login' || pathname === '/signup') {
      return;
    }

    // Convert pathname to page name
    const pageName = pathname === '/' ? 'dashboard' : pathname.replace(/^\//, '').split('/')[0] || 'unknown';

    // Log the page view with user ID if available
    logPageView(pageName, session?.user?.id);
  }, [pathname, session?.user?.id]);
}
