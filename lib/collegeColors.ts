/**
 * College-dependent color palettes
 * Each college has a complete color theme that controls the entire app appearance
 */

export interface ColorPalette {
  // Backgrounds
  bg: string;
  panel: string;
  panel2: string;

  // Text hierarchy
  text: string;
  textSecondary: string;
  muted: string;
  textMuted: string;
  textDisabled: string;

  // Borders
  border: string;
  borderHover: string;
  borderActive: string;
  borderStrong: string;

  // Accent
  accent: string;
  accentHover: string;
  accent2: string;
  ring: string;

  // Button colors
  buttonSecondary: string;

  // Navigation
  navActive: string;

  // Link color (always blue)
  link: string;

  // Calendar indicators (always fixed)
  calendarNoSchool: string;
  calendarCancelled: string;

  // Semantic colors
  success: string;
  warning: string;
  danger: string;
  dangerHover: string;
  successBg: string;
  warningBg: string;
  dangerBg: string;

  // Brand colors
  brandPrimary: string;

  // Shadows (can have subtle variations)
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;

  // Focus ring
  focusRing: string;
}

/**
 * BYU Color Palette - The original/current colors
 * These are the colors that were already in globals.css
 */
export const byuColorPalette: ColorPalette = {
  bg: "#0b0f14",
  panel: "#101826",
  panel2: "#0f1724",

  text: "#e6edf6",
  textSecondary: "#adbac7",
  muted: "#9aa7b7",
  textMuted: "#768390",
  textDisabled: "#545d68",

  border: "rgba(255, 255, 255, 0.08)",
  borderHover: "#444c56",
  borderActive: "#539bf5",
  borderStrong: "rgba(255, 255, 255, 0.12)",

  accent: "#2563eb",
  accentHover: "#1d4ed8",
  accent2: "rgba(37, 99, 235, 0.15)",
  ring: "rgba(37, 99, 235, 0.35)",

  buttonSecondary: "#132343",

  navActive: "#132343",

  link: "#2563eb",

  calendarNoSchool: "#132343",
  calendarCancelled: "#132343",

  success: "#57ab5a",
  warning: "#c69026",
  danger: "#e5534b",
  dangerHover: "#d64941",
  successBg: "rgba(87, 171, 90, 0.1)",
  warningBg: "rgba(198, 144, 38, 0.1)",
  dangerBg: "rgba(229, 83, 75, 0.1)",

  brandPrimary: "#1a2f8a",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.4)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.5)",

  focusRing: "0 0 0 3px rgba(83, 155, 245, 0.3)",
};

/**
 * Default/Neutral Color Palette - Black and grey theme
 * Used when no college is selected
 */
export const defaultColorPalette: ColorPalette = {
  bg: "#0a0a0a",
  panel: "#1a1a1a",
  panel2: "#161616",

  text: "#e8e8e8",
  textSecondary: "#b8b8b8",
  muted: "#8a8a8a",
  textMuted: "#707070",
  textDisabled: "#555555",

  border: "rgba(255, 255, 255, 0.08)",
  borderHover: "#404040",
  borderActive: "#606060",
  borderStrong: "rgba(255, 255, 255, 0.12)",

  accent: "#4a4a4a",
  accentHover: "#3a3a3a",
  accent2: "rgba(74, 74, 74, 0.15)",
  ring: "rgba(74, 74, 74, 0.35)",

  buttonSecondary: "#2d2d2d",

  navActive: "#2d2d2d",

  link: "#2563eb",

  calendarNoSchool: "#132343",
  calendarCancelled: "#132343",

  success: "#57ab5a",
  warning: "#c69026",
  danger: "#e5534b",
  dangerHover: "#d64941",
  successBg: "rgba(87, 171, 90, 0.1)",
  warningBg: "rgba(198, 144, 38, 0.1)",
  dangerBg: "rgba(229, 83, 75, 0.1)",

  brandPrimary: "#5a5a5a",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.4)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.5)",

  focusRing: "0 0 0 3px rgba(74, 74, 74, 0.3)",
};

/**
 * BYU Hawaii Color Palette - Tropical dark theme
 * Using official BYUH brand colors
 * Primary: #ba0c2f (Crimson), Accent: #00b097 (Turquoise), Secondary: #c69214 (Gold)
 */
export const byuhColorPalette: ColorPalette = {
  bg: "#0a0a0a",
  panel: "#1a1a1a",
  panel2: "#151515",

  text: "#f5f5f5",
  textSecondary: "#d0d0d0",
  muted: "#909090",
  textMuted: "#707070",
  textDisabled: "#555555",

  border: "rgba(255, 255, 255, 0.08)",
  borderHover: "#404040",
  borderActive: "#00b097",
  borderStrong: "rgba(255, 255, 255, 0.12)",

  accent: "#00b097",
  accentHover: "#008877",
  accent2: "rgba(0, 176, 151, 0.15)",
  ring: "rgba(0, 176, 151, 0.35)",

  buttonSecondary: "#862633",

  navActive: "#862633",

  link: "#00b097",

  calendarNoSchool: "#ba0c2f",
  calendarCancelled: "#ba0c2f",

  brandPrimary: "#d14124",

  success: "#57ab5a",
  warning: "#c69214",
  danger: "#e5534b",
  dangerHover: "#d64941",
  successBg: "rgba(87, 171, 90, 0.1)",
  warningBg: "rgba(198, 144, 20, 0.1)",
  dangerBg: "rgba(229, 83, 75, 0.1)",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.4)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.5)",

  focusRing: "0 0 0 3px rgba(0, 176, 151, 0.3)",
};

/**
 * College color palette map
 * Maps university names to their color palettes
 */
export const collegeColorPalettes: Record<string, ColorPalette> = {
  "Brigham Young University": byuColorPalette,
  "Brigham Young University Hawaii": byuhColorPalette,
  // Placeholder palettes - to be customized
  "Brigham Young University Idaho": byuColorPalette,
  "UNC Chapel Hill": byuColorPalette,
  "Utah State University": byuColorPalette,
  "Utah Valley University": byuColorPalette,
};

/**
 * Apply a color palette to the document
 * Updates all CSS variables on the root element
 */
export function applyColorPalette(palette: ColorPalette): void {
  const root = document.documentElement;

  // Backgrounds
  root.style.setProperty("--bg", palette.bg);
  root.style.setProperty("--panel", palette.panel);
  root.style.setProperty("--panel-2", palette.panel2);

  // Text
  root.style.setProperty("--text", palette.text);
  root.style.setProperty("--text-secondary", palette.textSecondary);
  root.style.setProperty("--muted", palette.muted);
  root.style.setProperty("--text-muted", palette.textMuted);
  root.style.setProperty("--text-disabled", palette.textDisabled);

  // Borders
  root.style.setProperty("--border", palette.border);
  root.style.setProperty("--border-hover", palette.borderHover);
  root.style.setProperty("--border-active", palette.borderActive);
  root.style.setProperty("--border-strong", palette.borderStrong);

  // Accent
  root.style.setProperty("--accent", palette.accent);
  root.style.setProperty("--accent-hover", palette.accentHover);
  root.style.setProperty("--accent-2", palette.accent2);
  root.style.setProperty("--ring", palette.ring);

  // Button colors
  root.style.setProperty("--button-secondary", palette.buttonSecondary);

  // Navigation
  root.style.setProperty("--nav-active", palette.navActive);

  // Link color
  root.style.setProperty("--link", palette.link);

  // Calendar indicators
  root.style.setProperty("--calendar-no-school", palette.calendarNoSchool);
  root.style.setProperty("--calendar-cancelled", palette.calendarCancelled);

  // Semantic colors
  root.style.setProperty("--success", palette.success);
  root.style.setProperty("--warning", palette.warning);
  root.style.setProperty("--danger", palette.danger);
  root.style.setProperty("--danger-hover", palette.dangerHover);
  root.style.setProperty("--success-bg", palette.successBg);
  root.style.setProperty("--warning-bg", palette.warningBg);
  root.style.setProperty("--danger-bg", palette.dangerBg);

  // Brand colors
  root.style.setProperty("--brand-primary", palette.brandPrimary);

  // Shadows
  root.style.setProperty("--shadow-sm", palette.shadowSm);
  root.style.setProperty("--shadow-md", palette.shadowMd);
  root.style.setProperty("--shadow-lg", palette.shadowLg);

  // Focus ring
  root.style.setProperty("--focus-ring", palette.focusRing);
}

/**
 * Get the color palette for a college
 * Returns default (neutral) palette if no college selected
 * Returns BYU palette as fallback if college not found
 */
export function getCollegeColorPalette(
  collegeName: string | null
): ColorPalette {
  if (!collegeName) {
    return defaultColorPalette;
  }
  return collegeColorPalettes[collegeName] || byuColorPalette;
}
