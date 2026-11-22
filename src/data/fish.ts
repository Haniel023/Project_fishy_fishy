import type { Species } from '../game/types';

// pattern 'none' draws a soft belly in the accent color.
export const SPECIES: Species[] = [
  { id: 'goldfish', name: 'Goldfish', rarity: 'common', price: 20, growMinutes: 30, unlockLevel: 1,
    look: { body: 'round', tail: 'veil', main: '#ffb36b', accent: '#ffe2b8', fin: '#ff9472', pattern: 'none' } },
  { id: 'guppy', name: 'Guppy', rarity: 'common', price: 25, growMinutes: 35, unlockLevel: 1,
    look: { body: 'long', tail: 'fan', main: '#cfe3f5', accent: '#f6f9ff', fin: '#c49bff', pattern: 'none' } },
  { id: 'neon', name: 'Neon Tetra', rarity: 'common', price: 30, growMinutes: 40, unlockLevel: 1,
    look: { body: 'long', tail: 'fork', main: '#6fc3ff', accent: '#ff8095', fin: '#d4ecff', pattern: 'none' } },
  { id: 'molly', name: 'Molly', rarity: 'common', price: 35, growMinutes: 45, unlockLevel: 2,
    look: { body: 'tall', tail: 'round', main: '#8e89b8', accent: '#c4c0e2', fin: '#77729f', pattern: 'none' } },
  { id: 'platy', name: 'Platy', rarity: 'common', price: 40, growMinutes: 45, unlockLevel: 2,
    look: { body: 'round', tail: 'fan', main: '#ff8a8a', accent: '#ffd0c2', fin: '#ffb04d', pattern: 'none' } },
  { id: 'danio', name: 'Zebra Danio', rarity: 'common', price: 45, growMinutes: 50, unlockLevel: 3,
    look: { body: 'long', tail: 'fork', main: '#fff0b8', accent: '#7fa6e6', fin: '#ffe39a', pattern: 'stripes' } },
  { id: 'cory', name: 'Cory Catfish', rarity: 'common', price: 50, growMinutes: 55, unlockLevel: 3,
    look: { body: 'flat', tail: 'fork', main: '#e8d6bd', accent: '#9a7b5f', fin: '#d9c2a3', pattern: 'spots' } },
  { id: 'clown', name: 'Clownfish', rarity: 'common', price: 60, growMinutes: 60, unlockLevel: 4,
    look: { body: 'round', tail: 'round', main: '#ff9f5a', accent: '#ffffff', fin: '#ff8a3d', pattern: 'band' } },
];

export const speciesById = (id: string) => SPECIES.find((s) => s.id === id)!;
