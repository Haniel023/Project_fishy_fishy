import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as sim from './sim';
import type { GameState, UpgradeId } from './types';

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
}

// Thin wrapper: every action delegates to a pure function in sim.ts.
export const useGame = create<GameState & Actions>()(
  persist(
    (set) => ({
      ...sim.createState(Date.now()),
      catchUp: (now) => set((s) => sim.catchUp(s, now)),
      feed: (id) => set((s) => sim.feedFish(s, id)),
      clean: (tankId) => set((s) => sim.cleanTank(s, tankId)),
      buy: (tankId, speciesId) => set((s) => sim.buyFish(s, tankId, speciesId, Date.now(), sim.newId())),
      sell: (id) => set((s) => sim.sellFish(s, id)),
      rename: (id, name) => set((s) => sim.renameFish(s, id, name)),
      toggleFavorite: (id) => set((s) => sim.toggleFavorite(s, id)),
      upgrade: (id) => set((s) => sim.buyUpgrade(s, id)),
      upgradeCapacity: (tankId) => set((s) => sim.upgradeCapacity(s, tankId)),
      buyTank: () => set((s) => sim.buyTank(s, sim.newId())),
    }),
    {
      name: 'pocket-fishies',
      version: 2,
      // Only state is persisted; the default merge keeps the actions.
      migrate: (old, version) => sim.migrateSave(old, version) as GameState & Actions,
    },
  ),
);
