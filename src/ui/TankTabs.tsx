import { MAX_TANKS } from '../data/config';
import { needsCare } from '../game/sim';
import { useGame } from '../game/store';

interface Props { active: number; onPick: (i: number) => void; onAdd: () => void }

export default function TankTabs({ active, onPick, onAdd }: Props) {
  const tanks = useGame((s) => s.tanks);
  return (
    <nav className="tabs">
      {tanks.map((t, i) => (
        <button key={t.id} className={`tab${i === active ? ' on' : ''}`} aria-pressed={i === active} onClick={() => onPick(i)}>
          Tank {i + 1}{needsCare(t) && <i className="dot" aria-label="needs care" />}
        </button>
      ))}
      {tanks.length < MAX_TANKS && <button className="tab add" onClick={onAdd} aria-label="Buy a tank">+</button>}
    </nav>
  );
}
