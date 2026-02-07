// Sprite sheet metadata for pet companion animations
// Each animal has sprite sheets for different states

export type AnimalType = 'rottweiler' | 'dalmatian' | 'husky' | 'canecorso' | 'dogoargentino' | 'golden' | 'labrador' | 'pharaoh' | 'fox' | 'turtle' | 'parrotblue' | 'parrotgreen';
export type SpriteState = 'idle' | 'walking' | 'sitting' | 'sleeping' | 'bark' | 'sniff' | 'attack' | 'liedown';

export interface SpriteSheetData {
  src: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  frameDuration: number; // ms per frame
  loop: boolean;
}

export type AnimalSprites = Record<SpriteState, SpriteSheetData>;

// Helper to build a single sprite entry
function s(folder: string, name: string, fw: number, fh: number, count: number, dur: number, loop: boolean): SpriteSheetData {
  return { src: `/pets/${folder}/${name}.png`, frameWidth: fw, frameHeight: fh, frameCount: count, frameDuration: dur, loop };
}

// Helper to build sprite data for a dog breed with standard 64x64 frames
function dog(folder: string, frames: { idle: number; run: number; sit: number; sleep: number; bark: number; sniff: number; attack: number; liedown: number }): AnimalSprites {
  return {
    idle: s(folder, 'idle', 64, 64, frames.idle, 150, true),
    walking: s(folder, 'run', 64, 64, frames.run, 100, true),
    sitting: s(folder, 'sit', 64, 64, frames.sit, 150, false),
    sleeping: s(folder, 'sleep', 64, 64, frames.sleep, 200, true),
    bark: s(folder, 'bark', 64, 64, frames.bark, 80, false),
    sniff: s(folder, 'sniff', 64, 64, frames.sniff, 80, false),
    attack: s(folder, 'attack', 64, 64, frames.attack, 70, false),
    liedown: s(folder, 'liedown', 64, 64, frames.liedown, 120, false),
  };
}

export const sprites: Record<AnimalType, AnimalSprites> = {
  rottweiler: dog('dog', { idle: 6, run: 5, sit: 8, sleep: 8, bark: 12, sniff: 31, attack: 18, liedown: 12 }),
  dalmatian: dog('dalmatian', { idle: 7, run: 5, sit: 8, sleep: 8, bark: 12, sniff: 26, attack: 16, liedown: 12 }),
  husky: dog('husky', { idle: 6, run: 6, sit: 8, sleep: 8, bark: 10, sniff: 24, attack: 15, liedown: 12 }),
  canecorso: dog('canecorso', { idle: 7, run: 7, sit: 7, sleep: 3, bark: 9, sniff: 12, attack: 16, liedown: 7 }),
  dogoargentino: dog('dogoargentino', { idle: 7, run: 7, sit: 7, sleep: 3, bark: 9, sniff: 12, attack: 16, liedown: 7 }),
  golden: dog('golden', { idle: 10, run: 6, sit: 8, sleep: 8, bark: 11, sniff: 29, attack: 17, liedown: 12 }),
  labrador: dog('labrador', { idle: 6, run: 16, sit: 16, sleep: 16, bark: 16, sniff: 16, attack: 16, liedown: 16 }),
  pharaoh: dog('pharaoh', { idle: 6, run: 6, sit: 8, sleep: 8, bark: 9, sniff: 9, attack: 11, liedown: 8 }),

  // Fox — 32x32 frames. Uses jump for bark, idle for sniff, sit for liedown
  fox: {
    idle:     s('fox', 'idle', 32, 32, 4, 150, true),
    walking:  s('fox', 'run', 32, 32, 4, 100, true),
    sitting:  s('fox', 'sit', 32, 32, 2, 150, false),
    sleeping: s('fox', 'sleep', 32, 32, 4, 200, true),
    bark:     s('fox', 'jump', 32, 32, 10, 80, false),
    sniff:    s('fox', 'idle', 32, 32, 4, 150, false),
    attack:   s('fox', 'attack', 32, 32, 8, 70, false),
    liedown:  s('fox', 'sit', 32, 32, 2, 120, false),
  },

  // Turtle — 32x32 frames. Uses hide for bark, idle for sniff
  turtle: {
    idle:     s('turtle', 'idle', 32, 32, 8, 150, true),
    walking:  s('turtle', 'run', 32, 32, 8, 100, true),
    sitting:  s('turtle', 'sit', 32, 32, 7, 150, false),
    sleeping: s('turtle', 'sleep', 32, 32, 12, 200, true),
    bark:     s('turtle', 'hide', 32, 32, 13, 80, false),
    sniff:    s('turtle', 'idle', 32, 32, 8, 150, false),
    attack:   s('turtle', 'attack', 32, 32, 10, 70, false),
    liedown:  s('turtle', 'liedown', 32, 32, 15, 120, false),
  },

  // Parrot (blue) — 16x16 frames. Uses dash for bark, fly for sniff, sit for liedown
  parrotblue: {
    idle:     s('parrot-blue', 'idle', 16, 16, 6, 150, true),
    walking:  s('parrot-blue', 'run', 16, 16, 6, 100, true),
    sitting:  s('parrot-blue', 'sit', 16, 16, 6, 150, false),
    sleeping: s('parrot-blue', 'sleep', 16, 16, 8, 200, true),
    bark:     s('parrot-blue', 'dash', 16, 16, 4, 80, false),
    sniff:    s('parrot-blue', 'fly', 16, 16, 8, 80, false),
    attack:   s('parrot-blue', 'attack', 16, 16, 6, 70, false),
    liedown:  s('parrot-blue', 'sit', 16, 16, 6, 120, false),
  },

  // Parrot (green) — 16x16 frames. Uses dash for bark, fly for sniff, sit for liedown
  parrotgreen: {
    idle:     s('parrot-green', 'idle', 16, 16, 6, 150, true),
    walking:  s('parrot-green', 'run', 16, 16, 6, 100, true),
    sitting:  s('parrot-green', 'sit', 16, 16, 6, 150, false),
    sleeping: s('parrot-green', 'sleep', 16, 16, 8, 200, true),
    bark:     s('parrot-green', 'dash', 16, 16, 4, 80, false),
    sniff:    s('parrot-green', 'fly', 16, 16, 8, 80, false),
    attack:   s('parrot-green', 'attack', 16, 16, 6, 70, false),
    liedown:  s('parrot-green', 'sit', 16, 16, 6, 120, false),
  },
};

export const animalSize: Partial<Record<AnimalType, { desktop: number; mobile: number }>> = {
  parrotblue: { desktop: 56, mobile: 40 },
  parrotgreen: { desktop: 56, mobile: 40 },
};

// Preview size in settings grid (accounts for different frame sizes)
export const animalPreviewSize: Partial<Record<AnimalType, number>> = {
  fox: 40,
  turtle: 40,
  parrotblue: 24,
  parrotgreen: 24,
};

export const animalWalkSpeed: Partial<Record<AnimalType, number>> = {
  turtle: 60, // px/s — turtles are slow!
};

export const animalLabels: Record<AnimalType, string> = {
  rottweiler: 'Rottweiler',
  dalmatian: 'Dalmatian',
  husky: 'Husky',
  canecorso: 'Cane Corso',
  dogoargentino: 'Dogo Argentino',
  golden: 'Golden Retriever',
  labrador: 'Labrador',
  pharaoh: 'Pharaoh Hound',
  fox: 'Fox',
  turtle: 'Turtle',
  parrotblue: 'Blue Parrot',
  parrotgreen: 'Green Parrot',
};
