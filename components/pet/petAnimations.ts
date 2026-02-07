// Pet companion animation constants

export const PET_CONFIG = {
  // Movement
  walkSpeed: 200, // pixels per second

  // State durations (in ms)
  idleDurationMin: 6000,
  idleDurationMax: 15000,
  sittingDurationMin: 15000,
  sittingDurationMax: 30000,
  sleepingDurationMin: 60000,
  sleepingDurationMax: 120000,

  // Probabilities
  sleepChance: 0.5,    // chance to sleep after sitting

  // Positioning
  zIndex: 51,          // above nav (50), below modals
  bottomOffset: 8,     // px from bottom of viewport
  edgePadding: 20,     // px from viewport edges

  // Display sizes (px)
  desktopSize: 112,
  mobileSize: 72,
} as const;

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
