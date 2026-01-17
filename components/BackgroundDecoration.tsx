'use client';

import useAppStore from '@/lib/store';
import { getCollegeColorPalette } from '@/lib/collegeColors';

export default function BackgroundDecoration() {
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';

  // Use opposite theme colors for depth
  const bgColorPalette = getCollegeColorPalette(university || null, theme === 'dark' ? 'light' : 'dark');

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', top: '-100px', left: '-80px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${bgColorPalette.accent}35 0%, ${bgColorPalette.accent}16 40%, transparent 70%)`, filter: 'blur(100px)' }} />
      <div style={{ position: 'absolute', top: '15%', right: '-100px', width: '550px', height: '550px', borderRadius: '50%', background: `radial-gradient(circle, ${bgColorPalette.accent}30 0%, ${bgColorPalette.accent}14 40%, transparent 70%)`, filter: 'blur(110px)' }} />
      <div style={{ position: 'absolute', bottom: '25%', left: '5%', width: '480px', height: '480px', borderRadius: '50%', background: `radial-gradient(circle, ${bgColorPalette.accent}28 0%, ${bgColorPalette.accent}12 40%, transparent 70%)`, filter: 'blur(95px)' }} />
      <div style={{ position: 'absolute', bottom: '-120px', right: '15%', width: '520px', height: '520px', borderRadius: '50%', background: `radial-gradient(circle, ${bgColorPalette.accent}33 0%, ${bgColorPalette.accent}14 40%, transparent 70%)`, filter: 'blur(105px)' }} />
      <div style={{ position: 'absolute', top: '45%', left: '35%', width: '450px', height: '450px', borderRadius: '50%', background: `radial-gradient(circle, ${bgColorPalette.accent}24 0%, ${bgColorPalette.accent}10 40%, transparent 70%)`, filter: 'blur(90px)' }} />
    </div>
  );
}
