import { describe, expect, it } from 'vitest';
import { DIRT_PER_MIN, MAX_OFFLINE_MIN } from '../data/config';
import { SPECIES, speciesById } from '../data/fish';
import * as sim from './sim';
import type { Fish, GameState, Placed, Tank, UpgradeId } from './types';

const T0 = 1_700_000_000_000;
const MIN = 60_000;
const DAY = 1440 * MIN;

// State with one goldfish 'f1' (gold 80), with optional overrides.
function setup(fish: Partial<Fish> = {}, cleanliness = 100): GameState {
  const s = sim.buyFish(sim.createState(T0), 'main', 'goldfish', T0, 'f1', 0.5);
  const t = s.tanks[0];
  return { ...s, tanks: [{ ...t, cleanliness, fish: [{ ...t.fish[0], ...fish }] }] };
}
const first = (s: GameState) => s.tanks[0].fish[0];
const after = (s: GameState, minutes: number) => first(sim.tick(s, minutes));
const withUp = (s: GameState, id: UpgradeId, level: number): GameState => ({ ...s, upgrades: { ...s.upgrades, [id]: level } });

describe('tick', () => {
  it('hunger decays to 0 in 480 minutes', () => {
    expect(after(setup(), 240).hunger).toBeCloseTo(50);
    expect(after(setup(), 480).hunger).toBeCloseTo(0, 6);
  });

  it('fed to 100 at night: after 8 h just empty, still healthy, grew all night', () => {
    const f = after(setup({ speciesId: 'aurora' }), 480);
    expect(f.hunger).toBeCloseTo(0, 6);
    expect(f.health).toBe(100);
    expect(f.growth).toBeCloseTo(480 / 1440);
  });

  it('growth stops when hunger is 0', () => {
    const s = sim.tick(setup({ hunger: 5 }), 30);
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
    for (let i = 0; i < 6; i++) rich = sim.buyFish(rich, 'main', 'goldfish', T0, `f${i}`, 0.5);
    expect(rich.tanks[0].fish).toHaveLength(6);
    expect(sim.canBuy(rich, 'main', 'goldfish')).toBe('Tank is full');
    expect(sim.buyFish(rich, 'main', 'goldfish', T0, 'x', 0.5)).toBe(rich);
  });

  it('deducts gold and adds a baby fish to the chosen tank', () => {
    const s = sim.buyFish(sim.createState(T0), 'main', 'guppy', T0, 'g1', 0.5);
    expect(s.gold).toBe(75);
    expect(first(s)).toEqual({
      id: 'g1', speciesId: 'guppy', name: 'Guppy', favorite: false, growth: 0, hunger: 100, health: 100, bornAt: T0, shiny: false,
    });
    const two = sim.buyFish(sim.buyTank({ ...s, level: 3, gold: 1100 }, 't2'), 't2', 'guppy', T0, 'g2', 0.5);
    expect(two.tanks.map((t) => t.fish.length)).toEqual([1, 1]);
  });

  it('pearl species: Lv 20 with 20 pearls buys Aurora Betta, gold unchanged', () => {
    const s = { ...sim.createState(T0), level: 20, pearls: 20, gold: 50, found: ['aurora'] }; // already in the book: no pearl
    const b = sim.buyFish(s, 'main', 'aurora', T0, 'a1', 0.5);
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
    expect(two.tanks[1]).toEqual({ id: 't2', capacity: 6, cleanliness: 100, fish: [], decor: [], theme: 'lagoon' });
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
  const oldTank = (id: string, species = ['goldfish']) =>
    ({ id, capacity: 6, cleanliness: 70, fish: species.map((speciesId, i) => ({ ...first(setup()), id: `${id}-${i}`, speciesId })) });
  const v4 = { daily: { lastDay: -1, streak: 0 }, shinyFound: [] };
  const upgrades = { food: 1, tool: 2, filter: 0, heater: 1 };

  it('v1 -> v4 adds upgrades, re-levels on the new curve, adds decor and themes, then the book (+1 pearl)', () => {
    const v1 = { gold: 300, pearls: 6, xp: 150, level: 2, lastTick: T0, tanks: [oldTank('main')] };
    expect(sim.migrateSave(v1, 1)).toEqual({
      ...v1, level: 3, xp: 50, gold: 450, pearls: 8, upgrades: { food: 0, tool: 0, filter: 0, heater: 0 },
      themes: ['lagoon'], tanks: [{ ...oldTank('main'), decor: [], theme: 'lagoon' }], ...v4, found: ['goldfish'],
    });
    const cur = sim.createState(T0);
    expect(sim.migrateSave(cur, 4)).toBe(cur);
  });

  it('v2 -> v4: both tanks get decor [] and theme lagoon; themes [lagoon]; one species found once', () => {
    const v2 = { gold: 1234, pearls: 9, xp: 40, level: 7, lastTick: T0, upgrades, tanks: [oldTank('main'), oldTank('t2')] };
    expect(sim.migrateSave(v2, 2)).toEqual({
      ...v2, themes: ['lagoon'], tanks: [{ ...oldTank('main'), decor: [], theme: 'lagoon' }, { ...oldTank('t2'), decor: [], theme: 'lagoon' }],
      ...v4, found: ['goldfish'], pearls: 10,
    });
  });

  it('v3 -> v4: a Goldfish, a Guppy and a Betta -> found all three, +3 pearls, daily { lastDay: -1, streak: 0 }', () => {
    const v3 = {
      gold: 500, pearls: 4, xp: 10, level: 9, lastTick: T0, upgrades, themes: ['lagoon', 'reef'],
      tanks: [{ ...oldTank('main', ['goldfish', 'guppy']), decor: [], theme: 'reef' }, { ...oldTank('t2', ['betta']), decor: [], theme: 'lagoon' }],
    };
    expect(sim.migrateSave(v3, 3)).toEqual({ ...v3, ...v4, pearls: 7, found: ['goldfish', 'guppy', 'betta'] });
  });
});

describe('daily gift', () => {
  const lv10 = (streak = 0, lastDay = -1): GameState => ({ ...sim.createState(T0), level: 10, gold: 0, pearls: 0, daily: { lastDay, streak } });

  it('dayKey is the local calendar day: Nov 22 23:30 UTC is Nov 23 at UTC+8; one claim per day', () => {
    const now = Date.UTC(2026, 10, 22, 23, 30);
    const key = sim.dayKey(now, -480);
    expect(key).toBe(Math.floor((now + 480 * MIN) / DAY));
    expect(key).toBe(Date.UTC(2026, 10, 23) / DAY);
    const s = lv10(0, key - 1);
    expect(sim.canClaimDaily(s, now, -480)).toBe(true);
    const c = sim.claimDaily(s, now, -480);
    expect(c.daily.lastDay).toBe(key);
    expect(sim.canClaimDaily(c, now, -480)).toBe(false);
    expect(sim.claimDaily(c, now, -480)).toBe(c);
  });

  it('Lv 10, streak 0 -> +200 gold, streak 1', () => {
    expect(sim.claimDaily(lv10(), T0, 0)).toMatchObject({ gold: 200, pearls: 0, daily: { lastDay: sim.dayKey(T0, 0), streak: 1 } });
  });

  it('streak 6 -> day 7: +3 pearls, streak 7; the next claim is day 1 again (+200 gold)', () => {
    const d7 = sim.claimDaily(lv10(6), T0, 0);
    expect(d7).toMatchObject({ gold: 0, pearls: 3, daily: { streak: 7 } });
    expect(sim.claimDaily(d7, T0 + DAY, 0)).toMatchObject({ gold: 200, pearls: 3, daily: { streak: 8 } });
  });

  it('a missed day pauses the streak instead of resetting it; rewards for days 1-7', () => {
    const d3 = sim.claimDaily(lv10(2), T0, 0);
    expect(sim.claimDaily(d3, T0 + 3 * DAY, 0)).toMatchObject({ gold: 400 + 600, daily: { streak: 4 } });
    expect([1, 2, 3, 4, 5, 6, 7].map((d) => sim.dailyReward(lv10(), d))).toEqual([
      { gold: 200 }, { gold: 300 }, { gold: 400 }, { gold: 600 }, { gold: 800 }, { gold: 1000 }, { pearls: 3 },
    ]);
  });
});

describe('shiny', () => {
  it('a shop roll below 0.02 is shiny: 0.01 -> shiny, 0.5 -> not', () => {
    const s = sim.createState(T0);
    expect(first(sim.buyFish(s, 'main', 'goldfish', T0, 'a', 0.01)).shiny).toBe(true);
    expect(first(sim.buyFish(s, 'main', 'goldfish', T0, 'a', 0.5)).shiny).toBe(false);
  });

  it('adult shiny Goldfish sells for 120 gold (20 x 2 x 3); sick -> 60', () => {
    const goldfish = speciesById('goldfish');
    expect(sim.sellValue(first(setup({ growth: 1, shiny: true })), goldfish)).toBe(120);
    expect(sim.sellValue(first(setup({ growth: 1, shiny: true, health: 10 })), goldfish)).toBe(60);
  });
});

describe('breeding', () => {
  const adult = (id: string, o: Partial<Fish> = {}): Fish => ({ ...first(setup()), id, speciesId: 'betta', name: 'Betta', growth: 1, ...o });
  const inTank = (fish: Fish[], level = 8): GameState => {
    const s = { ...sim.createState(T0), level };
    return { ...s, tanks: [{ ...s.tanks[0], fish }] };
  };
  const guppy = (id: string) => adult(id, { speciesId: 'guppy' });
  const pair = [adult('b1'), adult('b2'), guppy('g1'), guppy('g2')]; // 4/6

  it('checks the reasons in order', () => {
    const s0 = sim.createState(T0);
    const a = adult('a');
    let s: GameState = {
      ...s0, level: 7,
      tanks: [{ ...s0.tanks[0], capacity: 1, fish: [a] }, { ...s0.tanks[0], id: 't2', fish: [adult('b', { speciesId: 'guppy', growth: 0.5, health: 10, rest: 30 })] }],
    };
    const why = () => sim.canBreed(s, 'a', 'b');
    const patchB = (o: Partial<Fish>) => {
      s = { ...s, tanks: [{ ...s.tanks[0], fish: [a, { ...sim.findFish(s, 'b')!, ...o }] }] };
      return why();
    };
    expect(why()).toBe('Unlocks at Lv 8');
    s = { ...s, level: 8 };
    expect(why()).toBe('Must be in the same tank');
    expect(patchB({})).toBe('Must be the same species');
    expect(patchB({ speciesId: 'betta' })).toBe('Both must be adults');
    expect(patchB({ growth: 1, egg: 5 })).toBe('Both must be adults');
    expect(patchB({ egg: 0 })).toBe('Too sick to breed');
    expect(patchB({ health: 100 })).toBe('Resting');
    expect(patchB({ rest: 0 })).toBe('Tank is full');
    s = { ...s, tanks: [{ ...s.tanks[0], capacity: 6 }] };
    expect(why()).toBeNull();
  });

  it('Lv 7 -> locked; Betta + Guppy -> same species; a parent resting 30 -> Resting; 6/6 -> Tank is full', () => {
    expect(sim.canBreed(inTank(pair, 7), 'b1', 'b2')).toBe('Unlocks at Lv 8');
    expect(sim.canBreed(inTank(pair), 'b1', 'g1')).toBe('Must be the same species');
    expect(sim.canBreed(inTank([adult('b1'), adult('b2', { rest: 30 })]), 'b1', 'b2')).toBe('Resting');
    expect(sim.canBreed(inTank([...pair, guppy('g3'), guppy('g4')]), 'b1', 'b2')).toBe('Tank is full');
    expect(sim.canBreed(inTank(pair), 'b1', 'b2')).toBeNull();
  });

  it('Lv 8, two adult Bettas in a 4/6 tank -> egg hatching in 60 min, both rest 360, +10 XP, 5/6 fish', () => {
    const s = inTank(pair);
    const b = sim.breed(s, 'b1', 'b2', T0 + MIN, 'e1', 0.5);
    expect(b.tanks[0].fish).toHaveLength(5);
    expect(b.tanks[0].fish[4]).toEqual({
      id: 'e1', speciesId: 'betta', name: 'Betta', favorite: false, growth: 0, hunger: 100, health: 100, bornAt: T0 + MIN, egg: 60, shiny: false,
    });
    expect(b.tanks[0].fish.slice(0, 2).map((f) => f.rest)).toEqual([360, 360]);
    expect(b).toMatchObject({ xp: 10, found: ['betta'] });
    expect(sim.breed(s, 'b1', 'b2', T0, 'e1', 0.05).tanks[0].fish[4].shiny).toBe(true);
    const locked = inTank(pair, 7);
    expect(sim.breed(locked, 'b1', 'b2', T0, 'e1', 0.5)).toBe(locked);
  });

  it('egg 60: unchanged after 59 min, a baby at 60, then grows (30 more min -> 30/120); parents rest down', () => {
    const s = sim.breed(inTank(pair), 'b1', 'b2', T0, 'e1', 0.5);
    const egg = (x: GameState) => x.tanks[0].fish[4];
    const s59 = sim.tick(s, 59);
    expect(egg(s59)).toMatchObject({ egg: 1, hunger: 100, health: 100, growth: 0 });
    const s60 = sim.tick(s59, 1);
    expect(egg(s60)).toMatchObject({ hunger: 100, health: 100, growth: 0 });
    expect(sim.isEgg(egg(s60))).toBe(false);
    expect(egg(sim.tick(s60, 30)).growth).toBeCloseTo(30 / 120);
    expect(s60.tanks[0].fish[0].rest).toBe(300);
  });

  it('eggs cannot be sold or bred', () => {
    const s = sim.breed(inTank(pair), 'b1', 'b2', T0, 'e1', 0.5);
    expect(sim.sellFish(s, 'e1')).toBe(s);
    expect(sim.canBreed(s, 'e1', 'b1')).toBe('Both must be adults');
  });
});

describe('collection book', () => {
  const commons = SPECIES.filter((sp) => sp.rarity === 'common').map((sp) => sp.id);

  it('11 of 12 commons found: buying the 12th gives +1 +5 pearls; buying it again +0', () => {
    const s = { ...sim.createState(T0), level: 6, gold: 1000, pearls: 0, found: commons.filter((id) => id !== 'honey') };
    const a = sim.buyFish(s, 'main', 'honey', T0, 'h1', 0.5);
    expect(a.pearls).toBe(6);
    expect(a.found).toHaveLength(12);
    expect(sim.buyFish(a, 'main', 'honey', T0, 'h2', 0.5).pearls).toBe(6);
  });

  it('a first shiny Goldfish when Goldfish is already found: +1 pearl', () => {
    const s = { ...sim.createState(T0), pearls: 0, found: ['goldfish'] };
    const a = sim.buyFish(s, 'main', 'goldfish', T0, 'g1', 0.01);
    expect(a).toMatchObject({ pearls: 1, found: ['goldfish'], shinyFound: ['goldfish'] });
    expect(sim.discover(a, 'goldfish', true)).toBe(a);
    expect(sim.discover(a, 'koi', false)).toMatchObject({ pearls: 2, found: ['goldfish', 'koi'] });
  });
});

describe('decor', () => {
  const placed = (id: string, itemId: string): Placed => ({ id, itemId, x: 0.5, front: false, flip: false });
  const withDecor = (o: Partial<GameState>, decor: Placed[]): GameState => {
    const s = { ...sim.createState(T0), ...o };
    return { ...s, tanks: [{ ...s.tanks[0], decor }] };
  };
  const decor = (s: GameState) => s.tanks[0].decor;

  it('Lv 5, 500 gold, 11 decor: buys a Treasure Chest (gold 100, 12 decor); again -> tank decor is full', () => {
    const s = withDecor({ level: 5, gold: 500 }, Array.from({ length: 11 }, (_, i) => placed(`d${i}`, 'pebbles')));
    const b = sim.buyDecor(s, 'main', 'chest', 'c1', 0.4);
    expect(b.gold).toBe(100);
    expect(decor(b)).toHaveLength(12);
    expect(decor(b)[11]).toEqual({ id: 'c1', itemId: 'chest', x: 0.4, front: false, flip: false });
    expect(sim.canBuyDecor(b, 'main', 'chest')).toBe('Tank decor is full');
    expect(sim.buyDecor(b, 'main', 'chest', 'c2', 0.4)).toBe(b);
    expect(sim.canBuyDecor({ ...s, level: 4 }, 'main', 'chest')).toBe('Locked until Lv 5');
    expect(sim.canBuyDecor({ ...s, gold: 399 }, 'main', 'chest')).toBe('Not enough gold');
    expect(decor(sim.buyDecor(s, 'main', 'chest', 'c1', 1.3))[11].x).toBe(0.95);
  });

  it('Lv 12, 10 pearls: buys a Crystal Castle with pearls, gold unchanged', () => {
    const s = withDecor({ level: 12, pearls: 10, gold: 50 }, []);
    const b = sim.buyDecor(s, 'main', 'castle_crystal', 'k1', 0.5);
    expect(b).toMatchObject({ pearls: 0, gold: 50 });
    expect(decor(b).map((d) => d.itemId)).toEqual(['castle_crystal']);
    expect(sim.canBuyDecor({ ...s, pearls: 9, gold: 99999 }, 'main', 'castle_crystal')).toBe('Not enough pearls');
  });

  it('editDecor clamps x to 0.05..0.95; a flip patch only changes flip', () => {
    const s = withDecor({}, [placed('d1', 'rock')]);
    expect(decor(sim.editDecor(s, 'main', 'd1', { x: 1.3 }))[0].x).toBe(0.95);
    expect(decor(sim.editDecor(s, 'main', 'd1', { x: -0.2 }))[0].x).toBe(0.05);
    expect(decor(sim.editDecor(s, 'main', 'd1', { flip: true }))[0]).toEqual({ ...placed('d1', 'rock'), flip: true });
  });

  it('removeDecor refunds half, rounded down: Treasure Chest +200 gold, Golden Chest +7 pearls', () => {
    const s = withDecor({ gold: 0, pearls: 0 }, [placed('c', 'chest'), placed('g', 'chest_gold')]);
    const a = sim.removeDecor(s, 'main', 'c');
    expect(a).toMatchObject({ gold: 200, pearls: 0 });
    expect(decor(a).map((d) => d.id)).toEqual(['g']);
    expect(sim.removeDecor(s, 'main', 'g')).toMatchObject({ gold: 0, pearls: 7 });
    expect(sim.removeDecor(s, 'main', 'nope')).toBe(s);
  });
});

describe('themes', () => {
  it('Lv 4, 1000 gold: buys Coral Reef -> gold 200, themes [lagoon, reef]', () => {
    const s = { ...sim.createState(T0), level: 4, gold: 1000 };
    const b = sim.buyTheme(s, 'reef');
    expect(b.gold).toBe(200);
    expect(b.themes).toEqual(['lagoon', 'reef']);
    expect(sim.canBuyTheme(b, 'reef')).toBe('Owned');
    expect(sim.canBuyTheme(s, 'lagoon')).toBe('Owned');
    expect(sim.canBuyTheme({ ...s, level: 3 }, 'reef')).toBe('Locked until Lv 4');
    expect(sim.canBuyTheme({ ...s, gold: 799 }, 'reef')).toBe('Not enough gold');
    expect(sim.canBuyTheme({ ...s, level: 9, pearls: 9 }, 'candy')).toBe('Not enough pearls');
  });

  it('setTheme applies owned themes only', () => {
    const s = { ...sim.createState(T0), themes: ['lagoon', 'reef'] };
    expect(sim.setTheme(s, 'main', 'reef').tanks[0].theme).toBe('reef');
    expect(sim.setTheme(s, 'main', 'night')).toBe(s);
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
  const base = { ...setup({ hunger: 50, growth: 1 }, 50), level: 20, gold: 99999, pearls: 99 };
  const f = first(base);
  const fish = [f, { ...f, id: 'f9' }, { ...f, id: 'e9', growth: 0, egg: 10 }, { ...f, id: 'r9', rest: 20 }];
  const s = { ...base, tanks: [{ ...base.tanks[0], fish, decor: [{ id: 'd1', itemId: 'chest', x: 0.5, front: false, flip: false }] }] };
  const copy = structuredClone(s);
  sim.tick(s, 30);
  sim.catchUp(s, T0 + 30 * MIN);
  sim.feedFish(s, 'f1');
  sim.cleanTank(s, 'main');
  sim.buyFish(s, 'main', 'goldfish', T0, 'f2', 0.01);
  sim.buyFish(s, 'main', 'aurora', T0, 'f3', 0.5);
  sim.sellFish(s, 'f1');
  sim.renameFish(s, 'f1', 'Bob');
  sim.toggleFavorite(s, 'f1');
  sim.addXp(s, 500);
  sim.buyUpgrade(s, 'heater');
  sim.upgradeCapacity(s, 'main');
  sim.buyTank(s, 't2');
  sim.migrateSave(s, 1);
  sim.migrateSave(s, 2);
  sim.buyDecor(s, 'main', 'castle_crystal', 'd2', 0.3);
  sim.editDecor(s, 'main', 'd1', { x: 2, flip: true, front: true });
  sim.removeDecor(s, 'main', 'd1');
  sim.buyTheme(s, 'reef');
  sim.setTheme({ ...s, themes: ['lagoon', 'reef'] }, 'main', 'reef');
  sim.migrateSave(s, 3);
  sim.claimDaily(s, T0, 0);
  sim.discover(s, 'koi', true);
  sim.breed(s, 'f1', 'f9', T0, 'e1', 0.01);
  sim.sellFish(s, 'e9');
  expect(sim.canBreed(s, 'f1', 'f9')).toBeNull();
  expect(s).toEqual(copy);
});
