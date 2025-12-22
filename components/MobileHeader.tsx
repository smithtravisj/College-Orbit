'use client';

import { useState, useEffect } from 'react';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import styles from './MobileHeader.module.css';

export function MobileHeader() {
  const scrollDirection = useScrollDirection(50);
  const [isMinimized, setIsMinimized] = useState(false);

  // Minimize header when scrolling down
  useEffect(() => {
    setIsMinimized(scrollDirection === 'down' && window.scrollY > 50);
  }, [scrollDirection]);

  return (
    <header className={styles.header} data-minimized={isMinimized}>
      {/* Minimal header - no content, just spacing */}
    </header>
  );
}
