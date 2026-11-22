import { describe, expect, it } from 'vitest';
import { DIRT_PER_MIN, MAX_OFFLINE_MIN } from '../data/config';
import { speciesById } from '../data/fish';
import * as sim from './sim';
import type { Fish, GameState, Tank, UpgradeId } from './types';

const T0 = 1_700_000_000_000;
const MIN = 60_000;

// State with one goldfish 'f1' (gold 80), with optional overrides.
function setup(fish: Partial<Fish> = {}, cleanliness = 100): GameState {
  const s = sim.buyFish(sim.createState(T0), 'main', 'goldfish', T0, 'f1');
  const t = s.tanks[0];
  return { ...s, tanks: [{ ...t, cleanliness, fish: [{ ...t.fish[0], ...fish }] }] };
}
const first = (s: GameState) => s.tanks[0].fish[0];
const after = (s: GameState, minutes: number) => first(sim.tick(s, minutes));
const withUp = (s: GameState, id: UpgradeId, level: number): GameState => ({ ...s, upgrades: { ...s.upgrades, [id]: level } });

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

  it('filter slows dirt: Canister Filter with 4 fish loses ~7.0 in 60 min', () => {
    const s = withUp(setup(), 'filter', 2);
    const four = { ...s, tanks: [{ ...s.tanks[0], fish: ['a', 'b', 'c', 'd'].map((id) => ({ ...first(s), id })) }] };
    expect(sim.tick(four, 60).tanks[0].cleanliness).toBeCloseTo(100 - 60 * (100 / 720) * 1.4 * 0.6);
    expect(sim.tick(four, 60).tanks[0].cleanliness).toBeCloseTo(93.0, 1);
  });

  it('heater speeds growth: +10% Goldfish is 0.99 at minute 27, adult at 28', () => {
    const s = withUp(setup(), 'heater', 1);
    expect(after(s, 27).growth).toBeCloseTo(0.99);
    expect(after(s, 28).growth).toBe(1);
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
  it('Flakes: eats only below 90, +25 capped at 100, +1 XP', () => {
    const full = setup({ hunger: 90 });
    expect(sim.feedFish(full, 'f1')).toBe(full);
    const fed = sim.feedFish(setup({ hunger: 50 }), 'f1');
    expect(first(fed).hunger).toBe(75);
    expect(fed.xp).toBe(1);
    expect(first(sim.feedFish(setup({ hunger: 89 }), 'f1')).hunger).toBe(100);
  });

  it('Pellets: fullness 60 -> 95; fullness 90 is not eaten', () => {
    expect(first(sim.feedFish(withUp(setup({ hunger: 60 }), 'food', 1), 'f1')).hunger).toBe(95);
    const full = withUp(setup({ hunger: 90 }), 'food', 1);
    expect(sim.feedFish(full, 'f1')).toBe(full);
  });
});

describe('cleanTank', () => {
  const clean = (from: number, tool = 0) => sim.cleanTank(withUp(setup({}, from), 'tool', tool), 'main');
  it('Sponge cleans 2; 1 XP per 10% mark crossed upward, capped at 100', () => {
    expect(clean(85).xp).toBe(0);
    expect(clean(85).tanks[0].cleanliness).toBe(87);
    expect(clean(89).xp).toBe(1);
    expect(clean(99).tanks[0].cleanliness).toBe(100);
    expect(clean(99).xp).toBe(1);
    expect(clean(100).xp).toBe(0);
    expect(clean(35, 3).xp).toBe(1);
  });

  it('Brush: 88 -> 92, +1 XP', () => {
    const s = clean(88, 1);
    expect(s.tanks[0].cleanliness).toBe(92);
    expect(s.xp).toBe(1);
  });
});

describe('buying fish', () => {
  it('explains why a fish cannot be bought', () => {
    const s = sim.createState(T0);
    expect(sim.canBuy(s, 'main', 'goldfish')).toBeNull();
    expect(sim.canBuy(s, 'main', 'molly')).toBe('Locked until Lv 2');
    expect(sim.canBuy({ ...s, gold: 10 }, 'main', 'goldfish')).toBe('Not enough gold');
    let rich = { ...s, gold: 1000 };
    for (let i = 0; i < 6; i++) rich = sim.buyFish(rich, 'main', 'goldfish', T0, `f${i}`);
    expect(rich.tanks[0].fish).toHaveLength(6);
    expect(sim.canBuy(rich, 'main', 'goldfish')).toBe('Tank is full');
    expect(sim.buyFish(rich, 'main', 'goldfish', T0, 'x')).toBe(rich);
  });

  it('deducts gold and adds a baby fish to the chosen tank', () => {
    const s = sim.buyFish(sim.createState(T0), 'main', 'guppy', T0, 'g1');
    expect(s.gold).toBe(75);
    expect(first(s)).toEqual({
      id: 'g1', speciesId: 'guppy', name: 'Guppy', favorite: false, growth: 0, hunger: 100, health: 100, bornAt: T0,
    });
    const two = sim.buyFish(sim.buyTank({ ...s, level: 3, gold: 1100 }, 't2'), 't2', 'guppy', T0, 'g2');
    expect(two.tanks.map((t) => t.fish.length)).toEqual([1, 1]);
  });

  it('pearl species: Lv 20 with 20 pearls buys Aurora Betta, gold unchanged', () => {
    const s = { ...sim.createState(T0), level: 20, pearls: 20, gold: 50 };
    const b = sim.buyFish(s, 'main', 'aurora', T0, 'a1');
    expect(b).toMatchObject({ pearls: 0, gold: 50 });
    expect(first(b).speciesId).toBe('aurora');
    expect(sim.canBuy({ ...s, pearls: 19, gold: 99999 }, 'main', 'aurora')).toBe('Not enough pearls');
    expect(sim.canBuy({ ...s, level: 19 }, 'main', 'aurora')).toBe('Locked until Lv 20');
  });
});

describe('selling', () => {
  const goldfish = speciesById('goldfish');
  it('sellValue: adult is 2x price, halved when sick', () => {
    expect(sim.sellValue(first(setup({ growth: 1 })), goldfish)).toBe(40);
    expect(sim.sellValue(first(setup({ growth: 0.5 })), goldfish)).toBe(20);
    expect(sim.sellValue(first(setup({ growth: 1, health: 10 })), goldfish)).toBe(20);
  });

  it('sells for gold and XP = price x growth, but never a favorite', () => {
    const fav = setup({ growth: 1, favorite: true });
    expect(sim.sellFish(fav, 'f1')).toBe(fav);
    const s = sim.sellFish(setup({ growth: 1 }), 'f1');
    expect(s.gold).toBe(80 + 40);
    expect(s.xp).toBe(20);
    expect(s.tanks[0].fish).toHaveLength(0);
    expect(sim.sellFish(setup({ speciesId: 'clown', growth: 0.5 }), 'f1').xp).toBe(30);
  });

  it('adult Aurora Betta sells for 8000 gold and 4000 XP', () => {
    const s = { ...setup({ speciesId: 'aurora', growth: 1 }), level: 100, gold: 0 };
    expect(sim.sellFish(s, 'f1')).toMatchObject({ gold: 8000, xp: 4000, level: 100 });
  });
});

describe('levels', () => {
  it('levels up with rewards, chaining and keeping leftover xp', () => {
    const s = sim.createState(T0);
    expect(sim.addXp(s, 49)).toMatchObject({ level: 1, xp: 49, gold: 100, pearls: 5 });
    expect(sim.addXp(s, 50)).toMatchObject({ level: 2, xp: 0, gold: 200, pearls: 6 });
    expect(sim.addXp(s, 350)).toMatchObject({ level: 4, xp: 50, gold: 550, pearls: 8 });
  });

  it('Lv 1, xp 40, gain 20 -> Lv 2, xp 10, +100 gold, +1 pearl', () => {
    const s = { ...sim.createState(T0), xp: 40 };
    expect(sim.addXp(s, 20)).toMatchObject({ level: 2, xp: 10, gold: 200, pearls: 6 });
  });
});

describe('upgrades', () => {
  const s = { ...sim.createState(T0), level: 3, gold: 500 };
  it('buys the next level: food 0 -> 1 at Lv 3 costs 300', () => {
    const u = sim.buyUpgrade(s, 'food');
    expect(u.upgrades.food).toBe(1);
    expect(u.gold).toBe(200);
  });

  it('explains why an upgrade cannot be bought', () => {
    expect(sim.canUpgrade(s, 'food')).toBeNull();
    expect(sim.canUpgrade({ ...s, level: 2 }, 'food')).toBe('Locked until Lv 3');
    expect(sim.canUpgrade({ ...s, gold: 299 }, 'food')).toBe('Not enough gold');
    expect(sim.canUpgrade(withUp(s, 'food', 3), 'food')).toBe('Max level');
    expect(sim.buyUpgrade({ ...s, level: 2 }, 'food').upgrades.food).toBe(0);
  });
});

describe('tanks', () => {
  it('capacity: 6 -> 8 for 200 gold; max size at 20', () => {
    const s = { ...sim.createState(T0), gold: 300 };
    const u = sim.upgradeCapacity(s, 'main');
    expect(u.tanks[0].capacity).toBe(8);
    expect(u.gold).toBe(100);
    expect(sim.canUpgradeCapacity(u, 'main')).toBe('Not enough gold');
    const max = { ...s, tanks: [{ ...s.tanks[0], capacity: 20 }] };
    expect(sim.canUpgradeCapacity(max, 'main')).toBe('Max size');
    expect(sim.upgradeCapacity(max, 'main')).toBe(max);
  });

  it('buy tank: second for 1000 gold at Lv 3, fourth for 15 pearls at Lv 10', () => {
    const s = { ...sim.createState(T0), level: 3, gold: 1000 };
    const two = sim.buyTank(s, 't2');
    expect(two.gold).toBe(0);
    expect(two.tanks[1]).toEqual({ id: 't2', capacity: 6, cleanliness: 100, fish: [] });
    expect(sim.canBuyTank({ ...s, level: 2 })).toBe('Locked until Lv 3');
    expect(sim.canBuyTank({ ...s, gold: 999 })).toBe('Not enough gold');

    const t3 = { ...two, level: 10, pearls: 15, tanks: [...two.tanks, { ...two.tanks[1], id: 't3' }] };
    const four = sim.buyTank(t3, 't4');
    expect(four.tanks).toHaveLength(4);
    expect(four).toMatchObject({ pearls: 0, gold: 0 });
    expect(sim.canBuyTank({ ...t3, pearls: 14 })).toBe('Not enough pearls');
    const five = { ...four, tanks: [...four.tanks, { ...four.tanks[1], id: 't5' }] };
    expect(sim.canBuyTank(five)).toBe('Max tanks');
  });

  it('needsCare: dirty, hungry or sick', () => {
    const t: Tank = setup().tanks[0];
    const fish = (o: Partial<Fish>) => ({ ...t, fish: [{ ...t.fish[0], ...o }] });
    expect(sim.needsCare({ ...t, cleanliness: 29 })).toBe(true);
    expect(sim.needsCare(fish({ hunger: 29 }))).toBe(true);
    expect(sim.needsCare(fish({ health: 10 }))).toBe(true);
    expect(sim.needsCare(t)).toBe(false);
  });
});

describe('migrateSave', () => {
  it('v1 -> v2 adds upgrades and re-levels on the new curve', () => {
    const v1 = { gold: 300, pearls: 6, xp: 150, level: 2, lastTick: T0, tanks: [] };
    expect(sim.migrateSave(v1, 1)).toMatchObject({
      level: 3, xp: 50, gold: 450, pearls: 7, upgrades: { food: 0, tool: 0, filter: 0, heater: 0 },
    });
    const v2 = sim.createState(T0);
    expect(sim.migrateSave(v2, 2)).toBe(v2);
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
  const s = { ...setup({ hunger: 50, growth: 1 }, 50), level: 20, gold: 99999, pearls: 99 };
  const copy = structuredClone(s);
  sim.tick(s, 30);
  sim.catchUp(s, T0 + 30 * MIN);
  sim.feedFish(s, 'f1');
  sim.cleanTank(s, 'main');
  sim.buyFish(s, 'main', 'goldfish', T0, 'f2');
  sim.buyFish(s, 'main', 'aurora', T0, 'f3');
  sim.sellFish(s, 'f1');
  sim.renameFish(s, 'f1', 'Bob');
  sim.toggleFavorite(s, 'f1');
  sim.addXp(s, 500);
  sim.buyUpgrade(s, 'heater');
  sim.upgradeCapacity(s, 'main');
  sim.buyTank(s, 't2');
  sim.migrateSave(s, 1);
  expect(s).toEqual(copy);
});
