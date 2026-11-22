import { describe, expect, it } from 'vitest';
import { DIRT_PER_MIN, MAX_OFFLINE_MIN } from '../data/config';
import { speciesById } from '../data/fish';
import * as sim from './sim';
import type { Fish, GameState } from './types';

const T0 = 1_700_000_000_000;
const MIN = 60_000;

// State with one goldfish 'f1' (gold 80), with optional overrides.
function setup(fish: Partial<Fish> = {}, cleanliness = 100): GameState {
  const s = sim.buyFish(sim.createState(T0), 'goldfish', T0, 'f1');
  const t = s.tanks[0];
  return { ...s, tanks: [{ ...t, cleanliness, fish: [{ ...t.fish[0], ...fish }] }] };
}
const first = (s: GameState) => s.tanks[0].fish[0];
const after = (s: GameState, minutes: number) => first(sim.tick(s, minutes));

describe('tick', () => {
  it('hunger decays to 0 in 240 minutes', () => {
    expect(after(setup(), 120).hunger).toBeCloseTo(50);
    expect(after(setup(), 240).hunger).toBeCloseTo(0, 6);
  });

  it('growth stops when hunger is 0', () => {
    const s = sim.tick(setup({ hunger: 10 }), 30);
    const g = first(s).growth;
    expect(first(s).hunger).toBe(0);
    expect(g).toBeGreaterThan(0);
    expect(g).toBeLessThan(1);
    expect(after(s, 30).growth).toBe(g);
  });

  it('health drops when hungry or dirty and the fish gets sick', () => {
    expect(after(setup({ hunger: 0 }), 12).health).toBeCloseTo(90);
    expect(after(setup({}, 10), 12).health).toBeCloseTo(90);
    expect(sim.isSick(after(setup({ hunger: 0 }), 90))).toBe(true);
  });

  it('sick fish do not grow, and health recovers with care', () => {
    const s = setup({ health: 20, growth: 0.2 });
    expect(after(s, 10).growth).toBe(0.2);
    const later = after(s, 60);
    expect(later.health).toBeCloseTo(45);
    expect(sim.isSick(later)).toBe(false);
    expect(later.growth).toBeGreaterThan(0.2);
  });

  it('tank gets dirtier faster with more fish', () => {
    expect(sim.tick(setup(), 60).tanks[0].cleanliness).toBeCloseTo(100 - 60 * DIRT_PER_MIN * 1.1);
  });
});

describe('catchUp', () => {
  it('equals tick for the same minutes and keeps leftover seconds', () => {
    const s = setup();
    const c = sim.catchUp(s, T0 + 95 * MIN + 30_000);
    expect(c.tanks).toEqual(sim.tick(s, 95).tanks);
    expect(c.lastTick).toBe(T0 + 95 * MIN);
    expect(sim.catchUp(c, T0 + 95 * MIN + 59_000)).toBe(c);
  });

  it('caps offline progress at 7 days', () => {
    const s = setup();
    const now = T0 + 10 * 1440 * MIN;
    const c = sim.catchUp(s, now);
    expect(c.tanks).toEqual(sim.tick(s, MAX_OFFLINE_MIN).tanks);
    expect(c.lastTick).toBe(now);
  });
});

describe('feedFish', () => {
  it('eats only below 90, +25 capped at 100, +1 XP', () => {
    const full = setup({ hunger: 90 });
    expect(sim.feedFish(full, 'f1')).toBe(full);
    const fed = sim.feedFish(setup({ hunger: 50 }), 'f1');
    expect(first(fed).hunger).toBe(75);
    expect(fed.xp).toBe(1);
    expect(first(sim.feedFish(setup({ hunger: 89 }), 'f1')).hunger).toBe(100);
  });
});

describe('cleanTank', () => {
  const clean = (from: number, amount: number) => sim.cleanTank(setup({}, from), 'main', amount);
  it('gives 1 XP per 10% mark crossed upward, capped at 100', () => {
    expect(clean(85, 2).xp).toBe(0);
    expect(clean(85, 2).tanks[0].cleanliness).toBe(87);
    expect(clean(89, 2).xp).toBe(1);
    expect(clean(95, 10).xp).toBe(1);
    expect(clean(95, 10).tanks[0].cleanliness).toBe(100);
    expect(clean(35, 40).xp).toBe(4);
    expect(clean(100, 10).xp).toBe(0);
  });
});

describe('buying', () => {
  it('explains why a fish cannot be bought', () => {
    const s = sim.createState(T0);
    expect(sim.canBuy(s, 'goldfish')).toBeNull();
    expect(sim.canBuy(s, 'molly')).toBe('Locked until Lv 2');
    expect(sim.canBuy({ ...s, gold: 10 }, 'goldfish')).toBe('Not enough gold');
    let rich = { ...s, gold: 1000 };
    for (let i = 0; i < 6; i++) rich = sim.buyFish(rich, 'goldfish', T0, `f${i}`);
    expect(rich.tanks[0].fish).toHaveLength(6);
    expect(sim.canBuy(rich, 'goldfish')).toBe('Tank is full');
    expect(sim.buyFish(rich, 'goldfish', T0, 'x')).toBe(rich);
  });

  it('deducts gold and adds a baby fish', () => {
    const s = sim.buyFish(sim.createState(T0), 'guppy', T0, 'g1');
    expect(s.gold).toBe(75);
    expect(first(s)).toEqual({
      id: 'g1', speciesId: 'guppy', name: 'Guppy', favorite: false, growth: 0, hunger: 100, health: 100, bornAt: T0,
    });
  });
});

describe('selling', () => {
  const goldfish = speciesById('goldfish');
  it('sellValue: adult is 2x price, halved when sick', () => {
    expect(sim.sellValue(first(setup({ growth: 1 })), goldfish)).toBe(40);
    expect(sim.sellValue(first(setup({ growth: 0.5 })), goldfish)).toBe(20);
    expect(sim.sellValue(first(setup({ growth: 1, health: 10 })), goldfish)).toBe(20);
  });

  it('sells for gold and XP, but never a favorite', () => {
    const fav = setup({ growth: 1, favorite: true });
    expect(sim.sellFish(fav, 'f1')).toBe(fav);
    const s = sim.sellFish(setup({ growth: 1 }), 'f1');
    expect(s.gold).toBe(80 + 40);
    expect(s.xp).toBe(10);
    expect(s.tanks[0].fish).toHaveLength(0);
  });
});

describe('levels', () => {
  it('levels up with rewards, chaining and keeping leftover xp', () => {
    const s = sim.createState(T0);
    expect(sim.addXp(s, 99)).toMatchObject({ level: 1, xp: 99, gold: 100, pearls: 5 });
    expect(sim.addXp(s, 100)).toMatchObject({ level: 2, xp: 0, gold: 200, pearls: 6 });
    expect(sim.addXp(s, 350)).toMatchObject({ level: 3, xp: 50, gold: 350, pearls: 7 });
  });
});

describe('rename & favorite', () => {
  it('trims, limits to 16 chars, keeps old name when empty; toggles favorite', () => {
    const s = setup();
    expect(first(sim.renameFish(s, 'f1', '  Bubbles  ')).name).toBe('Bubbles');
    expect(first(sim.renameFish(s, 'f1', 'x'.repeat(30))).name).toHaveLength(16);
    expect(sim.renameFish(s, 'f1', '   ')).toBe(s);
    expect(first(sim.toggleFavorite(s, 'f1')).favorite).toBe(true);
  });
});

it('never mutates the input state', () => {
  const s = setup({ hunger: 50, growth: 1 }, 50);
  const copy = structuredClone(s);
  sim.tick(s, 30);
  sim.catchUp(s, T0 + 30 * MIN);
  sim.feedFish(s, 'f1');
  sim.cleanTank(s, 'main', 60);
  sim.buyFish(s, 'goldfish', T0, 'f2');
  sim.sellFish(s, 'f1');
  sim.renameFish(s, 'f1', 'Bob');
  sim.toggleFavorite(s, 'f1');
  sim.addXp(s, 500);
  expect(s).toEqual(copy);
});
