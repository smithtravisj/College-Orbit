'use client';

import { useEffect, useState } from 'react';

type ScrollDirection = 'up' | 'down';

/**
 * Hook to detect scroll direction
 * Uses requestAnimationFrame for 60fps performance
 * @param threshold - Minimum scroll distance to register as scroll (default: 10px)
 * @returns scroll direction: 'up' or 'down'
 */
export function useScrollDirection(threshold: number = 10): ScrollDirection {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;

      // Ignore small scroll changes to prevent jitter
      if (Math.abs(scrollY - lastScrollY) < threshold) {
        ticking = false;
        return;
      }

      setScrollDirection(scrollY > lastScrollY ? 'down' : 'up');
      setLastScrollY(scrollY > 0 ? scrollY : 0);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    // Use passive listener for better performance
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [lastScrollY, threshold]);

  return scrollDirection;
}

/**
 * Hook to get current scroll position and direction
 * @returns object with scrollY position and direction
 */
export function useScroll() {
  const [scrollY, setScrollY] = useState(0);
  const direction = useScrollDirection();

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { scrollY, direction };
}
