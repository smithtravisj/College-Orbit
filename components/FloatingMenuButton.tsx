'use client';

import { useMobileNav } from '@/context/MobileNavContext';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import { getThemeColors } from '@/lib/visualThemes';
import { useIsLightMode } from '@/hooks/useEffectiveTheme';
import styles from './FloatingMenuButton.module.css';

export function FloatingMenuButton() {
  const { toggleDrawer } = useMobileNav();
  const university = useAppStore((state) => state.settings.university) || null;
  const theme = useAppStore((state) => state.settings.theme);
  const isPremium = useAppStore((state) => state.isPremium);
  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);
  const savedVisualTheme = useAppStore((state) => state.settings.visualTheme);
  const glowIntensity = useAppStore((state) => state.settings.glowIntensity) ?? 50;

  // Only use custom theme if premium
  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;
  const visualTheme = isPremium ? savedVisualTheme : null;

  // Determine accent color - visual theme takes priority
  const buttonColor = (() => {
    if (visualTheme && visualTheme !== 'default') {
      const themeColors = getThemeColors(visualTheme, theme);
      if (themeColors.accent) return themeColors.accent;
    }
    if (useCustomTheme && customColors) {
      return getCustomColorSetForTheme(customColors as CustomColors, theme).accent;
    }
    return getCollegeColorPalette(university, theme).accent;
  })();

  const isLightMode = useIsLightMode();
  const iconColor = isLightMode ? '#000000' : 'white';

  // Calculate glow intensity (0-100 scale mapped to opacity and spread)
  const glowOpacity = Math.round((glowIntensity / 100) * 0.6 * 255).toString(16).padStart(2, '0');
  const glowSpread = 12 + (glowIntensity / 100) * 8;

  const handleClick = (e: React.MouseEvent) => {
    console.log('FAB clicked!');
    e.stopPropagation();
    toggleDrawer();
  };

  return (
    <button
      onClick={handleClick}
      className={styles.fab}
      style={{
        backgroundColor: buttonColor,
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
        boxShadow: `0 0 ${glowSpread}px ${buttonColor}${glowOpacity}, 0 3px 12px ${buttonColor}60`,
        pointerEvents: 'auto',
      }}
      aria-label="Open menu"
      type="button"
      data-tour="mobile-hamburger"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={iconColor}
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
