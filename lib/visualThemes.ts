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
export const visualThemes: VisualTheme[] = [
  defaultTheme,
  cartoonTheme,
];

/**
 * Get a visual theme by ID
 */
export function getVisualTheme(id: string | null | undefined): VisualTheme {
  if (!id || id === 'default') return defaultTheme;
  return visualThemes.find(t => t.id === id) || defaultTheme;
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
