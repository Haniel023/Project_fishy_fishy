import type { DecorItem } from '../game/types';

// Looks only. Bought with pearls if `pearls` is set, else gold `price`. Sorted by unlock level.
export const DECOR: DecorItem[] = [
  { id: 'kelp_green', name: 'Green Kelp', art: 'kelp', color: '#7fd6a0', price: 30, unlockLevel: 1, fx: 'sway' },
  { id: 'grass', name: 'Sea Grass', art: 'grass', color: '#9be08f', price: 25, unlockLevel: 1, fx: 'sway' },
  { id: 'pebbles', name: 'Pebble Pile', art: 'pebbles', color: '#cfc6e0', price: 20, unlockLevel: 1 },
  { id: 'star_pink', name: 'Pink Starfish', art: 'star', color: '#ff9fb0', price: 40, unlockLevel: 1 },
  { id: 'coral_pink', name: 'Pink Coral', art: 'coral', color: '#ff9fb8', price: 80, unlockLevel: 2 },
  { id: 'rock', name: 'Mossy Rock', art: 'rock', color: '#b9b0a2', price: 45, unlockLevel: 2 },
  { id: 'star_yellow', name: 'Sunny Starfish', art: 'star', color: '#ffd66b', price: 40, unlockLevel: 2 },
  { id: 'kelp_pink', name: 'Pink Kelp', art: 'kelp', color: '#ffa8c5', price: 60, unlockLevel: 3, fx: 'sway' },
  { id: 'conch', name: 'Conch Shell', art: 'conch', color: '#ffd2b0', price: 90, unlockLevel: 3 },
  { id: 'bubbler', name: 'Bubble Stone', art: 'bubbler', color: '#9aa7c0', price: 150, unlockLevel: 3, fx: 'bubbles' },
  { id: 'grass_red', name: 'Ruby Grass', art: 'grass', color: '#ff9a9a', price: 50, unlockLevel: 4, fx: 'sway' },
  { id: 'clam', name: 'Pearl Clam', art: 'clam', color: '#ffe4ec', price: 150, unlockLevel: 4 },
  { id: 'coral_blue', name: 'Blue Coral', art: 'coral', color: '#8fc8ff', price: 120, unlockLevel: 5 },
  { id: 'chest', name: 'Treasure Chest', art: 'chest', color: '#c98a55', price: 400, unlockLevel: 5, fx: 'bubbles' },
  { id: 'fan_orange', name: 'Sunset Fan Coral', art: 'fan', color: '#ffb37a', price: 140, unlockLevel: 6, fx: 'sway' },
  { id: 'castle', name: 'Little Castle', art: 'castle', color: '#e9dcc9', price: 500, unlockLevel: 6 },
  { id: 'arch', name: 'Rock Arch', art: 'arch', color: '#c8bba8', price: 300, unlockLevel: 7 },
  { id: 'coral_purple', name: 'Lilac Coral', art: 'coral', color: '#c9a7ff', price: 160, unlockLevel: 8 },
  { id: 'mushroom', name: 'Glow Mushrooms', art: 'mushroom', color: '#ff9fd0', price: 0, pearls: 5, unlockLevel: 8, fx: 'glow' },
  { id: 'helmet', name: 'Diver Helmet', art: 'helmet', color: '#ffc46b', price: 700, unlockLevel: 9, fx: 'bubbles' },
  { id: 'fan_lilac', name: 'Lilac Fan Coral', art: 'fan', color: '#d6b8ff', price: 200, unlockLevel: 10, fx: 'sway' },
  { id: 'ship', name: 'Sunken Ship', art: 'ship', color: '#a77b5a', price: 1200, unlockLevel: 11 },
  { id: 'castle_crystal', name: 'Crystal Castle', art: 'castle', color: '#bfe6ff', price: 0, pearls: 10, unlockLevel: 12, fx: 'glow' },
  { id: 'chest_gold', name: 'Golden Chest', art: 'chest', color: '#ffd45e', price: 0, pearls: 15, unlockLevel: 15, fx: 'bubbles' },
];

export const decorById = (id: string) => DECOR.find((d) => d.id === id)!;
