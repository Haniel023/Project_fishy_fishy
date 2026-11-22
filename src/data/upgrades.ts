import type { UpgradeId } from '../game/types';

export interface UpgradeLevel { name: string; cost: number; unlockLevel: number; value: number }

const lv = (name: string, cost: number, unlockLevel: number, value: number): UpgradeLevel => ({ name, cost, unlockLevel, value });

// Level 0 is the free default. value = food: fullness per pellet · tool: clean % per swipe ·
// filter: dirt rate multiplier · heater: growth bonus.
export const UPGRADES: Record<UpgradeId, UpgradeLevel[]> = {
  food: [lv('Flakes', 0, 1, 25), lv('Pellets', 300, 3, 35), lv('Premium Pellets', 1200, 7, 50), lv('Gourmet Bites', 4000, 12, 70)],
  tool: [lv('Sponge', 0, 1, 2), lv('Brush', 250, 2, 4), lv('Scrubber', 1000, 6, 7), lv('Magnet Wiper', 3500, 10, 12)],
  filter: [lv('No Filter', 0, 1, 1), lv('Basic Filter', 500, 4, 0.8), lv('Canister Filter', 2000, 8, 0.6), lv('Pro Filter', 6000, 14, 0.45)],
  heater: [lv('No Heater', 0, 1, 0), lv('Heater', 800, 5, 0.1), lv('Smart Heater', 3000, 10, 0.2), lv('Tropical Heater', 8000, 15, 0.3)],
};
