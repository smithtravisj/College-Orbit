'use client';

import { useState, useEffect } from 'react';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import styles from './MobileHeader.module.css';

interface MobileHeaderProps {
  title?: string;
  showNotifications?: boolean;
}

export function MobileHeader({ title = 'BYU Survival Tool', showNotifications = true }: MobileHeaderProps) {
  const scrollDirection = useScrollDirection(50);
  const [isMinimized, setIsMinimized] = useState(false);

  // Minimize header when scrolling down
  useEffect(() => {
    setIsMinimized(scrollDirection === 'down' && window.scrollY > 50);
  }, [scrollDirection]);

  return (
    <header className={styles.header} data-minimized={isMinimized}>
      <div className={styles.container}>
        {/* Title - centered */}
        <h1 className={styles.title}>{title}</h1>

        {/* Placeholder for notifications */}
        {showNotifications && (
          <button
            className={styles.notificationButton}
            aria-label="View notifications"
            type="button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
