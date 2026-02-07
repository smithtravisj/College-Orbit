/**
 * Visual Themes System
 * Fun, personality-driven visual themes that go beyond color changes
 * Premium feature
 */

import { ColorPalette } from './collegeColors';

export type BorderRadiusSize = 'sm' | 'md' | 'lg' | 'xl';
export type ShadowStyle = 'none' | 'soft' | 'bold';
export type BackgroundPattern = 'dots' | 'grid' | 'waves' | null;

export interface VisualTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    dark: Partial<ColorPalette>;
    light: Partial<ColorPalette>;
  };
  borderRadius: BorderRadiusSize;
  shadowStyle: ShadowStyle;
  backgroundPattern: BackgroundPattern;
  // Additional style overrides
  borderWidth?: 'thin' | 'medium' | 'thick';
}

/**
 * Cartoon Theme
 * Bright, saturated colors with playful UI styling
 * Fun, energetic, like a Saturday morning cartoon
 */
const cartoonTheme: VisualTheme = {
  id: 'cartoon',
  name: 'Cartoon',
  description: 'Bright colors, bold shapes, and playful vibes',
  colors: {
    dark: {
      // Bright, saturated primary colors
      bg: '#0a0a12',
      panel: '#14142a',
      panel2: '#0f0f20',
      accent: '#00b8d4', // Slightly darker cyan for dark mode
      accentHover: '#009cb8',
      accent2: 'rgba(0, 184, 212, 0.18)',
      ring: 'rgba(0, 184, 212, 0.4)',
      link: '#ff6bff', // Bright magenta
      success: '#00ff88', // Bright lime green
      warning: '#ffcc00', // Bright yellow
      danger: '#ff4466', // Bright coral red
      dangerHover: '#ff2244',
      successBg: 'rgba(0, 255, 136, 0.12)',
      warningBg: 'rgba(255, 204, 0, 0.12)',
      dangerBg: 'rgba(255, 68, 102, 0.12)',
      navActive: '#00b8d4',
      buttonSecondary: '#00b8d4',
      borderActive: '#00b8d4',
      brandPrimary: '#00b8d4',
      focusRing: '0 0 0 3px rgba(0, 184, 212, 0.35)',
      todayBg: 'rgba(0, 184, 212, 0.15)',
      weekViewTodayDateColor: '#00b8d4',
      calendarCurrentDateColor: '#00b8d4',
      editHover: '#ff6bff',
      text: '#f0f0ff',
      textSecondary: '#c8c8e0',
      border: 'rgba(255, 255, 255, 0.12)',
      borderStrong: 'rgba(255, 255, 255, 0.18)',
    },
    light: {
      // Pastel versions for light mode
      bg: '#f8f4ff',
      panel: '#ffffff',
      panel2: '#f0ecff',
      accent: '#00c4e8', // Slightly darker cyan for readability
      accentHover: '#00a8cc',
      accent2: 'rgba(0, 196, 232, 0.15)',
      ring: 'rgba(0, 196, 232, 0.35)',
      link: '#cc00cc', // Darker magenta for readability
      success: '#00cc6a',
      warning: '#cc9900',
      danger: '#e83355',
      dangerHover: '#cc2244',
      successBg: 'rgba(0, 204, 106, 0.1)',
      warningBg: 'rgba(204, 153, 0, 0.1)',
      dangerBg: 'rgba(232, 51, 85, 0.1)',
      navActive: 'rgba(0, 196, 232, 0.25)',
      buttonSecondary: '#00c4e8',
      borderActive: '#00c4e8',
      brandPrimary: '#00c4e8',
      focusRing: '0 0 0 3px rgba(0, 196, 232, 0.3)',
      todayBg: 'rgba(0, 196, 232, 0.12)',
      weekViewTodayDateColor: '#00a8cc',
      calendarCurrentDateColor: '#00c4e8',
      editHover: '#cc00cc',
      text: '#1a1a2e',
      textSecondary: '#4a4a6a',
    },
  },
  borderRadius: 'xl',
  shadowStyle: 'bold',
  backgroundPattern: 'dots',
  borderWidth: 'thick',
};

/**
 * Cyberpunk Theme
 * Neon colors on dark backgrounds, sharp edges, futuristic feel
 * Electric pink, cyan, and deep purple with glowing effects
 */
const cyberpunkTheme: VisualTheme = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  description: 'Neon glow, sharp edges, futuristic vibes',
  colors: {
    dark: {
      bg: '#0a0014',
      panel: '#120024',
      panel2: '#0e001a',
      accent: '#00d4d4', // Toned down cyan
      accentHover: '#00b8b8',
      accent2: 'rgba(0, 212, 212, 0.15)',
      ring: 'rgba(0, 212, 212, 0.4)',
      link: '#e000e0', // Toned down magenta
      success: '#00ff66', // Neon green
      warning: '#ffff00', // Electric yellow
      danger: '#ff0055', // Hot pink-red
      dangerHover: '#cc0044',
      successBg: 'rgba(0, 255, 102, 0.12)',
      warningBg: 'rgba(255, 255, 0, 0.12)',
      dangerBg: 'rgba(255, 0, 85, 0.12)',
      navActive: '#00d4d4',
      buttonSecondary: '#00d4d4',
      borderActive: '#00d4d4',
      brandPrimary: '#00d4d4',
      focusRing: '0 0 0 3px rgba(0, 212, 212, 0.35)',
      todayBg: 'rgba(0, 212, 212, 0.12)',
      weekViewTodayDateColor: '#00d4d4',
      calendarCurrentDateColor: '#00d4d4',
      editHover: '#e000e0',
      text: '#e0e0ff',
      textSecondary: '#a0a0c0',
      border: 'rgba(0, 212, 212, 0.15)',
      borderStrong: 'rgba(0, 212, 212, 0.25)',
    },
    light: {
      bg: '#f0f0ff',
      panel: '#ffffff',
      panel2: '#e8e8ff',
      accent: '#0099aa', // Darker cyan for readability
      accentHover: '#007788',
      accent2: 'rgba(0, 153, 170, 0.12)',
      ring: 'rgba(0, 153, 170, 0.35)',
      link: '#aa0088', // Darker magenta
      success: '#00994d',
      warning: '#998800',
      danger: '#cc0044',
      dangerHover: '#aa0033',
      successBg: 'rgba(0, 153, 77, 0.1)',
      warningBg: 'rgba(153, 136, 0, 0.1)',
      dangerBg: 'rgba(204, 0, 68, 0.1)',
      navActive: 'rgba(0, 153, 170, 0.2)',
      buttonSecondary: '#0099aa',
      borderActive: '#0099aa',
      brandPrimary: '#0099aa',
      focusRing: '0 0 0 3px rgba(0, 153, 170, 0.3)',
      todayBg: 'rgba(0, 153, 170, 0.1)',
      weekViewTodayDateColor: '#007788',
      calendarCurrentDateColor: '#0099aa',
      editHover: '#aa0088',
      text: '#1a1a2e',
      textSecondary: '#4a4a6a',
      border: 'rgba(0, 153, 170, 0.15)',
      borderStrong: 'rgba(0, 153, 170, 0.25)',
    },
  },
  borderRadius: 'sm',
  shadowStyle: 'bold',
  backgroundPattern: 'grid',
  borderWidth: 'thin',
};

/**
 * Retro Synthwave Theme
 * 80s nostalgia with pink/purple sunset gradients
 * Warm, dreamy, vaporwave aesthetic
 */
const retroTheme: VisualTheme = {
  id: 'retro',
  name: 'Retro',
  description: '80s synthwave vibes with sunset colors',
  colors: {
    dark: {
      bg: '#1a0a1e',
      panel: '#2a1230',
      panel2: '#200e25',
      accent: '#ff6b9d', // Hot pink
      accentHover: '#ff4785',
      accent2: 'rgba(255, 107, 157, 0.15)',
      ring: 'rgba(255, 107, 157, 0.4)',
      link: '#00d9ff', // Electric blue
      success: '#00e5a0', // Teal
      warning: '#ffc857', // Warm yellow
      danger: '#ff4757', // Coral red
      dangerHover: '#ff2d3d',
      successBg: 'rgba(0, 229, 160, 0.12)',
      warningBg: 'rgba(255, 200, 87, 0.12)',
      dangerBg: 'rgba(255, 71, 87, 0.12)',
      navActive: '#ff6b9d',
      buttonSecondary: '#ff6b9d',
      borderActive: '#ff6b9d',
      brandPrimary: '#ff6b9d',
      focusRing: '0 0 0 3px rgba(255, 107, 157, 0.35)',
      todayBg: 'rgba(255, 107, 157, 0.12)',
      weekViewTodayDateColor: '#ff6b9d',
      calendarCurrentDateColor: '#ff6b9d',
      editHover: '#00d9ff',
      text: '#fff0f5',
      textSecondary: '#d4a5b5',
      border: 'rgba(255, 107, 157, 0.15)',
      borderStrong: 'rgba(255, 107, 157, 0.25)',
    },
    light: {
      bg: '#fff5f8',
      panel: '#ffffff',
      panel2: '#fff0f4',
      accent: '#e05080', // Darker pink for readability
      accentHover: '#cc3d6d',
      accent2: 'rgba(224, 80, 128, 0.12)',
      ring: 'rgba(224, 80, 128, 0.35)',
      link: '#0099bb', // Darker blue
      success: '#00a87a',
      warning: '#cc9a30',
      danger: '#cc3040',
      dangerHover: '#b02535',
      successBg: 'rgba(0, 168, 122, 0.1)',
      warningBg: 'rgba(204, 154, 48, 0.1)',
      dangerBg: 'rgba(204, 48, 64, 0.1)',
      navActive: 'rgba(224, 80, 128, 0.2)',
      buttonSecondary: '#e05080',
      borderActive: '#e05080',
      brandPrimary: '#e05080',
      focusRing: '0 0 0 3px rgba(224, 80, 128, 0.3)',
      todayBg: 'rgba(224, 80, 128, 0.1)',
      weekViewTodayDateColor: '#cc3d6d',
      calendarCurrentDateColor: '#e05080',
      editHover: '#0099bb',
      text: '#2a1a20',
      textSecondary: '#6a4a55',
      border: 'rgba(224, 80, 128, 0.15)',
      borderStrong: 'rgba(224, 80, 128, 0.25)',
    },
  },
  borderRadius: 'md',
  shadowStyle: 'soft',
  backgroundPattern: 'waves',
  borderWidth: 'thin',
};

/**
 * Default theme (no visual changes)
 */
const defaultTheme: VisualTheme = {
  id: 'default',
  name: 'Default',
  description: 'Clean and minimal, uses your college colors',
  colors: {
    dark: {},
    light: {},
  },
  borderRadius: 'md',
  shadowStyle: 'soft',
  backgroundPattern: null,
};

/**
 * All available visual themes
 */
/**
 * Nature Theme
 * Green accent on warm brown backgrounds, calming forest vibes
 * Organic, peaceful, grounded aesthetic
 */
const natureTheme: VisualTheme = {
  id: 'nature',
  name: 'Nature',
  description: 'Forest green on warm earthy tones',
  colors: {
    dark: {
      bg: '#12100d',
      panel: '#1e1914',
      panel2: '#17130f',
      accent: '#3d8c3d', // Darker forest green
      accentHover: '#337533',
      accent2: 'rgba(61, 140, 61, 0.12)',
      ring: 'rgba(61, 140, 61, 0.4)',
      link: '#c9a66b', // Warm tan for links
      success: '#3d8c3d',
      warning: '#daa520', // Goldenrod
      danger: '#cd5c5c', // Indian red
      dangerHover: '#b84c4c',
      successBg: 'rgba(61, 140, 61, 0.12)',
      warningBg: 'rgba(218, 165, 32, 0.12)',
      dangerBg: 'rgba(205, 92, 92, 0.12)',
      navActive: '#3d8c3d',
      buttonSecondary: '#3d8c3d',
      borderActive: '#3d8c3d',
      brandPrimary: '#3d8c3d',
      focusRing: '0 0 0 3px rgba(61, 140, 61, 0.35)',
      todayBg: 'rgba(61, 140, 61, 0.12)',
      weekViewTodayDateColor: '#3d8c3d',
      calendarCurrentDateColor: '#3d8c3d',
      editHover: '#c9a66b',
      text: '#ebe5dc',
      textSecondary: '#a89a8a',
      border: 'rgba(139, 115, 85, 0.2)',
      borderStrong: 'rgba(139, 115, 85, 0.3)',
    },
    light: {
      bg: '#faf6f0',
      panel: '#fffefa',
      panel2: '#f3ebe0',
      accent: '#4aa64b', // Lighter forest green
      accentHover: '#3d9640',
      accent2: 'rgba(74, 166, 75, 0.1)',
      ring: 'rgba(74, 166, 75, 0.35)',
      link: '#8b6914', // Warm brown for links
      success: '#4aa64b',
      warning: '#b8860b',
      danger: '#a94442',
      dangerHover: '#8c3836',
      successBg: 'rgba(74, 166, 75, 0.1)',
      warningBg: 'rgba(184, 134, 11, 0.1)',
      dangerBg: 'rgba(169, 68, 66, 0.1)',
      navActive: 'rgba(74, 166, 75, 0.15)',
      buttonSecondary: '#4aa64b',
      borderActive: '#4aa64b',
      brandPrimary: '#4aa64b',
      focusRing: '0 0 0 3px rgba(74, 166, 75, 0.3)',
      todayBg: 'rgba(74, 166, 75, 0.1)',
      weekViewTodayDateColor: '#3d9640',
      calendarCurrentDateColor: '#4aa64b',
      editHover: '#8b6914',
      text: '#2a2418',
      textSecondary: '#5c5245',
      border: 'rgba(139, 115, 85, 0.15)',
      borderStrong: 'rgba(139, 115, 85, 0.25)',
    },
  },
  borderRadius: 'lg',
  shadowStyle: 'soft',
  backgroundPattern: null,
  borderWidth: 'thin',
};

/**
 * Ocean Theme
 * Deep blues and teals, calming waves, coastal vibes
 * Serene, peaceful, flowing aesthetic
 */
const oceanTheme: VisualTheme = {
  id: 'ocean',
  name: 'Ocean',
  description: 'Deep blues and calming coastal vibes',
  colors: {
    dark: {
      bg: '#0a1015',
      panel: '#121a22',
      panel2: '#0e151c',
      accent: '#3b9ebe', // Ocean blue
      accentHover: '#2d8aaa',
      accent2: 'rgba(59, 158, 190, 0.12)',
      ring: 'rgba(59, 158, 190, 0.4)',
      link: '#6bcfb5', // Sea foam green
      success: '#4ecba0',
      warning: '#e8b84a', // Sandy gold
      danger: '#e57373',
      dangerHover: '#d45f5f',
      successBg: 'rgba(78, 203, 160, 0.12)',
      warningBg: 'rgba(232, 184, 74, 0.12)',
      dangerBg: 'rgba(229, 115, 115, 0.12)',
      navActive: '#3b9ebe',
      buttonSecondary: '#3b9ebe',
      borderActive: '#3b9ebe',
      brandPrimary: '#3b9ebe',
      focusRing: '0 0 0 3px rgba(59, 158, 190, 0.35)',
      todayBg: 'rgba(59, 158, 190, 0.12)',
      weekViewTodayDateColor: '#3b9ebe',
      calendarCurrentDateColor: '#3b9ebe',
      editHover: '#6bcfb5',
      text: '#e0eaf0',
      textSecondary: '#8aa8b8',
      border: 'rgba(59, 158, 190, 0.15)',
      borderStrong: 'rgba(59, 158, 190, 0.25)',
    },
    light: {
      bg: '#f0f7fa',
      panel: '#ffffff',
      panel2: '#e5f0f5',
      accent: '#4db0d4', // Lighter ocean blue
      accentHover: '#3a9cc0',
      accent2: 'rgba(77, 176, 212, 0.1)',
      ring: 'rgba(77, 176, 212, 0.35)',
      link: '#1a8a6e',
      success: '#1a8a6e',
      warning: '#b58a20',
      danger: '#c54545',
      dangerHover: '#a83838',
      successBg: 'rgba(26, 138, 110, 0.1)',
      warningBg: 'rgba(181, 138, 32, 0.1)',
      dangerBg: 'rgba(197, 69, 69, 0.1)',
      navActive: 'rgba(77, 176, 212, 0.15)',
      buttonSecondary: '#4db0d4',
      borderActive: '#4db0d4',
      brandPrimary: '#4db0d4',
      focusRing: '0 0 0 3px rgba(77, 176, 212, 0.3)',
      todayBg: 'rgba(77, 176, 212, 0.1)',
      weekViewTodayDateColor: '#3a9cc0',
      calendarCurrentDateColor: '#4db0d4',
      editHover: '#1a8a6e',
      text: '#152530',
      textSecondary: '#456070',
      border: 'rgba(26, 122, 156, 0.12)',
      borderStrong: 'rgba(26, 122, 156, 0.2)',
    },
  },
  borderRadius: 'md',
  shadowStyle: 'soft',
  backgroundPattern: 'waves',
  borderWidth: 'thin',
};

/**
 * Lavender Theme
 * Soft purples and pinks, dreamy and ethereal
 * Calm, gentle, soothing aesthetic
 */
const lavenderTheme: VisualTheme = {
  id: 'lavender',
  name: 'Lavender',
  description: 'Soft purples and dreamy vibes',
  colors: {
    dark: {
      bg: '#12101a',
      panel: '#1c1826',
      panel2: '#16131f',
      accent: '#a78bfa', // Soft lavender
      accentHover: '#9775f0',
      accent2: 'rgba(167, 139, 250, 0.12)',
      ring: 'rgba(167, 139, 250, 0.4)',
      link: '#f0abfc', // Soft pink
      success: '#86efac',
      warning: '#fcd34d',
      danger: '#fca5a5',
      dangerHover: '#f87171',
      successBg: 'rgba(134, 239, 172, 0.12)',
      warningBg: 'rgba(252, 211, 77, 0.12)',
      dangerBg: 'rgba(252, 165, 165, 0.12)',
      navActive: '#a78bfa',
      buttonSecondary: '#a78bfa',
      borderActive: '#a78bfa',
      brandPrimary: '#a78bfa',
      focusRing: '0 0 0 3px rgba(167, 139, 250, 0.35)',
      todayBg: 'rgba(167, 139, 250, 0.12)',
      weekViewTodayDateColor: '#a78bfa',
      calendarCurrentDateColor: '#a78bfa',
      editHover: '#f0abfc',
      text: '#ede9fe',
      textSecondary: '#a5a0c0',
      border: 'rgba(167, 139, 250, 0.15)',
      borderStrong: 'rgba(167, 139, 250, 0.25)',
    },
    light: {
      bg: '#faf8ff',
      panel: '#ffffff',
      panel2: '#f3f0ff',
      accent: '#a78bfa', // Soft lavender (lighter)
      accentHover: '#9775f0',
      accent2: 'rgba(167, 139, 250, 0.1)',
      ring: 'rgba(167, 139, 250, 0.35)',
      link: '#c026d3',
      success: '#16a34a',
      warning: '#ca8a04',
      danger: '#dc2626',
      dangerHover: '#b91c1c',
      successBg: 'rgba(22, 163, 74, 0.1)',
      warningBg: 'rgba(202, 138, 4, 0.1)',
      dangerBg: 'rgba(220, 38, 38, 0.1)',
      navActive: 'rgba(167, 139, 250, 0.15)',
      buttonSecondary: '#a78bfa',
      borderActive: '#a78bfa',
      brandPrimary: '#a78bfa',
      focusRing: '0 0 0 3px rgba(167, 139, 250, 0.3)',
      todayBg: 'rgba(167, 139, 250, 0.1)',
      weekViewTodayDateColor: '#9775f0',
      calendarCurrentDateColor: '#a78bfa',
      editHover: '#c026d3',
      text: '#1e1b2e',
      textSecondary: '#5b5675',
      border: 'rgba(124, 58, 237, 0.12)',
      borderStrong: 'rgba(124, 58, 237, 0.2)',
    },
  },
  borderRadius: 'lg',
  shadowStyle: 'soft',
  backgroundPattern: null,
  borderWidth: 'thin',
};

/**
 * Space Theme
 * Deep cosmic purples and blues, stars, orbital vibes
 * Perfect for College Orbit - celestial and expansive
 */
const spaceTheme: VisualTheme = {
  id: 'space',
  name: 'Space',
  description: 'Cosmic depths and stellar vibes',
  colors: {
    dark: {
      bg: '#08080f',
      panel: '#10101a',
      panel2: '#0c0c14',
      accent: '#7c6cf0', // Cosmic purple
      accentHover: '#6a5ce0',
      accent2: 'rgba(124, 108, 240, 0.12)',
      ring: 'rgba(124, 108, 240, 0.4)',
      link: '#50c8f0', // Nebula blue
      success: '#50e0a0',
      warning: '#f0c060',
      danger: '#f06080',
      dangerHover: '#e04060',
      successBg: 'rgba(80, 224, 160, 0.12)',
      warningBg: 'rgba(240, 192, 96, 0.12)',
      dangerBg: 'rgba(240, 96, 128, 0.12)',
      navActive: '#7c6cf0',
      buttonSecondary: '#7c6cf0',
      borderActive: '#7c6cf0',
      brandPrimary: '#7c6cf0',
      focusRing: '0 0 0 3px rgba(124, 108, 240, 0.35)',
      todayBg: 'rgba(124, 108, 240, 0.12)',
      weekViewTodayDateColor: '#7c6cf0',
      calendarCurrentDateColor: '#7c6cf0',
      editHover: '#50c8f0',
      text: '#e8e8f8',
      textSecondary: '#9090b0',
      border: 'rgba(124, 108, 240, 0.15)',
      borderStrong: 'rgba(124, 108, 240, 0.25)',
    },
    light: {
      bg: '#f5f5fa',
      panel: '#ffffff',
      panel2: '#ededf5',
      accent: '#8a7cf0', // Lighter cosmic purple
      accentHover: '#7a6ce0',
      accent2: 'rgba(138, 124, 240, 0.1)',
      ring: 'rgba(138, 124, 240, 0.35)',
      link: '#2090b0',
      success: '#20a070',
      warning: '#c09030',
      danger: '#c04060',
      dangerHover: '#a03050',
      successBg: 'rgba(32, 160, 112, 0.1)',
      warningBg: 'rgba(192, 144, 48, 0.1)',
      dangerBg: 'rgba(192, 64, 96, 0.1)',
      navActive: 'rgba(138, 124, 240, 0.15)',
      buttonSecondary: '#8a7cf0',
      borderActive: '#8a7cf0',
      brandPrimary: '#8a7cf0',
      focusRing: '0 0 0 3px rgba(138, 124, 240, 0.3)',
      todayBg: 'rgba(138, 124, 240, 0.1)',
      weekViewTodayDateColor: '#7a6ce0',
      calendarCurrentDateColor: '#8a7cf0',
      editHover: '#2090b0',
      text: '#1a1a2a',
      textSecondary: '#5a5a70',
      border: 'rgba(90, 74, 208, 0.12)',
      borderStrong: 'rgba(90, 74, 208, 0.2)',
    },
  },
  borderRadius: 'md',
  shadowStyle: 'soft',
  backgroundPattern: null,
  borderWidth: 'thin',
};

/**
 * Aquarium Theme
 * Underwater world with swimming fish, bubbles, coral, and caustic light effects
 * Calming, mesmerizing, oceanic depths
 */
const aquariumTheme: VisualTheme = {
  id: 'aquarium',
  name: 'Aquarium',
  description: 'Underwater world with swimming fish',
  colors: {
    dark: {
      bg: '#061018',
      panel: 'rgba(10, 24, 32, 0.72)',
      panel2: 'rgba(8, 20, 24, 0.62)',
      accent: '#00b8d4', // Tropical cyan
      accentHover: '#00a0b8',
      accent2: 'rgba(0, 184, 212, 0.12)',
      ring: 'rgba(0, 184, 212, 0.4)',
      link: '#ff7f50', // Coral orange
      success: '#00e5a0', // Sea foam
      warning: '#ffd700', // Golden fish
      danger: '#ff6b6b', // Red coral
      dangerHover: '#ff5252',
      successBg: 'rgba(0, 229, 160, 0.12)',
      warningBg: 'rgba(255, 215, 0, 0.12)',
      dangerBg: 'rgba(255, 107, 107, 0.12)',
      navActive: '#00b8d4',
      buttonSecondary: '#00b8d4',
      borderActive: '#00b8d4',
      brandPrimary: '#00b8d4',
      focusRing: '0 0 0 3px rgba(0, 184, 212, 0.35)',
      todayBg: 'rgba(0, 184, 212, 0.12)',
      weekViewTodayDateColor: '#00b8d4',
      calendarCurrentDateColor: '#00b8d4',
      editHover: '#ff7f50',
      text: '#e0f4f8',
      textSecondary: '#8ab8c8',
      border: 'rgba(0, 184, 212, 0.15)',
      borderStrong: 'rgba(0, 184, 212, 0.25)',
    },
    light: {
      bg: '#f0f8fa',
      panel: 'rgba(255, 255, 255, 0.72)',
      panel2: 'rgba(232, 244, 248, 0.62)',
      accent: '#00a0b8', // Darker cyan for readability
      accentHover: '#008899',
      accent2: 'rgba(0, 160, 184, 0.1)',
      ring: 'rgba(0, 160, 184, 0.35)',
      link: '#e06030', // Darker coral
      success: '#00a87a',
      warning: '#c8a000',
      danger: '#d04040',
      dangerHover: '#b03030',
      successBg: 'rgba(0, 168, 122, 0.1)',
      warningBg: 'rgba(200, 160, 0, 0.1)',
      dangerBg: 'rgba(208, 64, 64, 0.1)',
      navActive: 'rgba(0, 160, 184, 0.15)',
      buttonSecondary: '#00a0b8',
      borderActive: '#00a0b8',
      brandPrimary: '#00a0b8',
      focusRing: '0 0 0 3px rgba(0, 160, 184, 0.3)',
      todayBg: 'rgba(0, 160, 184, 0.1)',
      weekViewTodayDateColor: '#008899',
      calendarCurrentDateColor: '#00a0b8',
      editHover: '#e06030',
      text: '#0a2830',
      textSecondary: '#3a6878',
      border: 'rgba(0, 120, 140, 0.12)',
      borderStrong: 'rgba(0, 120, 140, 0.2)',
    },
  },
  borderRadius: 'lg',
  shadowStyle: 'soft',
  backgroundPattern: null,
  borderWidth: 'thin',
};

/**
 * Pixel/Retro Gaming Theme
 * 8-bit aesthetic with bold colors, blocky shapes, and nostalgic vibes
 * Think classic NES/SNES games
 */
const pixelTheme: VisualTheme = {
  id: 'pixel',
  name: 'Pixel',
  description: '8-bit retro gaming vibes',
  colors: {
    dark: {
      bg: '#0f0f1a',
      panel: '#1a1a2e',
      panel2: '#141425',
      accent: '#ff5a5a', // Classic red (like Mario)
      accentHover: '#ff3a3a',
      accent2: 'rgba(255, 90, 90, 0.15)',
      ring: 'rgba(255, 90, 90, 0.4)',
      link: '#5aff5a', // Classic green (1-up)
      success: '#5aff5a', // Green
      warning: '#ffff5a', // Yellow (coins)
      danger: '#ff5a5a', // Red
      dangerHover: '#ff3a3a',
      successBg: 'rgba(90, 255, 90, 0.12)',
      warningBg: 'rgba(255, 255, 90, 0.12)',
      dangerBg: 'rgba(255, 90, 90, 0.12)',
      navActive: '#ff5a5a',
      buttonSecondary: '#ff5a5a',
      borderActive: '#ff5a5a',
      brandPrimary: '#ff5a5a',
      focusRing: '0 0 0 3px rgba(255, 90, 90, 0.35)',
      todayBg: 'rgba(255, 90, 90, 0.12)',
      weekViewTodayDateColor: '#ff5a5a',
      calendarCurrentDateColor: '#ff5a5a',
      editHover: '#5aff5a',
      text: '#e8e8ff',
      textSecondary: '#9090b0',
      border: 'rgba(255, 90, 90, 0.2)',
      borderStrong: 'rgba(255, 90, 90, 0.3)',
    },
    light: {
      bg: '#f5f5ff',
      panel: '#ffffff',
      panel2: '#ededff',
      accent: '#e04040', // Slightly darker red for readability
      accentHover: '#c83030',
      accent2: 'rgba(224, 64, 64, 0.1)',
      ring: 'rgba(224, 64, 64, 0.35)',
      link: '#20a020',
      success: '#20a020',
      warning: '#c0a000',
      danger: '#e04040',
      dangerHover: '#c83030',
      successBg: 'rgba(32, 160, 32, 0.1)',
      warningBg: 'rgba(192, 160, 0, 0.1)',
      dangerBg: 'rgba(224, 64, 64, 0.1)',
      navActive: 'rgba(224, 64, 64, 0.15)',
      buttonSecondary: '#e04040',
      borderActive: '#e04040',
      brandPrimary: '#e04040',
      focusRing: '0 0 0 3px rgba(224, 64, 64, 0.3)',
      todayBg: 'rgba(224, 64, 64, 0.1)',
      weekViewTodayDateColor: '#c83030',
      calendarCurrentDateColor: '#e04040',
      editHover: '#20a020',
      text: '#1a1a2e',
      textSecondary: '#5050a0',
      border: 'rgba(224, 64, 64, 0.15)',
      borderStrong: 'rgba(224, 64, 64, 0.25)',
    },
  },
  borderRadius: 'sm', // Blocky/sharp corners for pixel look
  shadowStyle: 'none', // Flat, no shadows for retro feel
  backgroundPattern: null,
  borderWidth: 'medium',
};

/**
 * Cozy/Cottagecore Theme
 * Warm, inviting atmosphere with fireflies, falling leaves, and candlelight
 * Nostalgic, peaceful, homey vibes
 */
const cozyTheme: VisualTheme = {
  id: 'cozy',
  name: 'Cozy',
  description: 'Warm candlelight & fireflies',
  colors: {
    dark: {
      bg: '#1a1410',
      panel: 'rgba(36, 32, 26, 0.93)',
      panel2: 'rgba(30, 26, 20, 0.88)',
      accent: '#e8a854', // Warm amber/honey
      accentHover: '#d49540',
      accent2: 'rgba(232, 168, 84, 0.12)',
      ring: 'rgba(232, 168, 84, 0.4)',
      link: '#c4785a', // Warm terracotta
      success: '#7cb37c', // Sage green
      warning: '#e8a854', // Amber
      danger: '#c45c4a', // Brick red
      dangerHover: '#a84a3a',
      successBg: 'rgba(124, 179, 124, 0.12)',
      warningBg: 'rgba(232, 168, 84, 0.12)',
      dangerBg: 'rgba(196, 92, 74, 0.12)',
      navActive: '#e8a854',
      buttonSecondary: '#e8a854',
      borderActive: '#e8a854',
      brandPrimary: '#e8a854',
      focusRing: '0 0 0 3px rgba(232, 168, 84, 0.35)',
      todayBg: 'rgba(232, 168, 84, 0.12)',
      weekViewTodayDateColor: '#e8a854',
      calendarCurrentDateColor: '#e8a854',
      editHover: '#c4785a',
      text: '#f0e6d8',
      textSecondary: '#b8a890',
      border: 'rgba(232, 168, 84, 0.15)',
      borderStrong: 'rgba(232, 168, 84, 0.25)',
    },
    light: {
      bg: '#faf6f0',
      panel: 'rgba(255, 252, 247, 0.93)',
      panel2: 'rgba(245, 239, 229, 0.88)',
      accent: '#c88a3a', // Darker amber for readability
      accentHover: '#b07830',
      accent2: 'rgba(200, 138, 58, 0.1)',
      ring: 'rgba(200, 138, 58, 0.35)',
      link: '#a0604a', // Darker terracotta
      success: '#5a8a5a',
      warning: '#c88a3a',
      danger: '#a84a3a',
      dangerHover: '#8a3a2a',
      successBg: 'rgba(90, 138, 90, 0.1)',
      warningBg: 'rgba(200, 138, 58, 0.1)',
      dangerBg: 'rgba(168, 74, 58, 0.1)',
      navActive: 'rgba(200, 138, 58, 0.15)',
      buttonSecondary: '#c88a3a',
      borderActive: '#c88a3a',
      brandPrimary: '#c88a3a',
      focusRing: '0 0 0 3px rgba(200, 138, 58, 0.3)',
      todayBg: 'rgba(200, 138, 58, 0.1)',
      weekViewTodayDateColor: '#b07830',
      calendarCurrentDateColor: '#c88a3a',
      editHover: '#a0604a',
      text: '#3a3025',
      textSecondary: '#6a5a48',
      border: 'rgba(160, 120, 60, 0.15)',
      borderStrong: 'rgba(160, 120, 60, 0.25)',
    },
  },
  borderRadius: 'lg',
  shadowStyle: 'soft',
  backgroundPattern: null,
  borderWidth: 'thin',
};

/**
 * Winter/Snow Theme
 * Falling snowflakes, frosted glass panels, icy blues, aurora borealis
 * Serene, magical, peaceful winter wonderland
 */
const winterTheme: VisualTheme = {
  id: 'winter',
  name: 'Winter',
  description: 'Snowflakes & aurora borealis',
  colors: {
    dark: {
      bg: '#0a1018',
      panel: 'rgba(20, 35, 50, 0.85)', // Frosted glass effect
      panel2: 'rgba(15, 28, 42, 0.8)',
      accent: '#7dd3fc', // Icy light blue
      accentHover: '#60c5f8',
      accent2: 'rgba(125, 211, 252, 0.12)',
      ring: 'rgba(125, 211, 252, 0.4)',
      link: '#a5f3fc', // Cyan/teal
      success: '#6ee7b7', // Mint green (aurora)
      warning: '#fcd34d', // Warm yellow
      danger: '#fca5a5', // Soft red
      dangerHover: '#f87171',
      successBg: 'rgba(110, 231, 183, 0.12)',
      warningBg: 'rgba(252, 211, 77, 0.12)',
      dangerBg: 'rgba(252, 165, 165, 0.12)',
      navActive: '#7dd3fc',
      buttonSecondary: '#7dd3fc',
      borderActive: '#7dd3fc',
      brandPrimary: '#7dd3fc',
      focusRing: '0 0 0 3px rgba(125, 211, 252, 0.35)',
      todayBg: 'rgba(125, 211, 252, 0.12)',
      weekViewTodayDateColor: '#7dd3fc',
      calendarCurrentDateColor: '#7dd3fc',
      editHover: '#a5f3fc',
      text: '#e8f4f8',
      textSecondary: '#94b8c8',
      border: 'rgba(125, 211, 252, 0.15)',
      borderStrong: 'rgba(125, 211, 252, 0.25)',
    },
    light: {
      bg: '#f0f8ff',
      panel: 'rgba(255, 255, 255, 0.9)', // Frosted glass
      panel2: 'rgba(240, 248, 255, 0.85)',
      accent: '#0891b2', // Darker cyan for readability
      accentHover: '#0e7490',
      accent2: 'rgba(8, 145, 178, 0.1)',
      ring: 'rgba(8, 145, 178, 0.35)',
      link: '#0e7490',
      success: '#059669',
      warning: '#d97706',
      danger: '#dc2626',
      dangerHover: '#b91c1c',
      successBg: 'rgba(5, 150, 105, 0.1)',
      warningBg: 'rgba(217, 119, 6, 0.1)',
      dangerBg: 'rgba(220, 38, 38, 0.1)',
      navActive: 'rgba(8, 145, 178, 0.15)',
      buttonSecondary: '#0891b2',
      borderActive: '#0891b2',
      brandPrimary: '#0891b2',
      focusRing: '0 0 0 3px rgba(8, 145, 178, 0.3)',
      todayBg: 'rgba(8, 145, 178, 0.1)',
      weekViewTodayDateColor: '#0e7490',
      calendarCurrentDateColor: '#0891b2',
      editHover: '#0e7490',
      text: '#0c4a6e',
      textSecondary: '#475569',
      border: 'rgba(8, 145, 178, 0.12)',
      borderStrong: 'rgba(8, 145, 178, 0.2)',
    },
  },
  borderRadius: 'lg',
  shadowStyle: 'soft',
  backgroundPattern: null,
  borderWidth: 'thin',
};

/**
 * Sakura Theme
 * Cherry blossom petals drifting, soft pinks, Japanese-inspired aesthetic
 * Serene, elegant, springtime beauty
 */
const sakuraTheme: VisualTheme = {
  id: 'sakura',
  name: 'Sakura',
  description: 'Cherry blossoms & soft pinks',
  colors: {
    dark: {
      bg: '#1a1218',
      panel: 'rgba(36, 28, 34, 0.96)',
      panel2: 'rgba(30, 24, 28, 0.92)',
      accent: '#f9a8d4', // Soft cherry blossom pink
      accentHover: '#f472b6',
      accent2: 'rgba(249, 168, 212, 0.12)',
      ring: 'rgba(249, 168, 212, 0.4)',
      link: '#fda4af', // Rose pink
      success: '#86efac', // Soft green (new leaves)
      warning: '#fcd34d',
      danger: '#fca5a5',
      dangerHover: '#f87171',
      successBg: 'rgba(134, 239, 172, 0.12)',
      warningBg: 'rgba(252, 211, 77, 0.12)',
      dangerBg: 'rgba(252, 165, 165, 0.12)',
      navActive: '#f9a8d4',
      buttonSecondary: '#f9a8d4',
      borderActive: '#f9a8d4',
      brandPrimary: '#f9a8d4',
      focusRing: '0 0 0 3px rgba(249, 168, 212, 0.35)',
      todayBg: 'rgba(249, 168, 212, 0.12)',
      weekViewTodayDateColor: '#f9a8d4',
      calendarCurrentDateColor: '#f9a8d4',
      editHover: '#fda4af',
      text: '#fce7f3',
      textSecondary: '#d4a5b5',
      border: 'rgba(249, 168, 212, 0.15)',
      borderStrong: 'rgba(249, 168, 212, 0.25)',
    },
    light: {
      bg: '#fff5f7',
      panel: 'rgba(255, 255, 255, 0.96)',
      panel2: 'rgba(255, 240, 243, 0.92)',
      accent: '#ec4899', // Vibrant pink for readability
      accentHover: '#db2777',
      accent2: 'rgba(236, 72, 153, 0.1)',
      ring: 'rgba(236, 72, 153, 0.35)',
      link: '#be185d',
      success: '#16a34a',
      warning: '#ca8a04',
      danger: '#dc2626',
      dangerHover: '#b91c1c',
      successBg: 'rgba(22, 163, 74, 0.1)',
      warningBg: 'rgba(202, 138, 4, 0.1)',
      dangerBg: 'rgba(220, 38, 38, 0.1)',
      navActive: 'rgba(236, 72, 153, 0.15)',
      buttonSecondary: '#ec4899',
      borderActive: '#ec4899',
      brandPrimary: '#ec4899',
      focusRing: '0 0 0 3px rgba(236, 72, 153, 0.3)',
      todayBg: 'rgba(236, 72, 153, 0.1)',
      weekViewTodayDateColor: '#db2777',
      calendarCurrentDateColor: '#ec4899',
      editHover: '#be185d',
      text: '#4a1a2c',
      textSecondary: '#7a4a5a',
      border: 'rgba(236, 72, 153, 0.12)',
      borderStrong: 'rgba(236, 72, 153, 0.2)',
    },
  },
  borderRadius: 'lg',
  shadowStyle: 'soft',
  backgroundPattern: null,
  borderWidth: 'thin',
};

/**
 * Halloween Theme
 * Bats flying, jack-o-lanterns, cobwebs, spooky orange/purple
 * Creepy, fun, festive autumn vibes
 */
const halloweenTheme: VisualTheme = {
  id: 'halloween',
  name: 'Halloween',
  description: 'Bats, pumpkins & cobwebs',
  colors: {
    dark: {
      bg: '#0d0a0f',
      panel: '#1a1420',
      panel2: '#14101a',
      accent: '#ff6b00', // Pumpkin orange
      accentHover: '#e55f00',
      accent2: 'rgba(255, 107, 0, 0.12)',
      ring: 'rgba(255, 107, 0, 0.4)',
      link: '#9b59b6', // Witch purple
      success: '#27ae60', // Slime green
      warning: '#ff6b00',
      danger: '#c0392b', // Blood red
      dangerHover: '#a93226',
      successBg: 'rgba(39, 174, 96, 0.12)',
      warningBg: 'rgba(255, 107, 0, 0.12)',
      dangerBg: 'rgba(192, 57, 43, 0.12)',
      navActive: '#ff6b00',
      buttonSecondary: '#ff6b00',
      borderActive: '#ff6b00',
      brandPrimary: '#ff6b00',
      focusRing: '0 0 0 3px rgba(255, 107, 0, 0.35)',
      todayBg: 'rgba(255, 107, 0, 0.12)',
      weekViewTodayDateColor: '#ff6b00',
      calendarCurrentDateColor: '#ff6b00',
      editHover: '#9b59b6',
      text: '#f0e6d3',
      textSecondary: '#a89580',
      border: 'rgba(255, 107, 0, 0.15)',
      borderStrong: 'rgba(255, 107, 0, 0.25)',
    },
    light: {
      bg: '#faf5f0',
      panel: '#ffffff',
      panel2: '#f5efe8',
      accent: '#f57c00', // Bright pumpkin orange
      accentHover: '#e65100',
      accent2: 'rgba(245, 124, 0, 0.12)',
      ring: 'rgba(245, 124, 0, 0.35)',
      link: '#8e44ad',
      success: '#1e8449',
      warning: '#f57c00',
      danger: '#c0392b',
      dangerHover: '#a93226',
      successBg: 'rgba(30, 132, 73, 0.1)',
      warningBg: 'rgba(245, 124, 0, 0.1)',
      dangerBg: 'rgba(192, 57, 43, 0.1)',
      navActive: 'rgba(245, 124, 0, 0.15)',
      buttonSecondary: '#f57c00',
      borderActive: '#f57c00',
      brandPrimary: '#f57c00',
      focusRing: '0 0 0 3px rgba(245, 124, 0, 0.3)',
      todayBg: 'rgba(245, 124, 0, 0.1)',
      weekViewTodayDateColor: '#e65100',
      calendarCurrentDateColor: '#f57c00',
      editHover: '#8e44ad',
      text: '#2a1f14',
      textSecondary: '#5a4a3a',
      border: 'rgba(245, 124, 0, 0.12)',
      borderStrong: 'rgba(245, 124, 0, 0.2)',
    },
  },
  borderRadius: 'md',
  shadowStyle: 'bold',
  backgroundPattern: null,
  borderWidth: 'medium',
};

/**
 * Terminal/Hacker Theme
 * Green text on black, matrix rain, monospace font, command prompt aesthetic
 * Cyberpunk hacker vibes, retro terminal feel
 */
const terminalTheme: VisualTheme = {
  id: 'terminal',
  name: 'Terminal',
  description: 'Matrix rain & hacker vibes',
  colors: {
    dark: {
      bg: '#000000',
      panel: '#0a0a0a',
      panel2: '#050505',
      accent: '#4ade80', // Soft matrix green
      accentHover: '#3fcf70',
      accent2: 'rgba(74, 222, 128, 0.12)',
      ring: 'rgba(74, 222, 128, 0.4)',
      link: '#67e8f9', // Soft cyan
      success: '#4ade80',
      warning: '#fde047', // Soft yellow
      danger: '#f87171', // Soft red
      dangerHover: '#ef4444',
      successBg: 'rgba(74, 222, 128, 0.1)',
      warningBg: 'rgba(253, 224, 71, 0.1)',
      dangerBg: 'rgba(248, 113, 113, 0.1)',
      navActive: '#4ade80',
      buttonSecondary: '#4ade80',
      borderActive: '#4ade80',
      brandPrimary: '#4ade80',
      focusRing: '0 0 0 3px rgba(74, 222, 128, 0.35)',
      todayBg: 'rgba(74, 222, 128, 0.1)',
      weekViewTodayDateColor: '#4ade80',
      calendarCurrentDateColor: '#4ade80',
      editHover: '#67e8f9',
      text: '#d1fae5', // Soft mint green for readability
      textSecondary: '#86efac', // Muted green
      border: 'rgba(74, 222, 128, 0.2)',
      borderStrong: 'rgba(74, 222, 128, 0.3)',
    },
    light: {
      bg: '#f0fff0',
      panel: '#ffffff',
      panel2: '#e8ffe8',
      accent: '#008800', // Dark green for readability
      accentHover: '#006600',
      accent2: 'rgba(0, 136, 0, 0.1)',
      ring: 'rgba(0, 136, 0, 0.35)',
      link: '#006666',
      success: '#008800',
      warning: '#888800',
      danger: '#880000',
      dangerHover: '#660000',
      successBg: 'rgba(0, 136, 0, 0.1)',
      warningBg: 'rgba(136, 136, 0, 0.1)',
      dangerBg: 'rgba(136, 0, 0, 0.1)',
      navActive: 'rgba(0, 136, 0, 0.15)',
      buttonSecondary: '#008800',
      borderActive: '#008800',
      brandPrimary: '#008800',
      focusRing: '0 0 0 3px rgba(0, 136, 0, 0.3)',
      todayBg: 'rgba(0, 136, 0, 0.1)',
      weekViewTodayDateColor: '#006600',
      calendarCurrentDateColor: '#008800',
      editHover: '#006666',
      text: '#004400',
      textSecondary: '#006600',
      border: 'rgba(0, 136, 0, 0.15)',
      borderStrong: 'rgba(0, 136, 0, 0.25)',
    },
  },
  borderRadius: 'sm',
  shadowStyle: 'none',
  backgroundPattern: null,
  borderWidth: 'thin',
};

/**
 * Paper/Notebook Theme
 * Lined paper background, handwritten font, pencil doodle decorations
 * Feels like a physical planner or notebook
 */
const paperTheme: VisualTheme = {
  id: 'paper',
  name: 'Paper',
  description: 'Notebook vibes with lined paper',
  colors: {
    dark: {
      bg: '#1a1816', // Dark warm brown
      panel: '#242220',
      panel2: '#1e1c1a',
      accent: '#3b82f6', // Blue ink/pen
      accentHover: '#2563eb',
      accent2: 'rgba(59, 130, 246, 0.15)',
      ring: 'rgba(59, 130, 246, 0.4)',
      link: '#60a5fa', // Light blue
      success: '#22c55e',
      warning: '#eab308', // Yellow highlighter
      danger: '#ef4444', // Red pen
      dangerHover: '#dc2626',
      successBg: 'rgba(34, 197, 94, 0.12)',
      warningBg: 'rgba(234, 179, 8, 0.15)',
      dangerBg: 'rgba(239, 68, 68, 0.12)',
      navActive: '#3b82f6',
      buttonSecondary: '#3b82f6',
      borderActive: '#3b82f6',
      brandPrimary: '#3b82f6',
      focusRing: '0 0 0 3px rgba(59, 130, 246, 0.35)',
      todayBg: 'rgba(59, 130, 246, 0.15)',
      weekViewTodayDateColor: '#3b82f6',
      calendarCurrentDateColor: '#3b82f6',
      editHover: '#60a5fa',
      text: '#f5f5f4', // Warm white
      textSecondary: '#a8a29e',
      border: 'rgba(255, 255, 255, 0.1)',
      borderStrong: 'rgba(255, 255, 255, 0.15)',
    },
    light: {
      bg: '#f5f0e6', // Actual paper/cream color
      panel: '#faf6ed',
      panel2: '#f0ebe0',
      accent: '#2563eb', // Blue ink
      accentHover: '#1d4ed8',
      accent2: 'rgba(37, 99, 235, 0.1)',
      ring: 'rgba(37, 99, 235, 0.35)',
      link: '#1d4ed8',
      success: '#16a34a',
      warning: '#ca8a04', // Highlighter
      danger: '#dc2626', // Red ink
      dangerHover: '#b91c1c',
      successBg: 'rgba(22, 163, 74, 0.1)',
      warningBg: 'rgba(202, 138, 4, 0.12)',
      dangerBg: 'rgba(220, 38, 38, 0.1)',
      navActive: 'rgba(37, 99, 235, 0.15)',
      buttonSecondary: '#2563eb',
      borderActive: '#2563eb',
      brandPrimary: '#2563eb',
      focusRing: '0 0 0 3px rgba(37, 99, 235, 0.3)',
      todayBg: 'rgba(37, 99, 235, 0.1)',
      weekViewTodayDateColor: '#1d4ed8',
      calendarCurrentDateColor: '#2563eb',
      editHover: '#1d4ed8',
      text: '#1c1917', // Dark brown/black like pencil
      textSecondary: '#57534e',
      border: 'rgba(0, 0, 0, 0.08)',
      borderStrong: 'rgba(0, 0, 0, 0.12)',
    },
  },
  borderRadius: 'sm',
  shadowStyle: 'soft',
  backgroundPattern: null,
};

/**
 * Autumn/Harvest Theme
 * Crisp fall energy with warm oranges, deep reds, golden yellows
 * Falling leaves, harvest vibes, pumpkin spice aesthetic
 */
const autumnTheme: VisualTheme = {
  id: 'autumn',
  name: 'Autumn',
  description: 'Crisp leaves & harvest warmth',
  colors: {
    dark: {
      bg: '#141008',
      panel: '#1e1810',
      panel2: '#18140c',
      accent: '#d4802a', // Warm burnt orange
      accentHover: '#c07020',
      accent2: 'rgba(212, 128, 42, 0.12)',
      ring: 'rgba(212, 128, 42, 0.4)',
      link: '#c44a3f', // Deep crimson red (fall foliage)
      success: '#7a9e3a', // Olive green (still-green leaves)
      warning: '#d4a020', // Golden yellow (turning leaves)
      danger: '#b03030', // Deep red
      dangerHover: '#942525',
      successBg: 'rgba(122, 158, 58, 0.12)',
      warningBg: 'rgba(212, 160, 32, 0.12)',
      dangerBg: 'rgba(176, 48, 48, 0.12)',
      navActive: '#d4802a',
      buttonSecondary: '#d4802a',
      borderActive: '#d4802a',
      brandPrimary: '#d4802a',
      focusRing: '0 0 0 3px rgba(212, 128, 42, 0.35)',
      todayBg: 'rgba(212, 128, 42, 0.12)',
      weekViewTodayDateColor: '#d4802a',
      calendarCurrentDateColor: '#d4802a',
      editHover: '#c44a3f',
      text: '#f0e8d8',
      textSecondary: '#b0a088',
      border: 'rgba(212, 128, 42, 0.15)',
      borderStrong: 'rgba(212, 128, 42, 0.25)',
    },
    light: {
      bg: '#faf5ec',
      panel: '#fffcf6',
      panel2: '#f4ede0',
      accent: '#d88a35', // Warm burnt orange
      accentHover: '#c67a28',
      accent2: 'rgba(216, 138, 53, 0.12)',
      ring: 'rgba(216, 138, 53, 0.35)',
      link: '#a63830', // Darker crimson
      success: '#5c7a28',
      warning: '#b08818',
      danger: '#a02828',
      dangerHover: '#882020',
      successBg: 'rgba(92, 122, 40, 0.1)',
      warningBg: 'rgba(176, 136, 24, 0.1)',
      dangerBg: 'rgba(160, 40, 40, 0.1)',
      navActive: 'rgba(216, 138, 53, 0.18)',
      buttonSecondary: '#d88a35',
      borderActive: '#d88a35',
      brandPrimary: '#d88a35',
      focusRing: '0 0 0 3px rgba(216, 138, 53, 0.3)',
      todayBg: 'rgba(216, 138, 53, 0.12)',
      weekViewTodayDateColor: '#c67a28',
      calendarCurrentDateColor: '#d88a35',
      editHover: '#a63830',
      text: '#2a2015',
      textSecondary: '#6a5840',
      border: 'rgba(160, 100, 30, 0.15)',
      borderStrong: 'rgba(160, 100, 30, 0.25)',
    },
  },
  borderRadius: 'lg',
  shadowStyle: 'soft',
  backgroundPattern: null,
  borderWidth: 'thin',
};

/**
 * Spring Theme
 * Fresh pastels, budding greens, floating butterflies, gentle rain
 * Bright, airy, renewal energy
 */
const springTheme: VisualTheme = {
  id: 'spring',
  name: 'Spring',
  description: 'Butterflies, fresh greens & new blooms',
  colors: {
    dark: {
      bg: '#0a1210',
      panel: 'rgba(18, 30, 26, 0.93)',
      panel2: 'rgba(14, 24, 20, 0.88)',
      accent: '#5cb870', // Fresh spring green
      accentHover: '#4aa860',
      accent2: 'rgba(92, 184, 112, 0.12)',
      ring: 'rgba(92, 184, 112, 0.4)',
      link: '#e090b0', // Soft blossom pink
      success: '#5cb870',
      warning: '#e0c050', // Buttercup yellow
      danger: '#e07070',
      dangerHover: '#cc5858',
      successBg: 'rgba(92, 184, 112, 0.12)',
      warningBg: 'rgba(224, 192, 80, 0.12)',
      dangerBg: 'rgba(224, 112, 112, 0.12)',
      navActive: '#5cb870',
      buttonSecondary: '#5cb870',
      borderActive: '#5cb870',
      brandPrimary: '#5cb870',
      focusRing: '0 0 0 3px rgba(92, 184, 112, 0.35)',
      todayBg: 'rgba(92, 184, 112, 0.12)',
      weekViewTodayDateColor: '#5cb870',
      calendarCurrentDateColor: '#5cb870',
      editHover: '#e090b0',
      text: '#e4f0e8',
      textSecondary: '#90b098',
      border: 'rgba(92, 184, 112, 0.15)',
      borderStrong: 'rgba(92, 184, 112, 0.25)',
    },
    light: {
      bg: '#f4faf5',
      panel: 'rgba(255, 255, 255, 0.93)',
      panel2: 'rgba(237, 247, 239, 0.88)',
      accent: '#4aad5e', // Vibrant spring green
      accentHover: '#3c9a4e',
      accent2: 'rgba(74, 173, 94, 0.1)',
      ring: 'rgba(74, 173, 94, 0.35)',
      link: '#c06088', // Deeper blossom pink
      success: '#3c9a4e',
      warning: '#b89830',
      danger: '#c84848',
      dangerHover: '#a83838',
      successBg: 'rgba(60, 154, 78, 0.1)',
      warningBg: 'rgba(184, 152, 48, 0.1)',
      dangerBg: 'rgba(200, 72, 72, 0.1)',
      navActive: 'rgba(74, 173, 94, 0.15)',
      buttonSecondary: '#4aad5e',
      borderActive: '#4aad5e',
      brandPrimary: '#4aad5e',
      focusRing: '0 0 0 3px rgba(74, 173, 94, 0.3)',
      todayBg: 'rgba(74, 173, 94, 0.1)',
      weekViewTodayDateColor: '#3c9a4e',
      calendarCurrentDateColor: '#4aad5e',
      editHover: '#c06088',
      text: '#1a2e1e',
      textSecondary: '#4a6850',
      border: 'rgba(60, 130, 70, 0.12)',
      borderStrong: 'rgba(60, 130, 70, 0.2)',
    },
  },
  borderRadius: 'lg',
  shadowStyle: 'soft',
  backgroundPattern: null,
  borderWidth: 'thin',
};

/**
 * Noir/Film Noir Theme
 * High contrast black/white with gold accent, dramatic shadows
 * Moody, cinematic, old Hollywood feel
 */
const noirTheme: VisualTheme = {
  id: 'noir',
  name: 'Noir',
  description: 'Cinematic shadows & golden accents',
  colors: {
    dark: {
      bg: '#0a0a0a',
      panel: '#141414',
      panel2: '#0e0e0e',
      accent: '#c8a84a', // Muted gold
      accentHover: '#b89838',
      accent2: 'rgba(200, 168, 74, 0.1)',
      ring: 'rgba(200, 168, 74, 0.35)',
      link: '#c8a84a', // Gold links
      success: '#708070', // Muted sage
      warning: '#c8a84a', // Gold
      danger: '#a04040', // Muted crimson
      dangerHover: '#883030',
      successBg: 'rgba(112, 128, 112, 0.1)',
      warningBg: 'rgba(200, 168, 74, 0.1)',
      dangerBg: 'rgba(160, 64, 64, 0.1)',
      navActive: '#c8a84a',
      buttonSecondary: '#c8a84a',
      borderActive: '#c8a84a',
      brandPrimary: '#c8a84a',
      focusRing: '0 0 0 3px rgba(200, 168, 74, 0.3)',
      todayBg: 'rgba(200, 168, 74, 0.1)',
      weekViewTodayDateColor: '#c8a84a',
      calendarCurrentDateColor: '#c8a84a',
      editHover: '#c8a84a',
      text: '#e8e8e8',
      textSecondary: '#888888',
      border: 'rgba(255, 255, 255, 0.08)',
      borderStrong: 'rgba(255, 255, 255, 0.14)',
    },
    light: {
      bg: '#f0f0ee',
      panel: '#fafaf8',
      panel2: '#e8e8e4',
      accent: '#b09040', // Warm gold
      accentHover: '#9a7e35',
      accent2: 'rgba(176, 144, 64, 0.1)',
      ring: 'rgba(176, 144, 64, 0.3)',
      link: '#b09040',
      success: '#506050',
      warning: '#b09040',
      danger: '#883030',
      dangerHover: '#702525',
      successBg: 'rgba(80, 96, 80, 0.1)',
      warningBg: 'rgba(176, 144, 64, 0.1)',
      dangerBg: 'rgba(136, 48, 48, 0.1)',
      navActive: 'rgba(176, 144, 64, 0.15)',
      buttonSecondary: '#b09040',
      borderActive: '#b09040',
      brandPrimary: '#b09040',
      focusRing: '0 0 0 3px rgba(176, 144, 64, 0.25)',
      todayBg: 'rgba(176, 144, 64, 0.1)',
      weekViewTodayDateColor: '#9a7e35',
      calendarCurrentDateColor: '#b09040',
      editHover: '#b09040',
      text: '#1a1a1a',
      textSecondary: '#5a5a5a',
      border: 'rgba(0, 0, 0, 0.1)',
      borderStrong: 'rgba(0, 0, 0, 0.16)',
    },
  },
  borderRadius: 'sm',
  shadowStyle: 'bold',
  backgroundPattern: null,
  borderWidth: 'thin',
};

const lofiTheme: VisualTheme = {
  id: 'lofi',
  name: 'Lo-fi',
  description: 'Soft pastels, analog vibes & study chill',
  colors: {
    dark: {
      bg: '#1a1528',
      panel: '#231e35',
      panel2: '#2d2644',
      text: '#e8dff5',
      textSecondary: '#b0a3c8',
      accent: '#e891c5',
      accentHover: '#d47db5',
      accent2: 'rgba(232, 145, 197, 0.1)',
      ring: 'rgba(232, 145, 197, 0.3)',
      link: '#7ecac3',
      success: '#7ecac3',
      warning: '#e8c170',
      danger: '#e87171',
      dangerHover: '#d45a5a',
      successBg: 'rgba(126, 202, 195, 0.1)',
      warningBg: 'rgba(232, 193, 112, 0.15)',
      dangerBg: 'rgba(232, 113, 113, 0.1)',
      navActive: 'rgba(232, 145, 197, 0.15)',
      buttonSecondary: '#e891c5',
      borderActive: '#e891c5',
      brandPrimary: '#e891c5',
      focusRing: '0 0 0 3px rgba(232, 145, 197, 0.25)',
      todayBg: 'rgba(232, 145, 197, 0.1)',
      weekViewTodayDateColor: '#e891c5',
      calendarCurrentDateColor: '#e891c5',
      editHover: '#e891c5',
      border: 'rgba(232, 145, 197, 0.12)',
      borderStrong: 'rgba(232, 145, 197, 0.2)',
    },
    light: {
      bg: '#f8f0fb',
      panel: '#fdf9ff',
      panel2: '#f5ecf9',
      accent: '#c06aad',
      accentHover: '#a85898',
      accent2: 'rgba(192, 106, 173, 0.1)',
      ring: 'rgba(192, 106, 173, 0.3)',
      link: '#5aa8a0',
      success: '#5aa8a0',
      warning: '#c8a050',
      danger: '#c85050',
      dangerHover: '#b04040',
      successBg: 'rgba(90, 168, 160, 0.1)',
      warningBg: 'rgba(192, 106, 173, 0.1)',
      dangerBg: 'rgba(200, 80, 80, 0.1)',
      navActive: 'rgba(192, 106, 173, 0.12)',
      buttonSecondary: '#c06aad',
      borderActive: '#c06aad',
      brandPrimary: '#c06aad',
      focusRing: '0 0 0 3px rgba(192, 106, 173, 0.2)',
      todayBg: 'rgba(192, 106, 173, 0.08)',
      weekViewTodayDateColor: '#a85898',
      calendarCurrentDateColor: '#c06aad',
      editHover: '#c06aad',
      text: '#2d1f3d',
      textSecondary: '#6b5a7d',
      border: 'rgba(100, 50, 120, 0.1)',
      borderStrong: 'rgba(100, 50, 120, 0.16)',
    },
  },
  borderRadius: 'lg',
  shadowStyle: 'soft',
  backgroundPattern: null,
  borderWidth: 'thin',
};

const jungleTheme: VisualTheme = {
  id: 'jungle',
  name: 'Jungle',
  description: 'Tropical wilds, vines & vibrant wildlife',
  colors: {
    dark: {
      bg: '#0f1a0f',
      panel: '#172017',
      panel2: '#1e2a1e',
      text: '#e0eed0',
      textSecondary: '#9ab88a',
      accent: '#4ec94e',
      accentHover: '#3db83d',
      accent2: 'rgba(78, 201, 78, 0.1)',
      ring: 'rgba(78, 201, 78, 0.3)',
      link: '#e8a830',
      success: '#4ec94e',
      warning: '#e8a830',
      danger: '#d84040',
      dangerHover: '#c03030',
      successBg: 'rgba(78, 201, 78, 0.1)',
      warningBg: 'rgba(232, 168, 48, 0.12)',
      dangerBg: 'rgba(216, 64, 64, 0.1)',
      navActive: 'rgba(78, 201, 78, 0.15)',
      buttonSecondary: '#4ec94e',
      borderActive: '#4ec94e',
      brandPrimary: '#4ec94e',
      focusRing: '0 0 0 3px rgba(78, 201, 78, 0.25)',
      todayBg: 'rgba(78, 201, 78, 0.1)',
      weekViewTodayDateColor: '#4ec94e',
      calendarCurrentDateColor: '#4ec94e',
      editHover: '#4ec94e',
      border: 'rgba(78, 201, 78, 0.12)',
      borderStrong: 'rgba(78, 201, 78, 0.2)',
    },
    light: {
      bg: '#f2f8ef',
      panel: '#fafdf8',
      panel2: '#eef5ea',
      accent: '#2d8a2d',
      accentHover: '#237023',
      accent2: 'rgba(45, 138, 45, 0.08)',
      ring: 'rgba(45, 138, 45, 0.25)',
      link: '#b07818',
      success: '#2d8a2d',
      warning: '#b07818',
      danger: '#c03030',
      dangerHover: '#a02020',
      successBg: 'rgba(45, 138, 45, 0.08)',
      warningBg: 'rgba(176, 120, 24, 0.08)',
      dangerBg: 'rgba(192, 48, 48, 0.08)',
      navActive: 'rgba(45, 138, 45, 0.1)',
      buttonSecondary: '#2d8a2d',
      borderActive: '#2d8a2d',
      brandPrimary: '#2d8a2d',
      focusRing: '0 0 0 3px rgba(45, 138, 45, 0.2)',
      todayBg: 'rgba(45, 138, 45, 0.08)',
      weekViewTodayDateColor: '#237023',
      calendarCurrentDateColor: '#2d8a2d',
      editHover: '#2d8a2d',
      text: '#1a2a1a',
      textSecondary: '#4a6040',
      border: 'rgba(30, 80, 30, 0.1)',
      borderStrong: 'rgba(30, 80, 30, 0.16)',
    },
  },
  borderRadius: 'md',
  shadowStyle: 'soft',
  backgroundPattern: null,
  borderWidth: 'thin',
};

const glassTheme: VisualTheme = {
  id: 'glass',
  name: 'Glass',
  description: 'Frosted glass panels & translucent overlays',
  colors: {
    dark: {
      bg: '#0c0e1a',
      panel: 'rgba(20, 24, 45, 0.25)',
      panel2: 'rgba(25, 30, 55, 0.18)',
      text: '#e8eaf5',
      textSecondary: '#a0a8c8',
      accent: '#6c8cff',
      accentHover: '#5a78e8',
      accent2: 'rgba(108, 140, 255, 0.1)',
      ring: 'rgba(108, 140, 255, 0.3)',
      link: '#6c8cff',
      success: '#50c878',
      warning: '#e8b040',
      danger: '#e06060',
      dangerHover: '#c84848',
      successBg: 'rgba(80, 200, 120, 0.1)',
      warningBg: 'rgba(232, 176, 64, 0.1)',
      dangerBg: 'rgba(224, 96, 96, 0.1)',
      navActive: 'rgba(108, 140, 255, 0.12)',
      buttonSecondary: '#6c8cff',
      borderActive: '#6c8cff',
      brandPrimary: '#6c8cff',
      focusRing: '0 0 0 3px rgba(108, 140, 255, 0.25)',
      todayBg: 'rgba(108, 140, 255, 0.1)',
      weekViewTodayDateColor: '#6c8cff',
      calendarCurrentDateColor: '#6c8cff',
      editHover: '#6c8cff',
      border: 'rgba(108, 140, 255, 0.1)',
      borderStrong: 'rgba(108, 140, 255, 0.18)',
    },
    light: {
      bg: '#e8ecf8',
      panel: 'rgba(255, 255, 255, 0.25)',
      panel2: 'rgba(255, 255, 255, 0.15)',
      accent: '#4a68d0',
      accentHover: '#3a56b8',
      accent2: 'rgba(74, 104, 208, 0.08)',
      ring: 'rgba(74, 104, 208, 0.25)',
      link: '#4a68d0',
      success: '#2a9050',
      warning: '#c09030',
      danger: '#c04848',
      dangerHover: '#a83838',
      successBg: 'rgba(42, 144, 80, 0.08)',
      warningBg: 'rgba(192, 144, 48, 0.08)',
      dangerBg: 'rgba(192, 72, 72, 0.08)',
      navActive: 'rgba(74, 104, 208, 0.1)',
      buttonSecondary: '#4a68d0',
      borderActive: '#4a68d0',
      brandPrimary: '#4a68d0',
      focusRing: '0 0 0 3px rgba(74, 104, 208, 0.2)',
      todayBg: 'rgba(74, 104, 208, 0.08)',
      weekViewTodayDateColor: '#3a56b8',
      calendarCurrentDateColor: '#4a68d0',
      editHover: '#4a68d0',
      text: '#1a1e30',
      textSecondary: '#5a6080',
      border: 'rgba(74, 104, 208, 0.12)',
      borderStrong: 'rgba(74, 104, 208, 0.2)',
    },
  },
  borderRadius: 'lg',
  shadowStyle: 'soft',
  backgroundPattern: null,
  borderWidth: 'thin',
};

const steampunkTheme: VisualTheme = {
  id: 'steampunk',
  name: 'Steampunk',
  description: 'Brass gears, copper pipes & Victorian industry',
  colors: {
    dark: {
      bg: '#1a140e',
      panel: '#241c14',
      panel2: '#2e2418',
      text: '#e8d8c0',
      textSecondary: '#b09878',
      accent: '#c89040',
      accentHover: '#b07830',
      accent2: 'rgba(200, 144, 64, 0.1)',
      ring: 'rgba(200, 144, 64, 0.3)',
      link: '#d0a050',
      success: '#78a048',
      warning: '#c89040',
      danger: '#c04830',
      dangerHover: '#a83820',
      successBg: 'rgba(120, 160, 72, 0.1)',
      warningBg: 'rgba(200, 144, 64, 0.12)',
      dangerBg: 'rgba(192, 72, 48, 0.1)',
      navActive: 'rgba(200, 144, 64, 0.15)',
      buttonSecondary: '#c89040',
      borderActive: '#c89040',
      brandPrimary: '#c89040',
      focusRing: '0 0 0 3px rgba(200, 144, 64, 0.25)',
      todayBg: 'rgba(200, 144, 64, 0.1)',
      weekViewTodayDateColor: '#c89040',
      calendarCurrentDateColor: '#c89040',
      editHover: '#c89040',
      border: 'rgba(200, 144, 64, 0.12)',
      borderStrong: 'rgba(200, 144, 64, 0.2)',
    },
    light: {
      bg: '#f5ede0',
      panel: '#faf5ec',
      panel2: '#f0e8d8',
      accent: '#b88030',
      accentHover: '#a06e25',
      accent2: 'rgba(184, 128, 48, 0.08)',
      ring: 'rgba(184, 128, 48, 0.25)',
      link: '#b88030',
      success: '#5a8030',
      warning: '#b88030',
      danger: '#a03020',
      dangerHover: '#882818',
      successBg: 'rgba(90, 128, 48, 0.08)',
      warningBg: 'rgba(184, 128, 48, 0.08)',
      dangerBg: 'rgba(160, 48, 32, 0.08)',
      navActive: 'rgba(184, 128, 48, 0.1)',
      buttonSecondary: '#b88030',
      borderActive: '#b88030',
      brandPrimary: '#b88030',
      focusRing: '0 0 0 3px rgba(184, 128, 48, 0.2)',
      todayBg: 'rgba(184, 128, 48, 0.08)',
      weekViewTodayDateColor: '#a06e25',
      calendarCurrentDateColor: '#b88030',
      editHover: '#b88030',
      text: '#2a2018',
      textSecondary: '#6a5840',
      border: 'rgba(100, 70, 30, 0.12)',
      borderStrong: 'rgba(100, 70, 30, 0.18)',
    },
  },
  borderRadius: 'sm',
  shadowStyle: 'bold',
  backgroundPattern: null,
  borderWidth: 'medium',
};

const skeuoTheme: VisualTheme = {
  id: 'skeuo',
  name: 'Skeuomorphism',
  description: 'Textured surfaces & tactile depth',
  colors: {
    dark: {
      bg: '#1c1612',
      panel: '#2a221a',
      panel2: '#221a14',
      text: '#ede4d8',
      textSecondary: '#bfb09a',
      accent: '#d4a24a',
      accentHover: '#c09038',
      accent2: 'rgba(212, 162, 74, 0.12)',
      ring: 'rgba(212, 162, 74, 0.35)',
      link: '#d4a24a',
      success: '#6a9e50',
      warning: '#d4a24a',
      danger: '#c44a38',
      dangerHover: '#a83a28',
      successBg: 'rgba(106, 158, 80, 0.1)',
      warningBg: 'rgba(212, 162, 74, 0.1)',
      dangerBg: 'rgba(196, 74, 56, 0.1)',
      navActive: 'rgba(212, 162, 74, 0.15)',
      buttonSecondary: '#d4a24a',
      borderActive: '#d4a24a',
      brandPrimary: '#d4a24a',
      focusRing: '0 0 0 3px rgba(212, 162, 74, 0.3)',
      todayBg: 'rgba(212, 162, 74, 0.1)',
      weekViewTodayDateColor: '#d4a24a',
      calendarCurrentDateColor: '#d4a24a',
      editHover: '#d4a24a',
      border: 'rgba(212, 162, 74, 0.12)',
      borderStrong: 'rgba(212, 162, 74, 0.2)',
    },
    light: {
      bg: '#ece4d4',
      panel: '#f5eee0',
      panel2: '#e8dfd0',
      text: '#2a2018',
      textSecondary: '#6a5840',
      accent: '#a07028',
      accentHover: '#8a6020',
      accent2: 'rgba(160, 112, 40, 0.1)',
      ring: 'rgba(160, 112, 40, 0.3)',
      link: '#a07028',
      success: '#508038',
      warning: '#a07028',
      danger: '#a03020',
      dangerHover: '#882818',
      successBg: 'rgba(80, 128, 56, 0.08)',
      warningBg: 'rgba(160, 112, 40, 0.08)',
      dangerBg: 'rgba(160, 48, 32, 0.08)',
      navActive: 'rgba(160, 112, 40, 0.1)',
      buttonSecondary: '#a07028',
      borderActive: '#a07028',
      brandPrimary: '#a07028',
      focusRing: '0 0 0 3px rgba(160, 112, 40, 0.2)',
      todayBg: 'rgba(160, 112, 40, 0.08)',
      weekViewTodayDateColor: '#8a6020',
      calendarCurrentDateColor: '#a07028',
      editHover: '#a07028',
      border: 'rgba(100, 70, 30, 0.15)',
      borderStrong: 'rgba(100, 70, 30, 0.22)',
    },
  },
  borderRadius: 'md',
  shadowStyle: 'bold',
  backgroundPattern: null,
  borderWidth: 'medium',
};

export const visualThemes: VisualTheme[] = [
  defaultTheme,
  cartoonTheme,
  cyberpunkTheme,
  retroTheme,
  natureTheme,
  oceanTheme,
  lavenderTheme,
  spaceTheme,
  pixelTheme,
  aquariumTheme,
  cozyTheme,
  winterTheme,
  sakuraTheme,
  halloweenTheme,
  autumnTheme,
  springTheme,
  noirTheme,
  lofiTheme,
  jungleTheme,
  glassTheme,
  steampunkTheme,
  terminalTheme,
  paperTheme,
  skeuoTheme,
];

/**
 * Resolve 'random' theme to a deterministic daily theme based on local date.
 * Uses a simple hash of the date string to pick a non-default theme.
 * Returns the original id for all other values.
 */
export function resolveThemeId(id: string | null | undefined): string | null | undefined {
  if (id !== 'random') return id;
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  // Simple string hash
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  // Pick from non-default themes
  const nonDefault = visualThemes.filter(t => t.id !== 'default');
  const index = Math.abs(hash) % nonDefault.length;
  return nonDefault[index].id;
}

/**
 * Get a visual theme by ID
 */
export function getVisualTheme(id: string | null | undefined): VisualTheme {
  if (!id || id === 'default') return defaultTheme;
  const resolved = resolveThemeId(id);
  if (!resolved || resolved === 'default') return defaultTheme;
  return visualThemes.find(t => t.id === resolved) || defaultTheme;
}

/**
 * Get theme colors for a specific mode
 */
export function getThemeColors(
  themeId: string | null | undefined,
  mode: 'light' | 'dark'
): Partial<ColorPalette> {
  const theme = getVisualTheme(themeId);
  return mode === 'light' ? theme.colors.light : theme.colors.dark;
}

/**
 * Border radius values for each size
 */
const borderRadiusValues: Record<BorderRadiusSize, { xs: string; control: string; card: string }> = {
  sm: { xs: '4px', control: '8px', card: '10px' },
  md: { xs: '6px', control: '12px', card: '16px' },
  lg: { xs: '8px', control: '16px', card: '20px' },
  xl: { xs: '16px', control: '28px', card: '40px' },
};

/**
 * Shadow values for each style
 */
const shadowValues: Record<ShadowStyle, { sm: string; md: string; lg: string }> = {
  none: { sm: 'none', md: 'none', lg: 'none' },
  soft: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 8px 0 rgba(0, 0, 0, 0.4)',
    lg: '0 8px 16px 0 rgba(0, 0, 0, 0.5)',
  },
  bold: {
    sm: '0 2px 4px 0 rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    md: '0 6px 16px 0 rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)',
    lg: '0 12px 32px 0 rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  },
};

/**
 * Border width values
 */
const borderWidthValues: Record<'thin' | 'medium' | 'thick', string> = {
  thin: '1px',
  medium: '1.5px',
  thick: '2px',
};

/**
 * Apply visual theme to the document
 * Sets colors, border radius, shadow style, and body class
 */
export function applyVisualTheme(
  themeId: string | null | undefined,
  mode: 'light' | 'dark',
  _basePalette: ColorPalette
): void {
  if (typeof document === 'undefined') return;

  const theme = getVisualTheme(themeId);
  const root = document.documentElement;
  const body = document.body;

  // Remove all theme classes
  visualThemes.forEach(t => {
    body.classList.remove(`theme-${t.id}`);
  });

  // Add current theme class
  if (theme.id !== 'default') {
    body.classList.add(`theme-${theme.id}`);
  }

  // Apply theme-specific colors (merged with base palette)
  const themeColors = mode === 'light' ? theme.colors.light : theme.colors.dark;

  // Only set CSS variables for colors that are defined in the theme
  if (themeColors.bg) root.style.setProperty('--bg', themeColors.bg);
  if (themeColors.panel) root.style.setProperty('--panel', themeColors.panel);
  if (themeColors.panel2) root.style.setProperty('--panel-2', themeColors.panel2);
  if (themeColors.text) root.style.setProperty('--text', themeColors.text);
  if (themeColors.textSecondary) root.style.setProperty('--text-secondary', themeColors.textSecondary);
  if (themeColors.accent) root.style.setProperty('--accent', themeColors.accent);
  if (themeColors.accentHover) root.style.setProperty('--accent-hover', themeColors.accentHover);
  if (themeColors.accent2) root.style.setProperty('--accent-2', themeColors.accent2);
  if (themeColors.ring) root.style.setProperty('--ring', themeColors.ring);
  if (themeColors.link) root.style.setProperty('--link', themeColors.link);
  if (themeColors.success) root.style.setProperty('--success', themeColors.success);
  if (themeColors.warning) root.style.setProperty('--warning', themeColors.warning);
  if (themeColors.danger) root.style.setProperty('--danger', themeColors.danger);
  if (themeColors.dangerHover) root.style.setProperty('--danger-hover', themeColors.dangerHover);
  if (themeColors.successBg) root.style.setProperty('--success-bg', themeColors.successBg);
  if (themeColors.warningBg) root.style.setProperty('--warning-bg', themeColors.warningBg);
  if (themeColors.dangerBg) root.style.setProperty('--danger-bg', themeColors.dangerBg);
  if (themeColors.navActive) root.style.setProperty('--nav-active', themeColors.navActive);
  if (themeColors.buttonSecondary) root.style.setProperty('--button-secondary', themeColors.buttonSecondary);
  if (themeColors.borderActive) root.style.setProperty('--border-active', themeColors.borderActive);
  if (themeColors.border) root.style.setProperty('--border', themeColors.border);
  if (themeColors.borderStrong) root.style.setProperty('--border-strong', themeColors.borderStrong);
  if (themeColors.brandPrimary) root.style.setProperty('--brand-primary', themeColors.brandPrimary);
  if (themeColors.focusRing) root.style.setProperty('--focus-ring', themeColors.focusRing);
  if (themeColors.todayBg) root.style.setProperty('--today-bg', themeColors.todayBg);
  if (themeColors.weekViewTodayDateColor) root.style.setProperty('--week-view-today-date-color', themeColors.weekViewTodayDateColor);
  if (themeColors.calendarCurrentDateColor) root.style.setProperty('--calendar-current-date-color', themeColors.calendarCurrentDateColor);
  if (themeColors.editHover) root.style.setProperty('--edit-hover', themeColors.editHover);

  // Apply border radius
  const radiusVals = borderRadiusValues[theme.borderRadius];
  root.style.setProperty('--radius-xs', radiusVals.xs);
  root.style.setProperty('--radius-control', radiusVals.control);
  root.style.setProperty('--radius-card', radiusVals.card);
  root.style.setProperty('--theme-radius', radiusVals.control);

  // Apply shadow style
  const shadowVals = shadowValues[theme.shadowStyle];
  root.style.setProperty('--shadow-sm', shadowVals.sm);
  root.style.setProperty('--shadow-md', shadowVals.md);
  root.style.setProperty('--shadow-lg', shadowVals.lg);
  root.style.setProperty('--theme-shadow', theme.shadowStyle);

  // Apply border width
  const borderWidth = borderWidthValues[theme.borderWidth || 'thin'];
  root.style.setProperty('--theme-border-width', borderWidth);

  // Store visual theme ID for background decoration
  root.style.setProperty('--visual-theme', theme.id);
  root.dataset.visualTheme = theme.id;
}

/**
 * Clear visual theme (reset to defaults)
 */
export function clearVisualTheme(): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  // Remove all theme classes
  visualThemes.forEach(t => {
    body.classList.remove(`theme-${t.id}`);
  });

  // Reset theme CSS variables to defaults
  root.style.setProperty('--radius-xs', '6px');
  root.style.setProperty('--radius-control', '12px');
  root.style.setProperty('--radius-card', '16px');
  root.style.setProperty('--theme-radius', '12px');
  root.style.setProperty('--theme-shadow', 'soft');
  root.style.setProperty('--theme-border-width', '1px');
  root.style.setProperty('--visual-theme', 'default');
  root.dataset.visualTheme = 'default';
}

/**
 * Get preview colors for a theme (for theme picker UI)
 */
export function getThemePreviewColors(themeId: string): {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
} {
  const theme = getVisualTheme(themeId);
  const darkColors = theme.colors.dark;

  return {
    primary: darkColors.accent || '#6d28d9',
    secondary: darkColors.link || '#a78bfa',
    accent: darkColors.success || '#57ab5a',
    background: darkColors.bg || '#080a0a',
  };
}
