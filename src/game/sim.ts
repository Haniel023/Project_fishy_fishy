import * as C from '../data/config';
import { speciesById } from '../data/fish';
import { UPGRADES } from '../data/upgrades';
import type { Cost, Fish, GameState, Species, Tank, UpgradeId } from './types';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const newTank = (id: string): Tank => ({ id, capacity: C.TANK_CAPACITY, cleanliness: 100, fish: [] });
const NO_UPGRADES = { food: 0, tool: 0, filter: 0, heater: 0 };

export const createState = (now: number): GameState => ({
  gold: C.START_GOLD,
  pearls: C.START_PEARLS,
  xp: 0,
  level: 1,
  lastTick: now,
  tanks: [newTank('main')],
  upgrades: NO_UPGRADES,
});

export const isSick = (f: Fish) => f.health < C.SICK_BELOW;
export const xpNeeded = (level: number) => C.XP_PER_LEVEL * level;
export const findFish = (s: GameState, id: string) => s.tanks.flatMap((t) => t.fish).find((f) => f.id === id);
export const upgradeValue = (s: GameState, id: UpgradeId) => UPGRADES[id][s.upgrades[id]].value;
export const needsCare = (t: Tank) =>
  t.cleanliness < C.CARE_BELOW || t.fish.some((f) => f.hunger < C.CARE_BELOW || isSick(f));

const mapFish = (s: GameState, id: string, fn: (f: Fish) => Fish): GameState => ({
  ...s,
  tanks: s.tanks.map((t) => ({ ...t, fish: t.fish.map((f) => (f.id === id ? fn(f) : f)) })),
});
const mapTank = (s: GameState, id: string, fn: (t: Tank) => Tank): GameState => ({
  ...s,
  tanks: s.tanks.map((t) => (t.id === id ? fn(t) : t)),
});

// Prices are in gold or pearls.
export const priceOf = (sp: Species): Cost => (sp.pearls ? { pearls: sp.pearls } : { gold: sp.price });
const cantAfford = (s: GameState, c: Cost) =>
  s.gold < (c.gold ?? 0) ? 'Not enough gold' : s.pearls < (c.pearls ?? 0) ? 'Not enough pearls' : null;
const pay = (s: GameState, c: Cost): GameState => ({ ...s, gold: s.gold - (c.gold ?? 0), pearls: s.pearls - (c.pearls ?? 0) });

function stepFish(f: Fish, dirty: boolean, growMult: number): Fish {
  const hunger = Math.max(0, f.hunger - C.HUNGER_DECAY);
  const health = clamp(f.health + (hunger <= 0 || dirty ? -C.HEALTH_LOSS : C.HEALTH_GAIN), 0, 100);
  const grows = health >= C.SICK_BELOW && hunger > 0;
  const growth = grows ? Math.min(1, f.growth + growMult / speciesById(f.speciesId).growMinutes) : f.growth;
  return { ...f, hunger, health, growth };
}

export function tick(s: GameState, minutes: number): GameState {
  if (minutes <= 0) return s;
  const dirtMult = upgradeValue(s, 'filter');
  const growMult = 1 + upgradeValue(s, 'heater');
  return {
    ...s,
    tanks: s.tanks.map((t) => {
      let { cleanliness, fish } = t;
      for (let i = 0; i < minutes; i++) {
        const dirty = cleanliness < C.DIRTY_BELOW;
        fish = fish.map((f) => stepFish(f, dirty, growMult));
        cleanliness = Math.max(0, cleanliness - C.DIRT_PER_MIN * (1 + C.DIRT_PER_FISH * fish.length) * dirtMult);
      }
      return { ...t, cleanliness, fish };
    }),
  };
}

// Simulates at most 7 days; time beyond the cap is dropped, leftover seconds are kept.
export function catchUp(s: GameState, now: number): GameState {
  const elapsed = Math.floor((now - s.lastTick) / 60000);
  if (elapsed <= 0) return s;
  return { ...tick(s, Math.min(elapsed, C.MAX_OFFLINE_MIN)), lastTick: s.lastTick + elapsed * 60000 };
}

export function addXp(s: GameState, amount: number): GameState {
  let { xp, level, gold, pearls } = s;
  xp += amount;
  while (xp >= xpNeeded(level)) {
    xp -= xpNeeded(level);
    level += 1;
    gold += C.LEVEL_GOLD * level;
    pearls += C.LEVEL_PEARLS;
  }
  return { ...s, xp, level, gold, pearls };
}

export function feedFish(s: GameState, fishId: string): GameState {
  const f = findFish(s, fishId);
  if (!f || f.hunger >= C.FEED_BELOW) return s;
  const food = upgradeValue(s, 'food');
  return addXp(mapFish(s, fishId, (x) => ({ ...x, hunger: Math.min(100, x.hunger + food) })), C.FEED_XP);
}

export function cleanTank(s: GameState, tankId: string): GameState {
  const tank = s.tanks.find((t) => t.id === tankId);
  if (!tank || tank.cleanliness >= 100) return s;
  const cleanliness = Math.min(100, tank.cleanliness + upgradeValue(s, 'tool'));
  const next = mapTank(s, tankId, (t) => ({ ...t, cleanliness }));
  // +1 XP for every CLEAN_XP_STEP mark crossed upward.
  const xp = Math.floor(cleanliness / C.CLEAN_XP_STEP) - Math.floor(tank.cleanliness / C.CLEAN_XP_STEP);
  return xp > 0 ? addXp(next, xp) : next;
}

export function canBuy(s: GameState, tankId: string, speciesId: string): string | null {
  const sp = speciesById(speciesId);
  const tank = s.tanks.find((t) => t.id === tankId);
  if (s.level < sp.unlockLevel) return `Locked until Lv ${sp.unlockLevel}`;
  const short = cantAfford(s, priceOf(sp));
  if (short) return short;
  if (!tank || tank.fish.length >= tank.capacity) return 'Tank is full';
  return null;
}

export function buyFish(s: GameState, tankId: string, speciesId: string, now: number, id: string): GameState {
  if (canBuy(s, tankId, speciesId)) return s;
  const sp = speciesById(speciesId);
  const fish: Fish = { id, speciesId, name: sp.name, favorite: false, growth: 0, hunger: 100, health: 100, bornAt: now };
  return mapTank(pay(s, priceOf(sp)), tankId, (t) => ({ ...t, fish: [...t.fish, fish] }));
}

export const sellValue = (f: Fish, sp: Species) =>
  Math.round((sp.price * C.SELL_MULT * f.growth) / (isSick(f) ? 2 : 1));

export function sellFish(s: GameState, fishId: string): GameState {
  const f = findFish(s, fishId);
  if (!f || f.favorite) return s;
  const sp = speciesById(f.speciesId);
  const next = {
    ...s,
    gold: s.gold + sellValue(f, sp),
    tanks: s.tanks.map((t) => ({ ...t, fish: t.fish.filter((x) => x.id !== fishId) })),
  };
  return addXp(next, Math.round(sp.price * f.growth));
}

export function renameFish(s: GameState, fishId: string, name: string): GameState {
  const n = name.trim().slice(0, C.NAME_MAX);
  return n ? mapFish(s, fishId, (f) => ({ ...f, name: n })) : s;
}

export const toggleFavorite = (s: GameState, fishId: string) =>
  mapFish(s, fishId, (f) => ({ ...f, favorite: !f.favorite }));

export function canUpgrade(s: GameState, id: UpgradeId): string | null {
  const next = UPGRADES[id][s.upgrades[id] + 1];
  if (!next) return 'Max level';
  if (s.level < next.unlockLevel) return `Locked until Lv ${next.unlockLevel}`;
  return cantAfford(s, { gold: next.cost });
}

export function buyUpgrade(s: GameState, id: UpgradeId): GameState {
  if (canUpgrade(s, id)) return s;
  const level = s.upgrades[id] + 1;
  return { ...pay(s, { gold: UPGRADES[id][level].cost }), upgrades: { ...s.upgrades, [id]: level } };
}

export const capacityCost = (s: GameState, tankId: string) => {
  const tank = s.tanks.find((t) => t.id === tankId);
  return tank && C.CAPACITY_COST[tank.capacity];
};

export function canUpgradeCapacity(s: GameState, tankId: string): string | null {
  const cost = capacityCost(s, tankId);
  return cost === undefined ? 'Max size' : cantAfford(s, { gold: cost });
}

export function upgradeCapacity(s: GameState, tankId: string): GameState {
  if (canUpgradeCapacity(s, tankId)) return s;
  return mapTank(pay(s, { gold: capacityCost(s, tankId) }), tankId, (t) => ({ ...t, capacity: t.capacity + C.CAPACITY_STEP }));
}

// Cost of the next tank (undefined at max tanks).
export const tankCost = (s: GameState) => (s.tanks.length < C.MAX_TANKS ? C.TANK_COSTS[s.tanks.length - 1] : undefined);

export function canBuyTank(s: GameState): string | null {
  const c = tankCost(s);
  if (!c) return 'Max tanks';
  if (s.level < c.unlockLevel) return `Locked until Lv ${c.unlockLevel}`;
  return cantAfford(s, c);
}

export function buyTank(s: GameState, id: string): GameState {
  const c = tankCost(s);
  if (!c || canBuyTank(s)) return s;
  return { ...pay(s, c), tanks: [...s.tanks, newTank(id)] };
}

// Brings an older persisted save up to date. v1 -> v2: add upgrades, re-level xp on the new curve.
export function migrateSave(old: unknown, version: number): GameState {
  const s = old as GameState;
  return version < 2 ? addXp({ ...s, upgrades: NO_UPGRADES }, 0) : s;
}
