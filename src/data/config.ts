import type { Cost } from '../game/types';

// Economy & progression
export const START_GOLD = 100;
export const START_PEARLS = 5;
export const XP_PER_LEVEL = 50; // xp to go from level L to L+1 = XP_PER_LEVEL * L
export const LEVEL_GOLD = 50; // level-up reward = LEVEL_GOLD * new level
export const LEVEL_PEARLS = 1;

// Tanks
export const TANK_CAPACITY = 6;
export const CAPACITY_STEP = 2;
export const CAPACITY_COST: Partial<Record<number, number>> = { 6: 200, 8: 400, 10: 800, 12: 1500, 14: 2500, 16: 4000, 18: 6000 }; // by current capacity; 20 is max
export const MAX_TANKS = 5;
export const TANK_COSTS: (Cost & { unlockLevel: number })[] = [ // next tank, by tanks owned (1..4)
  { gold: 1000, unlockLevel: 3 },
  { gold: 5000, unlockLevel: 8 },
  { pearls: 15, unlockLevel: 10 },
  { pearls: 30, unlockLevel: 15 },
];
export const CARE_BELOW = 30; // tank tab shows a dot when cleanliness or any fish's fullness is below this

// Simulation (per minute)
export const HUNGER_DECAY = 100 / 240; // full -> empty in 4 h
export const HEALTH_LOSS = 100 / 120;
export const HEALTH_GAIN = 100 / 240;
export const SICK_BELOW = 30;
export const DIRTY_BELOW = 20;
export const DIRT_PER_MIN = 100 / 720;
export const DIRT_PER_FISH = 0.1;
export const MAX_OFFLINE_MIN = 7 * 24 * 60;

// Actions (food and cleaning amounts come from upgrades.ts)
export const FEED_BELOW = 90;
export const FEED_XP = 1;
export const CLEAN_XP_STEP = 10; // +1 XP per 10% cleanliness mark crossed upward
export const SELL_MULT = 2; // sell gold = price * 2 * growth; sell XP = price * growth
export const NAME_MAX = 16;

// UI
export const TICK_MS = 10_000;
export const CLEAN_DRAG_PX = 40;
export const PELLET_LIFE_MS = 10_000;
export const PELLET_SINK_PX = 16; // per second
export const SELL_CONFIRM_MS = 3000;
export const TOAST_MS = 3000;
