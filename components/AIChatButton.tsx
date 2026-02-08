'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import { getThemeColors } from '@/lib/visualThemes';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useIsLightMode } from '@/hooks/useEffectiveTheme';
import AIChatModal from './AIChatModal';
import styles from './AIChatButton.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Clear conversation on navigation
  useEffect(() => {
    setMessages([]);
    setIsModalOpen(false);
  }, [pathname]);

  const topRightPages = ['/', '/dashboard', '/calendar', '/tools', '/settings', '/admin', '/account'];
  const isTopRight = topRightPages.includes(pathname);

  const university = useAppStore((state) => state.settings.university) || null;
  const theme = useAppStore((state) => state.settings.theme);
  const isPremium = useAppStore((state) => state.isPremium);
  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);
  const savedVisualTheme = useAppStore((state) => state.settings.visualTheme);
  const glowIntensity = useAppStore((state) => state.settings.glowIntensity) ?? 50;

  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;

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

  const gradientIntensity = useAppStore((state) => state.settings.gradientIntensity) ?? 50;

  const effectiveGlowIntensity = isPremium ? glowIntensity : 50;
  const noCollegeSelected = !university;
  const glowReduction = noCollegeSelected ? 0.5 : 1;

  // Mobile styling (matches QuickAddButton)
  const mobileGlowOpacity = Math.round((effectiveGlowIntensity / 100) * 0.6 * 255).toString(16).padStart(2, '0');
  const mobileGlowSpread = 12 + (effectiveGlowIntensity / 100) * 8;
  const mobileBackgroundImage = 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)';
  const mobileBoxShadow = `0 0 ${mobileGlowSpread}px ${buttonColor}${mobileGlowOpacity}, 0 3px 12px ${buttonColor}60`;

  // Desktop styling (matches QuickAddButton)
  const gradientScale = Math.pow((isPremium ? gradientIntensity : 50) / 50, 2);
  const lightOpacity = Math.round(0.08 * gradientScale * 100) / 100;
  const darkOpacity = Math.round(0.12 * gradientScale * 100) / 100;
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

  // Only show for premium users
  if (!isPremium) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const getButtonClass = () => {
    if (isMobile) return styles.fab;
    if (isTopRight) return styles.fabDesktop;
    return styles.fabDesktopBottomRight;
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={getButtonClass()}
        style={{
          backgroundColor: buttonColor,
          backgroundImage: isMobile ? mobileBackgroundImage : desktopBackgroundImage,
          boxShadow: isMobile ? mobileBoxShadow : desktopBoxShadow,
          pointerEvents: 'auto',
        }}
        aria-label="Orbi"
        type="button"
      >
        <Sparkles size={isMobile ? 20 : 18} color={iconColor} strokeWidth={2} />
      </button>

      <AIChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        messages={messages}
        setMessages={setMessages}
      />
    </>
  );
}
