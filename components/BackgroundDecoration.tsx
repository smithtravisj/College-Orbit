'use client';

import { useMemo, memo } from 'react';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import { getVisualTheme, resolveThemeId } from '@/lib/visualThemes';
import { useSubscription } from '@/hooks/useSubscription';

export default memo(function BackgroundDecoration() {
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';
  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);
  const savedVisualTheme = useAppStore((state) => state.settings.visualTheme);

  // Custom theme and visual theme are only active for premium users
  const { isPremium } = useSubscription();
  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;
  const visualTheme = isPremium ? (resolveThemeId(savedVisualTheme) || null) : null;

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

  // Cyberpunk scan lines and neon glow effects
  const renderCyberpunkEffects = () => {
    if (visualTheme !== 'cyberpunk') return null;

    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const cyan = themeColors.accent || '#00ffff';
    const magenta = themeColors.link || '#ff00ff';

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Scan lines overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.03) 2px,
              rgba(0, 0, 0, 0.03) 4px
            )`,
            pointerEvents: 'none',
          }}
        />

        {/* Animated scan line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${cyan}40, transparent)`,
            animation: 'cyberpunk-scan 8s linear infinite',
            opacity: 0.6,
          }}
        />

        {/* Corner accents - top left */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '3%',
            width: '80px',
            height: '80px',
            borderLeft: `2px solid ${cyan}30`,
            borderTop: `2px solid ${cyan}30`,
            opacity: 0.8,
          }}
        />

        {/* Corner accents - top right */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            right: '3%',
            width: '80px',
            height: '80px',
            borderRight: `2px solid ${magenta}30`,
            borderTop: `2px solid ${magenta}30`,
            opacity: 0.8,
          }}
        />

        {/* Corner accents - bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            left: '3%',
            width: '80px',
            height: '80px',
            borderLeft: `2px solid ${magenta}30`,
            borderBottom: `2px solid ${magenta}30`,
            opacity: 0.8,
          }}
        />

        {/* Corner accents - bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            right: '3%',
            width: '80px',
            height: '80px',
            borderRight: `2px solid ${cyan}30`,
            borderBottom: `2px solid ${cyan}30`,
            opacity: 0.8,
          }}
        />

        {/* Neon glow lines */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: 0,
            width: '150px',
            height: '1px',
            background: `linear-gradient(90deg, ${cyan}60, transparent)`,
            boxShadow: `0 0 10px ${cyan}40`,
            animation: 'cyberpunk-glow 3s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '45%',
            right: 0,
            width: '120px',
            height: '1px',
            background: `linear-gradient(270deg, ${magenta}60, transparent)`,
            boxShadow: `0 0 10px ${magenta}40`,
            animation: 'cyberpunk-glow 3s ease-in-out 1.5s infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '25%',
            left: 0,
            width: '100px',
            height: '1px',
            background: `linear-gradient(90deg, ${magenta}50, transparent)`,
            boxShadow: `0 0 8px ${magenta}30`,
            animation: 'cyberpunk-glow 3s ease-in-out 0.8s infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '60%',
            right: 0,
            width: '80px',
            height: '1px',
            background: `linear-gradient(270deg, ${cyan}50, transparent)`,
            boxShadow: `0 0 8px ${cyan}30`,
            animation: 'cyberpunk-glow 3s ease-in-out 2.2s infinite',
          }}
        />
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

  // Retro synthwave sun and grid effects
  const renderRetroEffects = () => {
    if (visualTheme !== 'retro') return null;

    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const pink = themeColors.accent || '#ff6b9d';
    const blue = themeColors.link || '#00d9ff';

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Sunset gradient at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: `linear-gradient(to top, ${pink}15, ${blue}08, transparent)`,
            opacity: 0.6,
          }}
        />

        {/* Retro sun */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '100px',
            background: `linear-gradient(to bottom, ${pink}40, #ffc85720)`,
            borderRadius: '200px 200px 0 0',
            opacity: 0.5,
            overflow: 'hidden',
          }}
        >
          {/* Sun stripes */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '4px',
                backgroundColor: 'rgba(26, 10, 30, 0.4)',
                bottom: `${15 + i * 18}%`,
              }}
            />
          ))}
        </div>

        {/* Perspective grid */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '-20%',
            right: '-20%',
            height: '25%',
            background: `
              linear-gradient(transparent 0%, ${pink}10 100%),
              repeating-linear-gradient(90deg, ${pink}15 0px, ${pink}15 1px, transparent 1px, transparent 60px),
              repeating-linear-gradient(0deg, ${pink}10 0px, ${pink}10 1px, transparent 1px, transparent 30px)
            `,
            transform: 'perspective(200px) rotateX(60deg)',
            transformOrigin: 'bottom center',
            opacity: 0.4,
          }}
        />

        {/* Floating stars */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${10 + i * 12}%`,
              top: `${5 + (i % 3) * 15}%`,
              width: '3px',
              height: '3px',
              backgroundColor: i % 2 === 0 ? pink : blue,
              borderRadius: '50%',
              opacity: 0.6,
              animation: `retro-twinkle ${2 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
              boxShadow: `0 0 6px ${i % 2 === 0 ? pink : blue}`,
            }}
          />
        ))}
      </div>
    );
  };

  // Nature theme - plants, leaves, branches, earthy elements
  const renderNatureEffects = () => {
    if (visualTheme !== 'nature') return null;

    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const tan = themeColors.accent || '#c9a66b';
    const sage = themeColors.link || '#8fbc8f';
    const brown = '#6b4423';
    const darkBrown = '#4a3520';

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Warm earthy gradient at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '35%',
            background: `linear-gradient(to top, ${brown}15, ${tan}08, transparent)`,
          }}
        />

        {/* Left side branch/vine */}
        <svg
          style={{
            position: 'absolute',
            left: 0,
            top: '10%',
            width: '120px',
            height: '300px',
            opacity: 0.25,
          }}
          viewBox="0 0 120 300"
        >
          <path
            d="M0,50 Q30,80 20,120 Q10,160 25,200 Q40,240 15,280"
            stroke={darkBrown}
            strokeWidth="3"
            fill="none"
          />
          {/* Leaves on branch */}
          <ellipse cx="25" cy="100" rx="15" ry="8" fill={sage} transform="rotate(-20, 25, 100)" />
          <ellipse cx="20" cy="150" rx="12" ry="6" fill={sage} opacity="0.8" transform="rotate(15, 20, 150)" />
          <ellipse cx="30" cy="210" rx="14" ry="7" fill={sage} transform="rotate(-10, 30, 210)" />
        </svg>

        {/* Right side branch */}
        <svg
          style={{
            position: 'absolute',
            right: 0,
            top: '25%',
            width: '100px',
            height: '250px',
            opacity: 0.2,
            transform: 'scaleX(-1)',
          }}
          viewBox="0 0 100 250"
        >
          <path
            d="M0,30 Q25,60 15,100 Q5,140 20,180 Q35,220 10,250"
            stroke={darkBrown}
            strokeWidth="2.5"
            fill="none"
          />
          <ellipse cx="20" cy="80" rx="12" ry="6" fill={sage} transform="rotate(-25, 20, 80)" />
          <ellipse cx="15" cy="140" rx="10" ry="5" fill={sage} opacity="0.7" transform="rotate(20, 15, 140)" />
        </svg>

        {/* Floating leaves */}
        {[
          { x: '8%', y: '20%', size: 18, rotation: 30, delay: 0, color: sage },
          { x: '20%', y: '65%', size: 14, rotation: -20, delay: 1.2, color: brown },
          { x: '35%', y: '12%', size: 16, rotation: 45, delay: 0.5, color: sage },
          { x: '50%', y: '80%', size: 20, rotation: -35, delay: 1.8, color: tan },
          { x: '65%', y: '8%', size: 14, rotation: 55, delay: 0.8, color: sage },
          { x: '78%', y: '55%', size: 16, rotation: -15, delay: 1.5, color: brown },
          { x: '88%', y: '25%', size: 12, rotation: 40, delay: 0.3, color: sage },
          { x: '45%', y: '40%', size: 10, rotation: -50, delay: 2, color: tan },
        ].map((leaf, i) => (
          <svg
            key={i}
            style={{
              position: 'absolute',
              left: leaf.x,
              top: leaf.y,
              width: leaf.size,
              height: leaf.size,
              opacity: 0.35,
              transform: `rotate(${leaf.rotation}deg)`,
              animation: `nature-float ${7 + (i % 4)}s ease-in-out ${leaf.delay}s infinite`,
            }}
            viewBox="0 0 24 24"
            fill={leaf.color}
          >
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
          </svg>
        ))}

        {/* Small plant/fern at bottom left */}
        <svg
          style={{
            position: 'absolute',
            left: '5%',
            bottom: '5%',
            width: '60px',
            height: '80px',
            opacity: 0.3,
          }}
          viewBox="0 0 60 80"
        >
          <path d="M30,80 Q30,50 25,30 Q20,10 30,5 Q40,10 35,30 Q30,50 30,80" fill={sage} />
          <path d="M30,60 Q15,50 10,35" stroke={sage} strokeWidth="2" fill="none" />
          <path d="M30,60 Q45,50 50,35" stroke={sage} strokeWidth="2" fill="none" />
          <path d="M30,45 Q20,38 12,25" stroke={sage} strokeWidth="1.5" fill="none" />
          <path d="M30,45 Q40,38 48,25" stroke={sage} strokeWidth="1.5" fill="none" />
        </svg>

        {/* Small plant at bottom right */}
        <svg
          style={{
            position: 'absolute',
            right: '8%',
            bottom: '3%',
            width: '50px',
            height: '70px',
            opacity: 0.25,
          }}
          viewBox="0 0 50 70"
        >
          <path d="M25,70 L25,30" stroke={darkBrown} strokeWidth="2" />
          <ellipse cx="15" cy="25" rx="12" ry="6" fill={sage} transform="rotate(-30, 15, 25)" />
          <ellipse cx="35" cy="20" rx="10" ry="5" fill={sage} transform="rotate(25, 35, 20)" />
          <ellipse cx="25" cy="10" rx="8" ry="4" fill={sage} transform="rotate(-5, 25, 10)" />
        </svg>

        {/* Acorns/seeds scattered */}
        {[
          { x: '12%', y: '85%', size: 8 },
          { x: '75%', y: '90%', size: 6 },
          { x: '55%', y: '92%', size: 7 },
        ].map((acorn, i) => (
          <svg
            key={`acorn-${i}`}
            style={{
              position: 'absolute',
              left: acorn.x,
              top: acorn.y,
              width: acorn.size,
              height: acorn.size * 1.3,
              opacity: 0.3,
            }}
            viewBox="0 0 10 13"
          >
            <rect x="3" y="0" width="4" height="3" rx="1" fill={darkBrown} />
            <ellipse cx="5" cy="8" rx="4" ry="5" fill={brown} />
          </svg>
        ))}
      </div>
    );
  };

  // Ocean theme - waves, bubbles, and flowing effects
  const renderOceanEffects = () => {
    if (visualTheme !== 'ocean') return null;

    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const blue = themeColors.accent || '#3b9ebe';
    const seafoam = themeColors.link || '#6bcfb5';

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Deep water gradient at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: `linear-gradient(to top, ${blue}12, ${seafoam}05, transparent)`,
          }}
        />

        {/* Animated wave layers */}
        <svg
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '200%',
            height: '120px',
            opacity: 0.15,
            animation: 'ocean-wave 12s ease-in-out infinite',
          }}
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <path
            fill={blue}
            d="M0,60 C320,120 420,0 720,60 C1020,120 1120,0 1440,60 L1440,120 L0,120 Z"
          />
        </svg>

        <svg
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '200%',
            height: '100px',
            opacity: 0.1,
            animation: 'ocean-wave 10s ease-in-out infinite reverse',
          }}
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
        >
          <path
            fill={seafoam}
            d="M0,50 C360,100 540,0 900,50 C1260,100 1080,0 1440,50 L1440,100 L0,100 Z"
          />
        </svg>

        {/* Floating bubbles */}
        {[
          { x: '8%', y: '75%', size: 8, delay: 0, duration: 8 },
          { x: '15%', y: '85%', size: 5, delay: 2, duration: 10 },
          { x: '25%', y: '70%', size: 6, delay: 1, duration: 9 },
          { x: '40%', y: '80%', size: 7, delay: 3, duration: 11 },
          { x: '55%', y: '75%', size: 5, delay: 0.5, duration: 8 },
          { x: '70%', y: '85%', size: 8, delay: 2.5, duration: 10 },
          { x: '82%', y: '72%', size: 6, delay: 1.5, duration: 9 },
          { x: '92%', y: '78%', size: 5, delay: 4, duration: 12 },
        ].map((bubble, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: bubble.x,
              top: bubble.y,
              width: bubble.size,
              height: bubble.size,
              borderRadius: '50%',
              backgroundColor: i % 2 === 0 ? blue : seafoam,
              opacity: 0.3,
              animation: `ocean-bubble ${bubble.duration}s ease-in-out ${bubble.delay}s infinite`,
            }}
          />
        ))}

        {/* Subtle light rays from top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '20%',
            width: '60%',
            height: '40%',
            background: `linear-gradient(to bottom, ${blue}08, transparent)`,
            clipPath: 'polygon(30% 0%, 40% 0%, 55% 100%, 25% 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '40%',
            width: '50%',
            height: '35%',
            background: `linear-gradient(to bottom, ${seafoam}06, transparent)`,
            clipPath: 'polygon(35% 0%, 45% 0%, 60% 100%, 30% 100%)',
          }}
        />
      </div>
    );
  };

  // Lavender theme - soft floating orbs and dreamy particles
  const renderLavenderEffects = () => {
    if (visualTheme !== 'lavender') return null;

    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const purple = themeColors.accent || '#a78bfa';
    const pink = themeColors.link || '#f0abfc';

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Soft gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: `linear-gradient(to bottom, ${purple}08, transparent)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: `linear-gradient(to top, ${pink}06, transparent)`,
          }}
        />

        {/* Floating soft orbs */}
        {[
          { x: '10%', y: '15%', size: 80, color: purple, opacity: 0.08, delay: 0 },
          { x: '75%', y: '20%', size: 100, color: pink, opacity: 0.06, delay: 2 },
          { x: '20%', y: '70%', size: 90, color: pink, opacity: 0.07, delay: 1 },
          { x: '80%', y: '65%', size: 70, color: purple, opacity: 0.08, delay: 3 },
          { x: '50%', y: '40%', size: 60, color: purple, opacity: 0.05, delay: 1.5 },
        ].map((orb, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: orb.x,
              top: orb.y,
              width: orb.size,
              height: orb.size,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${orb.color}${Math.round(orb.opacity * 255).toString(16).padStart(2, '0')}, transparent 70%)`,
              filter: 'blur(20px)',
              animation: `lavender-float ${8 + i * 2}s ease-in-out ${orb.delay}s infinite`,
            }}
          />
        ))}

        {/* Tiny sparkle particles */}
        {[
          { x: '15%', y: '25%', delay: 0 },
          { x: '30%', y: '60%', delay: 1.5 },
          { x: '45%', y: '15%', delay: 0.8 },
          { x: '60%', y: '75%', delay: 2.2 },
          { x: '75%', y: '35%', delay: 1.2 },
          { x: '85%', y: '55%', delay: 0.5 },
          { x: '25%', y: '85%', delay: 2.8 },
          { x: '55%', y: '45%', delay: 1.8 },
        ].map((spark, i) => (
          <div
            key={`spark-${i}`}
            style={{
              position: 'absolute',
              left: spark.x,
              top: spark.y,
              width: 3,
              height: 3,
              borderRadius: '50%',
              backgroundColor: i % 2 === 0 ? purple : pink,
              opacity: 0.4,
              animation: `lavender-sparkle ${3 + (i % 2)}s ease-in-out ${spark.delay}s infinite`,
            }}
          />
        ))}
      </div>
    );
  };

  // Space theme - stars, planets, nebulae, cosmic vibes
  const renderSpaceEffects = () => {
    if (visualTheme !== 'space') return null;

    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const purple = themeColors.accent || '#7c6cf0';
    const blue = themeColors.link || '#50c8f0';

    // Generate random stars
    const stars = Array.from({ length: 50 }, () => ({
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.5,
      delay: Math.random() * 3,
    }));

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Deep space gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'radial-gradient(ellipse at 30% 20%, rgba(124, 108, 240, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(80, 200, 240, 0.06) 0%, transparent 50%)'
              : 'radial-gradient(ellipse at 30% 20%, rgba(124, 108, 240, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(80, 200, 240, 0.1) 0%, transparent 50%)',
          }}
        />

        {/* Twinkling stars */}
        {stars.map((star, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              backgroundColor: i % 3 === 0 ? purple : i % 3 === 1 ? blue : '#ffffff',
              opacity: star.opacity,
              animation: `space-twinkle ${2 + Math.random() * 2}s ease-in-out ${star.delay}s infinite`,
            }}
          />
        ))}

        {/* Orbiting planet */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            right: '12%',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${purple}80, ${purple}40 60%, ${purple}20)`,
            boxShadow: `0 0 20px ${purple}40`,
            animation: 'space-float 20s ease-in-out infinite',
          }}
        >
          {/* Ring around planet */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '60px',
              height: '15px',
              border: `2px solid ${purple}40`,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%) rotateX(70deg)',
            }}
          />
        </div>

        {/* Small moon */}
        <div
          style={{
            position: 'absolute',
            top: '60%',
            left: '8%',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, #e0e0f0, #a0a0c0 60%, #707090)`,
            boxShadow: '0 0 10px rgba(200, 200, 240, 0.3)',
            animation: 'space-float 15s ease-in-out 2s infinite reverse',
          }}
        />

        {/* Shooting star */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '30%',
            width: '80px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #ffffff, transparent)',
            transform: 'rotate(-35deg)',
            opacity: 0.6,
            animation: 'space-shoot 8s ease-in-out infinite',
          }}
        />

        {/* Nebula cloud */}
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '5%',
            width: '150px',
            height: '100px',
            background: `radial-gradient(ellipse, ${purple}15 0%, ${blue}10 40%, transparent 70%)`,
            filter: 'blur(20px)',
            animation: 'space-float 25s ease-in-out infinite',
          }}
        />

        {/* Another nebula */}
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '15%',
            width: '120px',
            height: '80px',
            background: `radial-gradient(ellipse, ${blue}12 0%, ${purple}08 40%, transparent 70%)`,
            filter: 'blur(15px)',
            animation: 'space-float 20s ease-in-out 5s infinite reverse',
          }}
        />

        {/* Constellation lines */}
        <svg
          style={{
            position: 'absolute',
            top: '10%',
            left: '60%',
            width: '100px',
            height: '80px',
            opacity: 0.2,
          }}
          viewBox="0 0 100 80"
        >
          <line x1="10" y1="20" x2="40" y2="10" stroke={purple} strokeWidth="1" />
          <line x1="40" y1="10" x2="70" y2="30" stroke={purple} strokeWidth="1" />
          <line x1="70" y1="30" x2="90" y2="15" stroke={purple} strokeWidth="1" />
          <line x1="70" y1="30" x2="60" y2="60" stroke={purple} strokeWidth="1" />
          <circle cx="10" cy="20" r="3" fill={purple} />
          <circle cx="40" cy="10" r="3" fill={purple} />
          <circle cx="70" cy="30" r="4" fill={purple} />
          <circle cx="90" cy="15" r="2" fill={purple} />
          <circle cx="60" cy="60" r="3" fill={purple} />
        </svg>
      </div>
    );
  };

  // Pixel theme - 8-bit aesthetic with floating pixel art elements
  const renderPixelEffects = () => {
    if (visualTheme !== 'pixel') return null;

    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const red = themeColors.accent || '#ff5a5a';
    const green = themeColors.link || '#5aff5a';
    const yellow = themeColors.warning || '#ffff5a';
    const blue = '#5a5aff';

    // Pixel heart SVG
    const PixelHeart = ({ color, style }: { color: string; style: React.CSSProperties }) => (
      <svg style={style} viewBox="0 0 16 14" fill={color}>
        <rect x="2" y="0" width="2" height="2" />
        <rect x="4" y="0" width="2" height="2" />
        <rect x="8" y="0" width="2" height="2" />
        <rect x="10" y="0" width="2" height="2" />
        <rect x="0" y="2" width="2" height="2" />
        <rect x="2" y="2" width="2" height="2" />
        <rect x="4" y="2" width="2" height="2" />
        <rect x="6" y="2" width="2" height="2" />
        <rect x="8" y="2" width="2" height="2" />
        <rect x="10" y="2" width="2" height="2" />
        <rect x="12" y="2" width="2" height="2" />
        <rect x="0" y="4" width="2" height="2" />
        <rect x="2" y="4" width="2" height="2" />
        <rect x="4" y="4" width="2" height="2" />
        <rect x="6" y="4" width="2" height="2" />
        <rect x="8" y="4" width="2" height="2" />
        <rect x="10" y="4" width="2" height="2" />
        <rect x="12" y="4" width="2" height="2" />
        <rect x="2" y="6" width="2" height="2" />
        <rect x="4" y="6" width="2" height="2" />
        <rect x="6" y="6" width="2" height="2" />
        <rect x="8" y="6" width="2" height="2" />
        <rect x="10" y="6" width="2" height="2" />
        <rect x="4" y="8" width="2" height="2" />
        <rect x="6" y="8" width="2" height="2" />
        <rect x="8" y="8" width="2" height="2" />
        <rect x="6" y="10" width="2" height="2" />
      </svg>
    );

    // Pixel coin SVG
    const PixelCoin = ({ style }: { style: React.CSSProperties }) => (
      <svg style={style} viewBox="0 0 14 14" fill={yellow}>
        <rect x="4" y="0" width="6" height="2" />
        <rect x="2" y="2" width="2" height="2" />
        <rect x="4" y="2" width="2" height="2" fill="#cccc00" />
        <rect x="6" y="2" width="4" height="2" />
        <rect x="10" y="2" width="2" height="2" />
        <rect x="0" y="4" width="2" height="6" />
        <rect x="2" y="4" width="2" height="6" fill="#cccc00" />
        <rect x="4" y="4" width="6" height="6" />
        <rect x="10" y="4" width="2" height="6" fill="#cccc00" />
        <rect x="12" y="4" width="2" height="6" />
        <rect x="2" y="10" width="2" height="2" />
        <rect x="4" y="10" width="2" height="2" fill="#cccc00" />
        <rect x="6" y="10" width="4" height="2" />
        <rect x="10" y="10" width="2" height="2" />
        <rect x="4" y="12" width="6" height="2" />
      </svg>
    );

    // Pixel star SVG
    const PixelStar = ({ color, style }: { color: string; style: React.CSSProperties }) => (
      <svg style={style} viewBox="0 0 12 12" fill={color}>
        <rect x="5" y="0" width="2" height="2" />
        <rect x="5" y="2" width="2" height="2" />
        <rect x="0" y="4" width="2" height="2" />
        <rect x="2" y="4" width="2" height="2" />
        <rect x="4" y="4" width="4" height="2" />
        <rect x="8" y="4" width="2" height="2" />
        <rect x="10" y="4" width="2" height="2" />
        <rect x="3" y="6" width="2" height="2" />
        <rect x="5" y="6" width="2" height="2" />
        <rect x="7" y="6" width="2" height="2" />
        <rect x="2" y="8" width="2" height="2" />
        <rect x="8" y="8" width="2" height="2" />
        <rect x="1" y="10" width="2" height="2" />
        <rect x="9" y="10" width="2" height="2" />
      </svg>
    );

    // Pixel mushroom SVG (1-up style)
    const PixelMushroom = ({ style }: { style: React.CSSProperties }) => (
      <svg style={style} viewBox="0 0 14 14">
        <rect x="4" y="0" width="6" height="2" fill={green} />
        <rect x="2" y="2" width="2" height="2" fill={green} />
        <rect x="4" y="2" width="2" height="2" fill="#ffffff" />
        <rect x="6" y="2" width="2" height="2" fill={green} />
        <rect x="8" y="2" width="2" height="2" fill="#ffffff" />
        <rect x="10" y="2" width="2" height="2" fill={green} />
        <rect x="0" y="4" width="2" height="2" fill={green} />
        <rect x="2" y="4" width="2" height="2" fill="#ffffff" />
        <rect x="4" y="4" width="2" height="2" fill="#ffffff" />
        <rect x="6" y="4" width="2" height="2" fill={green} />
        <rect x="8" y="4" width="2" height="2" fill="#ffffff" />
        <rect x="10" y="4" width="2" height="2" fill="#ffffff" />
        <rect x="12" y="4" width="2" height="2" fill={green} />
        <rect x="0" y="6" width="2" height="2" fill={green} />
        <rect x="2" y="6" width="10" height="2" fill={green} />
        <rect x="12" y="6" width="2" height="2" fill={green} />
        <rect x="4" y="8" width="6" height="2" fill="#f5deb3" />
        <rect x="4" y="10" width="6" height="2" fill="#f5deb3" />
        <rect x="2" y="12" width="10" height="2" fill="#f5deb3" />
      </svg>
    );

    const elements = [
      // Hearts
      { type: 'heart', x: '5%', y: '15%', size: 20, delay: 0, duration: 6 },
      { type: 'heart', x: '85%', y: '25%', size: 16, delay: 1.5, duration: 7 },
      { type: 'heart', x: '15%', y: '70%', size: 18, delay: 3, duration: 5.5 },
      { type: 'heart', x: '75%', y: '80%', size: 14, delay: 2, duration: 6.5 },
      // Coins
      { type: 'coin', x: '25%', y: '10%', size: 16, delay: 0.5, duration: 5 },
      { type: 'coin', x: '70%', y: '45%', size: 18, delay: 2.5, duration: 6 },
      { type: 'coin', x: '10%', y: '45%', size: 14, delay: 1, duration: 5.5 },
      { type: 'coin', x: '90%', y: '60%', size: 16, delay: 3.5, duration: 7 },
      { type: 'coin', x: '50%', y: '85%', size: 18, delay: 0, duration: 6 },
      // Stars
      { type: 'star', x: '40%', y: '5%', size: 14, delay: 1, duration: 4.5 },
      { type: 'star', x: '60%', y: '30%', size: 12, delay: 2, duration: 5 },
      { type: 'star', x: '30%', y: '55%', size: 16, delay: 0.5, duration: 4 },
      { type: 'star', x: '80%', y: '10%', size: 14, delay: 3, duration: 5.5 },
      // Mushrooms
      { type: 'mushroom', x: '20%', y: '35%', size: 20, delay: 1.5, duration: 7 },
      { type: 'mushroom', x: '65%', y: '70%', size: 18, delay: 0, duration: 6.5 },
      { type: 'mushroom', x: '45%', y: '20%', size: 16, delay: 2.5, duration: 7.5 },
    ];

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Scanline overlay */}
        <div
          className="pixel-scanlines"
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.03) 2px,
              rgba(0, 0, 0, 0.03) 4px
            )`,
            pointerEvents: 'none',
          }}
        />

        {/* Floating pixel elements */}
        {elements.map((el, i) => {
          const baseStyle: React.CSSProperties = {
            position: 'absolute',
            left: el.x,
            top: el.y,
            width: el.size,
            height: el.size,
            opacity: 0.5,
            animation: `pixel-float ${el.duration}s ease-in-out ${el.delay}s infinite`,
            imageRendering: 'pixelated',
          };

          switch (el.type) {
            case 'heart':
              return <PixelHeart key={i} color={red} style={baseStyle} />;
            case 'coin':
              return <PixelCoin key={i} style={baseStyle} />;
            case 'star':
              return <PixelStar key={i} color={i % 2 === 0 ? yellow : blue} style={baseStyle} />;
            case 'mushroom':
              return <PixelMushroom key={i} style={baseStyle} />;
            default:
              return null;
          }
        })}

        {/* Ground blocks at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40px',
            display: 'flex',
            opacity: 0.15,
          }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: i % 2 === 0 ? '#8b4513' : '#a0522d',
                borderTop: '4px solid #654321',
                borderRight: '2px solid #4a2c0a',
                boxSizing: 'border-box',
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  // Aquarium theme - swimming fish, bubbles, coral, caustic light effects
  const renderAquariumEffects = () => {
    if (visualTheme !== 'aquarium') return null;

    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const cyan = themeColors.accent || '#00b8d4';
    const coral = themeColors.link || '#ff7f50';
    const seafoam = themeColors.success || '#00e5a0';
    const gold = themeColors.warning || '#ffd700';

    // Fish SVG component
    const Fish = ({ color, style, flip = false }: { color: string; style: React.CSSProperties; flip?: boolean }) => (
      <svg
        style={{
          ...style,
          transform: `${style.transform || ''} ${flip ? 'scaleX(-1)' : ''}`.trim(),
        }}
        viewBox="0 0 40 20"
      >
        {/* Fish body */}
        <ellipse cx="20" cy="10" rx="14" ry="7" fill={color} />
        {/* Fish tail */}
        <polygon points={flip ? "34,10 44,3 44,17" : "6,10 -4,3 -4,17"} fill={color} />
        {/* Fish eye */}
        <circle cx={flip ? "12" : "28"} cy="8" r="2" fill="#ffffff" />
        <circle cx={flip ? "11" : "29"} cy="7.5" r="1" fill="#000000" />
        {/* Fish fin */}
        <path
          d={flip ? "M22,4 Q25,0 28,4" : "M12,4 Q15,0 18,4"}
          stroke={color}
          strokeWidth="3"
          fill="none"
          opacity="0.8"
        />
      </svg>
    );

    // Small tropical fish
    const TropicalFish = ({ color1, color2, style, flip = false }: { color1: string; color2: string; style: React.CSSProperties; flip?: boolean }) => (
      <svg
        style={{
          ...style,
          transform: `${style.transform || ''} ${flip ? 'scaleX(-1)' : ''}`.trim(),
        }}
        viewBox="0 0 30 20"
      >
        {/* Body */}
        <ellipse cx="15" cy="10" rx="10" ry="8" fill={color1} />
        {/* Stripe */}
        <rect x="12" y="2" width="4" height="16" fill={color2} rx="2" />
        {/* Tail */}
        <polygon points={flip ? "25,10 35,4 35,16" : "5,10 -5,4 -5,16"} fill={color2} />
        {/* Eye */}
        <circle cx={flip ? "10" : "20"} cy="8" r="2" fill="#ffffff" />
        <circle cx={flip ? "9.5" : "20.5"} cy="7.5" r="1" fill="#000000" />
        {/* Top fin */}
        <path
          d="M15,2 Q15,-3 18,2"
          fill={color2}
        />
      </svg>
    );

    // Seaweed/kelp
    const Seaweed = ({ color, style }: { color: string; style: React.CSSProperties }) => (
      <svg style={style} viewBox="0 0 30 100">
        <path
          d="M15,100 Q5,80 15,60 Q25,40 15,20 Q5,0 15,0"
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M15,70 Q0,60 5,45"
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M15,50 Q30,40 25,25"
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>
    );

    // Coral
    const Coral = ({ color, style }: { color: string; style: React.CSSProperties }) => (
      <svg style={style} viewBox="0 0 60 50">
        {/* Main branches */}
        <path d="M30,50 L30,35 L20,15 L15,5" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M30,50 L30,35 L40,15 L45,5" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M30,35 L30,10" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Small branches */}
        <path d="M20,15 L10,10" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M40,15 L50,10" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M30,20 L25,12" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M30,20 L35,12" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Tips */}
        <circle cx="15" cy="5" r="3" fill={color} />
        <circle cx="45" cy="5" r="3" fill={color} />
        <circle cx="30" cy="10" r="3" fill={color} />
        <circle cx="10" cy="10" r="2" fill={color} />
        <circle cx="50" cy="10" r="2" fill={color} />
        <circle cx="25" cy="12" r="2" fill={color} />
        <circle cx="35" cy="12" r="2" fill={color} />
      </svg>
    );

    // Fish swimming data
    const fish = [
      { type: 'regular', x: '10%', y: '25%', size: 35, color: gold, delay: 0, duration: 15, flip: false },
      { type: 'regular', x: '80%', y: '40%', size: 30, color: cyan, delay: 3, duration: 18, flip: true },
      { type: 'tropical', x: '30%', y: '60%', size: 25, color1: coral, color2: '#ffffff', delay: 5, duration: 12, flip: false },
      { type: 'tropical', x: '70%', y: '20%', size: 28, color1: '#ff69b4', color2: '#ffffff', delay: 8, duration: 16, flip: true },
      { type: 'regular', x: '50%', y: '75%', size: 32, color: seafoam, delay: 2, duration: 14, flip: false },
      { type: 'tropical', x: '15%', y: '50%', size: 22, color1: gold, color2: '#ffffff', delay: 6, duration: 13, flip: false },
      { type: 'regular', x: '85%', y: '65%', size: 28, color: '#6495ed', delay: 4, duration: 17, flip: true },
      { type: 'tropical', x: '45%', y: '35%', size: 24, color1: cyan, color2: coral, delay: 10, duration: 15, flip: true },
    ];

    // Bubbles
    const bubbles = [
      { x: '12%', y: '85%', size: 6, delay: 0, duration: 8 },
      { x: '25%', y: '90%', size: 4, delay: 1.5, duration: 10 },
      { x: '38%', y: '82%', size: 8, delay: 0.8, duration: 9 },
      { x: '52%', y: '88%', size: 5, delay: 2.2, duration: 11 },
      { x: '65%', y: '85%', size: 7, delay: 1, duration: 8.5 },
      { x: '78%', y: '92%', size: 4, delay: 3, duration: 12 },
      { x: '88%', y: '80%', size: 6, delay: 0.5, duration: 9.5 },
      { x: '8%', y: '75%', size: 5, delay: 2.5, duration: 10 },
      { x: '42%', y: '78%', size: 3, delay: 4, duration: 11 },
      { x: '72%', y: '88%', size: 5, delay: 1.8, duration: 9 },
    ];

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Deep water gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'linear-gradient(to bottom, rgba(0, 184, 212, 0.05) 0%, rgba(0, 120, 140, 0.1) 100%)'
              : 'linear-gradient(to bottom, rgba(0, 80, 100, 0.15) 0%, rgba(6, 16, 24, 0.3) 100%)',
          }}
        />

        {/* Underwater caustic light rays */}
        <div
          className="aquarium-caustics"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60%',
            opacity: theme === 'light' ? 0.15 : 0.1,
            background: `
              radial-gradient(ellipse 100px 200px at 20% 10%, ${cyan}30, transparent 70%),
              radial-gradient(ellipse 80px 180px at 45% 15%, ${cyan}25, transparent 70%),
              radial-gradient(ellipse 120px 220px at 70% 8%, ${cyan}30, transparent 70%),
              radial-gradient(ellipse 90px 190px at 85% 12%, ${cyan}25, transparent 70%)
            `,
            animation: 'aquarium-caustic 8s ease-in-out infinite',
          }}
        />

        {/* Seaweed at bottom */}
        <Seaweed
          color={theme === 'light' ? '#2d8f6f' : '#3cb371'}
          style={{
            position: 'absolute',
            bottom: 0,
            left: '5%',
            width: '30px',
            height: '120px',
            opacity: 0.4,
            animation: 'aquarium-sway 4s ease-in-out infinite',
          }}
        />
        <Seaweed
          color={theme === 'light' ? '#228b22' : '#32cd32'}
          style={{
            position: 'absolute',
            bottom: 0,
            left: '12%',
            width: '25px',
            height: '100px',
            opacity: 0.35,
            animation: 'aquarium-sway 5s ease-in-out 0.5s infinite',
          }}
        />
        <Seaweed
          color={theme === 'light' ? '#2d8f6f' : '#3cb371'}
          style={{
            position: 'absolute',
            bottom: 0,
            right: '8%',
            width: '28px',
            height: '110px',
            opacity: 0.4,
            animation: 'aquarium-sway 4.5s ease-in-out 1s infinite',
          }}
        />
        <Seaweed
          color={theme === 'light' ? '#228b22' : '#32cd32'}
          style={{
            position: 'absolute',
            bottom: 0,
            right: '15%',
            width: '22px',
            height: '90px',
            opacity: 0.3,
            animation: 'aquarium-sway 5.5s ease-in-out 0.3s infinite',
          }}
        />

        {/* Coral formations */}
        <Coral
          color={coral}
          style={{
            position: 'absolute',
            bottom: 0,
            left: '25%',
            width: '50px',
            height: '45px',
            opacity: 0.35,
          }}
        />
        <Coral
          color={theme === 'light' ? '#ff6b6b' : '#ff7f7f'}
          style={{
            position: 'absolute',
            bottom: 0,
            right: '30%',
            width: '45px',
            height: '40px',
            opacity: 0.3,
            transform: 'scaleX(-1)',
          }}
        />
        <Coral
          color={theme === 'light' ? '#daa520' : '#ffd700'}
          style={{
            position: 'absolute',
            bottom: 0,
            left: '55%',
            width: '40px',
            height: '35px',
            opacity: 0.25,
          }}
        />

        {/* Sandy bottom hint */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30px',
            background: theme === 'light'
              ? 'linear-gradient(to top, rgba(210, 180, 140, 0.2), transparent)'
              : 'linear-gradient(to top, rgba(160, 130, 90, 0.15), transparent)',
          }}
        />

        {/* Swimming fish */}
        {fish.map((f, i) => {
          const baseStyle: React.CSSProperties = {
            position: 'absolute',
            left: f.x,
            top: f.y,
            width: f.size,
            height: f.size * 0.5,
            opacity: 0.6,
            animation: `aquarium-swim-${f.flip ? 'left' : 'right'} ${f.duration}s ease-in-out ${f.delay}s infinite`,
          };

          if (f.type === 'tropical') {
            return (
              <TropicalFish
                key={i}
                color1={f.color1 || coral}
                color2={f.color2 || '#ffffff'}
                style={baseStyle}
                flip={f.flip}
              />
            );
          }
          return <Fish key={i} color={f.color || '#ffffff'} style={baseStyle} flip={f.flip} />;
        })}

        {/* Rising bubbles */}
        {bubbles.map((bubble, i) => (
          <div
            key={`bubble-${i}`}
            style={{
              position: 'absolute',
              left: bubble.x,
              top: bubble.y,
              width: bubble.size,
              height: bubble.size,
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), ${cyan}40)`,
              border: `1px solid ${cyan}30`,
              opacity: 0.5,
              animation: `aquarium-bubble ${bubble.duration}s ease-in-out ${bubble.delay}s infinite`,
            }}
          />
        ))}

        {/* Floating particles/plankton */}
        {[
          { x: '20%', y: '30%', delay: 0 },
          { x: '40%', y: '50%', delay: 1.5 },
          { x: '60%', y: '25%', delay: 0.8 },
          { x: '75%', y: '55%', delay: 2 },
          { x: '35%', y: '70%', delay: 1 },
          { x: '80%', y: '35%', delay: 2.5 },
        ].map((p, i) => (
          <div
            key={`particle-${i}`}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: 2,
              height: 2,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              opacity: 0.3,
              animation: `aquarium-drift ${6 + i}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>
    );
  };

  // Cozy/Cottagecore theme - fireflies, falling leaves, warm candlelight
  const renderCozyEffects = () => {
    if (visualTheme !== 'cozy') return null;

    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const amber = themeColors.accent || '#e8a854';
    const terracotta = themeColors.link || '#c4785a';

    // Leaf colors for autumn feel
    const leafColors = ['#c45c4a', '#e8a854', '#8b4513', '#cd853f', '#d2691e'];

    // Leaf SVG component
    const Leaf = ({ color, style }: { color: string; style: React.CSSProperties }) => (
      <svg style={style} viewBox="0 0 24 24" fill={color}>
        <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
      </svg>
    );

    // Maple leaf SVG
    const MapleLeaf = ({ color, style }: { color: string; style: React.CSSProperties }) => (
      <svg style={style} viewBox="0 0 24 24" fill={color}>
        <path d="M12,2L9,5L6,2L7,6L3,6L6,9L2,12L6,12L4,16L8,14L9,19L12,15L15,19L16,14L20,16L18,12L22,12L18,9L21,6L17,6L18,2L15,5L12,2Z" />
      </svg>
    );

    // Falling leaves data
    const leaves = [
      { type: 'regular', x: '5%', color: leafColors[0], size: 18, delay: 0, duration: 12 },
      { type: 'maple', x: '15%', color: leafColors[1], size: 16, delay: 2, duration: 14 },
      { type: 'regular', x: '25%', color: leafColors[2], size: 14, delay: 4, duration: 11 },
      { type: 'maple', x: '35%', color: leafColors[3], size: 20, delay: 1, duration: 15 },
      { type: 'regular', x: '45%', color: leafColors[4], size: 16, delay: 3, duration: 13 },
      { type: 'maple', x: '55%', color: leafColors[0], size: 18, delay: 5, duration: 12 },
      { type: 'regular', x: '65%', color: leafColors[1], size: 15, delay: 2.5, duration: 14 },
      { type: 'maple', x: '75%', color: leafColors[2], size: 17, delay: 0.5, duration: 11 },
      { type: 'regular', x: '85%', color: leafColors[3], size: 19, delay: 3.5, duration: 15 },
      { type: 'maple', x: '95%', color: leafColors[4], size: 14, delay: 1.5, duration: 13 },
    ];

    // Fireflies data
    const fireflies = [
      { x: '8%', y: '20%', delay: 0, duration: 4 },
      { x: '15%', y: '45%', delay: 1.5, duration: 3.5 },
      { x: '25%', y: '30%', delay: 0.8, duration: 4.5 },
      { x: '35%', y: '60%', delay: 2.2, duration: 3.8 },
      { x: '45%', y: '25%', delay: 1, duration: 4.2 },
      { x: '55%', y: '50%', delay: 2.8, duration: 3.6 },
      { x: '65%', y: '35%', delay: 0.5, duration: 4.8 },
      { x: '75%', y: '55%', delay: 1.8, duration: 3.4 },
      { x: '85%', y: '40%', delay: 3, duration: 4.4 },
      { x: '92%', y: '65%', delay: 0.3, duration: 3.9 },
      { x: '12%', y: '70%', delay: 2.5, duration: 4.1 },
      { x: '42%', y: '75%', delay: 1.2, duration: 3.7 },
      { x: '68%', y: '80%', delay: 0.7, duration: 4.3 },
      { x: '88%', y: '72%', delay: 2, duration: 3.5 },
    ];

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Warm ambient gradient - like firelight */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'radial-gradient(ellipse at 50% 100%, rgba(232, 168, 84, 0.08) 0%, transparent 50%)'
              : 'radial-gradient(ellipse at 50% 100%, rgba(232, 168, 84, 0.15) 0%, transparent 50%)',
          }}
        />

        {/* Corner candlelight glows */}
        <div
          className="cozy-candle-glow"
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '5%',
            width: '150px',
            height: '150px',
            background: `radial-gradient(circle, ${amber}25, ${amber}10 40%, transparent 70%)`,
            filter: 'blur(30px)',
            animation: 'cozy-flicker 3s ease-in-out infinite',
          }}
        />
        <div
          className="cozy-candle-glow"
          style={{
            position: 'absolute',
            bottom: '15%',
            right: '8%',
            width: '120px',
            height: '120px',
            background: `radial-gradient(circle, ${amber}20, ${amber}08 40%, transparent 70%)`,
            filter: 'blur(25px)',
            animation: 'cozy-flicker 3.5s ease-in-out 0.5s infinite',
          }}
        />
        <div
          className="cozy-candle-glow"
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '100px',
            height: '100px',
            background: `radial-gradient(circle, ${terracotta}15, ${terracotta}05 40%, transparent 70%)`,
            filter: 'blur(20px)',
            animation: 'cozy-flicker 4s ease-in-out 1s infinite',
          }}
        />

        {/* Falling leaves */}
        {leaves.map((leaf, i) => {
          const baseStyle: React.CSSProperties = {
            position: 'absolute',
            left: leaf.x,
            top: '-30px',
            width: leaf.size,
            height: leaf.size,
            opacity: 0.6,
            animation: `cozy-fall ${leaf.duration * 4}s ease-in-out ${leaf.delay}s infinite`,
          };

          return leaf.type === 'maple' ? (
            <MapleLeaf key={`leaf-${i}`} color={leaf.color} style={baseStyle} />
          ) : (
            <Leaf key={`leaf-${i}`} color={leaf.color} style={baseStyle} />
          );
        })}

        {/* Fireflies */}
        {fireflies.map((ff, i) => (
          <div
            key={`firefly-${i}`}
            style={{
              position: 'absolute',
              left: ff.x,
              top: ff.y,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#fffacd',
              boxShadow: `0 0 12px 6px rgba(255, 250, 140, 0.7), 0 0 25px 12px rgba(255, 250, 140, 0.4), 0 0 40px 20px rgba(255, 250, 140, 0.2)`,
              animation: `cozy-firefly ${ff.duration * 10}s ease-in-out ${ff.delay}s infinite`,
            }}
          />
        ))}

        {/* Warm vignette effect */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'radial-gradient(ellipse at center, transparent 50%, rgba(200, 138, 58, 0.05) 100%)'
              : 'radial-gradient(ellipse at center, transparent 40%, rgba(26, 20, 16, 0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  };

  // Winter theme - falling snowflakes, aurora borealis, frosted atmosphere
  const renderWinterEffects = () => {
    if (visualTheme !== 'winter') return null;

    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const iceBlue = themeColors.accent || '#7dd3fc';
    const auroraGreen = themeColors.success || '#6ee7b7';
    const auroraPink = '#c4b5fd';

    // Generate snowflakes with varied sizes and positions
    const snowflakes = [
      { x: '5%', size: 4, delay: 0, duration: 25 },
      { x: '10%', size: 6, delay: 3, duration: 30 },
      { x: '15%', size: 3, delay: 8, duration: 22 },
      { x: '20%', size: 5, delay: 1, duration: 28 },
      { x: '25%', size: 4, delay: 6, duration: 24 },
      { x: '30%', size: 7, delay: 2, duration: 32 },
      { x: '35%', size: 3, delay: 10, duration: 20 },
      { x: '40%', size: 5, delay: 4, duration: 26 },
      { x: '45%', size: 4, delay: 7, duration: 23 },
      { x: '50%', size: 6, delay: 0, duration: 29 },
      { x: '55%', size: 3, delay: 5, duration: 21 },
      { x: '60%', size: 5, delay: 9, duration: 27 },
      { x: '65%', size: 4, delay: 2, duration: 25 },
      { x: '70%', size: 6, delay: 6, duration: 31 },
      { x: '75%', size: 3, delay: 1, duration: 22 },
      { x: '80%', size: 5, delay: 8, duration: 28 },
      { x: '85%', size: 4, delay: 3, duration: 24 },
      { x: '90%', size: 6, delay: 7, duration: 30 },
      { x: '95%', size: 3, delay: 4, duration: 20 },
      { x: '8%', size: 5, delay: 11, duration: 26 },
      { x: '22%', size: 4, delay: 13, duration: 23 },
      { x: '38%', size: 6, delay: 15, duration: 29 },
      { x: '52%', size: 3, delay: 12, duration: 21 },
      { x: '68%', size: 5, delay: 14, duration: 27 },
      { x: '82%', size: 4, delay: 16, duration: 25 },
    ];

    // Snowflake SVG component
    const Snowflake = ({ size, style }: { size: number; style: React.CSSProperties }) => (
      <svg style={style} viewBox="0 0 24 24" width={size} height={size} fill="#ffffff">
        <path d="M12,2L12,22M12,2L9,5M12,2L15,5M12,22L9,19M12,22L15,19M2,12L22,12M2,12L5,9M2,12L5,15M22,12L19,9M22,12L19,15M5.64,5.64L18.36,18.36M5.64,5.64L5.64,9.19M5.64,5.64L9.19,5.64M18.36,18.36L18.36,14.81M18.36,18.36L14.81,18.36M18.36,5.64L5.64,18.36M18.36,5.64L14.81,5.64M18.36,5.64L18.36,9.19M5.64,18.36L9.19,18.36M5.64,18.36L5.64,14.81"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Aurora borealis effect at the top */}
        <div
          className="winter-aurora"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: theme === 'light'
              ? `linear-gradient(180deg,
                  transparent 0%,
                  rgba(110, 231, 183, 0.05) 20%,
                  rgba(125, 211, 252, 0.08) 40%,
                  rgba(196, 181, 253, 0.05) 60%,
                  transparent 100%)`
              : `linear-gradient(180deg,
                  transparent 0%,
                  rgba(110, 231, 183, 0.12) 20%,
                  rgba(125, 211, 252, 0.15) 40%,
                  rgba(196, 181, 253, 0.1) 60%,
                  transparent 100%)`,
            animation: 'winter-aurora-shift 20s ease-in-out infinite',
          }}
        />

        {/* Secondary aurora wave */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '-20%',
            right: '-20%',
            height: '40%',
            background: theme === 'light'
              ? `radial-gradient(ellipse 80% 50% at 30% 20%, ${auroraGreen}08, transparent 50%),
                 radial-gradient(ellipse 60% 40% at 70% 30%, ${auroraPink}06, transparent 50%)`
              : `radial-gradient(ellipse 80% 50% at 30% 20%, ${auroraGreen}15, transparent 50%),
                 radial-gradient(ellipse 60% 40% at 70% 30%, ${auroraPink}12, transparent 50%)`,
            animation: 'winter-aurora-wave 15s ease-in-out infinite reverse',
            opacity: 0.8,
          }}
        />

        {/* Subtle ground frost/snow gradient */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20%',
            background: theme === 'light'
              ? 'linear-gradient(to top, rgba(255, 255, 255, 0.3), transparent)'
              : 'linear-gradient(to top, rgba(200, 230, 255, 0.08), transparent)',
          }}
        />

        {/* Falling snowflakes */}
        {snowflakes.map((flake, i) => (
          <div
            key={`snowflake-${i}`}
            style={{
              position: 'absolute',
              left: flake.x,
              top: '-20px',
              opacity: 0.7,
              animation: `winter-snow-fall ${flake.duration}s linear ${flake.delay}s infinite`,
            }}
          >
            <Snowflake
              size={flake.size * 3}
              style={{
                filter: `drop-shadow(0 0 ${flake.size}px rgba(255, 255, 255, 0.5))`,
              }}
            />
          </div>
        ))}

        {/* Floating ice sparkles */}
        {[
          { x: '10%', y: '20%', delay: 0 },
          { x: '25%', y: '35%', delay: 1.5 },
          { x: '40%', y: '15%', delay: 0.8 },
          { x: '55%', y: '45%', delay: 2.2 },
          { x: '70%', y: '25%', delay: 1.2 },
          { x: '85%', y: '40%', delay: 0.5 },
          { x: '15%', y: '55%', delay: 2.8 },
          { x: '60%', y: '60%', delay: 1.8 },
          { x: '80%', y: '55%', delay: 3.2 },
          { x: '35%', y: '65%', delay: 0.3 },
        ].map((sparkle, i) => (
          <div
            key={`ice-sparkle-${i}`}
            style={{
              position: 'absolute',
              left: sparkle.x,
              top: sparkle.y,
              width: 3,
              height: 3,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: `0 0 6px 2px ${iceBlue}80, 0 0 12px 4px ${iceBlue}40`,
              animation: `winter-sparkle ${3 + (i % 2)}s ease-in-out ${sparkle.delay}s infinite`,
            }}
          />
        ))}

        {/* Frosted vignette effect */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'radial-gradient(ellipse at center, transparent 60%, rgba(200, 230, 255, 0.1) 100%)'
              : 'radial-gradient(ellipse at center, transparent 50%, rgba(10, 20, 40, 0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  };

  // Sakura theme - cherry blossom petals drifting, soft pinks, Japanese aesthetic
  const renderSakuraEffects = () => {
    if (visualTheme !== 'sakura') return null;

    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const pink = themeColors.accent || '#f9a8d4';
    const rosePink = themeColors.link || '#fda4af';

    // Cherry blossom petal colors
    const petalColors = ['#ffc0cb', '#ffb6c1', '#ff69b4', '#ffc1cc', '#ffd1dc', '#fff0f5'];

    // Cherry blossom petal SVG component
    const CherryBlossomPetal = ({ color, style }: { color: string; style: React.CSSProperties }) => (
      <svg style={style} viewBox="0 0 20 20" fill={color}>
        <ellipse cx="10" cy="10" rx="4" ry="8" />
        <ellipse cx="10" cy="10" rx="8" ry="4" opacity="0.7" />
      </svg>
    );

    // Five-petal cherry blossom flower
    const CherryBlossomFlower = ({ style }: { style: React.CSSProperties }) => (
      <svg style={style} viewBox="0 0 40 40">
        <g transform="translate(20, 20)">
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <ellipse
              key={i}
              cx="0"
              cy="-10"
              rx="5"
              ry="10"
              fill={petalColors[i % petalColors.length]}
              transform={`rotate(${angle})`}
              opacity="0.85"
            />
          ))}
          <circle cx="0" cy="0" r="4" fill="#ffeb3b" />
          <circle cx="-1" cy="-1" r="1" fill="#ff9800" />
          <circle cx="1" cy="1" r="1" fill="#ff9800" />
          <circle cx="1" cy="-1" r="0.8" fill="#ff9800" />
        </g>
      </svg>
    );

    // Falling petals data
    const petals = [
      { x: '5%', size: 16, delay: 0, duration: 35, color: petalColors[0] },
      { x: '10%', size: 12, delay: 5, duration: 40, color: petalColors[1] },
      { x: '15%', size: 14, delay: 2, duration: 32, color: petalColors[2] },
      { x: '20%', size: 10, delay: 8, duration: 38, color: petalColors[3] },
      { x: '25%', size: 16, delay: 3, duration: 35, color: petalColors[4] },
      { x: '30%', size: 12, delay: 10, duration: 42, color: petalColors[5] },
      { x: '35%', size: 14, delay: 1, duration: 36, color: petalColors[0] },
      { x: '40%', size: 10, delay: 6, duration: 40, color: petalColors[1] },
      { x: '45%', size: 16, delay: 4, duration: 33, color: petalColors[2] },
      { x: '50%', size: 12, delay: 9, duration: 38, color: petalColors[3] },
      { x: '55%', size: 14, delay: 2, duration: 41, color: petalColors[4] },
      { x: '60%', size: 10, delay: 7, duration: 35, color: petalColors[5] },
      { x: '65%', size: 16, delay: 0, duration: 39, color: petalColors[0] },
      { x: '70%', size: 12, delay: 5, duration: 34, color: petalColors[1] },
      { x: '75%', size: 14, delay: 3, duration: 42, color: petalColors[2] },
      { x: '80%', size: 10, delay: 8, duration: 36, color: petalColors[3] },
      { x: '85%', size: 16, delay: 1, duration: 40, color: petalColors[4] },
      { x: '90%', size: 12, delay: 6, duration: 33, color: petalColors[5] },
      { x: '95%', size: 14, delay: 4, duration: 38, color: petalColors[0] },
      { x: '8%', size: 10, delay: 12, duration: 44, color: petalColors[1] },
      { x: '28%', size: 14, delay: 14, duration: 37, color: petalColors[2] },
      { x: '48%', size: 12, delay: 11, duration: 41, color: petalColors[3] },
      { x: '68%', size: 16, delay: 13, duration: 35, color: petalColors[4] },
      { x: '88%', size: 10, delay: 15, duration: 39, color: petalColors[5] },
    ];

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Soft pink gradient at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: theme === 'light'
              ? 'linear-gradient(to bottom, rgba(255, 192, 203, 0.15), transparent)'
              : 'linear-gradient(to bottom, rgba(249, 168, 212, 0.08), transparent)',
          }}
        />

        {/* Right branch silhouette */}
        <svg
          style={{
            position: 'absolute',
            top: '5%',
            right: '-5%',
            width: '280px',
            height: '350px',
            opacity: theme === 'light' ? 0.18 : 0.25,
          }}
          viewBox="0 0 220 280"
        >
          <path
            d="M220,40 Q170,70 155,95 Q140,120 150,155 Q165,190 135,225 Q105,260 90,280"
            stroke={theme === 'light' ? '#8b4513' : '#a0522d'}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M155,95 Q115,80 85,95"
            stroke={theme === 'light' ? '#8b4513' : '#a0522d'}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M150,155 Q110,148 90,170"
            stroke={theme === 'light' ? '#8b4513' : '#a0522d'}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M135,225 Q100,215 80,235"
            stroke={theme === 'light' ? '#8b4513' : '#a0522d'}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M85,95 Q60,85 45,95"
            stroke={theme === 'light' ? '#8b4513' : '#a0522d'}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Left branch silhouette */}
        <svg
          style={{
            position: 'absolute',
            top: '15%',
            left: '-8%',
            width: '220px',
            height: '280px',
            opacity: theme === 'light' ? 0.15 : 0.22,
            transform: 'scaleX(-1)',
          }}
          viewBox="0 0 180 230"
        >
          <path
            d="M180,30 Q140,55 125,80 Q110,105 120,140 Q135,175 100,200 Q75,225 60,230"
            stroke={theme === 'light' ? '#8b4513' : '#a0522d'}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M125,80 Q90,70 65,85"
            stroke={theme === 'light' ? '#8b4513' : '#a0522d'}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M120,140 Q85,135 70,155"
            stroke={theme === 'light' ? '#8b4513' : '#a0522d'}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Bottom right small branch */}
        <svg
          style={{
            position: 'absolute',
            bottom: '5%',
            right: '10%',
            width: '150px',
            height: '120px',
            opacity: theme === 'light' ? 0.12 : 0.18,
          }}
          viewBox="0 0 150 120"
        >
          <path
            d="M150,100 Q120,90 95,70 Q70,50 45,55 Q20,60 0,50"
            stroke={theme === 'light' ? '#8b4513' : '#a0522d'}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M95,70 Q80,45 60,40"
            stroke={theme === 'light' ? '#8b4513' : '#a0522d'}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Cherry blossom flowers on right branch */}
        <CherryBlossomFlower
          style={{
            position: 'absolute',
            top: '6%',
            right: '10%',
            width: '38px',
            height: '38px',
            opacity: 0.85,
          }}
        />
        <CherryBlossomFlower
          style={{
            position: 'absolute',
            top: '10%',
            right: '16%',
            width: '32px',
            height: '32px',
            opacity: 0.8,
          }}
        />
        <CherryBlossomFlower
          style={{
            position: 'absolute',
            top: '14%',
            right: '6%',
            width: '28px',
            height: '28px',
            opacity: 0.75,
          }}
        />
        <CherryBlossomFlower
          style={{
            position: 'absolute',
            top: '18%',
            right: '22%',
            width: '30px',
            height: '30px',
            opacity: 0.7,
          }}
        />
        <CherryBlossomFlower
          style={{
            position: 'absolute',
            top: '22%',
            right: '12%',
            width: '26px',
            height: '26px',
            opacity: 0.65,
          }}
        />
        <CherryBlossomFlower
          style={{
            position: 'absolute',
            top: '28%',
            right: '18%',
            width: '24px',
            height: '24px',
            opacity: 0.6,
          }}
        />

        {/* Cherry blossom flowers on left branch */}
        <CherryBlossomFlower
          style={{
            position: 'absolute',
            top: '18%',
            left: '8%',
            width: '34px',
            height: '34px',
            opacity: 0.8,
          }}
        />
        <CherryBlossomFlower
          style={{
            position: 'absolute',
            top: '22%',
            left: '14%',
            width: '28px',
            height: '28px',
            opacity: 0.75,
          }}
        />
        <CherryBlossomFlower
          style={{
            position: 'absolute',
            top: '28%',
            left: '5%',
            width: '26px',
            height: '26px',
            opacity: 0.7,
          }}
        />
        <CherryBlossomFlower
          style={{
            position: 'absolute',
            top: '32%',
            left: '12%',
            width: '30px',
            height: '30px',
            opacity: 0.65,
          }}
        />
        <CherryBlossomFlower
          style={{
            position: 'absolute',
            top: '38%',
            left: '8%',
            width: '22px',
            height: '22px',
            opacity: 0.6,
          }}
        />

        {/* Cherry blossom flowers on bottom branch */}
        <CherryBlossomFlower
          style={{
            position: 'absolute',
            bottom: '12%',
            right: '22%',
            width: '26px',
            height: '26px',
            opacity: 0.7,
          }}
        />
        <CherryBlossomFlower
          style={{
            position: 'absolute',
            bottom: '15%',
            right: '30%',
            width: '22px',
            height: '22px',
            opacity: 0.65,
          }}
        />
        <CherryBlossomFlower
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '35%',
            width: '28px',
            height: '28px',
            opacity: 0.6,
          }}
        />

        {/* Falling cherry blossom petals */}
        {petals.map((petal, i) => (
          <div
            key={`petal-${i}`}
            style={{
              position: 'absolute',
              left: petal.x,
              top: '-30px',
              animation: `sakura-fall ${petal.duration}s ease-in-out ${petal.delay}s infinite`,
            }}
          >
            <CherryBlossomPetal
              color={petal.color}
              style={{
                width: petal.size,
                height: petal.size,
                opacity: 0.75,
                filter: 'drop-shadow(0 2px 4px rgba(255, 182, 193, 0.3))',
              }}
            />
          </div>
        ))}

        {/* Floating sparkles */}
        {[
          { x: '15%', y: '25%', delay: 0 },
          { x: '35%', y: '40%', delay: 1.2 },
          { x: '55%', y: '20%', delay: 0.6 },
          { x: '75%', y: '35%', delay: 1.8 },
          { x: '25%', y: '60%', delay: 0.9 },
          { x: '65%', y: '55%', delay: 1.5 },
          { x: '85%', y: '45%', delay: 0.3 },
          { x: '45%', y: '70%', delay: 2.1 },
        ].map((sparkle, i) => (
          <div
            key={`sakura-sparkle-${i}`}
            style={{
              position: 'absolute',
              left: sparkle.x,
              top: sparkle.y,
              width: 3,
              height: 3,
              borderRadius: '50%',
              backgroundColor: '#fff',
              boxShadow: `0 0 6px 2px ${pink}60, 0 0 12px 4px ${rosePink}30`,
              animation: `sakura-sparkle ${3 + (i % 2)}s ease-in-out ${sparkle.delay}s infinite`,
            }}
          />
        ))}

        {/* Soft pink vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'radial-gradient(ellipse at center, transparent 60%, rgba(255, 192, 203, 0.08) 100%)'
              : 'radial-gradient(ellipse at center, transparent 50%, rgba(26, 18, 24, 0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  };

  // Halloween theme - bats, pumpkins, cobwebs, spooky vibes
  const renderHalloweenEffects = () => {
    if (visualTheme !== 'halloween') return null;

    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const orange = themeColors.accent || '#ff6b00';
    const purple = themeColors.link || '#9b59b6';

    // Bat SVG component
    const Bat = ({ style }: { style: React.CSSProperties }) => (
      <svg style={style} viewBox="0 0 40 24" fill={theme === 'light' ? '#2a1f14' : '#1a1420'}>
        <path d="M20,12
          Q15,8 10,4 Q8,2 5,3 Q2,4 0,8 Q2,6 5,7 Q8,8 10,12
          Q12,16 15,18 Q18,20 20,22
          Q22,20 25,18 Q28,16 30,12
          Q32,8 35,7 Q38,6 40,8 Q38,4 35,3 Q32,2 30,4 Q25,8 20,12Z" />
        <circle cx="16" cy="10" r="1.5" fill={theme === 'light' ? '#ff6b00' : '#ff8c00'} />
        <circle cx="24" cy="10" r="1.5" fill={theme === 'light' ? '#ff6b00' : '#ff8c00'} />
      </svg>
    );

    // Jack-o-lantern SVG component
    const Pumpkin = ({ style, glowing = false }: { style: React.CSSProperties; glowing?: boolean }) => (
      <svg style={style} viewBox="0 0 40 36">
        {/* Stem */}
        <path d="M18,4 Q20,0 22,4 L21,8 L19,8 Z" fill="#2d5016" />
        {/* Pumpkin body */}
        <ellipse cx="20" cy="22" rx="18" ry="14" fill="#ff6b00" />
        <ellipse cx="12" cy="22" rx="8" ry="12" fill="#e55f00" opacity="0.6" />
        <ellipse cx="28" cy="22" rx="8" ry="12" fill="#ff7f24" opacity="0.6" />
        {/* Face */}
        <path d="M10,18 L14,14 L18,18 L14,20 Z" fill={glowing ? '#ffcc00' : '#1a0a00'} />
        <path d="M22,18 L26,14 L30,18 L26,20 Z" fill={glowing ? '#ffcc00' : '#1a0a00'} />
        <path d="M12,26 Q14,24 16,26 Q18,28 20,26 Q22,28 24,26 Q26,24 28,26 L26,30 Q20,32 14,30 Z" fill={glowing ? '#ffcc00' : '#1a0a00'} />
        {glowing && (
          <ellipse cx="20" cy="24" rx="10" ry="8" fill="#ffcc00" opacity="0.3" filter="blur(4px)" />
        )}
      </svg>
    );

    // Cobweb SVG for corners
    const Cobweb = ({ style, flip = false }: { style: React.CSSProperties; flip?: boolean }) => (
      <svg
        style={{ ...style, transform: flip ? 'scaleX(-1)' : undefined }}
        viewBox="0 0 100 100"
        stroke={theme === 'light' ? 'rgba(100, 80, 60, 0.2)' : 'rgba(200, 200, 200, 0.15)'}
        strokeWidth="0.8"
        fill="none"
      >
        {/* Radial threads */}
        <line x1="0" y1="0" x2="100" y2="100" />
        <line x1="0" y1="0" x2="70" y2="100" />
        <line x1="0" y1="0" x2="100" y2="70" />
        <line x1="0" y1="0" x2="40" y2="100" />
        <line x1="0" y1="0" x2="100" y2="40" />
        <line x1="0" y1="0" x2="20" y2="100" />
        <line x1="0" y1="0" x2="100" y2="20" />
        {/* Spiral threads */}
        <path d="M10,10 Q20,8 25,15 Q30,22 22,28 Q14,34 18,42 Q22,50 15,55" />
        <path d="M25,25 Q38,20 45,30 Q52,40 42,50 Q32,60 40,72" />
        <path d="M40,40 Q55,35 65,48 Q75,61 62,75 Q50,88 60,95" />
        <path d="M55,55 Q72,50 82,65 Q92,80 80,92" />
      </svg>
    );

    // Flying bats data
    const bats = [
      { x: '10%', y: '15%', size: 35, delay: 0, duration: 12 },
      { x: '25%', y: '25%', size: 28, delay: 2, duration: 15 },
      { x: '45%', y: '10%', size: 32, delay: 4, duration: 13 },
      { x: '65%', y: '20%', size: 26, delay: 1, duration: 14 },
      { x: '80%', y: '12%', size: 30, delay: 3, duration: 11 },
      { x: '15%', y: '35%', size: 24, delay: 5, duration: 16 },
      { x: '55%', y: '30%', size: 28, delay: 2.5, duration: 12 },
      { x: '85%', y: '28%', size: 22, delay: 4.5, duration: 14 },
      { x: '35%', y: '18%', size: 30, delay: 1.5, duration: 13 },
      { x: '70%', y: '35%', size: 26, delay: 3.5, duration: 15 },
    ];

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Spooky gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'linear-gradient(to bottom, rgba(155, 89, 182, 0.05), transparent 40%, rgba(255, 107, 0, 0.05) 100%)'
              : 'linear-gradient(to bottom, rgba(155, 89, 182, 0.1), transparent 40%, rgba(255, 107, 0, 0.08) 100%)',
          }}
        />

        {/* Cobwebs in corners */}
        <Cobweb
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '150px',
            height: '150px',
          }}
        />
        <Cobweb
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '120px',
            height: '120px',
          }}
          flip
        />
        <Cobweb
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100px',
            height: '100px',
            transform: 'rotate(90deg)',
          }}
        />

        {/* Flying bats */}
        {bats.map((bat, i) => (
          <div
            key={`bat-${i}`}
            style={{
              position: 'absolute',
              left: bat.x,
              top: bat.y,
              animation: `halloween-bat-fly ${bat.duration}s ease-in-out ${bat.delay}s infinite`,
            }}
          >
            <Bat
              style={{
                width: bat.size,
                height: bat.size * 0.6,
                animation: `halloween-bat-flap 0.3s ease-in-out infinite`,
              }}
            />
          </div>
        ))}

        {/* Jack-o-lanterns */}
        <Pumpkin
          style={{
            position: 'absolute',
            bottom: '5%',
            left: '8%',
            width: '55px',
            height: '50px',
            opacity: 0.9,
          }}
          glowing
        />
        <Pumpkin
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '18%',
            width: '40px',
            height: '36px',
            opacity: 0.8,
          }}
          glowing
        />
        <Pumpkin
          style={{
            position: 'absolute',
            bottom: '4%',
            right: '10%',
            width: '50px',
            height: '45px',
            opacity: 0.9,
          }}
          glowing
        />
        <Pumpkin
          style={{
            position: 'absolute',
            bottom: '7%',
            right: '22%',
            width: '35px',
            height: '32px',
            opacity: 0.75,
          }}
          glowing
        />
        <Pumpkin
          style={{
            position: 'absolute',
            bottom: '6%',
            left: '45%',
            width: '45px',
            height: '40px',
            opacity: 0.85,
          }}
          glowing
        />

        {/* Floating spooky particles */}
        {[
          { x: '12%', y: '50%', delay: 0 },
          { x: '28%', y: '60%', delay: 1 },
          { x: '42%', y: '45%', delay: 0.5 },
          { x: '58%', y: '55%', delay: 1.5 },
          { x: '72%', y: '48%', delay: 0.8 },
          { x: '88%', y: '58%', delay: 1.2 },
        ].map((particle, i) => (
          <div
            key={`spooky-particle-${i}`}
            style={{
              position: 'absolute',
              left: particle.x,
              top: particle.y,
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: i % 2 === 0 ? orange : purple,
              boxShadow: `0 0 8px 3px ${i % 2 === 0 ? orange : purple}50`,
              animation: `halloween-float ${4 + (i % 2)}s ease-in-out ${particle.delay}s infinite`,
            }}
          />
        ))}

        {/* Spooky vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'radial-gradient(ellipse at center, transparent 50%, rgba(42, 31, 20, 0.08) 100%)'
              : 'radial-gradient(ellipse at center, transparent 40%, rgba(13, 10, 15, 0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  };

  // Terminal/Hacker theme - matrix rain, scanlines, command prompt aesthetic
  const terminalGreen = '#4ade80'; // Softer matrix green
  const matrixChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';

  // Memoize columns so they don't regenerate and reset the animation
  const terminalColumns = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      x: `${i * 3.3}%`,
      delay: -((i * 7) % 15), // Negative delay = start mid-animation (staggered)
      duration: 12 + (i % 5) * 2, // Varied slow durations (12-20s)
      chars: Array.from({ length: 20 }, (_, j) => matrixChars[(i * 7 + j * 3) % matrixChars.length]),
    }));
  }, []);

  const renderTerminalEffects = () => {
    if (visualTheme !== 'terminal') return null;

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Scanline overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.15) 2px,
              rgba(0, 0, 0, 0.15) 4px
            )`,
            pointerEvents: 'none',
          }}
        />

        {/* CRT screen curve effect */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'radial-gradient(ellipse at center, transparent 60%, rgba(0, 80, 0, 0.05) 100%)'
              : 'radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.6) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Matrix rain */}
        {terminalColumns.map((col, i) => (
          <div
            key={`matrix-col-${i}`}
            className="matrix-rain-column"
            style={{
              position: 'absolute',
              left: col.x,
              top: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              animationDuration: `${col.duration}s`,
              animationDelay: `${col.delay}s`,
              opacity: 0.4,
            }}
          >
            {col.chars.map((char, j) => (
              <span
                key={j}
                style={{
                  color: j === 0 ? '#ffffff' : terminalGreen,
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  textShadow: j === 0 ? `0 0 10px ${terminalGreen}, 0 0 20px ${terminalGreen}` : `0 0 5px ${terminalGreen}`,
                  opacity: 1 - (j * 0.06),
                }}
              >
                {char}
              </span>
            ))}
          </div>
        ))}

        {/* Blinking cursor elements */}
        {[
          { x: '5%', y: '85%' },
          { x: '75%', y: '90%' },
        ].map((cursor, i) => (
          <div
            key={`cursor-${i}`}
            style={{
              position: 'absolute',
              left: cursor.x,
              top: cursor.y,
              color: terminalGreen,
              fontFamily: 'monospace',
              fontSize: '14px',
              textShadow: `0 0 5px ${terminalGreen}`,
              animation: 'terminal-blink 1s step-end infinite',
            }}
          >
            {'>'} _
          </div>
        ))}

        {/* Glowing green accent in corner */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '5%',
            width: '100px',
            height: '100px',
            background: `radial-gradient(circle, ${terminalGreen}15, transparent 70%)`,
            filter: 'blur(20px)',
          }}
        />
      </div>
    );
  };

  // Paper/Notebook theme - lined paper, pencil doodles, handwritten feel
  const renderPaperEffects = () => {
    if (visualTheme !== 'paper') return null;

    const lineColor = theme === 'light' ? 'rgba(70, 130, 220, 0.35)' : 'rgba(100, 149, 237, 0.15)';
    const marginColor = theme === 'light' ? 'rgba(220, 70, 70, 0.5)' : 'rgba(220, 80, 80, 0.2)';
    const doodleColor = theme === 'light' ? 'rgba(60, 60, 60, 0.3)' : 'rgba(200, 200, 200, 0.15)';

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Lined paper background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 27px,
                ${lineColor} 27px,
                ${lineColor} 28px
              )
            `,
            backgroundSize: '100% 28px',
            pointerEvents: 'none',
          }}
        />

        {/* Red margin line */}
        <div
          style={{
            position: 'absolute',
            left: '60px',
            top: 0,
            bottom: 0,
            width: '2px',
            background: marginColor,
            pointerEvents: 'none',
          }}
        />

        {/* Pencil doodles - stars */}
        {[
          { x: '85%', y: '15%', size: 20, rotation: 15 },
          { x: '90%', y: '45%', size: 16, rotation: -10 },
          { x: '88%', y: '75%', size: 18, rotation: 25 },
        ].map((star, i) => (
          <svg
            key={`star-${i}`}
            style={{
              position: 'absolute',
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              transform: `rotate(${star.rotation}deg)`,
              opacity: 0.6,
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke={doodleColor}
            strokeWidth="1.5"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}

        {/* Pencil doodles - spirals/swirls */}
        <svg
          style={{
            position: 'absolute',
            right: '5%',
            top: '30%',
            width: 40,
            height: 40,
            opacity: 0.5,
          }}
          viewBox="0 0 40 40"
          fill="none"
          stroke={doodleColor}
          strokeWidth="1.5"
        >
          <path d="M20 20 C20 15, 25 15, 25 20 C25 25, 15 25, 15 20 C15 12, 28 12, 28 20 C28 28, 12 28, 12 20" strokeLinecap="round" />
        </svg>

        {/* Pencil doodles - simple flower */}
        <svg
          style={{
            position: 'absolute',
            right: '8%',
            bottom: '20%',
            width: 35,
            height: 35,
            opacity: 0.5,
          }}
          viewBox="0 0 40 40"
          fill="none"
          stroke={doodleColor}
          strokeWidth="1.5"
        >
          <circle cx="20" cy="20" r="4" />
          <ellipse cx="20" cy="10" rx="4" ry="6" />
          <ellipse cx="20" cy="30" rx="4" ry="6" />
          <ellipse cx="10" cy="20" rx="6" ry="4" />
          <ellipse cx="30" cy="20" rx="6" ry="4" />
        </svg>

        {/* Pencil doodles - arrow */}
        <svg
          style={{
            position: 'absolute',
            right: '12%',
            top: '60%',
            width: 50,
            height: 20,
            opacity: 0.4,
            transform: 'rotate(-5deg)',
          }}
          viewBox="0 0 50 20"
          fill="none"
          stroke={doodleColor}
          strokeWidth="1.5"
        >
          <path d="M5 10 L40 10 M35 5 L40 10 L35 15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Paper texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'
              : 'none',
            opacity: 0.03,
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  };

  // Autumn/Harvest theme - falling leaves, harvest warmth, crisp fall energy
  const renderAutumnEffects = () => {
    if (visualTheme !== 'autumn') return null;

    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const orange = themeColors.accent || '#d4802a';

    // Rich fall foliage colors
    const leafColors = ['#c44a3f', '#d4802a', '#d4a020', '#8b4513', '#a0522d', '#b8651a'];

    // Maple leaf SVG
    const MapleLeaf = ({ color, style }: { color: string; style: React.CSSProperties }) => (
      <svg style={style} viewBox="0 0 24 24" fill={color}>
        <path d="M12,2L9,5L6,2L7,6L3,6L6,9L2,12L6,12L4,16L8,14L9,19L12,15L15,19L16,14L20,16L18,12L22,12L18,9L21,6L17,6L18,2L15,5L12,2Z" />
      </svg>
    );

    // Oak leaf SVG
    const OakLeaf = ({ color, style }: { color: string; style: React.CSSProperties }) => (
      <svg style={style} viewBox="0 0 24 24" fill={color}>
        <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
      </svg>
    );

    // Falling leaves - negative delays pre-fill the screen so leaves are already mid-fall on load
    const leaves = [
      { type: 'maple', x: '3%', color: leafColors[0], size: 20, delay: -5, duration: 45 },
      { type: 'oak', x: '10%', color: leafColors[1], size: 16, delay: -38, duration: 52 },
      { type: 'maple', x: '18%', color: leafColors[2], size: 18, delay: -20, duration: 40 },
      { type: 'oak', x: '26%', color: leafColors[3], size: 14, delay: -50, duration: 55 },
      { type: 'maple', x: '34%', color: leafColors[4], size: 22, delay: -12, duration: 48 },
      { type: 'oak', x: '42%', color: leafColors[5], size: 16, delay: -42, duration: 58 },
      { type: 'maple', x: '50%', color: leafColors[0], size: 18, delay: -28, duration: 44 },
      { type: 'oak', x: '58%', color: leafColors[1], size: 15, delay: -8, duration: 50 },
      { type: 'maple', x: '66%', color: leafColors[2], size: 20, delay: -35, duration: 42 },
      { type: 'oak', x: '74%', color: leafColors[3], size: 17, delay: -18, duration: 53 },
      { type: 'maple', x: '82%', color: leafColors[4], size: 14, delay: -45, duration: 46 },
      { type: 'oak', x: '90%', color: leafColors[5], size: 19, delay: -25, duration: 56 },
      { type: 'maple', x: '97%', color: leafColors[0], size: 16, delay: -32, duration: 49 },
    ];

    // Acorns scattered on the ground
    const acorns = [
      { x: '8%', y: '88%', size: 10, rotation: 15 },
      { x: '22%', y: '92%', size: 8, rotation: -20 },
      { x: '45%', y: '90%', size: 9, rotation: 10 },
      { x: '62%', y: '93%', size: 7, rotation: -30 },
      { x: '80%', y: '89%', size: 10, rotation: 25 },
      { x: '93%', y: '91%', size: 8, rotation: -10 },
    ];

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Warm harvest gradient - golden hour light */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'radial-gradient(ellipse at 50% 0%, rgba(212, 160, 32, 0.06) 0%, transparent 60%)'
              : 'radial-gradient(ellipse at 50% 0%, rgba(212, 128, 42, 0.1) 0%, transparent 60%)',
          }}
        />

        {/* Warm ground gradient */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: theme === 'light'
              ? `linear-gradient(to top, rgba(160, 82, 45, 0.06), rgba(212, 128, 42, 0.03), transparent)`
              : `linear-gradient(to top, rgba(139, 69, 19, 0.12), rgba(212, 128, 42, 0.05), transparent)`,
          }}
        />

        {/* Warm harvest lantern glows */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '8%',
            width: '140px',
            height: '140px',
            background: `radial-gradient(circle, ${orange}20, ${orange}0a 40%, transparent 70%)`,
            filter: 'blur(30px)',
            animation: 'autumn-glow 4s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            right: '10%',
            width: '110px',
            height: '110px',
            background: `radial-gradient(circle, ${orange}18, ${orange}08 40%, transparent 70%)`,
            filter: 'blur(25px)',
            animation: 'autumn-glow 4.5s ease-in-out 1s infinite',
          }}
        />

        {/* Falling leaves */}
        {leaves.map((leaf, i) => {
          const baseStyle: React.CSSProperties = {
            position: 'absolute',
            left: leaf.x,
            top: '-30px',
            width: leaf.size,
            height: leaf.size,
            opacity: 0.65,
            animation: `autumn-fall ${leaf.duration}s ease-in-out ${leaf.delay}s infinite`,
          };

          return leaf.type === 'maple' ? (
            <MapleLeaf key={`leaf-${i}`} color={leaf.color} style={baseStyle} />
          ) : (
            <OakLeaf key={`leaf-${i}`} color={leaf.color} style={baseStyle} />
          );
        })}

        {/* Acorns scattered on the ground */}
        {acorns.map((acorn, i) => (
          <svg
            key={`acorn-${i}`}
            style={{
              position: 'absolute',
              left: acorn.x,
              top: acorn.y,
              width: acorn.size,
              height: acorn.size * 1.3,
              opacity: 0.3,
              transform: `rotate(${acorn.rotation}deg)`,
              animation: `autumn-sway ${6 + (i % 3)}s ease-in-out ${i * 0.5}s infinite`,
            }}
            viewBox="0 0 10 13"
          >
            <rect x="3" y="0" width="4" height="3" rx="1" fill="#6b4423" />
            <ellipse cx="5" cy="8" rx="4" ry="5" fill="#8b5e3c" />
          </svg>
        ))}

        {/* Wheat/grass at bottom edges */}
        <svg
          style={{
            position: 'absolute',
            left: '2%',
            bottom: '2%',
            width: '70px',
            height: '90px',
            opacity: 0.25,
            animation: 'autumn-sway 5s ease-in-out infinite',
          }}
          viewBox="0 0 70 90"
        >
          <path d="M35,90 Q33,60 28,30 Q25,15 35,5 Q45,15 42,30 Q37,60 35,90" fill="#d4a020" />
          <path d="M35,65 Q20,55 12,40" stroke="#d4a020" strokeWidth="2" fill="none" />
          <path d="M35,65 Q50,55 58,40" stroke="#d4a020" strokeWidth="2" fill="none" />
          <path d="M35,50 Q22,42 15,28" stroke="#d4a020" strokeWidth="1.5" fill="none" />
          <path d="M35,50 Q48,42 55,28" stroke="#d4a020" strokeWidth="1.5" fill="none" />
        </svg>

        <svg
          style={{
            position: 'absolute',
            right: '4%',
            bottom: '1%',
            width: '55px',
            height: '75px',
            opacity: 0.2,
            animation: 'autumn-sway 6s ease-in-out 0.5s infinite',
            transform: 'scaleX(-1)',
          }}
          viewBox="0 0 55 75"
        >
          <path d="M28,75 L28,35" stroke="#8b5e3c" strokeWidth="2" />
          <ellipse cx="18" cy="28" rx="14" ry="7" fill="#d4a020" transform="rotate(-25, 18, 28)" />
          <ellipse cx="38" cy="22" rx="12" ry="6" fill="#d4a020" transform="rotate(20, 38, 22)" />
          <ellipse cx="28" cy="12" rx="10" ry="5" fill="#d4a020" transform="rotate(-5, 28, 12)" />
        </svg>

        {/* Warm vignette effect */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'radial-gradient(ellipse at center, transparent 50%, rgba(160, 82, 45, 0.04) 100%)'
              : 'radial-gradient(ellipse at center, transparent 40%, rgba(20, 16, 8, 0.35) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  };

  // Spring theme - floating butterflies, gentle rain, fresh blooms
  const renderSpringEffects = () => {
    if (visualTheme !== 'spring') return null;

    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const green = themeColors.accent || '#5cb870';
    const pink = themeColors.link || '#e090b0';

    // Butterfly colors - pastel, spring-like
    const butterflyColors = ['#e090b0', '#90c0e0', '#e0c050', '#b090e0', '#5cb870', '#f0a070'];

    // Butterfly SVG
    const Butterfly = ({ color, style }: { color: string; style: React.CSSProperties }) => (
      <svg style={style} viewBox="0 0 32 32" fill="none">
        {/* Left wing */}
        <path d="M16,16 C14,12 8,6 4,8 C0,10 2,16 6,18 C10,20 14,18 16,16Z" fill={color} opacity="0.8" />
        {/* Right wing */}
        <path d="M16,16 C18,12 24,6 28,8 C32,10 30,16 26,18 C22,20 18,18 16,16Z" fill={color} opacity="0.8" />
        {/* Lower left wing */}
        <path d="M16,16 C13,18 8,24 6,22 C4,20 6,16 10,15 C13,14 15,15 16,16Z" fill={color} opacity="0.6" />
        {/* Lower right wing */}
        <path d="M16,16 C19,18 24,24 26,22 C28,20 26,16 22,15 C19,14 17,15 16,16Z" fill={color} opacity="0.6" />
        {/* Body */}
        <ellipse cx="16" cy="16" rx="1" ry="5" fill={color} opacity="0.9" />
      </svg>
    );

    // Butterflies - negative delays to pre-fill, varied durations
    const butterflies = [
      { x: '5%', y: '15%', color: butterflyColors[0], size: 28, delay: -8, duration: 18 },
      { x: '18%', y: '40%', color: butterflyColors[1], size: 22, delay: -22, duration: 24 },
      { x: '30%', y: '10%', color: butterflyColors[2], size: 26, delay: -5, duration: 20 },
      { x: '45%', y: '55%', color: butterflyColors[3], size: 20, delay: -15, duration: 22 },
      { x: '60%', y: '25%', color: butterflyColors[4], size: 24, delay: -30, duration: 26 },
      { x: '72%', y: '50%', color: butterflyColors[5], size: 22, delay: -12, duration: 19 },
      { x: '85%', y: '18%', color: butterflyColors[0], size: 26, delay: -20, duration: 23 },
      { x: '92%', y: '38%', color: butterflyColors[2], size: 20, delay: -3, duration: 21 },
      { x: '12%', y: '70%', color: butterflyColors[4], size: 24, delay: -18, duration: 25 },
      { x: '55%', y: '72%', color: butterflyColors[1], size: 22, delay: -28, duration: 20 },
      { x: '78%', y: '68%', color: butterflyColors[3], size: 18, delay: -10, duration: 22 },
    ];

    // Gentle rain drops
    const raindrops = [
      { x: '3%', delay: -2, duration: 6 },
      { x: '8%', delay: -5, duration: 7 },
      { x: '14%', delay: -1, duration: 6.5 },
      { x: '19%', delay: -6.5, duration: 7.5 },
      { x: '26%', delay: -3, duration: 6 },
      { x: '31%', delay: -7, duration: 7 },
      { x: '38%', delay: -4.5, duration: 6.5 },
      { x: '44%', delay: -1.5, duration: 7.5 },
      { x: '51%', delay: -6, duration: 6 },
      { x: '57%', delay: -3.5, duration: 7 },
      { x: '63%', delay: -5.5, duration: 6.5 },
      { x: '69%', delay: -2, duration: 7.5 },
      { x: '76%', delay: -7, duration: 6 },
      { x: '82%', delay: -4, duration: 7 },
      { x: '88%', delay: -1, duration: 6.5 },
      { x: '95%', delay: -5, duration: 7.5 },
    ];

    // Small flowers scattered
    const flowers = [
      { x: '4%', y: '85%', size: 16, color: pink, delay: 0 },
      { x: '15%', y: '90%', size: 12, color: '#e0c050', delay: 0.5 },
      { x: '28%', y: '88%', size: 14, color: '#b090e0', delay: 1 },
      { x: '48%', y: '92%', size: 10, color: pink, delay: 1.5 },
      { x: '65%', y: '87%', size: 16, color: '#90c0e0', delay: 0.3 },
      { x: '80%', y: '91%', size: 12, color: '#e0c050', delay: 0.8 },
      { x: '94%', y: '86%', size: 14, color: '#b090e0', delay: 1.2 },
    ];

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Fresh sky gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'linear-gradient(to bottom, rgba(144, 192, 224, 0.06) 0%, transparent 40%, rgba(92, 184, 112, 0.04) 100%)'
              : 'linear-gradient(to bottom, rgba(144, 192, 224, 0.08) 0%, transparent 40%, rgba(92, 184, 112, 0.06) 100%)',
          }}
        />

        {/* Gentle rain */}
        {raindrops.map((drop, i) => (
          <div
            key={`rain-${i}`}
            style={{
              position: 'absolute',
              left: drop.x,
              top: '-10px',
              width: '2px',
              height: '28px',
              background: theme === 'light'
                ? 'linear-gradient(to bottom, transparent, rgba(100, 160, 200, 0.4))'
                : 'linear-gradient(to bottom, transparent, rgba(144, 192, 224, 0.35))',
              borderRadius: '2px',
              animation: `spring-rain ${drop.duration}s linear ${drop.delay}s infinite`,
            }}
          />
        ))}

        {/* Floating butterflies */}
        {butterflies.map((bf, i) => (
          <Butterfly
            key={`butterfly-${i}`}
            color={bf.color}
            style={{
              position: 'absolute',
              left: bf.x,
              top: bf.y,
              width: bf.size,
              height: bf.size,
              animation: `spring-butterfly ${bf.duration}s ease-in-out ${bf.delay}s infinite`,
            }}
          />
        ))}

        {/* Ground flowers */}
        {flowers.map((flower, i) => (
          <svg
            key={`flower-${i}`}
            style={{
              position: 'absolute',
              left: flower.x,
              top: flower.y,
              width: flower.size,
              height: flower.size,
              animation: `spring-bloom ${4 + (i % 3)}s ease-in-out ${flower.delay}s infinite`,
            }}
            viewBox="0 0 24 24"
            fill={flower.color}
          >
            {/* Petals */}
            <ellipse cx="12" cy="8" rx="3" ry="5" opacity="0.7" />
            <ellipse cx="12" cy="8" rx="3" ry="5" opacity="0.7" transform="rotate(72, 12, 12)" />
            <ellipse cx="12" cy="8" rx="3" ry="5" opacity="0.7" transform="rotate(144, 12, 12)" />
            <ellipse cx="12" cy="8" rx="3" ry="5" opacity="0.7" transform="rotate(216, 12, 12)" />
            <ellipse cx="12" cy="8" rx="3" ry="5" opacity="0.7" transform="rotate(288, 12, 12)" />
            {/* Center */}
            <circle cx="12" cy="12" r="2.5" fill="#e0c050" opacity="0.9" />
          </svg>
        ))}

        {/* Stem/grass at bottom */}
        <svg
          style={{
            position: 'absolute',
            left: '6%',
            bottom: '2%',
            width: '50px',
            height: '70px',
            opacity: 0.25,
            animation: 'spring-bloom 6s ease-in-out infinite',
          }}
          viewBox="0 0 50 70"
        >
          <path d="M25,70 Q23,50 20,30 Q18,15 25,5 Q32,15 30,30 Q27,50 25,70" fill={green} />
          <path d="M25,50 Q15,42 8,30" stroke={green} strokeWidth="1.5" fill="none" />
          <path d="M25,50 Q35,42 42,30" stroke={green} strokeWidth="1.5" fill="none" />
        </svg>

        <svg
          style={{
            position: 'absolute',
            right: '5%',
            bottom: '1%',
            width: '45px',
            height: '65px',
            opacity: 0.2,
            animation: 'spring-bloom 7s ease-in-out 1s infinite',
            transform: 'scaleX(-1)',
          }}
          viewBox="0 0 45 65"
        >
          <path d="M22,65 L22,30" stroke="#4a8a3a" strokeWidth="1.5" />
          <ellipse cx="14" cy="24" rx="10" ry="5" fill={green} transform="rotate(-20, 14, 24)" />
          <ellipse cx="30" cy="18" rx="8" ry="4" fill={green} transform="rotate(25, 30, 18)" />
          <ellipse cx="22" cy="10" rx="7" ry="3.5" fill={green} transform="rotate(-5, 22, 10)" />
        </svg>
      </div>
    );
  };

  // Noir/Film Noir theme - film grain, spotlight, dramatic vignette
  const renderNoirEffects = () => {
    if (visualTheme !== 'noir') return null;

    const themeColors = theme === 'light' ? themeConfig.colors.light : themeConfig.colors.dark;
    const gold = themeColors.accent || '#c8a84a';

    // Floating dust particles in a spotlight beam
    const dustParticles = [
      { x: '15%', y: '20%', size: 3, delay: -2, duration: 12 },
      { x: '22%', y: '35%', size: 2, delay: -8, duration: 15 },
      { x: '10%', y: '50%', size: 2.5, delay: -5, duration: 11 },
      { x: '28%', y: '15%', size: 2, delay: -10, duration: 14 },
      { x: '18%', y: '42%', size: 3, delay: -3, duration: 13 },
      { x: '25%', y: '28%', size: 2, delay: -7, duration: 16 },
      { x: '12%', y: '60%', size: 2.5, delay: -1, duration: 12 },
      { x: '30%', y: '45%', size: 2, delay: -12, duration: 15 },
      { x: '8%', y: '30%', size: 3, delay: -6, duration: 11 },
      { x: '20%', y: '55%', size: 2, delay: -9, duration: 14 },
      { x: '35%', y: '22%', size: 2.5, delay: -4, duration: 13 },
      { x: '14%', y: '68%', size: 2, delay: -11, duration: 16 },
    ];

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Film grain overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
            opacity: theme === 'light' ? 0.025 : 0.04,
            animation: 'noir-grain 4s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Venetian blind shadow lines - diagonal light slats */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '70%',
            background: theme === 'light'
              ? `repeating-linear-gradient(
                  -25deg,
                  transparent,
                  transparent 40px,
                  rgba(0, 0, 0, 0.015) 40px,
                  rgba(0, 0, 0, 0.015) 44px
                )`
              : `repeating-linear-gradient(
                  -25deg,
                  transparent,
                  transparent 40px,
                  rgba(200, 168, 74, 0.018) 40px,
                  rgba(200, 168, 74, 0.018) 44px
                )`,
            opacity: 0.8,
            pointerEvents: 'none',
          }}
        />

        {/* Dramatic spotlight cone from upper-left */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-10%',
            width: '65%',
            height: '80%',
            background: theme === 'light'
              ? `radial-gradient(ellipse at 25% 25%, rgba(176, 144, 64, 0.06) 0%, transparent 55%)`
              : `radial-gradient(ellipse at 25% 25%, rgba(200, 168, 74, 0.1) 0%, transparent 55%)`,
            animation: 'noir-spotlight 10s ease-in-out infinite',
          }}
        />

        {/* Secondary spotlight from lower-right - dimmer */}
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-5%',
            width: '45%',
            height: '55%',
            background: theme === 'light'
              ? `radial-gradient(ellipse at 70% 70%, rgba(176, 144, 64, 0.03) 0%, transparent 50%)`
              : `radial-gradient(ellipse at 70% 70%, rgba(200, 168, 74, 0.05) 0%, transparent 50%)`,
            animation: 'noir-spotlight 12s ease-in-out 3s infinite',
          }}
        />

        {/* Floating dust particles caught in the spotlight */}
        {dustParticles.map((p, i) => (
          <div
            key={`dust-${i}`}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: theme === 'light' ? 'rgba(176, 144, 64, 0.25)' : 'rgba(200, 168, 74, 0.3)',
              boxShadow: theme === 'light' ? 'none' : `0 0 4px rgba(200, 168, 74, 0.15)`,
              animation: `noir-dust ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}

        {/* Gold accent line - top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '5%',
            right: '5%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${gold}20, ${gold}30, ${gold}20, transparent)`,
          }}
        />

        {/* Gold accent line - bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '5%',
            right: '5%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${gold}20, ${gold}30, ${gold}20, transparent)`,
          }}
        />

        {/* Gold corner accents - like a film frame */}
        {/* Top-left */}
        <div style={{ position: 'absolute', top: '3%', left: '3%', width: '30px', height: '1px', background: `${gold}25` }} />
        <div style={{ position: 'absolute', top: '3%', left: '3%', width: '1px', height: '30px', background: `${gold}25` }} />
        {/* Top-right */}
        <div style={{ position: 'absolute', top: '3%', right: '3%', width: '30px', height: '1px', background: `${gold}25` }} />
        <div style={{ position: 'absolute', top: '3%', right: '3%', width: '1px', height: '30px', background: `${gold}25` }} />
        {/* Bottom-left */}
        <div style={{ position: 'absolute', bottom: '3%', left: '3%', width: '30px', height: '1px', background: `${gold}25` }} />
        <div style={{ position: 'absolute', bottom: '3%', left: '3%', width: '1px', height: '30px', background: `${gold}25` }} />
        {/* Bottom-right */}
        <div style={{ position: 'absolute', bottom: '3%', right: '3%', width: '30px', height: '1px', background: `${gold}25` }} />
        <div style={{ position: 'absolute', bottom: '3%', right: '3%', width: '1px', height: '30px', background: `${gold}25` }} />

        {/* Heavy cinematic vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'radial-gradient(ellipse at center, transparent 35%, rgba(0, 0, 0, 0.06) 100%)'
              : 'radial-gradient(ellipse at center, transparent 25%, rgba(0, 0, 0, 0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  };

  const renderLofiEffects = () => {
    if (visualTheme !== 'lofi') return null;

    const pink = theme === 'light' ? '#c06aad' : '#e891c5';
    const teal = theme === 'light' ? '#5aa8a0' : '#7ecac3';
    const purple = theme === 'light' ? '#9060b0' : '#b88adc';
    const peach = theme === 'light' ? '#d89878' : '#f0b898';

    // Floating soft gradient orbs
    const orbs = [
      { x: 8, y: 15, size: 180, color: pink, dur: 28, delay: -8 },
      { x: 75, y: 60, size: 220, color: teal, dur: 34, delay: -15 },
      { x: 45, y: 80, size: 160, color: purple, dur: 30, delay: -5 },
      { x: 90, y: 25, size: 140, color: peach, dur: 26, delay: -20 },
      { x: 20, y: 55, size: 200, color: teal, dur: 32, delay: -12 },
    ];

    // Small geometric shapes floating around
    const shapes = [
      { x: 12, y: 20, type: 'circle', size: 8, color: pink, dur: 22, delay: -6 },
      { x: 30, y: 70, type: 'triangle', size: 10, color: teal, dur: 26, delay: -14 },
      { x: 55, y: 15, type: 'circle', size: 6, color: purple, dur: 20, delay: -3 },
      { x: 78, y: 45, type: 'diamond', size: 9, color: peach, dur: 28, delay: -18 },
      { x: 42, y: 90, type: 'circle', size: 7, color: pink, dur: 24, delay: -10 },
      { x: 88, y: 75, type: 'triangle', size: 8, color: teal, dur: 25, delay: -8 },
      { x: 65, y: 35, type: 'diamond', size: 6, color: purple, dur: 23, delay: -16 },
      { x: 18, y: 85, type: 'circle', size: 9, color: peach, dur: 27, delay: -4 },
    ];

    // Floating music notes
    const notes = [
      { x: 15, y: 70, dur: 8, delay: -2 },
      { x: 35, y: 85, dur: 10, delay: -6 },
      { x: 60, y: 75, dur: 9, delay: -4 },
      { x: 82, y: 80, dur: 11, delay: -8 },
      { x: 48, y: 90, dur: 7, delay: -1 },
      { x: 72, y: 65, dur: 10, delay: -5 },
    ];

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Soft gradient orbs */}
        {orbs.map((orb, i) => (
          <div
            key={`lofi-orb-${i}`}
            style={{
              position: 'absolute',
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${orb.color}30 0%, transparent 70%)`,
              filter: 'blur(30px)',
              animation: `lofi-pulse ${orb.dur}s ease-in-out infinite`,
              animationDelay: `${orb.delay}s`,
            }}
          />
        ))}

        {/* Floating geometric shapes */}
        {shapes.map((shape, i) => {
          const shapeStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            opacity: 0.25,
            animation: `lofi-drift ${shape.dur}s ease-in-out infinite`,
            animationDelay: `${shape.delay}s`,
          };

          if (shape.type === 'circle') {
            return (
              <div
                key={`lofi-shape-${i}`}
                style={{
                  ...shapeStyle,
                  borderRadius: '50%',
                  border: `1.5px solid ${shape.color}`,
                }}
              />
            );
          } else if (shape.type === 'triangle') {
            return (
              <div
                key={`lofi-shape-${i}`}
                style={{
                  ...shapeStyle,
                  width: 0,
                  height: 0,
                  borderLeft: `${shape.size / 2}px solid transparent`,
                  borderRight: `${shape.size / 2}px solid transparent`,
                  borderBottom: `${shape.size}px solid ${shape.color}40`,
                }}
              />
            );
          } else {
            return (
              <div
                key={`lofi-shape-${i}`}
                style={{
                  ...shapeStyle,
                  transform: 'rotate(45deg)',
                  border: `1.5px solid ${shape.color}`,
                }}
              />
            );
          }
        })}

        {/* Music notes */}
        {notes.map((note, i) => (
          <svg
            key={`lofi-note-${i}`}
            viewBox="0 0 24 24"
            style={{
              position: 'absolute',
              left: `${note.x}%`,
              top: `${note.y}%`,
              width: '14px',
              height: '14px',
              fill: i % 2 === 0 ? pink : teal,
              opacity: 0.3,
              animation: `lofi-note ${note.dur}s ease-in-out infinite`,
              animationDelay: `${note.delay}s`,
            }}
          >
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        ))}

        {/* VHS scan line */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '2px',
              background: theme === 'light'
                ? `linear-gradient(90deg, transparent, ${pink}15, ${teal}10, transparent)`
                : `linear-gradient(90deg, transparent, ${pink}20, ${teal}15, transparent)`,
              animation: 'lofi-scan 8s linear infinite',
            }}
          />
        </div>

        {/* Subtle CRT/VHS horizontal lines overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: theme === 'light'
              ? 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(100, 50, 120, 0.012) 3px, rgba(100, 50, 120, 0.012) 4px)'
              : 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(232, 145, 197, 0.02) 3px, rgba(232, 145, 197, 0.02) 4px)',
            pointerEvents: 'none',
          }}
        />

        {/* Soft vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'radial-gradient(ellipse at center, transparent 50%, rgba(100, 50, 120, 0.04) 100%)'
              : 'radial-gradient(ellipse at center, transparent 40%, rgba(26, 21, 40, 0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  };

  const renderJungleEffects = () => {
    if (visualTheme !== 'jungle') return null;

    const green = theme === 'light' ? '#2d8a2d' : '#4ec94e';
    const darkGreen = theme === 'light' ? '#1a5a1a' : '#2a7a2a';
    const limeGreen = theme === 'light' ? '#48a828' : '#70d840';
    const emerald = theme === 'light' ? '#1e7040' : '#30a060';
    const sage = theme === 'light' ? '#5a8848' : '#80b868';
    const gold = theme === 'light' ? '#b07818' : '#e8a830';
    const brown = theme === 'light' ? '#6b4820' : '#8a6030';
    const bgColor = theme === 'light' ? '#f2f8ef' : '#0f1a0f';
    const lo = theme === 'light' ? 0.18 : 0.28; // base leaf opacity

    // Giant monstera leaves filling entire background - scattered everywhere
    const bigLeaves: Array<{x: number; y: number; rot: number; size: number; type: 'monstera' | 'banana' | 'palm' | 'elephant' | 'fern'; flip: boolean; depth: number}> = [
      // Back layer (larger, more transparent) - fills every area
      { x: -8, y: -10, rot: 35, size: 320, type: 'monstera', flip: false, depth: 0 },
      { x: 25, y: -12, rot: 80, size: 280, type: 'palm', flip: false, depth: 0 },
      { x: 55, y: -8, rot: -60, size: 300, type: 'banana', flip: true, depth: 0 },
      { x: 80, y: -10, rot: -40, size: 290, type: 'monstera', flip: true, depth: 0 },
      { x: -10, y: 20, rot: 40, size: 300, type: 'elephant', flip: false, depth: 0 },
      { x: 15, y: 25, rot: 55, size: 260, type: 'palm', flip: false, depth: 0 },
      { x: 45, y: 18, rot: -30, size: 280, type: 'monstera', flip: true, depth: 0 },
      { x: 72, y: 22, rot: -50, size: 270, type: 'banana', flip: true, depth: 0 },
      { x: 92, y: 15, rot: -35, size: 310, type: 'elephant', flip: true, depth: 0 },
      { x: -5, y: 45, rot: 30, size: 290, type: 'banana', flip: false, depth: 0 },
      { x: 20, y: 50, rot: 65, size: 250, type: 'monstera', flip: false, depth: 0 },
      { x: 50, y: 42, rot: -25, size: 270, type: 'palm', flip: false, depth: 0 },
      { x: 78, y: 48, rot: -55, size: 260, type: 'monstera', flip: true, depth: 0 },
      { x: 95, y: 40, rot: -30, size: 300, type: 'palm', flip: true, depth: 0 },
      { x: -8, y: 65, rot: 45, size: 280, type: 'palm', flip: false, depth: 0 },
      { x: 18, y: 70, rot: 35, size: 260, type: 'elephant', flip: false, depth: 0 },
      { x: 42, y: 68, rot: -40, size: 290, type: 'banana', flip: true, depth: 0 },
      { x: 68, y: 62, rot: -20, size: 250, type: 'monstera', flip: false, depth: 0 },
      { x: 90, y: 70, rot: -45, size: 280, type: 'elephant', flip: true, depth: 0 },
      { x: -5, y: 85, rot: 50, size: 300, type: 'monstera', flip: false, depth: 0 },
      { x: 30, y: 88, rot: 20, size: 260, type: 'palm', flip: false, depth: 0 },
      { x: 55, y: 82, rot: -35, size: 280, type: 'elephant', flip: true, depth: 0 },
      { x: 82, y: 85, rot: -25, size: 270, type: 'banana', flip: true, depth: 0 },
      // Mid layer - medium leaves filling gaps
      { x: 5, y: 8, rot: 50, size: 200, type: 'fern', flip: false, depth: 1 },
      { x: 35, y: 5, rot: 70, size: 220, type: 'monstera', flip: false, depth: 1 },
      { x: 65, y: 10, rot: -45, size: 210, type: 'fern', flip: true, depth: 1 },
      { x: 88, y: 5, rot: -60, size: 190, type: 'palm', flip: true, depth: 1 },
      { x: 8, y: 35, rot: 25, size: 220, type: 'monstera', flip: false, depth: 1 },
      { x: 38, y: 32, rot: -15, size: 200, type: 'banana', flip: false, depth: 1 },
      { x: 60, y: 38, rot: 40, size: 210, type: 'fern', flip: false, depth: 1 },
      { x: 85, y: 32, rot: -50, size: 190, type: 'monstera', flip: true, depth: 1 },
      { x: 10, y: 55, rot: 35, size: 200, type: 'palm', flip: false, depth: 1 },
      { x: 33, y: 58, rot: 50, size: 180, type: 'fern', flip: false, depth: 1 },
      { x: 58, y: 55, rot: -30, size: 210, type: 'banana', flip: true, depth: 1 },
      { x: 82, y: 58, rot: -40, size: 195, type: 'fern', flip: true, depth: 1 },
      { x: 5, y: 78, rot: 45, size: 220, type: 'fern', flip: false, depth: 1 },
      { x: 25, y: 75, rot: 30, size: 190, type: 'banana', flip: false, depth: 1 },
      { x: 50, y: 78, rot: -20, size: 200, type: 'monstera', flip: true, depth: 1 },
      { x: 75, y: 75, rot: -55, size: 210, type: 'palm', flip: true, depth: 1 },
      { x: 95, y: 80, rot: -30, size: 200, type: 'fern', flip: true, depth: 1 },
    ];

    // Hanging vines
    const vines = [
      { x: 3, h: 250, delay: -2, dur: 13 },
      { x: 12, h: 180, delay: -7, dur: 15 },
      { x: 22, h: 300, delay: -4, dur: 12 },
      { x: 35, h: 200, delay: -9, dur: 14 },
      { x: 48, h: 160, delay: -1, dur: 16 },
      { x: 58, h: 280, delay: -6, dur: 13 },
      { x: 68, h: 220, delay: -3, dur: 15 },
      { x: 78, h: 260, delay: -8, dur: 12 },
      { x: 88, h: 190, delay: -5, dur: 14 },
      { x: 95, h: 310, delay: -2, dur: 13 },
    ];

    // Fireflies
    const fireflies = Array.from({ length: 16 }, (_, i) => ({
      x: 8 + (i * 53 + i * i * 7) % 84,
      y: 10 + (i * 37 + i * i * 11) % 80,
      dur: 5 + (i % 5),
      delay: -(i * 1.3),
    }));

    // Butterflies
    const butterflies = [
      { x: 25, y: 35, color: '#e87030', dur: 18, delay: -4 },
      { x: 70, y: 55, color: '#3090e8', dur: 22, delay: -10 },
      { x: 50, y: 20, color: gold, dur: 20, delay: -7 },
      { x: 40, y: 65, color: '#e84080', dur: 19, delay: -14 },
    ];

    const renderLeafSvg = (type: string, colors: { g: string; dg: string; lg: string; em: string; sg: string; br: string; bg: string }) => {
      switch (type) {
        case 'monstera':
          return (
            <>
              {/* Big monstera with splits and holes */}
              <path d="M50 95 Q30 70, 20 50 Q12 35, 15 20 Q18 10, 28 8 Q35 6, 45 5 Q55 4, 62 8 Q70 12, 72 22 Q68 35, 58 50 Q48 65, 50 95Z" fill={colors.dg} />
              <path d="M50 95 Q35 72, 25 52 Q18 38, 20 25 Q24 15, 35 10" stroke={colors.bg} strokeWidth="2" fill="none" opacity="0.15" />
              <path d="M50 95 Q42 70, 38 48 Q35 35, 40 22" stroke={colors.bg} strokeWidth="1.5" fill="none" opacity="0.12" />
              {/* Leaf splits */}
              <path d="M30 45 Q25 42, 18 40 Q14 39, 12 42" stroke={colors.bg} strokeWidth="2.5" fill="none" opacity="0.2" />
              <path d="M35 32 Q28 28, 22 25 Q18 24, 16 28" stroke={colors.bg} strokeWidth="2.5" fill="none" opacity="0.2" />
              <path d="M58 38 Q64 34, 70 32 Q74 31, 75 35" stroke={colors.bg} strokeWidth="2.5" fill="none" opacity="0.2" />
              <path d="M55 52 Q62 50, 68 48 Q72 47, 72 51" stroke={colors.bg} strokeWidth="2.5" fill="none" opacity="0.2" />
              {/* Monstera holes */}
              <ellipse cx="32" cy="40" rx="5" ry="7" fill={colors.bg} opacity="0.25" transform="rotate(-10 32 40)" />
              <ellipse cx="45" cy="30" rx="4" ry="6" fill={colors.bg} opacity="0.2" transform="rotate(5 45 30)" />
              <ellipse cx="55" cy="45" rx="4" ry="5" fill={colors.bg} opacity="0.2" transform="rotate(-5 55 45)" />
              {/* Center vein */}
              <path d="M50 92 Q46 70, 42 50 Q38 35, 38 18" stroke={colors.em} strokeWidth="1.5" fill="none" opacity="0.3" />
              {/* Side veins */}
              <path d="M44 65 Q36 58, 28 55" stroke={colors.em} strokeWidth="0.8" fill="none" opacity="0.2" />
              <path d="M46 52 Q38 46, 30 42" stroke={colors.em} strokeWidth="0.8" fill="none" opacity="0.2" />
              <path d="M48 42 Q54 38, 62 36" stroke={colors.em} strokeWidth="0.8" fill="none" opacity="0.2" />
              <path d="M47 55 Q55 52, 62 50" stroke={colors.em} strokeWidth="0.8" fill="none" opacity="0.2" />
            </>
          );
        case 'banana':
          return (
            <>
              {/* Big banana leaf - long and curved */}
              <path d="M50 95 Q45 70, 35 45 Q25 25, 20 10 Q22 5, 28 4 Q35 3, 42 5 Q50 8, 55 15 Q52 30, 48 50 Q46 70, 50 95Z" fill={colors.lg} />
              {/* Slight fold/curve highlight */}
              <path d="M50 95 Q47 72, 42 50 Q37 30, 30 15" stroke={colors.dg} strokeWidth="2" fill="none" opacity="0.25" />
              {/* Center vein */}
              <path d="M50 92 Q44 65, 38 40 Q32 22, 28 8" stroke={colors.em} strokeWidth="1.5" fill="none" opacity="0.35" />
              {/* Side veins - parallel lines */}
              {[20, 30, 40, 50, 60, 70, 80].map((y, vi) => (
                <path key={vi} d={`M${42 - vi * 0.5} ${y} Q${35 - vi * 0.3} ${y - 3}, ${28 - vi * 0.5} ${y - 5}`} stroke={colors.em} strokeWidth="0.6" fill="none" opacity="0.15" />
              ))}
              {[25, 35, 45, 55, 65, 75].map((y, vi) => (
                <path key={vi} d={`M${46 - vi * 0.3} ${y} Q${50 - vi * 0.2} ${y - 2}, ${54 - vi * 0.3} ${y - 3}`} stroke={colors.em} strokeWidth="0.6" fill="none" opacity="0.15" />
              ))}
              {/* Torn edges */}
              <path d="M35 45 Q32 44, 30 46" stroke={colors.bg} strokeWidth="1.5" fill="none" opacity="0.15" />
              <path d="M38 60 Q35 58, 33 60" stroke={colors.bg} strokeWidth="1.5" fill="none" opacity="0.12" />
            </>
          );
        case 'palm':
          return (
            <>
              {/* Fan palm - multiple fronds from center */}
              <path d="M50 90 Q42 65, 20 35 Q12 25, 8 18 Q10 12, 18 10 Q25 15, 32 28 Q42 45, 50 90Z" fill={colors.g} />
              <path d="M50 90 Q44 60, 30 30 Q24 18, 22 10 Q26 5, 34 6 Q38 12, 42 25 Q48 45, 50 90Z" fill={colors.dg} />
              <path d="M50 90 Q50 60, 50 30 Q50 15, 50 5 Q54 4, 56 8 Q56 20, 54 40 Q52 60, 50 90Z" fill={colors.lg} />
              <path d="M50 90 Q56 60, 70 30 Q76 18, 78 10 Q74 5, 66 6 Q62 12, 58 25 Q52 45, 50 90Z" fill={colors.g} />
              <path d="M50 90 Q58 65, 80 35 Q88 25, 92 18 Q90 12, 82 10 Q75 15, 68 28 Q58 45, 50 90Z" fill={colors.dg} />
              {/* Stem */}
              <path d="M50 95 Q50 90, 50 85" stroke={colors.br} strokeWidth="3" fill="none" opacity="0.3" />
            </>
          );
        case 'elephant':
          return (
            <>
              {/* Elephant ear - big rounded heart shape */}
              <path d="M50 95 Q25 75, 15 50 Q8 30, 15 15 Q25 5, 40 5 Q50 5, 50 15 Q50 5, 60 5 Q75 5, 85 15 Q92 30, 85 50 Q75 75, 50 95Z" fill={colors.dg} />
              {/* Center vein */}
              <path d="M50 90 Q50 65, 50 40 Q50 25, 50 12" stroke={colors.em} strokeWidth="2" fill="none" opacity="0.3" />
              {/* Side veins radiating out */}
              <path d="M50 70 Q38 62, 25 58" stroke={colors.em} strokeWidth="1" fill="none" opacity="0.2" />
              <path d="M50 55 Q35 48, 22 42" stroke={colors.em} strokeWidth="1" fill="none" opacity="0.2" />
              <path d="M50 40 Q38 34, 25 28" stroke={colors.em} strokeWidth="1" fill="none" opacity="0.2" />
              <path d="M50 70 Q62 62, 75 58" stroke={colors.em} strokeWidth="1" fill="none" opacity="0.2" />
              <path d="M50 55 Q65 48, 78 42" stroke={colors.em} strokeWidth="1" fill="none" opacity="0.2" />
              <path d="M50 40 Q62 34, 75 28" stroke={colors.em} strokeWidth="1" fill="none" opacity="0.2" />
              {/* Light highlight */}
              <path d="M50 85 Q30 68, 22 48 Q18 35, 22 22" stroke={colors.sg} strokeWidth="1" fill="none" opacity="0.15" />
            </>
          );
        case 'fern':
          return (
            <>
              {/* Fern frond with many small leaflets */}
              <path d="M50 95 Q48 75, 46 55 Q44 35, 42 15 Q43 8, 46 5 Q49 4, 50 8 Q50 25, 50 95Z" fill={colors.g} opacity="0.6" />
              {/* Leaflets - left side */}
              {[15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85].map((y, fi) => (
                <ellipse key={`l${fi}`} cx={42 - fi * 0.3} cy={y} rx={10 - fi * 0.5} ry={3} fill={fi % 2 === 0 ? colors.g : colors.lg} opacity="0.7" transform={`rotate(-30 ${42 - fi * 0.3} ${y})`} />
              ))}
              {/* Leaflets - right side */}
              {[18, 25, 32, 39, 46, 53, 60, 67, 74, 81].map((y, fi) => (
                <ellipse key={`r${fi}`} cx={54 + fi * 0.3} cy={y} rx={9 - fi * 0.4} ry={3} fill={fi % 2 === 0 ? colors.lg : colors.g} opacity="0.7" transform={`rotate(30 ${54 + fi * 0.3} ${y})`} />
              ))}
              {/* Stem */}
              <path d="M50 92 Q48 60, 45 30 Q44 18, 46 8" stroke={colors.dg} strokeWidth="1" fill="none" opacity="0.3" />
            </>
          );
        default:
          return null;
      }
    };

    const leafColors = { g: green, dg: darkGreen, lg: limeGreen, em: emerald, sg: sage, br: brown, bg: bgColor };

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Base green wash across entire background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? `radial-gradient(ellipse at 30% 20%, ${darkGreen}06 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, ${green}05 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, ${darkGreen}06 0%, transparent 50%)`
              : `radial-gradient(ellipse at 30% 20%, ${darkGreen}15 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, ${green}10 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, ${darkGreen}15 0%, transparent 50%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Back layer of giant leaves */}
        {bigLeaves.filter(l => l.depth === 0).map((leaf, i) => (
          <svg
            key={`jungle-bg-${i}`}
            style={{
              position: 'absolute',
              left: `${leaf.x}%`,
              top: `${leaf.y}%`,
              width: `${leaf.size}px`,
              height: `${leaf.size}px`,
              transform: `rotate(${leaf.rot}deg) ${leaf.flip ? 'scaleX(-1)' : ''}`,
              opacity: lo * 0.7,
              animation: `jungle-sway ${14 + (i % 6) * 2}s ease-in-out infinite`,
              animationDelay: `${-i * 2.2}s`,
            }}
            viewBox="0 0 100 100"
            fill="none"
          >
            {renderLeafSvg(leaf.type, leafColors)}
          </svg>
        ))}

        {/* Mid layer of leaves */}
        {bigLeaves.filter(l => l.depth === 1).map((leaf, i) => (
          <svg
            key={`jungle-md-${i}`}
            style={{
              position: 'absolute',
              left: `${leaf.x}%`,
              top: `${leaf.y}%`,
              width: `${leaf.size}px`,
              height: `${leaf.size}px`,
              transform: `rotate(${leaf.rot}deg) ${leaf.flip ? 'scaleX(-1)' : ''}`,
              opacity: lo * 0.9,
              animation: `jungle-sway ${12 + (i % 5) * 2}s ease-in-out infinite`,
              animationDelay: `${-i * 1.8}s`,
            }}
            viewBox="0 0 100 100"
            fill="none"
          >
            {renderLeafSvg(leaf.type, leafColors)}
          </svg>
        ))}

        {/* Hanging vines */}
        {vines.map((vine, i) => (
          <svg
            key={`jungle-vine-${i}`}
            style={{
              position: 'absolute',
              left: `${vine.x}%`,
              top: 0,
              width: '20px',
              height: `${vine.h}px`,
              animation: `jungle-sway ${vine.dur}s ease-in-out infinite`,
              animationDelay: `${vine.delay}s`,
              transformOrigin: 'top center',
              opacity: lo,
            }}
            viewBox={`0 0 20 ${vine.h}`}
            fill="none"
          >
            <path
              d={`M10 0 Q5 ${vine.h * 0.3}, 12 ${vine.h * 0.5} Q18 ${vine.h * 0.7}, 8 ${vine.h}`}
              stroke={green}
              strokeWidth="1.5"
              fill="none"
            />
            {Array.from({ length: 4 }, (_, j) => {
              const cy = vine.h * 0.15 + (j * vine.h * 0.6) / 4;
              const side = j % 2 === 0 ? -1 : 1;
              return (
                <ellipse
                  key={j}
                  cx={10 + side * 6}
                  cy={cy}
                  rx="6"
                  ry="3"
                  fill={`${j % 2 === 0 ? green : limeGreen}60`}
                  transform={`rotate(${side * -25} ${10 + side * 6} ${cy})`}
                />
              );
            })}
          </svg>
        ))}

        {/* Parrots */}
        <svg
          style={{
            position: 'absolute',
            left: '18%',
            top: '14%',
            width: '28px',
            height: '28px',
            opacity: 0.55,
            animation: 'jungle-parrot 22s ease-in-out infinite',
            animationDelay: '-4s',
          }}
          viewBox="0 0 40 40"
        >
          <path d="M25 8 Q28 6, 30 8 Q31 9, 30 10 L28 11 Q27 10, 26 10Z" fill={theme === 'light' ? '#a02020' : '#e84040'} />
          <ellipse cx="22" cy="14" rx="6" ry="5" fill={theme === 'light' ? '#c83030' : '#e84040'} />
          <ellipse cx="20" cy="20" rx="5" ry="7" fill={theme === 'light' ? '#c83030' : '#e84040'} />
          <path d="M16 24 Q14 30, 12 36 Q11 38, 13 37 Q16 33, 18 27Z" fill={theme === 'light' ? '#2060c0' : '#4090e8'} />
          <path d="M18 25 Q17 31, 16 36 Q15 38, 17 37 Q19 33, 20 27Z" fill={theme === 'light' ? '#c0a020' : '#e8c840'} />
          <circle cx="24" cy="12" r="1.2" fill="white" />
          <circle cx="24.2" cy="12" r="0.6" fill="#111" />
          <path d="M18 14 Q12 16, 8 20 Q6 22, 8 21 Q12 18, 17 16Z" fill={theme === 'light' ? '#2060c0' : '#4090e8'} opacity="0.8" />
        </svg>

        <svg
          style={{
            position: 'absolute',
            left: '75%',
            top: '10%',
            width: '24px',
            height: '24px',
            opacity: 0.45,
            animation: 'jungle-parrot 26s ease-in-out infinite',
            animationDelay: '-14s',
          }}
          viewBox="0 0 40 40"
        >
          <path d="M25 8 Q28 6, 30 8 Q31 9, 30 10 L28 11 Q27 10, 26 10Z" fill={gold} />
          <ellipse cx="22" cy="14" rx="6" ry="5" fill={green} />
          <ellipse cx="20" cy="20" rx="5" ry="7" fill={green} />
          <path d="M16 24 Q14 30, 12 36 Q11 38, 13 37 Q16 33, 18 27Z" fill={limeGreen} />
          <path d="M18 25 Q17 31, 16 36 Q15 38, 17 37 Q19 33, 20 27Z" fill={green} />
          <circle cx="24" cy="12" r="1.2" fill="white" />
          <circle cx="24.2" cy="12" r="0.6" fill="#111" />
          <path d="M18 14 Q12 16, 8 20 Q6 22, 8 21 Q12 18, 17 16Z" fill={limeGreen} opacity="0.8" />
        </svg>

        {/* Butterflies */}
        {butterflies.map((b, i) => (
          <svg
            key={`jungle-butterfly-${i}`}
            style={{
              position: 'absolute',
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: '16px',
              height: '16px',
              opacity: 0.5,
              animation: `jungle-butterfly ${b.dur}s ease-in-out infinite`,
              animationDelay: `${b.delay}s`,
            }}
            viewBox="0 0 24 24"
          >
            <path d="M12 12 Q8 6, 4 5 Q2 5, 3 7 Q5 10, 12 12Z" fill={b.color} opacity="0.8" />
            <path d="M12 12 Q16 6, 20 5 Q22 5, 21 7 Q19 10, 12 12Z" fill={b.color} opacity="0.8" />
            <path d="M12 12 Q9 16, 6 18 Q4 19, 5 17 Q7 14, 12 12Z" fill={b.color} opacity="0.6" />
            <path d="M12 12 Q15 16, 18 18 Q20 19, 19 17 Q17 14, 12 12Z" fill={b.color} opacity="0.6" />
            <line x1="12" y1="8" x2="12" y2="16" stroke={brown} strokeWidth="0.5" />
          </svg>
        ))}

        {/* Fireflies */}
        {fireflies.map((ff, i) => (
          <div
            key={`jungle-firefly-${i}`}
            style={{
              position: 'absolute',
              left: `${ff.x}%`,
              top: `${ff.y}%`,
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: i % 3 === 0 ? gold : green,
              boxShadow: `0 0 8px 3px ${i % 3 === 0 ? gold : green}50`,
              animation: `jungle-firefly ${ff.dur}s ease-in-out infinite`,
              animationDelay: `${ff.delay}s`,
            }}
          />
        ))}

        {/* Dappled sunlight */}
        {Array.from({ length: 10 }, (_, i) => ({
          x: 5 + (i * 47 + i * i * 3) % 90,
          y: 5 + (i * 31 + i * i * 7) % 85,
          size: 50 + (i % 4) * 25,
        })).map((spot, i) => (
          <div
            key={`jungle-sun-${i}`}
            style={{
              position: 'absolute',
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: `${spot.size}px`,
              height: `${spot.size}px`,
              borderRadius: '50%',
              background: theme === 'light'
                ? `radial-gradient(circle, ${gold}0c 0%, transparent 70%)`
                : `radial-gradient(circle, ${gold}0a 0%, transparent 70%)`,
              animation: `lofi-pulse ${14 + i * 3}s ease-in-out infinite`,
              animationDelay: `${-i * 3}s`,
            }}
          />
        ))}

        {/* Heavy jungle vignette for depth */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'radial-gradient(ellipse at center, transparent 30%, rgba(20, 50, 20, 0.07) 100%)'
              : 'radial-gradient(ellipse at center, transparent 20%, rgba(5, 12, 5, 0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  };

  const renderGlassEffects = () => {
    if (visualTheme !== 'glass') return null;

    const accent = theme === 'light' ? '#4a68d0' : '#6c8cff';
    const pink = theme === 'light' ? '#d050a0' : '#f070c0';
    const teal = theme === 'light' ? '#2098b8' : '#40c8e8';
    const purple = theme === 'light' ? '#8050d8' : '#a070f0';
    const orange = theme === 'light' ? '#d08030' : '#f0a050';

    // Big vivid gradient orbs — these are what make Liquid Glass work
    // The rich colors bleed through the frosted blur on cards
    const orbs = [
      { x: -5, y: -10, size: 500, color1: accent, color2: purple, dur: 30, delay: -5 },
      { x: 50, y: -15, size: 450, color1: pink, color2: orange, dur: 36, delay: -14 },
      { x: 85, y: 10, size: 420, color1: teal, color2: accent, dur: 28, delay: -8 },
      { x: 10, y: 35, size: 480, color1: purple, color2: pink, dur: 34, delay: -20 },
      { x: 60, y: 40, size: 400, color1: orange, color2: teal, dur: 32, delay: -3 },
      { x: 30, y: 65, size: 460, color1: teal, color2: purple, dur: 30, delay: -16 },
      { x: 75, y: 60, size: 440, color1: pink, color2: accent, dur: 35, delay: -10 },
      { x: -10, y: 70, size: 420, color1: accent, color2: orange, dur: 28, delay: -22 },
      { x: 45, y: 85, size: 400, color1: purple, color2: teal, dur: 33, delay: -7 },
      { x: 90, y: 80, size: 380, color1: orange, color2: pink, dur: 31, delay: -18 },
    ];

    // Floating glass bubbles with specular highlights
    const bubbles = [
      { x: 12, y: 18, size: 50, dur: 22, delay: -3 },
      { x: 35, y: 40, size: 35, dur: 26, delay: -9 },
      { x: 58, y: 12, size: 42, dur: 20, delay: -14 },
      { x: 78, y: 50, size: 30, dur: 24, delay: -6 },
      { x: 22, y: 68, size: 38, dur: 28, delay: -17 },
      { x: 68, y: 32, size: 28, dur: 21, delay: -11 },
      { x: 88, y: 18, size: 34, dur: 25, delay: -4 },
      { x: 42, y: 58, size: 40, dur: 23, delay: -8 },
      { x: 8, y: 45, size: 32, dur: 27, delay: -13 },
      { x: 52, y: 78, size: 36, dur: 22, delay: -20 },
      { x: 75, y: 72, size: 26, dur: 19, delay: -2 },
      { x: 30, y: 85, size: 44, dur: 24, delay: -15 },
    ];

    // Light opacity values
    const orbAlpha = theme === 'light' ? '50' : '35';
    const orbAlpha2 = theme === 'light' ? '30' : '20';

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Rich vivid gradient orbs — the soul of Liquid Glass */}
        {orbs.map((orb, i) => (
          <div
            key={`glass-orb-${i}`}
            style={{
              position: 'absolute',
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${orb.color1}${orbAlpha} 0%, ${orb.color2}${orbAlpha2} 45%, transparent 70%)`,
              filter: 'blur(60px)',
              animation: `glass-orb ${orb.dur}s ease-in-out infinite`,
              animationDelay: `${orb.delay}s`,
            }}
          />
        ))}

        {/* Glass bubbles with specular highlight */}
        {bubbles.map((bubble, i) => (
          <div
            key={`glass-bubble-${i}`}
            style={{
              position: 'absolute',
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              borderRadius: '50%',
              background: theme === 'light'
                ? 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.03) 60%, transparent 70%)'
                : 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.01) 60%, transparent 70%)',
              border: `1px solid ${theme === 'light' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
              boxShadow: theme === 'light'
                ? 'inset 0 -2px 6px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)'
                : 'inset 0 -2px 6px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.1)',
              animation: `glass-float ${bubble.dur}s ease-in-out infinite`,
              animationDelay: `${bubble.delay}s`,
            }}
          />
        ))}

        {/* Shimmer sweep — slow moving light refraction */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '25%',
              height: '200%',
              background: theme === 'light'
                ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
              transform: 'rotate(25deg)',
              animation: 'glass-shimmer 15s ease-in-out infinite',
            }}
          />
        </div>

        {/* Soft vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'radial-gradient(ellipse at center, transparent 50%, rgba(50, 60, 100, 0.04) 100%)'
              : 'radial-gradient(ellipse at center, transparent 30%, rgba(4, 6, 16, 0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  };

  const renderSteampunkEffects = () => {
    if (visualTheme !== 'steampunk') return null;

    const brass = theme === 'light' ? '#9a6820' : '#c89040';
    const copper = theme === 'light' ? '#8a5030' : '#c07040';
    const bronze = theme === 'light' ? '#7a5828' : '#a87838';
    const steam = theme === 'light' ? 'rgba(100, 80, 50, 0.08)' : 'rgba(200, 180, 140, 0.06)';

    // Gears of different sizes scattered across screen
    const gears: Array<{x: number; y: number; size: number; teeth: number; reverse: boolean; dur: number; color: string}> = [
      // Large gears at corners and edges
      { x: -3, y: -5, size: 180, teeth: 16, reverse: false, dur: 60, color: brass },
      { x: 88, y: -4, size: 160, teeth: 14, reverse: true, dur: 55, color: copper },
      { x: -5, y: 75, size: 200, teeth: 18, reverse: true, dur: 70, color: bronze },
      { x: 90, y: 80, size: 170, teeth: 15, reverse: false, dur: 58, color: brass },
      // Medium gears meshing with large ones
      { x: 10, y: 10, size: 100, teeth: 12, reverse: true, dur: 40, color: copper },
      { x: 82, y: 8, size: 90, teeth: 10, reverse: false, dur: 36, color: bronze },
      { x: 8, y: 88, size: 110, teeth: 12, reverse: false, dur: 44, color: brass },
      { x: 85, y: 68, size: 95, teeth: 11, reverse: true, dur: 38, color: copper },
      // Smaller scattered gears
      { x: 30, y: 5, size: 60, teeth: 8, reverse: false, dur: 28, color: bronze },
      { x: 65, y: 3, size: 50, teeth: 8, reverse: true, dur: 24, color: brass },
      { x: 3, y: 40, size: 70, teeth: 10, reverse: false, dur: 32, color: copper },
      { x: 92, y: 35, size: 55, teeth: 8, reverse: true, dur: 26, color: bronze },
      { x: 25, y: 85, size: 65, teeth: 9, reverse: true, dur: 30, color: brass },
      { x: 70, y: 90, size: 50, teeth: 8, reverse: false, dur: 25, color: copper },
      // Interior small gears
      { x: 20, y: 30, size: 40, teeth: 8, reverse: true, dur: 20, color: bronze },
      { x: 75, y: 45, size: 35, teeth: 7, reverse: false, dur: 18, color: brass },
      { x: 45, y: 15, size: 45, teeth: 8, reverse: true, dur: 22, color: copper },
      { x: 55, y: 75, size: 38, teeth: 7, reverse: false, dur: 19, color: bronze },
    ];

    // Steam puffs
    const steamPuffs = [
      { x: 15, y: 60, dur: 5, delay: -1 },
      { x: 40, y: 45, dur: 6, delay: -3 },
      { x: 65, y: 55, dur: 5.5, delay: -2 },
      { x: 85, y: 50, dur: 7, delay: -4 },
      { x: 30, y: 70, dur: 6, delay: -5 },
      { x: 55, y: 35, dur: 5, delay: -1.5 },
      { x: 78, y: 65, dur: 6.5, delay: -3.5 },
      { x: 10, y: 50, dur: 5.5, delay: -2.5 },
    ];

    // Pipes
    const pipes = [
      { x1: 0, y1: 30, x2: 15, y2: 30, vert: false },
      { x1: 85, y1: 25, x2: 100, y2: 25, vert: false },
      { x1: 0, y1: 60, x2: 10, y2: 60, vert: false },
      { x1: 90, y1: 55, x2: 100, y2: 55, vert: false },
      { x1: 40, y1: 0, x2: 40, y2: 8, vert: true },
      { x1: 70, y1: 92, x2: 70, y2: 100, vert: true },
    ];

    const renderGear = (gear: typeof gears[0], i: number) => {
      // Normalized to 100x100 viewBox for simplicity
      const cx = 50;
      const cy = 50;
      const outerR = 46;       // outer tip of teeth
      const baseR = 36;        // base of teeth (gear body radius)
      const hubR = 8;          // center hub dot
      const n = gear.teeth;

      // Build gear outline: alternating tooth-tip and valley for each tooth
      const points: string[] = [];
      for (let t = 0; t < n; t++) {
        const frac = t / n;
        const a0 = frac * Math.PI * 2 - Math.PI / 2;        // start of tooth
        const a1 = a0 + (Math.PI * 2 / n) * 0.35;           // end of tooth top
        const a2 = a0 + (Math.PI * 2 / n) * 0.5;            // start of valley
        const a3 = a0 + (Math.PI * 2 / n) * 0.85;           // end of valley

        // Tooth: go out to outerR
        points.push(`${cx + baseR * Math.cos(a0)},${cy + baseR * Math.sin(a0)}`);
        points.push(`${cx + outerR * Math.cos(a0)},${cy + outerR * Math.sin(a0)}`);
        points.push(`${cx + outerR * Math.cos(a1)},${cy + outerR * Math.sin(a1)}`);
        points.push(`${cx + baseR * Math.cos(a1)},${cy + baseR * Math.sin(a1)}`);
        // Valley: stay at baseR
        points.push(`${cx + baseR * Math.cos(a2)},${cy + baseR * Math.sin(a2)}`);
        points.push(`${cx + baseR * Math.cos(a3)},${cy + baseR * Math.sin(a3)}`);
      }

      const spokeCount = n <= 8 ? 4 : 6;
      const bgFill = theme === 'light' ? '#f5ede0' : '#1a140e';

      return (
        <svg
          key={`steam-gear-${i}`}
          style={{
            position: 'absolute',
            left: `${gear.x}%`,
            top: `${gear.y}%`,
            width: `${gear.size}px`,
            height: `${gear.size}px`,
            opacity: theme === 'light' ? 0.14 : 0.2,
            animation: `${gear.reverse ? 'steam-gear-reverse' : 'steam-gear'} ${gear.dur}s linear infinite`,
          }}
          viewBox="0 0 100 100"
        >
          {/* Gear body with teeth */}
          <polygon points={points.join(' ')} fill={gear.color} />
          {/* Inner ring cutout */}
          <circle cx={cx} cy={cy} r={baseR * 0.6} fill={bgFill} />
          {/* Spokes connecting hub to rim */}
          {Array.from({ length: spokeCount }, (_, si) => {
            const a = (si / spokeCount) * Math.PI * 2 - Math.PI / 2;
            return (
              <line
                key={si}
                x1={cx + hubR * 1.2 * Math.cos(a)}
                y1={cy + hubR * 1.2 * Math.sin(a)}
                x2={cx + baseR * 0.56 * Math.cos(a)}
                y2={cy + baseR * 0.56 * Math.sin(a)}
                stroke={gear.color}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            );
          })}
          {/* Center hub */}
          <circle cx={cx} cy={cy} r={hubR} fill={gear.color} />
          {/* Center axle hole */}
          <circle cx={cx} cy={cy} r={hubR * 0.4} fill={bgFill} />
        </svg>
      );
    };

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Parchment/aged metal texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? `radial-gradient(ellipse at 30% 25%, rgba(180, 140, 80, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 75% 70%, rgba(160, 120, 60, 0.05) 0%, transparent 50%)`
              : `radial-gradient(ellipse at 30% 25%, rgba(200, 144, 64, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 75% 70%, rgba(180, 120, 40, 0.05) 0%, transparent 50%)`,
            pointerEvents: 'none',
          }}
        />

        {/* All the gears */}
        {gears.map((gear, i) => renderGear(gear, i))}

        {/* Pipes along edges */}
        {pipes.map((pipe, i) => (
          <div
            key={`steam-pipe-${i}`}
            style={{
              position: 'absolute',
              left: `${Math.min(pipe.x1, pipe.x2)}%`,
              top: `${Math.min(pipe.y1, pipe.y2)}%`,
              width: pipe.vert ? '6px' : `${Math.abs(pipe.x2 - pipe.x1)}%`,
              height: pipe.vert ? `${Math.abs(pipe.y2 - pipe.y1)}%` : '6px',
              background: `linear-gradient(${pipe.vert ? '180deg' : '90deg'}, ${copper}${theme === 'light' ? '20' : '30'}, ${brass}${theme === 'light' ? '25' : '35'}, ${copper}${theme === 'light' ? '20' : '30'})`,
              borderRadius: '3px',
              boxShadow: theme === 'light'
                ? `0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.15)`
                : `0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,200,100,0.08)`,
            }}
          >
            {/* Pipe rivets */}
            {!pipe.vert && [0.2, 0.5, 0.8].map((pos, ri) => (
              <div
                key={ri}
                style={{
                  position: 'absolute',
                  left: `${pos * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: brass,
                  opacity: theme === 'light' ? 0.2 : 0.3,
                }}
              />
            ))}
          </div>
        ))}

        {/* Pressure gauges */}
        {[
          { x: 5, y: 20, size: 35 },
          { x: 90, y: 42, size: 30 },
        ].map((gauge, i) => (
          <svg
            key={`steam-gauge-${i}`}
            style={{
              position: 'absolute',
              left: `${gauge.x}%`,
              top: `${gauge.y}%`,
              width: `${gauge.size}px`,
              height: `${gauge.size}px`,
              opacity: theme === 'light' ? 0.2 : 0.28,
            }}
            viewBox="0 0 40 40"
          >
            {/* Gauge body */}
            <circle cx="20" cy="20" r="18" fill="none" stroke={brass} strokeWidth="2.5" />
            <circle cx="20" cy="20" r="15" fill="none" stroke={copper} strokeWidth="0.5" opacity="0.5" />
            {/* Tick marks */}
            {Array.from({ length: 8 }, (_, ti) => {
              const a = -135 + ti * (270 / 7);
              const rad = (a * Math.PI) / 180;
              return (
                <line
                  key={ti}
                  x1={20 + 13 * Math.cos(rad)}
                  y1={20 + 13 * Math.sin(rad)}
                  x2={20 + 15.5 * Math.cos(rad)}
                  y2={20 + 15.5 * Math.sin(rad)}
                  stroke={brass}
                  strokeWidth="1"
                  opacity="0.7"
                />
              );
            })}
            {/* Needle */}
            <line
              x1="20" y1="20"
              x2="20" y2="8"
              stroke={theme === 'light' ? '#a03020' : '#e04030'}
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{
                transformOrigin: '20px 20px',
                animation: `steam-gauge ${8 + i * 3}s ease-in-out infinite`,
                animationDelay: `${-i * 4}s`,
              }}
            />
            {/* Center pin */}
            <circle cx="20" cy="20" r="2" fill={brass} />
          </svg>
        ))}

        {/* Steam puffs */}
        {steamPuffs.map((puff, i) => (
          <div
            key={`steam-puff-${i}`}
            style={{
              position: 'absolute',
              left: `${puff.x}%`,
              top: `${puff.y}%`,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: steam,
              filter: 'blur(6px)',
              animation: `steam-puff ${puff.dur}s ease-out infinite`,
              animationDelay: `${puff.delay}s`,
            }}
          />
        ))}

        {/* Warm lantern glows */}
        {[
          { x: 12, y: 25 },
          { x: 85, y: 40 },
          { x: 50, y: 80 },
        ].map((glow, i) => (
          <div
            key={`steam-glow-${i}`}
            style={{
              position: 'absolute',
              left: `${glow.x}%`,
              top: `${glow.y}%`,
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${brass}${theme === 'light' ? '0a' : '10'} 0%, transparent 70%)`,
              animation: `steam-flicker ${4 + i}s ease-in-out infinite`,
              animationDelay: `${-i * 2}s`,
            }}
          />
        ))}

        {/* Victorian vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'light'
              ? 'radial-gradient(ellipse at center, transparent 45%, rgba(80, 50, 20, 0.06) 100%)'
              : 'radial-gradient(ellipse at center, transparent 30%, rgba(10, 6, 2, 0.45) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  };

  const renderSkeuoEffects = () => {
    if (visualTheme !== 'skeuo') return null;

    const isLight = theme === 'light';

    // Much stronger texture colors
    const leatherBase = isLight ? 'rgba(140, 90, 40, 0.1)' : 'rgba(180, 140, 80, 0.07)';
    const leatherDark = isLight ? 'rgba(100, 60, 25, 0.08)' : 'rgba(140, 100, 50, 0.06)';
    const stitch = isLight ? 'rgba(100, 70, 30, 0.25)' : 'rgba(212, 162, 74, 0.2)';
    const stitchHole = isLight ? 'rgba(60, 40, 15, 0.15)' : 'rgba(0, 0, 0, 0.3)';
    const metalBase = isLight ? '#b0a080' : '#8a7a5a';
    const metalHighlight = isLight ? '#d8d0b8' : '#c0b090';
    const metalShadow = isLight ? '#7a6a4a' : '#4a3a20';
    const woodGrain = isLight ? 'rgba(120, 70, 30, 0.06)' : 'rgba(160, 110, 50, 0.04)';

    // Stitching paths - double stitch lines along borders and diagonals
    const stitchLines = [
      // Outer border stitching
      { x1: 2, y1: 2, x2: 98, y2: 2 },    // top
      { x1: 2, y1: 98, x2: 98, y2: 98 },   // bottom
      { x1: 2, y1: 2, x2: 2, y2: 98 },     // left
      { x1: 98, y1: 2, x2: 98, y2: 98 },   // right
      // Inner border stitching (double stitch effect)
      { x1: 4, y1: 4, x2: 96, y2: 4 },     // top inner
      { x1: 4, y1: 96, x2: 96, y2: 96 },   // bottom inner
      { x1: 4, y1: 4, x2: 4, y2: 96 },     // left inner
      { x1: 96, y1: 4, x2: 96, y2: 96 },   // right inner
    ];

    // Decorative rivets/studs along edges
    const rivets = [
      // Corners
      { x: 3, y: 3 }, { x: 97, y: 3 }, { x: 3, y: 97 }, { x: 97, y: 97 },
      // Mid-edge rivets
      { x: 25, y: 3 }, { x: 50, y: 3 }, { x: 75, y: 3 },
      { x: 25, y: 97 }, { x: 50, y: 97 }, { x: 75, y: 97 },
      { x: 3, y: 25 }, { x: 3, y: 50 }, { x: 3, y: 75 },
      { x: 97, y: 25 }, { x: 97, y: 50 }, { x: 97, y: 75 },
    ];

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>

        {/* === LAYER 1: Heavy leather texture === */}
        {/* Primary crosshatch linen/leather weave */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 1px,
                ${leatherBase} 1px,
                ${leatherBase} 2.5px
              ),
              repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 1px,
                ${leatherBase} 1px,
                ${leatherBase} 2.5px
              )
            `,
            backgroundSize: '6px 6px',
          }}
        />

        {/* Secondary finer grain texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 1px,
                ${leatherDark} 1px,
                ${leatherDark} 2px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 3px,
                ${leatherDark} 3px,
                ${leatherDark} 4px
              )
            `,
            backgroundSize: '3px 5px',
            opacity: 0.6,
          }}
        />

        {/* Leather pore/grain dot pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle, ${leatherDark} 0.8px, transparent 0.8px),
              radial-gradient(circle, ${leatherBase} 0.5px, transparent 0.5px)
            `,
            backgroundSize: '7px 7px, 4px 4px',
            backgroundPosition: '0 0, 2px 2px',
            opacity: 0.8,
          }}
        />

        {/* === LAYER 2: Wood grain undertone === */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                175deg,
                transparent,
                transparent 20px,
                ${woodGrain} 20px,
                ${woodGrain} 22px,
                transparent 22px,
                transparent 35px,
                ${woodGrain} 35px,
                ${woodGrain} 36px
              )
            `,
            opacity: 0.8,
          }}
        />

        {/* === LAYER 3: Leather color variation - darker patches === */}
        {[
          { x: 5, y: 10, w: 35, h: 30, rot: -2 },
          { x: 55, y: 5, w: 40, h: 25, rot: 1 },
          { x: 10, y: 60, w: 30, h: 35, rot: 3 },
          { x: 50, y: 55, w: 45, h: 40, rot: -1 },
          { x: 25, y: 35, w: 50, h: 30, rot: 0 },
        ].map((patch, i) => (
          <div
            key={`leather-patch-${i}`}
            style={{
              position: 'absolute',
              left: `${patch.x}%`,
              top: `${patch.y}%`,
              width: `${patch.w}%`,
              height: `${patch.h}%`,
              background: `radial-gradient(ellipse, ${isLight ? 'rgba(100, 65, 25, 0.04)' : 'rgba(80, 50, 20, 0.08)'} 0%, transparent 70%)`,
              transform: `rotate(${patch.rot}deg)`,
            }}
          />
        ))}

        {/* === LAYER 4: Stitching === */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {stitchLines.map((line, i) => (
            <g key={`stitch-${i}`}>
              {/* Stitch hole shadows */}
              <line
                x1={line.x1} y1={line.y1 + 0.15}
                x2={line.x2} y2={line.y2 + 0.15}
                stroke={stitchHole}
                strokeWidth="0.25"
                strokeDasharray="0.6 0.5"
                strokeLinecap="round"
              />
              {/* Main stitch thread */}
              <line
                x1={line.x1} y1={line.y1}
                x2={line.x2} y2={line.y2}
                stroke={stitch}
                strokeWidth="0.2"
                strokeDasharray="0.6 0.5"
                strokeLinecap="round"
              />
              {/* Stitch highlight (thread catching light) */}
              <line
                x1={line.x1} y1={line.y1 - 0.08}
                x2={line.x2} y2={line.y2 - 0.08}
                stroke={isLight ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)'}
                strokeWidth="0.1"
                strokeDasharray="0.6 0.5"
                strokeLinecap="round"
              />
            </g>
          ))}
        </svg>

        {/* === LAYER 5: Metal rivets/studs === */}
        {rivets.map((rivet, i) => (
          <div
            key={`rivet-${i}`}
            style={{
              position: 'absolute',
              left: `${rivet.x}%`,
              top: `${rivet.y}%`,
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, ${metalHighlight}, ${metalBase} 50%, ${metalShadow} 100%)`,
              boxShadow: `0 1px 2px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,${isLight ? '0.4' : '0.15'}), inset 0 -1px 1px rgba(0,0,0,0.2)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Rivet center dimple */}
            <div style={{
              position: 'absolute',
              top: '30%',
              left: '30%',
              width: '40%',
              height: '40%',
              borderRadius: '50%',
              background: `radial-gradient(circle at 40% 40%, ${metalHighlight}, ${metalBase})`,
              boxShadow: `inset 0 0.5px 1px rgba(0,0,0,0.2)`,
            }} />
          </div>
        ))}

        {/* === LAYER 6: Embossed border frame === */}
        <div
          style={{
            position: 'absolute',
            inset: '6px',
            border: `2px solid ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.02)'}`,
            borderRadius: '4px',
            boxShadow: `
              inset 0 2px 0 ${isLight ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.02)'},
              inset 0 -2px 0 ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.3)'},
              inset 2px 0 0 ${isLight ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.01)'},
              inset -2px 0 0 ${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.15)'},
              0 0 8px ${isLight ? 'rgba(80,50,20,0.06)' : 'rgba(0,0,0,0.3)'}
            `,
            pointerEvents: 'none',
          }}
        />

        {/* === LAYER 7: Decorative objects === */}

        {/* Paper clip - larger and more detailed */}
        <svg
          style={{
            position: 'absolute',
            top: '6%',
            right: '4%',
            width: '32px',
            height: '80px',
            opacity: isLight ? 0.35 : 0.2,
            transform: 'rotate(12deg)',
            filter: `drop-shadow(1px 2px 2px rgba(0,0,0,${isLight ? '0.15' : '0.4'}))`,
          }}
          viewBox="0 0 24 60"
        >
          <path
            d="M8 4 C8 2, 16 2, 16 4 L16 48 C16 54, 8 54, 8 48 L8 12 C8 8, 16 8, 16 12 L16 42"
            fill="none"
            stroke={isLight ? '#999' : '#bbb'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Highlight on clip */}
          <path
            d="M9 5 C9 3.5, 15 3.5, 15 5 L15 20"
            fill="none"
            stroke={isLight ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        </svg>

        {/* Second paper clip */}
        <svg
          style={{
            position: 'absolute',
            top: '35%',
            left: '2%',
            width: '28px',
            height: '70px',
            opacity: isLight ? 0.25 : 0.12,
            transform: 'rotate(-20deg)',
            filter: `drop-shadow(1px 2px 2px rgba(0,0,0,${isLight ? '0.1' : '0.3'}))`,
          }}
          viewBox="0 0 24 60"
        >
          <path
            d="M8 4 C8 2, 16 2, 16 4 L16 48 C16 54, 8 54, 8 48 L8 12 C8 8, 16 8, 16 12 L16 42"
            fill="none"
            stroke={isLight ? '#c8a060' : '#d4a24a'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Pencil - bigger, more visible */}
        <svg
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '3%',
            width: '180px',
            height: '22px',
            opacity: isLight ? 0.3 : 0.15,
            transform: 'rotate(-6deg)',
            filter: `drop-shadow(1px 2px 3px rgba(0,0,0,${isLight ? '0.15' : '0.4'}))`,
          }}
          viewBox="0 0 180 22"
        >
          {/* Pencil body with wood texture */}
          <rect x="30" y="4" width="130" height="14" rx="1" fill={isLight ? '#daa520' : '#c89040'} />
          <rect x="30" y="4" width="130" height="7" rx="1" fill={isLight ? '#e8b830' : '#d49848'} opacity="0.6" />
          {/* Pencil stripes */}
          <rect x="60" y="4" width="2" height="14" fill={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.1)'} />
          <rect x="100" y="4" width="2" height="14" fill={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.1)'} />
          <rect x="140" y="4" width="2" height="14" fill={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.1)'} />
          {/* Metal ferrule */}
          <rect x="155" y="3" width="12" height="16" rx="1" fill={isLight ? '#b8b0a0' : '#8a8070'} />
          <rect x="157" y="3" width="2" height="16" fill={isLight ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'} />
          <rect x="163" y="3" width="1" height="16" fill={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.2)'} />
          {/* Eraser */}
          <rect x="167" y="5" width="13" height="12" rx="2" fill={isLight ? '#e08888' : '#c07070'} />
          {/* Wood tip */}
          <polygon points="30,4 30,18 16,11" fill={isLight ? '#f0daa0' : '#d0b878'} />
          {/* Graphite tip */}
          <polygon points="18,9.5 18,12.5 12,11" fill={isLight ? '#444' : '#666'} />
        </svg>

        {/* Rubber eraser - bottom right */}
        <svg
          style={{
            position: 'absolute',
            bottom: '15%',
            right: '5%',
            width: '50px',
            height: '30px',
            opacity: isLight ? 0.25 : 0.12,
            transform: 'rotate(8deg)',
            filter: `drop-shadow(1px 2px 3px rgba(0,0,0,${isLight ? '0.12' : '0.3'}))`,
          }}
          viewBox="0 0 50 30"
        >
          <rect x="2" y="2" width="46" height="26" rx="3" fill={isLight ? '#f0c0c0' : '#c08080'} />
          <rect x="2" y="2" width="46" height="13" rx="3" fill={isLight ? '#f0d0d0' : '#d09090'} opacity="0.5" />
          {/* Band */}
          <rect x="2" y="8" width="46" height="6" fill={isLight ? '#4080c0' : '#3060a0'} />
          <text x="25" y="13.5" textAnchor="middle" fontSize="4" fill="white" fontFamily="sans-serif" fontWeight="bold" opacity="0.7">ERASER</text>
        </svg>

        {/* Sticky note - top left */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '3%',
            width: '60px',
            height: '55px',
            background: isLight
              ? 'linear-gradient(180deg, #fff9c4 0%, #fff59d 100%)'
              : 'linear-gradient(180deg, rgba(200, 180, 80, 0.15) 0%, rgba(180, 160, 60, 0.1) 100%)',
            borderRadius: '1px',
            boxShadow: isLight
              ? '2px 3px 6px rgba(0,0,0,0.12), inset 0 -2px 4px rgba(0,0,0,0.03)'
              : '2px 3px 6px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.1)',
            transform: 'rotate(-4deg)',
            opacity: isLight ? 0.5 : 0.25,
          }}
        >
          {/* Faux lines on sticky note */}
          {[0, 1, 2, 3].map((l) => (
            <div
              key={`line-${l}`}
              style={{
                position: 'absolute',
                top: `${18 + l * 18}%`,
                left: '12%',
                width: `${55 + l * 5}%`,
                height: '1px',
                background: isLight ? 'rgba(100, 80, 40, 0.12)' : 'rgba(200, 160, 60, 0.1)',
                borderRadius: '1px',
              }}
            />
          ))}
          {/* Curl effect at bottom */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '15px',
            height: '15px',
            background: isLight
              ? 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.04) 50%)'
              : 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)',
            borderRadius: '0 0 0 0',
          }} />
        </div>

        {/* Ruler along the right edge */}
        <div
          style={{
            position: 'absolute',
            top: '55%',
            right: '1.5%',
            width: '18px',
            height: '200px',
            background: isLight
              ? 'linear-gradient(90deg, #e8d8a0, #f0e0b0, #e0d098)'
              : 'linear-gradient(90deg, rgba(160, 130, 60, 0.15), rgba(180, 150, 70, 0.12), rgba(150, 120, 50, 0.15))',
            borderRadius: '2px',
            boxShadow: isLight
              ? '1px 2px 4px rgba(0,0,0,0.1), inset 1px 0 0 rgba(255,255,255,0.3)'
              : '1px 2px 4px rgba(0,0,0,0.3), inset 1px 0 0 rgba(255,255,255,0.05)',
            opacity: isLight ? 0.35 : 0.2,
            transform: 'rotate(2deg)',
          }}
        >
          {/* Ruler tick marks */}
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={`tick-${i}`}
              style={{
                position: 'absolute',
                top: `${i * 5}%`,
                left: 0,
                width: i % 5 === 0 ? '60%' : i % 2 === 0 ? '40%' : '25%',
                height: '1px',
                background: isLight ? 'rgba(80, 50, 20, 0.3)' : 'rgba(200, 160, 80, 0.2)',
              }}
            />
          ))}
        </div>

        {/* === LAYER 8: Lighting & depth === */}

        {/* Strong vignette - like a physical desk surface */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isLight
              ? 'radial-gradient(ellipse at center, transparent 30%, rgba(80, 50, 20, 0.12) 100%)'
              : 'radial-gradient(ellipse at center, transparent 20%, rgba(10, 6, 2, 0.6) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Warm desk lamp glow - top left */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-10%',
            width: '70%',
            height: '60%',
            background: `radial-gradient(ellipse, ${isLight ? 'rgba(255, 230, 180, 0.15)' : 'rgba(212, 162, 74, 0.06)'} 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Secondary ambient from bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-5%',
            width: '50%',
            height: '40%',
            background: `radial-gradient(ellipse, ${isLight ? 'rgba(200, 160, 100, 0.06)' : 'rgba(160, 120, 60, 0.03)'} 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Top edge shadow (like surface is under a shelf) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40px',
            background: `linear-gradient(180deg, ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.15)'} 0%, transparent 100%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {defaultBlobs}
      {renderThemePattern()}
      {renderCartoonShapes()}
      {renderCyberpunkEffects()}
      {renderRetroEffects()}
      {renderNatureEffects()}
      {renderOceanEffects()}
      {renderLavenderEffects()}
      {renderSpaceEffects()}
      {renderPixelEffects()}
      {renderAquariumEffects()}
      {renderCozyEffects()}
      {renderWinterEffects()}
      {renderSakuraEffects()}
      {renderHalloweenEffects()}
      {renderAutumnEffects()}
      {renderSpringEffects()}
      {renderNoirEffects()}
      {renderLofiEffects()}
      {renderJungleEffects()}
      {renderGlassEffects()}
      {renderSteampunkEffects()}
      {renderTerminalEffects()}
      {renderPaperEffects()}
      {renderSkeuoEffects()}
    </div>
  );
});
