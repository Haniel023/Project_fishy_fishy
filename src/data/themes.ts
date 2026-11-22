import type { Theme } from '../game/types';

// Tank looks: water gradient, sand, glass rim and a soft background motif. Lagoon is free and owned from the start.
export const THEMES: Theme[] = [
  { id: 'lagoon', name: 'Lagoon', unlockLevel: 1, water: ['#c9f5f1', '#8fd5ee', '#5ea6dd'], sand: ['#fbe9c0', '#efd29a'], frame: 'rgba(255,255,255,.55)', motif: 'none' },
  { id: 'reef', name: 'Coral Reef', gold: 800, unlockLevel: 4, water: ['#c6fbee', '#6fdccd', '#36adbf'], sand: ['#ffe6df', '#f6c3bc'], frame: 'rgba(255,236,230,.6)', motif: 'coral' },
  { id: 'river', name: 'Jungle River', gold: 1500, unlockLevel: 7, water: ['#dcf3c8', '#8acfab', '#3d9189'], sand: ['#c9a47c', '#977250'], frame: 'rgba(230,255,215,.55)', motif: 'leaves' },
  { id: 'candy', name: 'Candy Sea', pearls: 10, unlockLevel: 9, water: ['#ffe4f2', '#f5c9ec', '#c5aef6'], sand: ['#fff4d9', '#ffd3e6'], frame: 'rgba(255,255,255,.75)', motif: 'candy' },
  { id: 'sunken', name: 'Sunken City', gold: 3000, unlockLevel: 12, water: ['#9cc8ea', '#4581c2', '#1f4b8c'], sand: ['#c9ccd4', '#979cab'], frame: 'rgba(200,220,255,.45)', motif: 'ruins' },
  { id: 'night', name: 'Night Sky', pearls: 20, unlockLevel: 16, water: ['#4b5fa2', '#2c3676', '#221c52'], sand: ['#dcdcea', '#b0b0c8'], frame: 'rgba(205,205,255,.4)', motif: 'stars' },
];

export const themeById = (id: string) => THEMES.find((t) => t.id === id)!;
