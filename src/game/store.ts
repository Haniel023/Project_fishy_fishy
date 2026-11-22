import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as sim from './sim';
import type { GameState } from './types';

interface Actions {
  catchUp: (now: number) => void;
  feed: (fishId: string) => void;
  clean: (tankId: string, amount: number) => void;
  buy: (speciesId: string) => void;
  sell: (fishId: string) => void;
  rename: (fishId: string, name: string) => void;
  toggleFavorite: (fishId: string) => void;
}

// Thin wrapper: every action delegates to a pure function in sim.ts.
export const useGame = create<GameState & Actions>()(
  persist(
    (set) => ({
      ...sim.createState(Date.now()),
      catchUp: (now) => set((s) => sim.catchUp(s, now)),
      feed: (id) => set((s) => sim.feedFish(s, id)),
      clean: (tankId, amount) => set((s) => sim.cleanTank(s, tankId, amount)),
      buy: (speciesId) => set((s) => sim.buyFish(s, speciesId, Date.now(), sim.newId())),
      sell: (id) => set((s) => sim.sellFish(s, id)),
      rename: (id, name) => set((s) => sim.renameFish(s, id, name)),
      toggleFavorite: (id) => set((s) => sim.toggleFavorite(s, id)),
    }),
    { name: 'pocket-fishies', version: 1 },
  ),
);
