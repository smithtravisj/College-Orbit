'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function useHighlightElement() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const highlightId = searchParams.get('highlight');

  useEffect(() => {
    if (!highlightId) return;

    let attempts = 0;
    const maxAttempts = 30; // More attempts for tab switching
    let highlightTimeout: NodeJS.Timeout;
    let retryTimeout: NodeJS.Timeout;
    let scrollAdjustTimeout1: NodeJS.Timeout;
    let scrollAdjustTimeout2: NodeJS.Timeout;
    let scrollAdjustTimeout3: NodeJS.Timeout;

    // Try to find and highlight element, with retries for tab switching
    const tryHighlight = () => {
      attempts++;
      const element = document.getElementById(highlightId);

      if (element) {
        // Scroll to element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Add highlight class
        element.classList.add('search-highlight');

        // Scroll again multiple times to account for layout shifts from loading content
        scrollAdjustTimeout1 = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
        scrollAdjustTimeout2 = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
        scrollAdjustTimeout3 = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 1000);

        // Remove highlight after animation completes (2s animation + buffer)
        highlightTimeout = setTimeout(() => {
          element.classList.remove('search-highlight');

          // Clean up URL params (use window.location to get current params, not stale searchParams)
          const currentParams = new URLSearchParams(window.location.search);
          currentParams.delete('highlight');
          const currentPath = window.location.pathname;
          const newUrl = currentParams.toString()
            ? `${currentPath}?${currentParams.toString()}`
            : currentPath;
          router.replace(newUrl, { scroll: false });
        }, 2500);
      } else if (attempts < maxAttempts) {
        // Element not found yet, retry after 150ms (allows for tab switch rendering)
        retryTimeout = setTimeout(tryHighlight, 150);
      } else {
        // Give up after max attempts, clean up URL
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.delete('highlight');
        const currentPath = window.location.pathname;
        const newUrl = currentParams.toString()
          ? `${currentPath}?${currentParams.toString()}`
          : currentPath;
        router.replace(newUrl, { scroll: false });
      }
    };

    // Start trying after initial delay for page render and tab switch
    const timeout = setTimeout(tryHighlight, 350);

    return () => {
      clearTimeout(timeout);
      clearTimeout(highlightTimeout);
      clearTimeout(retryTimeout);
      clearTimeout(scrollAdjustTimeout1);
      clearTimeout(scrollAdjustTimeout2);
      clearTimeout(scrollAdjustTimeout3);
    };
  // Only re-run when highlightId changes (not when other params like 'tab' are cleaned up)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId]);

  return highlightId;
}

export function useTabFromSearchParams(
  validTabs: string[],
  _defaultTab: string, // Prefixed with underscore to indicate intentionally unused
  setTab: (tab: string) => void
) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && validTabs.includes(tabParam)) {
      setTab(tabParam);

      // Clean up the tab param after applying (but keep highlight if present)
      const timeout = setTimeout(() => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('tab');
        const newUrl = newParams.toString()
          ? `${pathname}?${newParams.toString()}`
          : pathname;
        router.replace(newUrl, { scroll: false });
      }, 100);

      return () => clearTimeout(timeout);
    }
    return undefined; // Explicit return for code paths that don't return cleanup
  }, [searchParams, validTabs, setTab, router, pathname]);
}
