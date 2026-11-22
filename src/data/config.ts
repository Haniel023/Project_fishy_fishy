// Economy & progression
export const START_GOLD = 100;
export const START_PEARLS = 5;
export const TANK_CAPACITY = 6;
export const XP_PER_LEVEL = 100; // xp to go from level L to L+1 = XP_PER_LEVEL * L
export const LEVEL_GOLD = 50; // level-up reward = LEVEL_GOLD * new level
export const LEVEL_PEARLS = 1;

// Simulation (per minute)
export const HUNGER_DECAY = 100 / 240; // full -> empty in 4 h
export const HEALTH_LOSS = 100 / 120;
export const HEALTH_GAIN = 100 / 240;
export const SICK_BELOW = 30;
export const DIRTY_BELOW = 20;
export const DIRT_PER_MIN = 100 / 720;
export const DIRT_PER_FISH = 0.1;
export const MAX_OFFLINE_MIN = 7 * 24 * 60;

// Actions
export const FEED_BELOW = 90;
export const FEED_AMOUNT = 25;
export const FEED_XP = 1;
export const CLEAN_XP_STEP = 10; // +1 XP per 10% cleanliness mark crossed upward
export const SELL_MULT = 2;
export const SELL_XP = 10;
export const NAME_MAX = 16;

// UI
export const TICK_MS = 10_000;
export const CLEAN_DRAG_PX = 40;
export const CLEAN_AMOUNT = 2;
export const PELLET_LIFE_MS = 10_000;
export const PELLET_SINK_PX = 16; // per second
export const SELL_CONFIRM_MS = 3000;
export const TOAST_MS = 3000;
