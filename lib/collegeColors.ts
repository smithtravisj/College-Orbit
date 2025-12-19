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
  calendarEventText: string;

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

  // Today background highlight (calendar views)
  todayBg: string;

  // Week view today date color
  weekViewTodayDateColor: string;

  // Calendar current date color (matches college color, brighter in dark mode)
  calendarCurrentDateColor: string;
}

/**
 * BYU Color Palette - Dark grey backgrounds with BYU blue accents
 * Uses dark greyish-blackish backgrounds with BYU blue buttons and highlights
 */
export const byuColorPalette: ColorPalette = {
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
  borderActive: "#002E5D",
  borderStrong: "rgba(255, 255, 255, 0.12)",

  accent: "#002E5D",
  accentHover: "#001f40",
  accent2: "rgba(0, 46, 93, 0.15)",
  ring: "rgba(0, 46, 93, 0.35)",

  buttonSecondary: "#002E5D",

  navActive: "#002E5D",

  link: "#2563eb",

  calendarNoSchool: "#d1d5db",
  calendarCancelled: "#d1d5db",
  calendarEventText: "white",

  success: "#57ab5a",
  warning: "#c69026",
  danger: "#e5534b",
  dangerHover: "#d64941",
  successBg: "rgba(87, 171, 90, 0.1)",
  warningBg: "rgba(198, 144, 38, 0.1)",
  dangerBg: "rgba(229, 83, 75, 0.1)",

  brandPrimary: "#002E5D",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.4)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.5)",

  focusRing: "0 0 0 3px rgba(0, 46, 93, 0.3)",

  todayBg: "rgba(0, 46, 93, 0.12)",

  weekViewTodayDateColor: "#0ea5e9",

  calendarCurrentDateColor: "#6ab2ff",
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

  calendarNoSchool: "#d1d5db",
  calendarCancelled: "#d1d5db",
  calendarEventText: "white",

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

  todayBg: "rgba(74, 74, 74, 0.12)",

  weekViewTodayDateColor: "#e8e8e8",

  calendarCurrentDateColor: "#f0f1f3",
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
  borderActive: "#9e1b34",
  borderStrong: "rgba(255, 255, 255, 0.10)",

  accent: "#9e1b34",
  accentHover: "#7a1428",
  accent2: "rgba(158, 27, 52, 0.15)",
  ring: "rgba(158, 27, 52, 0.35)",

  buttonSecondary: "#9e1b34",

  navActive: "#9e1b34",

  link: "#2563eb",

  calendarNoSchool: "#d1d5db",
  calendarCancelled: "#d1d5db",
  calendarEventText: "white",

  brandPrimary: "#9e1b34",

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

  focusRing: "0 0 0 3px rgba(158, 27, 52, 0.3)",

  todayBg: "rgba(158, 27, 52, 0.2)",

  weekViewTodayDateColor: "#ff5577",

  calendarCurrentDateColor: "#f5a6b4",
};

/**
 * BYU Idaho Color Palette - Dark theme with purple-blue accents
 * Using official BYUI brand colors (darker palette)
 * Primary: #214491 (Purple-Blue)
 */
export const byuidColorPalette: ColorPalette = {
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
  borderActive: "#0063A5",
  borderStrong: "rgba(255, 255, 255, 0.12)",

  accent: "#0063A5",
  accentHover: "#004A7A",
  accent2: "rgba(0, 99, 165, 0.15)",
  ring: "rgba(0, 99, 165, 0.35)",

  buttonSecondary: "#0063A5",

  navActive: "#0063A5",

  link: "#2563eb",

  calendarNoSchool: "#d1d5db",
  calendarCancelled: "#d1d5db",
  calendarEventText: "white",

  brandPrimary: "#0063A5",

  success: "#57ab5a",
  warning: "#c69026",
  danger: "#e5534b",
  dangerHover: "#d64941",
  successBg: "rgba(87, 171, 90, 0.1)",
  warningBg: "rgba(198, 144, 38, 0.1)",
  dangerBg: "rgba(229, 83, 75, 0.1)",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.4)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.5)",

  focusRing: "0 0 0 3px rgba(0, 99, 165, 0.3)",

  todayBg: "rgba(0, 99, 165, 0.2)",

  weekViewTodayDateColor: "#0ea5e9",

  calendarCurrentDateColor: "#7bbaff",
};

/**
 * Utah Valley University Color Palette - Dark theme with UVU green accents
 * Using official UVU brand color (dark palette)
 * Primary: #275038 (UVU Green)
 */
export const uvuColorPalette: ColorPalette = {
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
  borderActive: "#275038",
  borderStrong: "rgba(255, 255, 255, 0.12)",

  accent: "#275038",
  accentHover: "#1d3827",
  accent2: "rgba(39, 80, 56, 0.15)",
  ring: "rgba(39, 80, 56, 0.35)",

  buttonSecondary: "#275038",

  navActive: "#275038",

  link: "#2563eb",

  calendarNoSchool: "#d1d5db",
  calendarCancelled: "#d1d5db",
  calendarEventText: "white",

  success: "#57ab5a",
  warning: "#c69026",
  danger: "#e5534b",
  dangerHover: "#d64941",
  successBg: "rgba(87, 171, 90, 0.1)",
  warningBg: "rgba(198, 144, 38, 0.1)",
  dangerBg: "rgba(229, 83, 75, 0.1)",

  brandPrimary: "#275038",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.4)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.5)",

  focusRing: "0 0 0 3px rgba(39, 80, 56, 0.3)",

  todayBg: "rgba(39, 80, 56, 0.2)",

  weekViewTodayDateColor: "#52b788",

  calendarCurrentDateColor: "#7cc49a",
};

/**
 * Utah State University Color Palette - Dark theme with USU navy accents
 * Using official USU brand color (dark palette)
 * Primary: #0F2439 (USU Navy)
 */
export const usuColorPalette: ColorPalette = {
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
  borderActive: "#0F2439",
  borderStrong: "rgba(255, 255, 255, 0.12)",

  accent: "#0F2439",
  accentHover: "#0A1827",
  accent2: "rgba(15, 36, 57, 0.15)",
  ring: "rgba(15, 36, 57, 0.35)",

  buttonSecondary: "#0F2439",

  navActive: "#0F2439",

  link: "#2563eb",

  calendarNoSchool: "#d1d5db",
  calendarCancelled: "#d1d5db",
  calendarEventText: "white",

  success: "#57ab5a",
  warning: "#c69026",
  danger: "#e5534b",
  dangerHover: "#d64941",
  successBg: "rgba(87, 171, 90, 0.1)",
  warningBg: "rgba(198, 144, 38, 0.1)",
  dangerBg: "rgba(229, 83, 75, 0.1)",

  brandPrimary: "#0F2439",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.4)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.5)",

  focusRing: "0 0 0 3px rgba(15, 36, 57, 0.3)",

  todayBg: "rgba(15, 36, 57, 0.2)",

  weekViewTodayDateColor: "#0ea5e9",

  calendarCurrentDateColor: "#8ac8ff",
};

/**
 * UNC Chapel Hill Color Palette - Dark theme with UNC blue accents
 * Using official UNC Chapel Hill brand color (dark palette)
 * Primary: #007FAE (UNC Blue)
 */
export const uncColorPalette: ColorPalette = {
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
  borderActive: "#007FAE",
  borderStrong: "rgba(255, 255, 255, 0.12)",

  accent: "#007FAE",
  accentHover: "#006699",
  accent2: "rgba(0, 127, 174, 0.15)",
  ring: "rgba(0, 127, 174, 0.35)",

  buttonSecondary: "#007FAE",

  navActive: "#007FAE",

  link: "#2563eb",

  calendarNoSchool: "#d1d5db",
  calendarCancelled: "#d1d5db",
  calendarEventText: "white",

  success: "#57ab5a",
  warning: "#c69026",
  danger: "#e5534b",
  dangerHover: "#d64941",
  successBg: "rgba(87, 171, 90, 0.1)",
  warningBg: "rgba(198, 144, 38, 0.1)",
  dangerBg: "rgba(229, 83, 75, 0.1)",

  brandPrimary: "#007FAE",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.4)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.5)",

  focusRing: "0 0 0 3px rgba(0, 127, 174, 0.3)",

  todayBg: "rgba(0, 127, 174, 0.2)",

  weekViewTodayDateColor: "#0ea5e9",

  calendarCurrentDateColor: "#82ccff",
};

/**
 * Light Mode Palettes - Inverted backgrounds and text with same accent colors
 */

/**
 * BYU Light Color Palette
 */
export const byuLightPalette: ColorPalette = {
  bg: "#f5f5f5",
  panel: "#ffffff",
  panel2: "#f0f1f3",

  text: "#2a2a2a",
  textSecondary: "#5a5a5a",
  muted: "#5a5a5a",
  textMuted: "#5a5a5a",
  textDisabled: "#8a8a8a",

  border: "rgba(0, 0, 0, 0.12)",
  borderHover: "#d1d5db",
  borderActive: "#6ab2ff",
  borderStrong: "rgba(0, 0, 0, 0.16)",

  accent: "#6ab2ff",
  accentHover: "#5aa2ee",
  accent2: "rgba(106, 178, 255, 0.15)",
  ring: "rgba(106, 178, 255, 0.35)",

  buttonSecondary: "#6ab2ff",
  navActive: "#6ab2ff",
  link: "#0ea5e9",

  calendarNoSchool: "#d1d5db",
  calendarCancelled: "#d1d5db",
  calendarEventText: "#000000",

  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  dangerHover: "#b91c1c",
  successBg: "rgba(22, 163, 74, 0.1)",
  warningBg: "rgba(217, 119, 6, 0.1)",
  dangerBg: "rgba(220, 38, 38, 0.1)",

  brandPrimary: "#002E5D",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.08)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",

  focusRing: "0 0 0 3px rgba(106, 178, 255, 0.3)",
  todayBg: "rgba(106, 178, 255, 0.2)",
  weekViewTodayDateColor: "#0ea5e9",
  calendarCurrentDateColor: "#6ab2ff",
};

/**
 * Default/Neutral Light Color Palette
 */
export const defaultLightPalette: ColorPalette = {
  bg: "#f5f5f5",
  panel: "#ffffff",
  panel2: "#f0f1f3",

  text: "#2a2a2a",
  textSecondary: "#5a5a5a",
  muted: "#5a5a5a",
  textMuted: "#5a5a5a",
  textDisabled: "#8a8a8a",

  border: "rgba(0, 0, 0, 0.12)",
  borderHover: "#d1d5db",
  borderActive: "#f0f1f3",
  borderStrong: "rgba(0, 0, 0, 0.16)",

  accent: "#f0f1f3",
  accentHover: "#e0e1e3",
  accent2: "rgba(240, 241, 243, 0.15)",
  ring: "rgba(240, 241, 243, 0.35)",

  buttonSecondary: "#f0f1f3",
  navActive: "#f0f1f3",
  link: "#0ea5e9",

  calendarNoSchool: "#d1d5db",
  calendarCancelled: "#d1d5db",
  calendarEventText: "#000000",

  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  dangerHover: "#b91c1c",
  successBg: "rgba(22, 163, 74, 0.1)",
  warningBg: "rgba(217, 119, 6, 0.1)",
  dangerBg: "rgba(220, 38, 38, 0.1)",

  brandPrimary: "#404040",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.08)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",

  focusRing: "0 0 0 3px rgba(240, 241, 243, 0.3)",
  todayBg: "rgba(240, 241, 243, 0.12)",
  weekViewTodayDateColor: "#0ea5e9",
  calendarCurrentDateColor: "#f0f1f3",
};

/**
 * BYU Hawaii Light Color Palette
 */
export const byuhLightPalette: ColorPalette = {
  bg: "#f5f5f5",
  panel: "#ffffff",
  panel2: "#f0f1f3",

  text: "#2a2a2a",
  textSecondary: "#5a5a5a",
  muted: "#5a5a5a",
  textMuted: "#5a5a5a",
  textDisabled: "#8a8a8a",

  border: "rgba(0, 0, 0, 0.12)",
  borderHover: "#d1d5db",
  borderActive: "#f5a6b4",
  borderStrong: "rgba(0, 0, 0, 0.16)",

  accent: "#f5a6b4",
  accentHover: "#e596a4",
  accent2: "rgba(245, 166, 180, 0.15)",
  ring: "rgba(245, 166, 180, 0.35)",

  buttonSecondary: "#f5a6b4",
  navActive: "#f5a6b4",
  link: "#0ea5e9",

  calendarNoSchool: "#d1d5db",
  calendarCancelled: "#d1d5db",
  calendarEventText: "#000000",

  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  dangerHover: "#b91c1c",
  successBg: "rgba(22, 163, 74, 0.1)",
  warningBg: "rgba(217, 119, 6, 0.1)",
  dangerBg: "rgba(220, 38, 38, 0.1)",

  brandPrimary: "#f5a6b4",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.08)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",

  focusRing: "0 0 0 3px rgba(245, 166, 180, 0.3)",
  todayBg: "rgba(245, 166, 180, 0.2)",
  weekViewTodayDateColor: "#0ea5e9",
  calendarCurrentDateColor: "#f5a6b4",
};

/**
 * BYU Idaho Light Color Palette
 */
export const byuidLightPalette: ColorPalette = {
  bg: "#f5f5f5",
  panel: "#ffffff",
  panel2: "#f0f1f3",

  text: "#2a2a2a",
  textSecondary: "#5a5a5a",
  muted: "#5a5a5a",
  textMuted: "#5a5a5a",
  textDisabled: "#8a8a8a",

  border: "rgba(0, 0, 0, 0.12)",
  borderHover: "#d1d5db",
  borderActive: "#7bbaff",
  borderStrong: "rgba(0, 0, 0, 0.16)",

  accent: "#7bbaff",
  accentHover: "#6baaee",
  accent2: "rgba(123, 186, 255, 0.15)",
  ring: "rgba(123, 186, 255, 0.35)",

  buttonSecondary: "#7bbaff",
  navActive: "#7bbaff",
  link: "#0ea5e9",

  calendarNoSchool: "#d1d5db",
  calendarCancelled: "#d1d5db",
  calendarEventText: "#000000",

  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  dangerHover: "#b91c1c",
  successBg: "rgba(22, 163, 74, 0.1)",
  warningBg: "rgba(217, 119, 6, 0.1)",
  dangerBg: "rgba(220, 38, 38, 0.1)",

  brandPrimary: "#7bbaff",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.08)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",

  focusRing: "0 0 0 3px rgba(123, 186, 255, 0.3)",
  todayBg: "rgba(123, 186, 255, 0.2)",
  weekViewTodayDateColor: "#0ea5e9",
  calendarCurrentDateColor: "#7bbaff",
};

/**
 * UVU Light Color Palette
 */
export const uvuLightPalette: ColorPalette = {
  bg: "#f5f5f5",
  panel: "#ffffff",
  panel2: "#f0f1f3",

  text: "#2a2a2a",
  textSecondary: "#5a5a5a",
  muted: "#5a5a5a",
  textMuted: "#5a5a5a",
  textDisabled: "#8a8a8a",

  border: "rgba(0, 0, 0, 0.12)",
  borderHover: "#d1d5db",
  borderActive: "#7cc49a",
  borderStrong: "rgba(0, 0, 0, 0.16)",

  accent: "#7cc49a",
  accentHover: "#92d0a8",
  accent2: "rgba(124, 196, 154, 0.15)",
  ring: "rgba(124, 196, 154, 0.35)",

  buttonSecondary: "#7cc49a",
  navActive: "#7cc49a",
  link: "#0ea5e9",

  calendarNoSchool: "#d1d5db",
  calendarCancelled: "#d1d5db",
  calendarEventText: "#000000",

  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  dangerHover: "#b91c1c",
  successBg: "rgba(22, 163, 74, 0.1)",
  warningBg: "rgba(217, 119, 6, 0.1)",
  dangerBg: "rgba(220, 38, 38, 0.1)",

  brandPrimary: "#7cc49a",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.08)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",

  focusRing: "0 0 0 3px rgba(124, 196, 154, 0.3)",
  todayBg: "rgba(124, 196, 154, 0.12)",
  weekViewTodayDateColor: "#0ea5e9",
  calendarCurrentDateColor: "#7cc49a",
};

/**
 * USU Light Color Palette
 */
export const usuLightPalette: ColorPalette = {
  bg: "#f5f5f5",
  panel: "#ffffff",
  panel2: "#f0f1f3",

  text: "#2a2a2a",
  textSecondary: "#5a5a5a",
  muted: "#5a5a5a",
  textMuted: "#5a5a5a",
  textDisabled: "#8a8a8a",

  border: "rgba(0, 0, 0, 0.12)",
  borderHover: "#d1d5db",
  borderActive: "#8ac8ff",
  borderStrong: "rgba(0, 0, 0, 0.16)",

  accent: "#8ac8ff",
  accentHover: "#9ed4ff",
  accent2: "rgba(138, 200, 255, 0.15)",
  ring: "rgba(138, 200, 255, 0.35)",

  buttonSecondary: "#8ac8ff",
  navActive: "#8ac8ff",
  link: "#0ea5e9",

  calendarNoSchool: "#d1d5db",
  calendarCancelled: "#d1d5db",
  calendarEventText: "#000000",

  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  dangerHover: "#b91c1c",
  successBg: "rgba(22, 163, 74, 0.1)",
  warningBg: "rgba(217, 119, 6, 0.1)",
  dangerBg: "rgba(220, 38, 38, 0.1)",

  brandPrimary: "#8ac8ff",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.08)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",

  focusRing: "0 0 0 3px rgba(138, 200, 255, 0.3)",
  todayBg: "rgba(138, 200, 255, 0.12)",
  weekViewTodayDateColor: "#0ea5e9",
  calendarCurrentDateColor: "#8ac8ff",
};

/**
 * UNC Light Color Palette
 */
export const uncLightPalette: ColorPalette = {
  bg: "#f5f5f5",
  panel: "#ffffff",
  panel2: "#f0f1f3",

  text: "#2a2a2a",
  textSecondary: "#5a5a5a",
  muted: "#5a5a5a",
  textMuted: "#5a5a5a",
  textDisabled: "#8a8a8a",

  border: "rgba(0, 0, 0, 0.12)",
  borderHover: "#d1d5db",
  borderActive: "#82ccff",
  borderStrong: "rgba(0, 0, 0, 0.16)",

  accent: "#82ccff",
  accentHover: "#72bcee",
  accent2: "rgba(130, 204, 255, 0.15)",
  ring: "rgba(130, 204, 255, 0.35)",

  buttonSecondary: "#82ccff",
  navActive: "#82ccff",
  link: "#0ea5e9",

  calendarNoSchool: "#d1d5db",
  calendarCancelled: "#d1d5db",
  calendarEventText: "#000000",

  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  dangerHover: "#b91c1c",
  successBg: "rgba(22, 163, 74, 0.1)",
  warningBg: "rgba(217, 119, 6, 0.1)",
  dangerBg: "rgba(220, 38, 38, 0.1)",

  brandPrimary: "#82ccff",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.08)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",

  focusRing: "0 0 0 3px rgba(130, 204, 255, 0.3)",
  todayBg: "rgba(130, 204, 255, 0.2)",
  weekViewTodayDateColor: "#007FAE",
  calendarCurrentDateColor: "#82ccff",
};

/**
 * College color palette map
 * Maps university names to their color palettes
 */
export const collegeColorPalettes: Record<string, ColorPalette> = {
  "Brigham Young University": byuColorPalette,
  "Brigham Young University Hawaii": byuhColorPalette,
  "Brigham Young University Idaho": byuidColorPalette,
  "UNC Chapel Hill": uncColorPalette,
  "Utah State University": usuColorPalette,
  "Utah Valley University": uvuColorPalette,
};

/**
 * Light mode college color palette map
 * Maps university names to their light color palettes
 */
export const collegeColorPalettesLight: Record<string, ColorPalette> = {
  "Brigham Young University": byuLightPalette,
  "Brigham Young University Hawaii": byuhLightPalette,
  "Brigham Young University Idaho": byuidLightPalette,
  "UNC Chapel Hill": uncLightPalette,
  "Utah State University": usuLightPalette,
  "Utah Valley University": uvuLightPalette,
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

  // Today background
  root.style.setProperty("--today-bg", palette.todayBg);

  // Week view today date color
  root.style.setProperty("--week-view-today-date-color", palette.weekViewTodayDateColor);

  // Calendar current date color
  root.style.setProperty("--calendar-current-date-color", palette.calendarCurrentDateColor);
}

/**
 * Get the color palette for a college
 * Returns appropriate palette based on college and theme
 * Returns default palette if no college selected
 * Returns BYU palette as fallback if college not found
 */
export function getCollegeColorPalette(
  collegeName: string | null,
  theme: 'light' | 'dark' | 'system' = 'dark'
): ColorPalette {
  // Resolve system theme to actual preference
  let actualTheme = theme;
  if (theme === 'system' && typeof window !== 'undefined') {
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  const isLight = actualTheme === 'light';

  // No college selected
  if (!collegeName) {
    return isLight ? defaultLightPalette : defaultColorPalette;
  }

  // Get appropriate palette based on theme
  const darkPalette = collegeColorPalettes[collegeName] || byuColorPalette;
  const lightPalette = collegeColorPalettesLight[collegeName] || byuLightPalette;

  return isLight ? lightPalette : darkPalette;
}
