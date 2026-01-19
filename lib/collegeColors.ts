/**
 * College-dependent color palettes
 * Each college has a complete color theme that controls the entire app appearance
 */

/**
 * Database college interface - matches the API response
 */
export interface DatabaseCollege {
  id?: string;
  fullName: string;
  acronym: string;
  darkAccent: string;
  darkLink: string;
  lightAccent: string;
  lightLink: string;
  quickLinks: Array<{ label: string; url: string }>;
}

// Global cache for database colleges
let databaseColleges: DatabaseCollege[] = [];

/**
 * Set the database colleges cache
 * Called by the store after fetching colleges from API
 */
export function setDatabaseColleges(colleges: DatabaseCollege[]): void {
  databaseColleges = colleges;
}

/**
 * Get a database college by name
 */
export function getDatabaseCollege(collegeName: string): DatabaseCollege | undefined {
  return databaseColleges.find(c => c.fullName === collegeName);
}

/**
 * Get all database colleges
 */
export function getAllDatabaseColleges(): DatabaseCollege[] {
  return databaseColleges;
}

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

  // Link color (college-specific)
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

  // Edit button hover color (light mode link color in dark mode for better visibility)
  editHover: string;

  // Slider thumb color
  sliderThumb: string;
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

  link: "#6ab2ff",

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

  editHover: "#6ab2ff", // Bright link color for better visibility
  sliderThumb: "#9a9a9a",
};

/**
 * Generate a full ColorPalette from database college colors
 * Uses the 4 stored colors to create a complete palette based on the default template
 */
export function generatePaletteFromDbColors(
  accentColor: string,
  linkColor: string,
  theme: 'light' | 'dark'
): ColorPalette {
  const isLight = theme === 'light';
  const basePalette = isLight ? defaultLightPalette : defaultColorPalette;

  // Generate hover color (slightly darker/lighter)
  const accentHover = adjustColorBrightness(accentColor, isLight ? -10 : -15);

  return {
    ...basePalette,
    // Override accent colors
    accent: accentColor,
    accentHover: accentHover,
    accent2: `${accentColor}26`, // 15% opacity
    ring: `${accentColor}59`, // 35% opacity
    buttonSecondary: accentColor,
    navActive: accentColor,
    borderActive: accentColor,
    brandPrimary: accentColor,
    focusRing: `0 0 0 3px ${accentColor}4d`, // 30% opacity
    todayBg: `${accentColor}1f`, // 12% opacity
    weekViewTodayDateColor: linkColor,
    calendarCurrentDateColor: linkColor,
    editHover: linkColor,
    // Override link color
    link: linkColor,
  };
}

/**
 * Helper function to adjust color brightness
 * Positive amount lightens, negative darkens
 */
function adjustColorBrightness(hex: string, amount: number): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse RGB values
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));

  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

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

  accent: "#6d28d9",
  accentHover: "#5b21b6",
  accent2: "rgba(109, 40, 217, 0.15)",
  ring: "rgba(109, 40, 217, 0.35)",

  buttonSecondary: "#2d2d2d",

  navActive: "#6d28d9",

  link: "#a78bfa",

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

  brandPrimary: "#7c3aed",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.4)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.5)",

  focusRing: "0 0 0 3px rgba(124, 58, 237, 0.3)",

  todayBg: "rgba(124, 58, 237, 0.12)",

  weekViewTodayDateColor: "#e8e8e8",

  calendarCurrentDateColor: "#7c3aed",

  editHover: "#a78bfa",
  sliderThumb: "#9a9a9a",
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

  link: "#f5a6b4",

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

  editHover: "#f5a6b4", // Bright link color for better visibility
  sliderThumb: "#9a9a9a",
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

  link: "#7bbaff",


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

  editHover: "#7bbaff", // Bright link color for better visibility
  sliderThumb: "#9a9a9a",
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

  link: "#7cc49a",


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

  editHover: "#7cc49a", // Bright link color for better visibility
  sliderThumb: "#9a9a9a",
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

  link: "#8ac8ff",


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

  editHover: "#8ac8ff", // Bright link color for better visibility
  sliderThumb: "#9a9a9a",
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

  link: "#82ccff",


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

  editHover: "#82ccff", // Bright link color for better visibility
  sliderThumb: "#9a9a9a",
};

/**
 * ASU Color Palette - Dark theme with ASU maroon accents
 * Using official ASU brand color (dark palette)
 * Primary: #8C1D40 (ASU Maroon)
 */
export const asuColorPalette: ColorPalette = {
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
  borderActive: "#8C1D40",
  borderStrong: "rgba(255, 255, 255, 0.12)",

  accent: "#8C1D40",
  accentHover: "#6d1530",
  accent2: "rgba(140, 29, 64, 0.15)",
  ring: "rgba(140, 29, 64, 0.35)",

  buttonSecondary: "#8C1D40",

  navActive: "#8C1D40",

  link: "#ff8fa3",

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

  brandPrimary: "#8C1D40",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.4)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.5)",

  focusRing: "0 0 0 3px rgba(140, 29, 64, 0.3)",

  todayBg: "rgba(140, 29, 64, 0.12)",

  weekViewTodayDateColor: "#ff8fa3",

  calendarCurrentDateColor: "#ff8fa3",

  editHover: "#ff8fa3", // Bright link color for better visibility
  sliderThumb: "#9a9a9a",
};

/**
 * UCF Color Palette - Dark theme with UCF gold accents
 * Using official UCF brand color (dark palette)
 * Primary: #b69317 (UCF Gold)
 */
export const ucfColorPalette: ColorPalette = {
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
  borderActive: "#6d5611",
  borderStrong: "rgba(255, 255, 255, 0.12)",

  accent: "#6d5611",
  accentHover: "#5a4710",
  accent2: "rgba(109, 86, 17, 0.15)",
  ring: "rgba(109, 86, 17, 0.35)",

  buttonSecondary: "#6d5611",

  navActive: "#6d5611",

  link: "#ffc857",

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

  brandPrimary: "#6d5611",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.4)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.5)",

  focusRing: "0 0 0 3px rgba(109, 86, 17, 0.3)",

  todayBg: "rgba(109, 86, 17, 0.12)",

  weekViewTodayDateColor: "#ffc857",

  calendarCurrentDateColor: "#ffc857",

  editHover: "#ffc857", // Bright link color for better visibility
  sliderThumb: "#9a9a9a",
};

/**
 * OSU Color Palette - Dark theme with Ohio State red accents
 */
export const osuColorPalette: ColorPalette = {
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
  borderActive: "#7a0b22",
  borderStrong: "rgba(255, 255, 255, 0.12)",

  accent: "#7a0b22",
  accentHover: "#5a0818",
  accent2: "rgba(122, 11, 34, 0.15)",
  ring: "rgba(122, 11, 34, 0.35)",

  buttonSecondary: "#7a0b22",

  navActive: "#7a0b22",

  link: "#ff6b7a",

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

  brandPrimary: "#7a0b22",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.4)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.5)",

  focusRing: "0 0 0 3px rgba(122, 11, 34, 0.3)",

  todayBg: "rgba(122, 11, 34, 0.12)",

  weekViewTodayDateColor: "#ff6b7a",

  calendarCurrentDateColor: "#ff6b7a",

  editHover: "#ff6b7a", // Bright link color for better visibility
  sliderThumb: "#9a9a9a",
};

/**
 * North Lincoln High School Color Palette - Dark theme with NLHS blue accents
 * Primary: #0035a8 (NLHS Blue)
 */
export const nlhsColorPalette: ColorPalette = {
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
  borderActive: "#0035a8",
  borderStrong: "rgba(255, 255, 255, 0.12)",

  accent: "#0035a8",
  accentHover: "#002a86",
  accent2: "rgba(0, 53, 168, 0.15)",
  ring: "rgba(0, 53, 168, 0.35)",

  buttonSecondary: "#0035a8",

  navActive: "#0035a8",

  link: "#6ab2ff",

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

  brandPrimary: "#0035a8",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.4)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.5)",

  focusRing: "0 0 0 3px rgba(0, 53, 168, 0.3)",

  todayBg: "rgba(0, 53, 168, 0.12)",

  weekViewTodayDateColor: "#6ab2ff",

  calendarCurrentDateColor: "#6ab2ff",

  editHover: "#6ab2ff", // Bright link color for better visibility
  sliderThumb: "#9a9a9a",
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
  link: "#0035a8",


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
  editHover: "#6ab2ff", // Uses accent in light mode
  sliderThumb: "#bbbbbb",
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

  accent: "#a78bfa",
  accentHover: "#8b5cf6",
  accent2: "rgba(124, 58, 237, 0.15)",
  ring: "rgba(124, 58, 237, 0.35)",

  buttonSecondary: "#f0f1f3",
  navActive: "rgba(139, 92, 246, 0.25)",
  link: "#6d28d9",


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

  brandPrimary: "#a78bfa",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.08)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",

  focusRing: "0 0 0 3px rgba(167, 139, 250, 0.3)",
  todayBg: "rgba(167, 139, 250, 0.12)",
  weekViewTodayDateColor: "#a78bfa",
  calendarCurrentDateColor: "#a78bfa",
  editHover: "#8b5cf6",
  sliderThumb: "#bbbbbb",
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
  link: "#9e1b34",


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
  editHover: "#f5a6b4", // Uses accent in light mode
  sliderThumb: "#bbbbbb",
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
  link: "#0063A5",


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
  editHover: "#7bbaff", // Uses accent in light mode
  sliderThumb: "#bbbbbb",
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
  link: "#275038",


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
  editHover: "#7cc49a", // Uses accent in light mode
  sliderThumb: "#bbbbbb",
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
  link: "#0F2439",


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
  editHover: "#8ac8ff", // Uses accent in light mode
  sliderThumb: "#bbbbbb",
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
  link: "#007FAE",


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
  editHover: "#82ccff", // Uses accent in light mode
  sliderThumb: "#bbbbbb",
};

/**
 * ASU Light Color Palette
 */
export const asuLightPalette: ColorPalette = {
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
  borderActive: "#ff90b3",
  borderStrong: "rgba(0, 0, 0, 0.16)",

  accent: "#ff90b3",
  accentHover: "#ff7fa8",
  accent2: "rgba(255, 144, 179, 0.15)",
  ring: "rgba(255, 144, 179, 0.35)",

  buttonSecondary: "#ff90b3",
  navActive: "#ff90b3",
  link: "#8C1D40",


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

  brandPrimary: "#ff90b3",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.08)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",

  focusRing: "0 0 0 3px rgba(255, 144, 179, 0.3)",
  todayBg: "rgba(255, 144, 179, 0.2)",
  weekViewTodayDateColor: "#8C1D40",
  calendarCurrentDateColor: "#ff90b3",
  editHover: "#ff90b3", // Uses accent in light mode
  sliderThumb: "#bbbbbb",
};

/**
 * UCF Light Color Palette
 */
export const ucfLightPalette: ColorPalette = {
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
  borderActive: "#fedf8c",
  borderStrong: "rgba(0, 0, 0, 0.16)",

  accent: "#fedf8c",
  accentHover: "#fdd966",
  accent2: "rgba(254, 223, 140, 0.15)",
  ring: "rgba(254, 223, 140, 0.35)",

  buttonSecondary: "#fedf8c",
  navActive: "#fedf8c",
  link: "#b69317",


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

  brandPrimary: "#fedf8c",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.08)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",

  focusRing: "0 0 0 3px rgba(254, 223, 140, 0.3)",
  todayBg: "rgba(254, 223, 140, 0.2)",
  weekViewTodayDateColor: "#b69317",
  calendarCurrentDateColor: "#fedf8c",
  editHover: "#fedf8c", // Uses accent in light mode
  sliderThumb: "#bbbbbb",
};

/**
 * OSU Light Color Palette
 */
export const osuLightPalette: ColorPalette = {
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
  borderActive: "#db7d88",
  borderStrong: "rgba(0, 0, 0, 0.16)",

  accent: "#db7d88",
  accentHover: "#c96b7a",
  accent2: "rgba(219, 125, 136, 0.15)",
  ring: "rgba(219, 125, 136, 0.35)",

  buttonSecondary: "#db7d88",
  navActive: "#db7d88",
  link: "#7a0b22",

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

  brandPrimary: "#db7d88",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.08)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",

  focusRing: "0 0 0 3px rgba(219, 125, 136, 0.3)",
  todayBg: "rgba(219, 125, 136, 0.2)",
  weekViewTodayDateColor: "#7a0b22",
  calendarCurrentDateColor: "#db7d88",
  editHover: "#db7d88", // Uses accent in light mode
  sliderThumb: "#bbbbbb",
};

/**
 * North Lincoln High School Light Color Palette
 */
export const nlhsLightPalette: ColorPalette = {
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
  borderActive: "#64a7f0",
  borderStrong: "rgba(0, 0, 0, 0.16)",

  accent: "#64a7f0",
  accentHover: "#5497e0",
  accent2: "rgba(100, 167, 240, 0.15)",
  ring: "rgba(100, 167, 240, 0.35)",

  buttonSecondary: "#64a7f0",
  navActive: "#64a7f0",
  link: "#0035a8",

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

  brandPrimary: "#64a7f0",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.08)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",

  focusRing: "0 0 0 3px rgba(100, 167, 240, 0.3)",
  todayBg: "rgba(100, 167, 240, 0.2)",
  weekViewTodayDateColor: "#64a7f0",
  calendarCurrentDateColor: "#64a7f0",
  editHover: "#64a7f0", // Uses accent in light mode
  sliderThumb: "#9a9a9a",
};

/**
 * UT Austin Color Palette - Dark theme with burnt orange accents
 */
export const utaColorPalette: ColorPalette = {
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
  borderActive: "#bf5700",
  borderStrong: "rgba(255, 255, 255, 0.12)",

  accent: "#bf5700",
  accentHover: "#944200",
  accent2: "rgba(191, 87, 0, 0.15)",
  ring: "rgba(191, 87, 0, 0.35)",

  buttonSecondary: "#bf5700",

  navActive: "#bf5700",

  link: "#ff9d42",

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

  brandPrimary: "#bf5700",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.4)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.5)",

  focusRing: "0 0 0 3px rgba(191, 87, 0, 0.3)",

  todayBg: "rgba(191, 87, 0, 0.12)",

  weekViewTodayDateColor: "#ff9d42",

  calendarCurrentDateColor: "#ff9d42",

  editHover: "#ff9d42", // Bright link color for better visibility
  sliderThumb: "#9a9a9a",
};

/**
 * UT Austin Light Color Palette
 */
export const utaLightPalette: ColorPalette = {
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
  borderActive: "#fab368",
  borderStrong: "rgba(0, 0, 0, 0.16)",

  accent: "#fab368",
  accentHover: "#f5a04f",
  accent2: "rgba(250, 179, 104, 0.15)",
  ring: "rgba(250, 179, 104, 0.35)",

  buttonSecondary: "#fab368",
  navActive: "#fab368",
  link: "#bf5700",

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

  brandPrimary: "#fab368",

  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  shadowMd: "0 4px 8px 0 rgba(0, 0, 0, 0.08)",
  shadowLg: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",

  focusRing: "0 0 0 3px rgba(250, 179, 104, 0.3)",
  todayBg: "rgba(250, 179, 104, 0.2)",
  weekViewTodayDateColor: "#bf5700",
  calendarCurrentDateColor: "#fab368",
  editHover: "#fab368", // Uses accent in light mode
  sliderThumb: "#9a9a9a",
};

/**
 * College color palette map
 * Maps university names to their color palettes
 */
export const collegeColorPalettes: Record<string, ColorPalette> = {
  "Arizona State University": asuColorPalette,
  "Brigham Young University": byuColorPalette,
  "Brigham Young University Hawaii": byuhColorPalette,
  "Brigham Young University Idaho": byuidColorPalette,
  "North Lincoln High School": nlhsColorPalette,
  "Ohio State University": osuColorPalette,
  "UNC Chapel Hill": uncColorPalette,
  "University of Central Florida": ucfColorPalette,
  "University of Texas at Austin": utaColorPalette,
  "Utah State University": usuColorPalette,
  "Utah Valley University": uvuColorPalette,
};

/**
 * Light mode college color palette map
 * Maps university names to their light color palettes
 */
export const collegeColorPalettesLight: Record<string, ColorPalette> = {
  "Arizona State University": asuLightPalette,
  "Brigham Young University": byuLightPalette,
  "Brigham Young University Hawaii": byuhLightPalette,
  "Brigham Young University Idaho": byuidLightPalette,
  "North Lincoln High School": nlhsLightPalette,
  "Ohio State University": osuLightPalette,
  "UNC Chapel Hill": uncLightPalette,
  "University of Central Florida": ucfLightPalette,
  "University of Texas at Austin": utaLightPalette,
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

  // Edit button hover color
  root.style.setProperty("--edit-hover", palette.editHover);

  // Slider thumb color
  root.style.setProperty("--slider-thumb", palette.sliderThumb);
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

  // Check database colleges first
  const dbCollege = getDatabaseCollege(collegeName);
  if (dbCollege) {
    const accentColor = isLight ? dbCollege.lightAccent : dbCollege.darkAccent;
    const linkColor = isLight ? dbCollege.lightLink : dbCollege.darkLink;
    return generatePaletteFromDbColors(accentColor, linkColor, actualTheme as 'light' | 'dark');
  }

  // Fallback to hardcoded palettes
  const darkPalette = collegeColorPalettes[collegeName] || defaultColorPalette;
  const lightPalette = collegeColorPalettesLight[collegeName] || defaultLightPalette;

  return isLight ? lightPalette : darkPalette;
}

/**
 * Get the accent color for a college
 * Returns appropriate accent color based on college and theme
 * Used for FAB buttons, badges, and other accent elements
 */
export function getCollegeColor(
  collegeName: string | null | undefined,
  theme: 'light' | 'dark' | 'system' = 'dark'
): string {
  const palette = getCollegeColorPalette(collegeName || null, theme);
  return palette.accent;
}

/**
 * Custom color set for a single theme mode
 */
export interface CustomColorSet {
  accent: string;
  accentHover: string;
  accentText: string;
  link: string;
  success: string;
  warning: string;
  danger: string;
}

/**
 * Custom colors interface with separate light and dark mode colors
 */
export interface CustomColors {
  light: CustomColorSet;
  dark: CustomColorSet;
}

/**
 * Default custom colors for dark mode
 */
export const DEFAULT_CUSTOM_COLORS_DARK: CustomColorSet = {
  accent: '#7c3aed',
  accentHover: '#6d28d9',
  accentText: '#ffffff',
  link: '#a78bfa',
  success: '#57ab5a',
  warning: '#c69026',
  danger: '#e5534b',
};

/**
 * Default custom colors for light mode
 */
export const DEFAULT_CUSTOM_COLORS_LIGHT: CustomColorSet = {
  accent: '#7c3aed',
  accentHover: '#6d28d9',
  accentText: '#ffffff',
  link: '#6d28d9',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
};

/**
 * Get default custom colors for both light and dark modes
 * If a college is provided, uses that college's colors as the base
 */
export function getDefaultCustomColors(collegeName?: string | null): CustomColors {
  if (collegeName) {
    const darkPalette = getCollegeColorPalette(collegeName, 'dark');
    const lightPalette = getCollegeColorPalette(collegeName, 'light');
    return {
      dark: {
        accent: darkPalette.accent,
        accentHover: darkPalette.accentHover,
        accentText: '#ffffff',
        link: darkPalette.link,
        success: darkPalette.success,
        warning: darkPalette.warning,
        danger: darkPalette.danger,
      },
      light: {
        accent: lightPalette.accent,
        accentHover: lightPalette.accentHover,
        accentText: '#000000',
        link: lightPalette.link,
        success: lightPalette.success,
        warning: lightPalette.warning,
        danger: lightPalette.danger,
      },
    };
  }

  return {
    dark: DEFAULT_CUSTOM_COLORS_DARK,
    light: DEFAULT_CUSTOM_COLORS_LIGHT,
  };
}

/**
 * Get the custom color set for the current theme
 * Handles both old flat format and new light/dark format
 */
export function getCustomColorSetForTheme(
  customColors: CustomColors | CustomColorSet | any,
  theme: 'light' | 'dark' | 'system'
): CustomColorSet {
  let actualTheme = theme;
  if (theme === 'system' && typeof window !== 'undefined') {
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  // Handle new format with light/dark separation
  if (customColors.light && customColors.dark) {
    const colorSet = actualTheme === 'light' ? customColors.light : customColors.dark;
    // Ensure accentText is always present (for data saved before this field existed)
    return {
      ...colorSet,
      accentText: colorSet.accentText || (actualTheme === 'light' ? '#000000' : '#ffffff'),
    };
  }

  // Handle old flat format (migrate on the fly)
  if (customColors.accent) {
    return {
      accent: customColors.accent,
      accentHover: customColors.accentHover || customColors.accent,
      accentText: customColors.accentText || (actualTheme === 'light' ? '#000000' : '#ffffff'),
      link: customColors.link || customColors.accent,
      success: customColors.success || DEFAULT_CUSTOM_COLORS_DARK.success,
      warning: customColors.warning || DEFAULT_CUSTOM_COLORS_DARK.warning,
      danger: customColors.danger || DEFAULT_CUSTOM_COLORS_DARK.danger,
    };
  }

  // Fallback to defaults
  return actualTheme === 'light' ? DEFAULT_CUSTOM_COLORS_LIGHT : DEFAULT_CUSTOM_COLORS_DARK;
}

/**
 * Apply custom colors on top of the base palette
 * Takes custom color set and merges it with the default palette for the current theme
 */
export function applyCustomColors(
  customColorSet: CustomColorSet,
  theme: 'light' | 'dark' | 'system' = 'dark'
): void {
  // First get the base palette (default, no college)
  const basePalette = getCollegeColorPalette(null, theme);

  // Create a modified palette with custom colors
  const customPalette: ColorPalette = {
    ...basePalette,
    // Override accent colors
    accent: customColorSet.accent,
    accentHover: customColorSet.accentHover,
    accent2: `${customColorSet.accent}26`, // 15% opacity
    ring: `${customColorSet.accent}59`, // 35% opacity
    buttonSecondary: customColorSet.accent,
    navActive: customColorSet.accent,
    borderActive: customColorSet.accent,
    brandPrimary: customColorSet.accent,
    focusRing: `0 0 0 3px ${customColorSet.accent}4d`, // 30% opacity
    todayBg: `${customColorSet.accent}1f`, // 12% opacity
    weekViewTodayDateColor: customColorSet.accent,
    calendarCurrentDateColor: customColorSet.accent,
    editHover: customColorSet.link, // Match link color for consistency
    // Override link color
    link: customColorSet.link,
    // Override semantic colors
    success: customColorSet.success,
    warning: customColorSet.warning,
    danger: customColorSet.danger,
    dangerHover: adjustColor(customColorSet.danger, -15), // Slightly darker for hover
    successBg: `${customColorSet.success}1a`, // 10% opacity
    warningBg: `${customColorSet.warning}1a`, // 10% opacity
    dangerBg: `${customColorSet.danger}1a`, // 10% opacity
  };

  // Apply the custom palette
  applyColorPalette(customPalette);

  // Also set the custom accent text color as a CSS variable
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--accent-text', customColorSet.accentText);
  }
}

/**
 * Helper function to adjust color brightness
 * Positive amount lightens, negative darkens
 */
function adjustColor(hex: string, amount: number): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse RGB values
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));

  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
