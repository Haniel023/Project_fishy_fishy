export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Look {
  body: 'round' | 'long' | 'tall' | 'flat' | 'angel' | 'puff';
  tail: 'fan' | 'fork' | 'round' | 'veil' | 'sword' | 'flowy';
  main: string;
  accent: string;
  fin: string;
  pattern: 'none' | 'stripes' | 'spots' | 'band' | 'gradient' | 'scales';
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
}

export interface Tank {
  id: string;
  capacity: number;
  cleanliness: number; // 0..100
  fish: Fish[];
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
  lastTick: number; // ms
}

export type Mode = 'none' | 'feed' | 'clean';
