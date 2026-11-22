import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { gameNow } from './clock';
import * as sim from './sim';
import type { DecorPatch, GameState, UpgradeId } from './types';

interface Actions {
  catchUp: (now: number) => void;
  feed: (fishId: string) => void;
  clean: (tankId: string) => void;
  buy: (tankId: string, speciesId: string) => void;
  sell: (fishId: string) => void;
  rename: (fishId: string, name: string) => void;
  toggleFavorite: (fishId: string) => void;
  upgrade: (id: UpgradeId) => void;
  upgradeCapacity: (tankId: string) => void;
  buyTank: () => void;
  buyDecor: (tankId: string, itemId: string, x: number) => void;
  editDecor: (tankId: string, placedId: string, patch: DecorPatch) => void;
  removeDecor: (tankId: string, placedId: string) => void;
  buyTheme: (themeId: string) => void;
  setTheme: (tankId: string, themeId: string) => void;
  claimDaily: (serverNow: number, tz: number) => void;
  breed: (aId: string, bId: string, roll: number) => void;
}

// Thin wrapper: every action delegates to a pure function in sim.ts.
export const useGame = create<GameState & Actions>()(
  persist(
    (set) => ({
      ...sim.createState(gameNow()),
      catchUp: (now) => set((s) => sim.catchUp(s, now)),
      feed: (id) => set((s) => sim.feedFish(s, id)),
      clean: (tankId) => set((s) => sim.cleanTank(s, tankId)),
      buy: (tankId, speciesId) => set((s) => sim.buyFish(s, tankId, speciesId, gameNow(), sim.newId(), Math.random())),
      sell: (id) => set((s) => sim.sellFish(s, id)),
      rename: (id, name) => set((s) => sim.renameFish(s, id, name)),
      toggleFavorite: (id) => set((s) => sim.toggleFavorite(s, id)),
      upgrade: (id) => set((s) => sim.buyUpgrade(s, id)),
      upgradeCapacity: (tankId) => set((s) => sim.upgradeCapacity(s, tankId)),
      buyTank: () => set((s) => sim.buyTank(s, sim.newId())),
      buyDecor: (tankId, itemId, x) => set((s) => sim.buyDecor(s, tankId, itemId, sim.newId(), x)),
      editDecor: (tankId, id, patch) => set((s) => sim.editDecor(s, tankId, id, patch)),
      removeDecor: (tankId, id) => set((s) => sim.removeDecor(s, tankId, id)),
      buyTheme: (id) => set((s) => sim.buyTheme(s, id)),
      setTheme: (tankId, id) => set((s) => sim.setTheme(s, tankId, id)),
      claimDaily: (now, tz) => set((s) => sim.claimDaily(s, now, tz)),
      breed: (a, b, roll) => set((s) => sim.breed(s, a, b, gameNow(), sim.newId(), roll)),
    }),
    {
      name: 'pocket-fishies',
      version: 4,
      // Only state is persisted; the default merge keeps the actions.
      migrate: (old, version) => sim.migrateSave(old, version) as GameState & Actions,
    },
  ),
);
