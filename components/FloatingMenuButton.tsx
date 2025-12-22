'use client';

import { useMobileNav } from '@/context/MobileNavContext';
import useAppStore from '@/lib/store';
import { getCollegeColor } from '@/lib/collegeColors';
import styles from './FloatingMenuButton.module.css';

export function FloatingMenuButton() {
  const { toggleDrawer } = useMobileNav();
  const university = useAppStore((state) => state.settings.university);
  const collegeColor = getCollegeColor(university);

  const handleClick = () => {
    console.log('FAB clicked!');
    toggleDrawer();
  };

  return (
    <button
      onClick={handleClick}
      className={styles.fab}
      style={{
        backgroundColor: collegeColor,
      }}
      aria-label="Open menu"
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
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}
