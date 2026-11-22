import type { CSSProperties } from 'react';
import type { Theme } from '../game/types';

// CSS variables read by .tank / .tprev (water, sand, glass rim).
export const themeVars = (th: Theme) => ({
  '--w1': th.water[0], '--w2': th.water[1], '--w3': th.water[2], '--s1': th.sand[0], '--s2': th.sand[1], '--frame': th.frame,
}) as CSSProperties;

const DOTS = Array.from({ length: 12 }, (_, i) => ({ left: `${4 + ((i * 37 + 7) % 92)}%`, top: `${4 + ((i * 23 + 5) % 62)}%`, animationDelay: `${-i * 0.8}s` }));
const CANDY = ['#ffb3d1', '#b8f0d8', '#fff0a8', '#d8c4ff', '#bfe3ff'];
const LEAF = 'M0 0C7 10 7 22 0 32C-7 22-7 10 0 0Z';
const LEAVES = [[6, 20, 1.1], [20, -12, 1.4], [36, 16, 0.9], [58, -20, 1.2], [72, 6, 1.6], [88, 24, 1], [118, -14, 1.3], [134, 10, 1.7], [152, -24, 1.1], [174, 14, 1.4], [192, -6, 1]];
const col = (x: number, h: number) => `M${x} 60V${60 - h}h-3v-5h20v5h-3V60Z`;
const broken = (x: number, h: number) => `M${x} 60V${60 - h}l4 4 5-6 5 3V60Z`;

// Soft background layer behind the decor, one per theme.
export default function Motif({ motif }: { motif: Theme['motif'] }) {
  switch (motif) {
    case 'stars':
    case 'candy':
      return (
        <div className={`motif ${motif}`}>
          {DOTS.map((d, i) => <i key={i} style={{ ...d, background: motif === 'candy' ? CANDY[i % 5] : undefined }} />)}
        </div>
      );
    case 'coral':
      return (
        <svg className="motif bottom" viewBox="0 0 200 50" fill="rgba(255,120,150,.22)" stroke="rgba(255,120,150,.22)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M30 50V30M30 38L20 26V18M30 34L40 22V14M150 50V22M150 34L138 22V10M150 30L162 18V8M138 22L132 16" fill="none" />
          <ellipse cx="72" cy="48" rx="16" ry="11" stroke="none" />
          <path d="M110 50L97 36C94 26 104 20 110 24C116 20 126 26 123 36Z" strokeWidth="2" />
          <ellipse cx="186" cy="48" rx="10" ry="7" stroke="none" />
        </svg>
      );
    case 'leaves':
      return (
        <svg className="motif top" viewBox="0 0 200 50" fill="rgba(30,100,60,.3)">
          {LEAVES.map(([x, r, k], i) => <path key={x} d={LEAF} opacity={i % 2 ? 0.7 : 1} transform={`translate(${x} -4) rotate(${r}) scale(${k})`} />)}
        </svg>
      );
    case 'ruins':
      return (
        <svg className="motif bottom" viewBox="0 0 200 60" fill="rgba(15,35,80,.28)">
          <path d={col(18, 44) + broken(50, 26) + broken(96, 16) + col(176, 36)} />
          <path d="M120 60V26C120 10 162 10 162 26V60H152V28C152 19 130 19 130 28V60Z" />
        </svg>
      );
    default:
      return null;
  }
}
