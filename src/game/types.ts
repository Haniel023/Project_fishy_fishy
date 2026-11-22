export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Look {
  body: 'round' | 'long' | 'tall' | 'flat';
  tail: 'fan' | 'fork' | 'round' | 'veil';
  main: string;
  accent: string;
  fin: string;
  pattern: 'none' | 'stripes' | 'spots' | 'band';
}

export interface Species {
  id: string;
  name: string;
  rarity: Rarity;
  price: number;
  growMinutes: number;
  unlockLevel: number;
  look: Look;
}

export interface Fish {
  id: string;
  speciesId: string;
  name: string;
  favorite: boolean;
  growth: number; // 0..1
  hunger: number; // 0..100 (100 = full)
  health: number; // 0..100
  bornAt: number; // ms
}

export interface Tank {
  id: string;
  capacity: number;
  cleanliness: number; // 0..100
  fish: Fish[];
}

export interface GameState {
  gold: number;
  pearls: number;
  xp: number;
  level: number;
  tanks: Tank[];
  lastTick: number; // ms
}

export type Mode = 'none' | 'feed' | 'clean';
