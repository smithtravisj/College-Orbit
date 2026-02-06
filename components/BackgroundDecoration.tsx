'use client';

import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import { getVisualTheme } from '@/lib/visualThemes';
import { useSubscription } from '@/hooks/useSubscription';

export default function BackgroundDecoration() {
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';
  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);
  const savedVisualTheme = useAppStore((state) => state.settings.visualTheme);

  // Custom theme and visual theme are only active for premium users
  const { isPremium } = useSubscription();
  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;
  const visualTheme = isPremium ? savedVisualTheme : null;

  // Get the visual theme definition
  const themeConfig = getVisualTheme(visualTheme);

  // Use current theme's accent color for background blobs
  // Visual theme colors override custom colors override college colors
  const getAccentColor = () => {
    if (visualTheme && visualTheme !== 'default' && themeConfig.colors) {
      const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
      if (themeColors.accent) return themeColors.accent;
    }
    if (useCustomTheme && customColors) {
      return getCustomColorSetForTheme(customColors as CustomColors, theme).accent;
    }
    return getCollegeColorPalette(university || null, theme).accent;
  };

  const accentColor = getAccentColor();

  // Default gradient blobs
  const defaultBlobs = (
    <>
      <div style={{ position: 'absolute', top: '-100px', left: '-80px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}20 0%, ${accentColor}0a 40%, transparent 70%)`, filter: 'blur(100px)' }} />
      <div style={{ position: 'absolute', top: '15%', right: '-100px', width: '550px', height: '550px', borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}1c 0%, ${accentColor}08 40%, transparent 70%)`, filter: 'blur(110px)' }} />
      <div style={{ position: 'absolute', bottom: '25%', left: '5%', width: '480px', height: '480px', borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}18 0%, ${accentColor}08 40%, transparent 70%)`, filter: 'blur(95px)' }} />
      <div style={{ position: 'absolute', bottom: '-120px', right: '15%', width: '520px', height: '520px', borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}1c 0%, ${accentColor}08 40%, transparent 70%)`, filter: 'blur(105px)' }} />
      <div style={{ position: 'absolute', top: '45%', left: '35%', width: '450px', height: '450px', borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}14 0%, ${accentColor}06 40%, transparent 70%)`, filter: 'blur(90px)' }} />
    </>
  );

  // Floating cartoon shapes for cartoon theme
  const renderCartoonShapes = () => {
    if (visualTheme !== 'cartoon') return null;

    // Get theme colors for variety
    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const colors = [
      themeColors.accent || '#00d4ff',
      themeColors.link || '#ff6bff',
      themeColors.success || '#00ff88',
      themeColors.warning || '#ffcc00',
    ];

    // Generate floating shapes with different positions, sizes, and animations
    // Spread across the entire screen - left, center, and right areas
    const shapes = [
      // Stars - scattered across screen
      { type: 'star', x: '5%', y: '8%', size: 18, color: colors[0], delay: 0, duration: 6 },
      { type: 'star', x: '25%', y: '5%', size: 14, color: colors[2], delay: 2.5, duration: 7 },
      { type: 'star', x: '45%', y: '3%', size: 12, color: colors[1], delay: 1, duration: 5.5 },
      { type: 'star', x: '70%', y: '6%', size: 16, color: colors[3], delay: 0.5, duration: 6.5 },
      { type: 'star', x: '92%', y: '10%', size: 20, color: colors[0], delay: 3, duration: 7 },
      { type: 'star', x: '8%', y: '35%', size: 14, color: colors[1], delay: 1.5, duration: 6 },
      { type: 'star', x: '50%', y: '92%', size: 16, color: colors[2], delay: 2, duration: 5 },
      { type: 'star', x: '88%', y: '45%', size: 12, color: colors[3], delay: 0, duration: 7.5 },
      { type: 'star', x: '15%', y: '75%', size: 18, color: colors[0], delay: 3.5, duration: 6 },
      { type: 'star', x: '78%', y: '85%', size: 14, color: colors[1], delay: 1, duration: 5.5 },

      // Circles - dotted around
      { type: 'circle', x: '3%', y: '20%', size: 10, color: colors[1], delay: 1.5, duration: 8 },
      { type: 'circle', x: '35%', y: '15%', size: 8, color: colors[2], delay: 0, duration: 7 },
      { type: 'circle', x: '60%', y: '12%', size: 12, color: colors[0], delay: 2, duration: 9 },
      { type: 'circle', x: '95%', y: '25%', size: 10, color: colors[3], delay: 1, duration: 7.5 },
      { type: 'circle', x: '12%', y: '55%', size: 8, color: colors[2], delay: 2.5, duration: 8 },
      { type: 'circle', x: '40%', y: '88%', size: 10, color: colors[1], delay: 0.5, duration: 6.5 },
      { type: 'circle', x: '85%', y: '65%', size: 12, color: colors[0], delay: 3, duration: 7 },
      { type: 'circle', x: '55%', y: '45%', size: 6, color: colors[3], delay: 1.5, duration: 9 },

      // Sparkles - spread out
      { type: 'sparkle', x: '2%', y: '45%', size: 14, color: colors[3], delay: 3, duration: 4 },
      { type: 'sparkle', x: '30%', y: '28%', size: 12, color: colors[0], delay: 1, duration: 5 },
      { type: 'sparkle', x: '55%', y: '18%', size: 10, color: colors[1], delay: 2, duration: 4.5 },
      { type: 'sparkle', x: '75%', y: '35%', size: 14, color: colors[2], delay: 0, duration: 5.5 },
      { type: 'sparkle', x: '97%', y: '55%', size: 12, color: colors[0], delay: 2.5, duration: 4 },
      { type: 'sparkle', x: '20%', y: '90%', size: 10, color: colors[3], delay: 1.5, duration: 5 },
      { type: 'sparkle', x: '65%', y: '78%', size: 14, color: colors[1], delay: 0.5, duration: 4.5 },
      { type: 'sparkle', x: '42%', y: '60%', size: 8, color: colors[2], delay: 3.5, duration: 5 },

      // Hearts - scattered with love
      { type: 'heart', x: '6%', y: '65%', size: 12, color: colors[1], delay: 0, duration: 7 },
      { type: 'heart', x: '28%', y: '42%', size: 10, color: colors[3], delay: 1.5, duration: 6 },
      { type: 'heart', x: '48%', y: '8%', size: 14, color: colors[0], delay: 2, duration: 7.5 },
      { type: 'heart', x: '72%', y: '22%', size: 12, color: colors[2], delay: 0.5, duration: 6.5 },
      { type: 'heart', x: '93%', y: '75%', size: 10, color: colors[1], delay: 3, duration: 7 },
      { type: 'heart', x: '18%', y: '18%', size: 14, color: colors[3], delay: 1, duration: 6 },
      { type: 'heart', x: '82%', y: '92%', size: 12, color: colors[0], delay: 2.5, duration: 7.5 },
      { type: 'heart', x: '38%', y: '72%', size: 10, color: colors[2], delay: 0, duration: 6.5 },
    ];

    const renderShape = (shape: typeof shapes[0], index: number) => {
      const baseStyle: React.CSSProperties = {
        position: 'absolute',
        left: shape.x,
        top: shape.y,
        width: shape.size,
        height: shape.size,
        opacity: 0.6,
        animation: `cartoon-float ${shape.duration}s ease-in-out ${shape.delay}s infinite`,
      };

      switch (shape.type) {
        case 'star':
          return (
            <svg key={index} style={baseStyle} viewBox="0 0 24 24" fill={shape.color}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          );
        case 'circle':
          return (
            <div
              key={index}
              style={{
                ...baseStyle,
                borderRadius: '50%',
                backgroundColor: shape.color,
              }}
            />
          );
        case 'sparkle':
          return (
            <svg key={index} style={{ ...baseStyle, animation: `cartoon-sparkle ${shape.duration}s ease-in-out ${shape.delay}s infinite` }} viewBox="0 0 24 24" fill={shape.color}>
              <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" />
            </svg>
          );
        case 'heart':
          return (
            <svg key={index} style={baseStyle} viewBox="0 0 24 24" fill={shape.color}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          );
        default:
          return null;
      }
    };

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {shapes.map((shape, index) => renderShape(shape, index))}
      </div>
    );
  };

  // Render theme-specific background patterns
  const renderThemePattern = () => {
    if (!visualTheme || visualTheme === 'default') return null;

    const pattern = themeConfig.backgroundPattern;
    if (!pattern) return null;

    switch (pattern) {
      case 'dots':
        // Comic-style halftone dots pattern
        return (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `radial-gradient(circle, ${accentColor}12 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
              opacity: 0.6,
              mixBlendMode: 'overlay',
            }}
          />
        );
      case 'grid':
        // Grid pattern
        return (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(${accentColor}08 1px, transparent 1px),
                linear-gradient(90deg, ${accentColor}08 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px',
              opacity: 0.5,
            }}
          />
        );
      case 'waves':
        // Wavy pattern using SVG
        return (
          <svg
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40%',
              opacity: 0.1,
            }}
            preserveAspectRatio="none"
            viewBox="0 0 1440 320"
          >
            <path
              fill={accentColor}
              d="M0,192L48,176C96,160,192,128,288,122.7C384,117,480,139,576,165.3C672,192,768,224,864,229.3C960,235,1056,213,1152,181.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {defaultBlobs}
      {renderThemePattern()}
      {renderCartoonShapes()}
    </div>
  );
}
