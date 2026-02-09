'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import { getThemeColors } from '@/lib/visualThemes';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { QuickAddModal } from './QuickAddModal';
import { useKeyboardShortcutsContext } from './KeyboardShortcutsProvider';
import { useIsLightMode } from '@/hooks/useEffectiveTheme';
import styles from './QuickAddButton.module.css';

export function QuickAddButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setQuickAddHandler, setEscapeHandler } = useKeyboardShortcutsContext();

  // Register Cmd+K handler to open modal
  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  useEffect(() => {
    setQuickAddHandler(openModal);
    return () => setQuickAddHandler(() => {});
  }, [setQuickAddHandler, openModal]);

  // Register Escape handler when modal is open
  useEffect(() => {
    if (isModalOpen) {
      setEscapeHandler(closeModal);
      return () => setEscapeHandler(null);
    }
    return undefined;
  }, [isModalOpen, setEscapeHandler, closeModal]);
  const pathname = usePathname();
  const isMobile = useIsMobile();
  // Top-right on dashboard and pages without item lists, bottom-right on list pages
  const topRightPages = ['/', '/dashboard', '/calendar', '/tools', '/settings', '/admin', '/account'];
  const isTopRight = topRightPages.includes(pathname);
  const university = useAppStore((state) => state.settings.university) || null;
  const theme = useAppStore((state) => state.settings.theme);
  const isPremium = useAppStore((state) => state.isPremium);
  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);
  const savedVisualTheme = useAppStore((state) => state.settings.visualTheme);
  const glowIntensity = useAppStore((state) => state.settings.glowIntensity) ?? 50;
  const gradientIntensity = useAppStore((state) => state.settings.gradientIntensity) ?? 50;

  // Only use custom theme if premium
  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;

  // Determine accent color based on visual theme, custom theme, or college palette
  // Visual theme takes priority
  const visualTheme = isPremium ? savedVisualTheme : null;
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

  // Mobile: Use simple gradient/glow to match FloatingMenuButton exactly
  // Desktop: Use customizable gradient/glow based on settings
  const effectiveGlowIntensity = isPremium ? glowIntensity : 50;

  // Mobile styling (matches FloatingMenuButton)
  const mobileGlowOpacity = Math.round((effectiveGlowIntensity / 100) * 0.6 * 255).toString(16).padStart(2, '0');
  const mobileGlowSpread = 12 + (effectiveGlowIntensity / 100) * 8;
  const mobileBackgroundImage = 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)';
  const mobileBoxShadow = `0 0 ${mobileGlowSpread}px ${buttonColor}${mobileGlowOpacity}, 0 3px 12px ${buttonColor}60`;

  // Desktop styling (customizable)
  const gradientScale = Math.pow((isPremium ? gradientIntensity : 50) / 50, 2);
  const lightOpacity = Math.round(0.08 * gradientScale * 100) / 100;
  const darkOpacity = Math.round(0.12 * gradientScale * 100) / 100;
  const noCollegeSelected = !university;
  const glowReduction = noCollegeSelected ? 0.5 : 1;
  const desktopGlowOpacity = isLightMode
    ? Math.round((effectiveGlowIntensity / 100) * 0.6 * glowReduction * 255).toString(16).padStart(2, '0')
    : Math.round((effectiveGlowIntensity / 100) * 0.25 * glowReduction * 255).toString(16).padStart(2, '0');
  const desktopGlowSpread = (12 + (effectiveGlowIntensity / 100) * 8) * glowReduction;
  const effectiveGradientIntensity = isPremium ? gradientIntensity : 50;
  const gradient = `linear-gradient(135deg, rgba(255,255,255,${lightOpacity}) 0%, transparent 50%, rgba(0,0,0,${darkOpacity}) 100%)`;
  const darkOverlay = 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2))';
  const desktopBackgroundImage = effectiveGradientIntensity > 0
    ? (isLightMode ? gradient : `${darkOverlay}, ${gradient}`)
    : (isLightMode ? 'none' : darkOverlay);
  const desktopBoxShadow = effectiveGlowIntensity > 0
    ? `0 0 ${desktopGlowSpread}px ${buttonColor}${desktopGlowOpacity}, 0 3px 12px ${buttonColor}40`
    : `0 3px 12px ${buttonColor}40`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  // On desktop, always show the full label
  const showLabel = !isMobile;

  // Determine which style class to use
  const getButtonClass = () => {
    if (isMobile) return styles.fab;
    // On desktop, top-right on dashboard, bottom-right everywhere else
    if (isTopRight) return styles.fabDesktop;
    return styles.fabDesktopBottomRight;
  };

  // Premium users use "Ask Orbi" button instead — but keep modal + keyboard shortcut
  if (isPremium) {
    return (
      <QuickAddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={getButtonClass()}
        data-tour="quick-add"
        style={{
          backgroundColor: buttonColor,
          backgroundImage: isMobile ? mobileBackgroundImage : desktopBackgroundImage,
          boxShadow: isMobile ? mobileBoxShadow : desktopBoxShadow,
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
