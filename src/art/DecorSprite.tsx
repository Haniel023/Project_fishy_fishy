import type { ReactNode } from 'react';
import type { DecorArt, DecorItem } from '../game/types';

// Mixes a #rrggbb color toward black (to = 0) or white (to = 255) by t (0..1).
const mix = (hex: string, to: number, t: number) =>
  '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - t) + to * t).toString(16).padStart(2, '0')).join('');

const INK = '#3a3352';
const GLASS = '#cdeeff';
const moss = { fill: '#a8dc8f', stroke: '#6fae63' };
const coin = { fill: '#ffd45e', stroke: '#e9a93a' };
const shine = { fill: '#fff', stroke: 'none', opacity: 0.6 };
const BLADES = ['M18 44Q8 36 10 26Q16 34 24 44Z', 'M30 44Q40 32 46 26Q42 38 38 44Z', 'M8 44Q2 30 4 16Q12 30 14 44Z',
  'M22 44Q28 22 38 10Q32 30 30 44Z', 'M14 44Q12 18 20 4Q22 26 22 44Z'];
const CORAL = 'M28 50V34M28 42L15 30V16M28 38L41 26V12M15 30L8 23M41 26L49 20M28 34L27 22';
const star = (i: number, r: number) => [18 + r * Math.cos(Math.PI * (i / 5 - 0.5)), 18 + r * Math.sin(Math.PI * (i / 5 - 0.5))];
const STAR = 'M' + Array.from({ length: 10 }, (_, i) => star(i, i % 2 ? 7 : 15.5).map((n) => n.toFixed(1)).join(' ')).join('L') + 'Z';

type Draw = (c: string, dk: string, lt: string) => ReactNode;
// [width, height, drawing]: viewBox units = display px, standing on the bottom edge. Strokes default to the dark shade.
export const ART: Record<DecorArt, [number, number, Draw]> = {
  kelp: [36, 96, (c, _, lt) => <>
    <path d="M14 96C4 86 2 72 6 58C13 68 18 82 21 96Z" fill={lt} />
    <path d="M24 96C26 84 31 76 34 64C36 78 32 90 29 96Z" fill={lt} />
    <path d="M16 96C8 80 24 66 13 50C5 36 18 20 14 4C28 14 32 34 24 48C34 62 24 80 26 96Z" fill={c} />
    <path d="M20 90C16 76 25 64 19 50C13 38 21 26 17 12" stroke={lt} strokeWidth="1.6" />
  </>],
  grass: [48, 44, (c, _, lt) => <>{BLADES.map((d, i) => <path key={d} d={d} fill={i < 2 ? lt : c} />)}</>],
  coral: [56, 54, (c, dk, lt) => <>
    <path d={CORAL} stroke={dk} strokeWidth="11" />
    <path d={CORAL} stroke={c} strokeWidth="7" />
    <path d="M14 18v1M40 14v1M26 24v1M48 21v1M8 24v1" stroke={lt} strokeWidth="3" />
  </>],
  fan: [60, 56, (c, dk) => <>
    <rect x="27" y="44" width="6" height="12" rx="2" fill={dk} />
    <path d="M30 48L6 30C1 18 10 6 20 10C24 1 36 1 40 10C50 6 59 18 54 30Z" fill={c} />
    <path d="M30 48L12 20M30 48L23 9M30 48V6M30 48L37 9M30 48L48 20M13 30Q30 21 47 30M19 18Q30 12 41 18" strokeWidth="1.4" opacity=".5" />
  </>],
  pebbles: [56, 24, (c, _, lt) => <>
    {([[16, 14, 11, 8, c], [39, 13, 12, 9, lt], [27, 18, 10, 6, mix(c, 0, 0.1)], [48, 19, 7, 5, c], [8, 20, 6, 4, lt]] as const).map(([x, y, rx, ry, f]) => (
      <g key={x}><ellipse cx={x} cy={y} rx={rx} ry={ry} fill={f} strokeWidth="1.6" /><ellipse cx={x - rx * 0.3} cy={y - ry * 0.4} rx={rx * 0.35} ry={ry * 0.25} {...shine} /></g>
    ))}
  </>],
  rock: [64, 40, (c, dk, lt) => <>
    <path d="M3 40C1 27 10 15 24 13C32 4 50 5 56 16C64 22 64 34 61 40Z" fill={c} />
    <path d="M13 18C20 8 33 6 39 10C46 6 53 10 56 16C49 15 45 19 39 17C31 21 22 16 13 18Z" {...moss} />
    <ellipse cx="22" cy="28" rx="7" ry="3.5" fill={lt} stroke="none" />
    <path d="M44 30h.1M50 25h.1M36 34h.1" stroke={dk} strokeWidth="3" opacity=".4" />
  </>],
  arch: [100, 62, (c, dk, lt) => <>
    <path d="M4 62C1 40 12 14 38 8C55 2 80 7 90 22C98 34 99 50 96 62H74C75 46 66 34 52 34C38 34 27 46 28 62Z" fill={c} />
    <path d="M30 13C40 5 62 3 76 10C66 9 56 13 48 11C41 13 35 14 30 13Z" {...moss} />
    <path d="M12 38C16 26 24 18 34 14" stroke={lt} strokeWidth="3" />
    <path d="M14 52h.1M84 30h.1M88 48h.1M62 22h.1" stroke={dk} strokeWidth="3.5" opacity=".35" />
  </>],
  clam: [44, 38, (c, dk) => <>
    <path d="M6 24C3 10 13 2 22 2C31 2 41 10 38 24Z" fill={c} />
    <path d="M22 5V22M14 7L17 22M30 7L27 22M9 13L13 22M35 13L31 22" strokeWidth="1.4" opacity=".45" />
    <ellipse cx="22" cy="24" rx="16" ry="5" fill="#ffc2d4" />
    <circle cx="22" cy="20.5" r="5.5" fill="#f7f1ff" stroke="#c9bde0" />
    <circle cx="20" cy="18.5" r="1.8" fill="#fff" stroke="none" />
    <path d="M4 24H40C40 33 32 38 22 38C12 38 4 33 4 24Z" fill={c} />
    <path d="M22 27V36M14 27L15 35M30 27L29 35" stroke={dk} strokeWidth="1.4" opacity=".45" />
  </>],
  conch: [44, 32, (c, _, lt) => <>
    <path d="M3 28C1 20 6 12 12 9L11 3L17 7C19 6 21 6 23 6L25 1L28 6C36 7 42 13 41 21C40 29 28 32 3 28Z" fill={c} />
    <path d="M9 24C9 17 16 12 25 12M16 26C17 20 22 17 28 17" strokeWidth="1.5" opacity=".5" />
    <path d="M24 28C26 20 34 18 40 22C40 27 33 29 24 28Z" fill="#ffb3c1" />
    <ellipse cx="14" cy="16" rx="4" ry="2" fill={lt} stroke="none" />
  </>],
  star: [36, 34, (c, dk, lt) => <g transform="rotate(-12 18 18)">
    <path d={STAR} fill={c} stroke={dk} strokeWidth="5" />
    <path d={STAR} fill={c} stroke={c} strokeWidth="2" />
    <path d={[0, 2, 4, 6, 8].map((i) => `M${star(i, 10.5).join(' ')}h.1`).join('')} stroke={lt} strokeWidth="2.6" />
    <path d="M15.5 17h.1M20.5 17h.1" stroke={INK} strokeWidth="2.6" />
    <path d="M16.5 20q1.5 1.6 3 0" stroke={INK} strokeWidth="1.2" />
  </g>],
  castle: [64, 80, (c, dk, lt) => <>
    <rect x="4" y="34" width="14" height="46" fill={c} />
    <rect x="46" y="34" width="14" height="46" fill={c} />
    <path d="M2 36L11 16L20 36ZM44 36L53 16L62 36Z" fill={mix(c, 0, 0.18)} />
    <path d="M32 10V2l8 3-8 3" fill="#ffb3c6" />
    <path d="M18 80V16h6v5h5v-5h6v5h5v-5h6V80Z" fill={lt} />
    <path d="M26 80V70a6 6 0 0 1 12 0V80Z" fill={dk} />
    <rect x="29" y="32" width="6" height="9" rx="3" fill={dk} />
    <rect x="8.5" y="44" width="5" height="8" rx="2.5" fill={dk} />
    <rect x="50.5" y="44" width="5" height="8" rx="2.5" fill={dk} />
  </>],
  chest: [56, 46, (c, _, lt) => <>
    <path d="M6 22C6 8 50 8 50 22Z" fill={c} transform="rotate(-14 6 22)" />
    <circle cx="20" cy="22" r="5" {...coin} /><circle cx="36" cy="21" r="5" {...coin} /><circle cx="28" cy="19" r="5" {...coin} />
    <rect x="4" y="22" width="48" height="24" rx="4" fill={c} />
    <path d="M4 33H52" opacity=".35" />
    <path d="M14 23V45M42 23V45" strokeWidth="5" opacity=".5" />
    <rect x="24" y="26" width="8" height="9" rx="2" fill={lt} />
  </>],
  ship: [120, 70, (c, dk, lt) => <>
    <path d="M46 50L54 4" stroke={dk} strokeWidth="6" />
    <path d="M46 50L54 4" stroke={c} strokeWidth="3" />
    <path d="M52 12L78 18L74 32L68 28L62 36L56 30L49 34Z" fill={lt} opacity=".85" />
    <path d="M70 44L72 26L96 22L99 38Z" fill={mix(c, 255, 0.2)} />
    <rect x="78" y="28" width="5" height="5" rx="1" fill={dk} /><rect x="88" y="26.5" width="5" height="5" rx="1" fill={dk} />
    <path d="M3 44C30 50 80 44 117 32L108 58C80 66 40 70 13 68Z" fill={c} />
    <path d="M9 57C40 61 80 56 111 46" opacity=".4" />
    <circle cx="30" cy="59" r="3.5" fill={lt} /><circle cx="52" cy="58" r="3.5" fill={lt} /><circle cx="74" cy="55" r="3.5" fill={lt} />
    <path d="M94 52l5 5-5 5-5-4z" fill={dk} />
  </>],
  helmet: [54, 58, (c, dk, lt) => <>
    <circle cx="27" cy="26" r="22" fill={c} />
    <path d="M11 17a19 19 0 0 1 10-10" stroke={lt} strokeWidth="3" />
    <rect x="6" y="44" width="42" height="14" rx="5" fill={mix(c, 0, 0.12)} />
    <circle cx="29" cy="27" r="11" fill={GLASS} stroke={dk} strokeWidth="3.5" />
    <path d="M29 17V37M19 27H39" strokeWidth="1.5" opacity=".5" />
    <path d="M23 22a7 7 0 0 1 6-3" stroke="#fff" />
    <path d="M13 51h.1M27 51h.1M41 51h.1M8 30h.1" stroke={lt} strokeWidth="4" />
  </>],
  bubbler: [40, 20, (c, dk, lt) => <>
    <path d="M3 20C1 11 10 6 20 6C30 6 39 11 37 20Z" fill={c} />
    <path d="M13 12h.1M20 10h.1M27 12h.1" stroke={dk} strokeWidth="3.2" />
    <ellipse cx="11" cy="15" rx="4" ry="2" fill={lt} stroke="none" />
  </>],
  mushroom: [46, 44, (c, _, lt) => <>
    <rect x="19" y="20" width="8" height="24" rx="4" fill={lt} />
    <path d="M8 24C8 9 38 9 38 24Z" fill={c} />
    <rect x="8" y="32" width="6" height="12" rx="3" fill={lt} />
    <rect x="33" y="30" width="6" height="14" rx="3" fill={lt} />
    <path d="M2 34C2 25 20 25 20 34ZM28 32C28 23 44 23 44 32Z" fill={c} />
    <path d="M17 15h.1M27 14h.1M32 20h.1M22 20h.1M10 30h.1M36 27h.1" stroke="#fff" strokeWidth="3.4" opacity=".85" />
  </>],
};

export default function DecorSprite({ item, fit }: { item: DecorItem; fit?: number }) {
  const [w, h, draw] = ART[item.art];
  const k = fit ? Math.min(1, fit / Math.max(w, h)) : 1;
  const dk = mix(item.color, 0, 0.32);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w * k} height={h * k} overflow="visible"
      fill="none" stroke={dk} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      {draw(item.color, dk, mix(item.color, 255, 0.5))}
    </svg>
  );
}
