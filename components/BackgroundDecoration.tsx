'use client';

import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import { useSubscription } from '@/hooks/useSubscription';

export default function BackgroundDecoration() {
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';
  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);

  // Custom theme is only active for premium users
  const { isPremium } = useSubscription();
  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;

  // Use current theme's accent color for background blobs
  const accentColor = useCustomTheme && customColors
    ? getCustomColorSetForTheme(customColors as CustomColors, theme).accent
    : getCollegeColorPalette(university || null, theme).accent;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', top: '-100px', left: '-80px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}20 0%, ${accentColor}0a 40%, transparent 70%)`, filter: 'blur(100px)' }} />
      <div style={{ position: 'absolute', top: '15%', right: '-100px', width: '550px', height: '550px', borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}1c 0%, ${accentColor}08 40%, transparent 70%)`, filter: 'blur(110px)' }} />
      <div style={{ position: 'absolute', bottom: '25%', left: '5%', width: '480px', height: '480px', borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}18 0%, ${accentColor}08 40%, transparent 70%)`, filter: 'blur(95px)' }} />
      <div style={{ position: 'absolute', bottom: '-120px', right: '15%', width: '520px', height: '520px', borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}1c 0%, ${accentColor}08 40%, transparent 70%)`, filter: 'blur(105px)' }} />
      <div style={{ position: 'absolute', top: '45%', left: '35%', width: '450px', height: '450px', borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}14 0%, ${accentColor}06 40%, transparent 70%)`, filter: 'blur(90px)' }} />
    </div>
  );
}
