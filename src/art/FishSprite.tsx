import { useId } from 'react';
import type { Look } from '../game/types';

interface Body {
  d: string;
  cy: number; // vertical center (tail attach height)
  tailX: number;
  eye: [number, number, number]; // x, y, radius
  mouth: [number, number];
  fin: [number, number]; // dorsal fin base
}

// viewBox 0 0 120 80, fish faces right.
const BODIES: Record<Look['body'], Body> = {
  round: { d: 'M96 40C96 55 81 64 64 64S32 55 32 40S47 16 64 16S96 25 96 40Z', cy: 40, tailX: 34, eye: [80, 34, 7], mouth: [90, 45], fin: [60, 18] },
  long: { d: 'M102 40C102 50 88 55 66 55S26 49 26 40S44 25 66 25S102 30 102 40Z', cy: 40, tailX: 28, eye: [88, 36, 5.5], mouth: [97, 44], fin: [62, 26] },
  tall: { d: 'M90 40C90 60 78 70 64 70S40 58 40 40S50 10 64 10S90 20 90 40Z', cy: 40, tailX: 42, eye: [76, 31, 6.5], mouth: [85, 46], fin: [60, 12] },
  flat: { d: 'M100 46C100 56 86 58 64 58S30 54 30 46S46 24 66 24S100 34 100 46Z', cy: 46, tailX: 32, eye: [84, 38, 6], mouth: [95, 50], fin: [64, 25] },
};

// Tails attach at (0,0) and extend left.
const TAILS: Record<Look['tail'], string> = {
  fan: 'M6 0C-4-8-14-24-24-22C-30-12-30 12-24 22C-14 24-4 8 6 0Z',
  fork: 'M6 0C-2-8-12-20-22-21C-17-10-15-4-12 0C-15 4-17 10-22 21C-12 20-2 8 6 0Z',
  round: 'M6 0C0-10-8-15-17-13C-26-9-26 9-17 13C-8 15 0 10 6 0Z',
  veil: 'M6 0C-6-10-20-26-32-22C-26-12-30-4-24 2C-30 10-24 20-34 30C-18 30-6 10 6 0Z',
};
const DORSAL = 'M-11 6C-8-6 2-11 12-7C9-2 9 2 9 6Z';
const SPOTS = [[-14, -8], [-24, 1], [-35, -10], [-45, -1], [-19, 9], [-37, 9], [-54, -8], [-58, 5], [-28, -16]];
const OUTLINE = 'rgba(60,40,90,.35)';
const INK = '#3a3352';
const line = { stroke: OUTLINE, strokeWidth: 2, strokeLinejoin: 'round' as const };

function Pattern({ look, b }: { look: Look; b: Body }) {
  const ex = b.eye[0];
  switch (look.pattern) {
    case 'stripes':
      return <>{[-8, 0, 8].map((dy) => <rect key={dy} x="0" y={b.cy + dy - 2} width="120" height="3.5" rx="1.75" fill={look.accent} />)}</>;
    case 'band':
      return <>{[12, 32].map((dx) => <rect key={dx} x={ex - dx - 5} y="0" width="9" height="80" fill={look.accent} stroke={OUTLINE} strokeWidth="1.5" />)}</>;
    case 'spots':
      return <>{SPOTS.map(([dx, dy], i) => <circle key={i} cx={ex + dx} cy={b.cy + dy} r="2.6" fill={look.accent} />)}</>;
    default:
      return <ellipse cx={ex - 20} cy={b.cy + 16} rx="34" ry="11" fill={look.accent} />; // belly
  }
}

export default function FishSprite({ look, sick, size = 96 }: { look: Look; sick?: boolean; size?: number }) {
  const clip = useId();
  const b = BODIES[look.body];
  const [ex, ey, er] = b.eye;
  const [mx, my] = b.mouth;
  return (
    <svg viewBox="0 0 120 80" width={size} height={(size * 2) / 3} overflow="visible"
      style={sick ? { filter: 'grayscale(.5) sepia(.5) hue-rotate(50deg)' } : undefined}>
      <defs><clipPath id={clip}><path d={b.d} /></clipPath></defs>
      <path d={TAILS[look.tail]} transform={`translate(${b.tailX} ${b.cy})`} fill={look.fin} {...line} />
      <path d={DORSAL} transform={`translate(${b.fin[0]} ${b.fin[1]})`} fill={look.fin} {...line} />
      <path d={b.d} fill={look.main} />
      <g clipPath={`url(#${clip})`}>
        <Pattern look={look} b={b} />
        <ellipse cx={ex - 22} cy={b.cy - 13} rx="16" ry="4.5" fill="#fff" opacity=".35" />
      </g>
      <path d={b.d} fill="none" {...line} />
      <ellipse cx={ex - 20} cy={b.cy + 8} rx="7" ry="4" transform={`rotate(-25 ${ex - 20} ${b.cy + 8})`} fill={look.fin} {...line} />
      <circle cx={ex} cy={ey} r={er} fill={INK} />
      <circle cx={ex + er * 0.3} cy={ey - er * 0.35} r={er * 0.4} fill="#fff" />
      <circle cx={ex - er * 0.35} cy={ey + er * 0.35} r={er * 0.16} fill="#fff" />
      <ellipse cx={ex - 3} cy={ey + er + 4} rx="4.5" ry="2.5" fill="#ff8fab" opacity=".55" />
      <path d={sick ? `M${mx - 3} ${my + 1.5}q3-3 6 0` : `M${mx - 3} ${my}q3 3 6 0`}
        fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
