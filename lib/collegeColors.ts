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
 * BYU Color Palette - Dark grey backgrounds with BYU blue accents
 * Uses dark greyish-blackish backgrounds with BYU blue buttons and highlights
 */
export const byuColorPalette: ColorPalette = {
  bg: "#080a0a",
  panel: "#141618",
  panel2: "#0f1114",

  text: "#e6edf6",
  textSecondary: "#adbac7",
  muted: "#9aa7b7",
  textMuted: "#768390",
  textDisabled: "#545d68",

  border: "rgba(255, 255, 255, 0.08)",
  borderHover: "#2a3a3a",
  borderActive: "#023182",
  borderStrong: "rgba(255, 255, 255, 0.12)",

  accent: "#023182",
  accentHover: "#001a50",
  accent2: "rgba(2, 49, 130, 0.15)",
  ring: "rgba(2, 49, 130, 0.35)",

  buttonSecondary: "#023182",

  navActive: "#023182",

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

  focusRing: "0 0 0 3px rgba(2, 49, 130, 0.3)",
};

/**
 * Default/Neutral Color Palette - Dark greyish-blackish theme
 * Used when no college is selected
 */
export const defaultColorPalette: ColorPalette = {
  bg: "#080a0a",
  panel: "#141618",
  panel2: "#0f1114",

  text: "#e8e8e8",
  textSecondary: "#b8b8b8",
  muted: "#8a8a8a",
  textMuted: "#707070",
  textDisabled: "#555555",

  border: "rgba(255, 255, 255, 0.08)",
  borderHover: "#2a3a3a",
  borderActive: "#404040",
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
 * BYU Hawaii Color Palette - Dark tropical theme with muted dark tones
 * Using official BYUH brand colors (dark palette)
 * Primary: #006c5b (Forest Green), Secondary: #862633 (Maroon), Accent: #6a2a5b (Purple)
 */
export const byuhColorPalette: ColorPalette = {
  bg: "#080a0a",
  panel: "#141618",
  panel2: "#0f1114",

  text: "#f0f0f0",
  textSecondary: "#c8c8c8",
  muted: "#808080",
  textMuted: "#606060",
  textDisabled: "#4a4a4a",

  border: "rgba(255, 255, 255, 0.06)",
  borderHover: "#2a3a3a",
  borderActive: "#006c5b",
  borderStrong: "rgba(255, 255, 255, 0.10)",

  accent: "#006c5b",
  accentHover: "#004a45",
  accent2: "rgba(0, 108, 91, 0.12)",
  ring: "rgba(0, 108, 91, 0.30)",

  buttonSecondary: "#9e1b34",

  navActive: "#9e1b34",

  link: "#2563eb",

  calendarNoSchool: "#132343",
  calendarCancelled: "#132343",

  brandPrimary: "#6a2a5b",

  success: "#4a8a4d",
  warning: "#a67a1a",
  danger: "#c53a3a",
  dangerHover: "#b52f2f",
  successBg: "rgba(74, 138, 77, 0.1)",
  warningBg: "rgba(166, 122, 26, 0.1)",
  dangerBg: "rgba(197, 58, 58, 0.1)",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.5)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.6)",

  focusRing: "0 0 0 3px rgba(37, 99, 235, 0.3)",
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
