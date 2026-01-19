'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { QuickAddModal } from './QuickAddModal';
import styles from './QuickAddButton.module.css';

export function QuickAddButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const showFullButton = ['/', '/dashboard', '/calendar', '/tools', '/settings', '/admin', '/account'].includes(pathname);
  const bottomRightPages = ['/tasks', '/deadlines', '/exams', '/notes', '/courses', '/shopping'];
  const isBottomRight = bottomRightPages.includes(pathname);
  const university = useAppStore((state) => state.settings.university) || null;
  const theme = useAppStore((state) => state.settings.theme);
  const isPremium = useAppStore((state) => state.isPremium);
  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);
  const glowIntensity = useAppStore((state) => state.settings.glowIntensity) ?? 50;

  // Only use custom theme if premium
  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;

  // Determine accent color based on custom theme or college palette
  const buttonColor = useCustomTheme && customColors
    ? getCustomColorSetForTheme(customColors as CustomColors, theme).accent
    : getCollegeColorPalette(university, theme).accent;

  const iconColor = theme === 'light' ? '#000000' : 'white';

  // Calculate glow intensity (0-100 scale mapped to opacity and spread)
  const glowOpacity = Math.round((glowIntensity / 100) * 0.6 * 255).toString(16).padStart(2, '0');
  const glowSpread = 12 + (glowIntensity / 100) * 8;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  // On desktop, show label only on dashboard/calendar; otherwise just the plus icon
  const showLabel = !isMobile && showFullButton;

  // Determine which style class to use
  const getButtonClass = () => {
    if (isMobile) return styles.fab;
    if (showLabel) return styles.fabDesktop;
    if (isBottomRight) return styles.fabBottomRight;
    return styles.fab;
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={getButtonClass()}
        style={{
          backgroundColor: buttonColor,
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
          boxShadow: `0 0 ${glowSpread}px ${buttonColor}${glowOpacity}, 0 3px 12px ${buttonColor}60`,
          pointerEvents: 'auto',
        }}
        aria-label="Quick add"
        type="button"
      >
        <Plus size={showLabel ? 20 : 24} color={iconColor} strokeWidth={2.5} />
        {showLabel && <span className={styles.fabLabel} style={{ color: iconColor }}>Quick Add</span>}
      </button>

      <QuickAddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
