export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Look {
  body: 'round' | 'long' | 'tall' | 'flat' | 'angel' | 'puff';
  tail: 'fan' | 'fork' | 'round' | 'veil' | 'sword' | 'flowy';
  main: string;
  accent: string;
  fin: string;
  pattern: 'none' | 'stripes' | 'spots' | 'band' | 'gradient' | 'scales';
  shinyHue?: number; // hue shift (deg) of the shiny variant, if the default looks bad
}

export interface Species {
  id: string;
  name: string;
  rarity: Rarity;
  price: number; // gold base for selling (and buying, unless pearls is set)
  pearls?: number; // if set, buying costs this many pearls instead of gold
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
  shiny?: boolean;
  egg?: number; // minutes until it hatches (an egg does not change otherwise)
  rest?: number; // minutes until it can breed again
}

export interface Tank {
  id: string;
  capacity: number;
  cleanliness: number; // 0..100
  fish: Fish[];
  decor: Placed[];
  theme: string; // theme id
}

export type DecorArt = 'kelp' | 'grass' | 'coral' | 'fan' | 'pebbles' | 'rock' | 'arch' | 'clam' | 'conch' | 'star'
  | 'castle' | 'chest' | 'ship' | 'helmet' | 'bubbler' | 'mushroom';

export interface DecorItem {
  id: string;
  name: string;
  art: DecorArt;
  color: string;
  price: number; // gold, unless pearls is set
  pearls?: number;
  unlockLevel: number;
  fx?: 'sway' | 'bubbles' | 'glow';
}

export interface Placed { id: string; itemId: string; x: number /* 0.05..0.95 of tank width */; front: boolean; flip: boolean }
export type DecorPatch = Partial<Pick<Placed, 'x' | 'front' | 'flip'>>;

// Looks only. Cost (gold or pearls) comes from Cost; none = free.
export interface Theme extends Cost {
  id: string;
  name: string;
  unlockLevel: number;
  water: [string, string, string]; // top, mid, bottom
  sand: [string, string]; // light, dark
  frame: string;
  motif: 'none' | 'coral' | 'leaves' | 'candy' | 'ruins' | 'stars';
  noRays?: boolean; // hide the sun rays
}

export type UpgradeId = 'food' | 'tool' | 'filter' | 'heater';
export interface Cost { gold?: number; pearls?: number }

export interface GameState {
  gold: number;
  pearls: number;
  xp: number;
  level: number;
  tanks: Tank[];
  upgrades: Record<UpgradeId, number>; // current level index per upgrade (player-wide)
  themes: string[]; // owned theme ids (player-wide)
  lastTick: number; // ms
  daily: { lastDay: number; streak: number }; // lastDay = dayKey of the last claim
  found: string[]; // species ids in the collection book
  shinyFound: string[];
}

export type Mode = 'none' | 'feed' | 'clean' | 'decorate';
