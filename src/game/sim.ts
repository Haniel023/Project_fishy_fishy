import * as C from '../data/config';
import { speciesById } from '../data/fish';
import type { Fish, GameState, Species } from './types';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const createState = (now: number): GameState => ({
  gold: C.START_GOLD,
  pearls: C.START_PEARLS,
  xp: 0,
  level: 1,
  lastTick: now,
  tanks: [{ id: 'main', capacity: C.TANK_CAPACITY, cleanliness: 100, fish: [] }],
});

export const isSick = (f: Fish) => f.health < C.SICK_BELOW;
export const xpNeeded = (level: number) => C.XP_PER_LEVEL * level;
export const findFish = (s: GameState, id: string) => s.tanks.flatMap((t) => t.fish).find((f) => f.id === id);

const mapFish = (s: GameState, id: string, fn: (f: Fish) => Fish): GameState => ({
  ...s,
  tanks: s.tanks.map((t) => ({ ...t, fish: t.fish.map((f) => (f.id === id ? fn(f) : f)) })),
});

function stepFish(f: Fish, dirty: boolean): Fish {
  const hunger = Math.max(0, f.hunger - C.HUNGER_DECAY);
  const health = clamp(f.health + (hunger <= 0 || dirty ? -C.HEALTH_LOSS : C.HEALTH_GAIN), 0, 100);
  const grows = health >= C.SICK_BELOW && hunger > 0;
  const growth = grows ? Math.min(1, f.growth + 1 / speciesById(f.speciesId).growMinutes) : f.growth;
  return { ...f, hunger, health, growth };
}

export function tick(s: GameState, minutes: number): GameState {
  if (minutes <= 0) return s;
  return {
    ...s,
    tanks: s.tanks.map((t) => {
      let { cleanliness, fish } = t;
      for (let i = 0; i < minutes; i++) {
        const dirty = cleanliness < C.DIRTY_BELOW;
        fish = fish.map((f) => stepFish(f, dirty));
        cleanliness = Math.max(0, cleanliness - C.DIRT_PER_MIN * (1 + C.DIRT_PER_FISH * fish.length));
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
  return addXp(mapFish(s, fishId, (x) => ({ ...x, hunger: Math.min(100, x.hunger + C.FEED_AMOUNT) })), C.FEED_XP);
}

export function cleanTank(s: GameState, tankId: string, amount: number): GameState {
  const tank = s.tanks.find((t) => t.id === tankId);
  if (!tank || tank.cleanliness >= 100) return s;
  const cleanliness = Math.min(100, tank.cleanliness + amount);
  const next = { ...s, tanks: s.tanks.map((t) => (t.id === tankId ? { ...t, cleanliness } : t)) };
  // +1 XP for every CLEAN_XP_STEP mark crossed upward.
  const xp = Math.floor(cleanliness / C.CLEAN_XP_STEP) - Math.floor(tank.cleanliness / C.CLEAN_XP_STEP);
  return xp > 0 ? addXp(next, xp) : next;
}

export function canBuy(s: GameState, speciesId: string): string | null {
  const sp = speciesById(speciesId);
  const tank = s.tanks[0];
  if (s.level < sp.unlockLevel) return `Locked until Lv ${sp.unlockLevel}`;
  if (s.gold < sp.price) return 'Not enough gold';
  if (tank.fish.length >= tank.capacity) return 'Tank is full';
  return null;
}

export function buyFish(s: GameState, speciesId: string, now: number, id: string): GameState {
  if (canBuy(s, speciesId)) return s;
  const sp = speciesById(speciesId);
  const fish: Fish = { id, speciesId, name: sp.name, favorite: false, growth: 0, hunger: 100, health: 100, bornAt: now };
  const [tank, ...rest] = s.tanks;
  return { ...s, gold: s.gold - sp.price, tanks: [{ ...tank, fish: [...tank.fish, fish] }, ...rest] };
}

export const sellValue = (f: Fish, sp: Species) =>
  Math.round((sp.price * C.SELL_MULT * f.growth) / (isSick(f) ? 2 : 1));

export function sellFish(s: GameState, fishId: string): GameState {
  const f = findFish(s, fishId);
  if (!f || f.favorite) return s;
  const next = {
    ...s,
    gold: s.gold + sellValue(f, speciesById(f.speciesId)),
    tanks: s.tanks.map((t) => ({ ...t, fish: t.fish.filter((x) => x.id !== fishId) })),
  };
  return addXp(next, Math.round(C.SELL_XP * f.growth));
}

export function renameFish(s: GameState, fishId: string, name: string): GameState {
  const n = name.trim().slice(0, C.NAME_MAX);
  return n ? mapFish(s, fishId, (f) => ({ ...f, name: n })) : s;
}

export const toggleFavorite = (s: GameState, fishId: string) =>
  mapFish(s, fishId, (f) => ({ ...f, favorite: !f.favorite }));
