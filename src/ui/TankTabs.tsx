import { useState } from 'react';
import { MAX_TANKS } from '../data/config';
import { themeById } from '../data/themes';
import { needsCare } from '../game/sim';
import { useGame } from '../game/store';

interface Props { active: number; onPick: (i: number) => void; onAdd: () => void; gift: boolean; onGift: () => void; onBook: () => void }

const Icon = ({ d, size = 22 }: { d: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const careDot = (on: boolean) => on && <i className="dot" aria-label="needs care" />;

// Tank switcher (‹ [Tank N ▾] ›, with a dropdown list of all tanks) plus fixed Gift and Book buttons.
export default function TankTabs({ active, onPick, onAdd, gift, onGift, onBook }: Props) {
  const tanks = useGame((s) => s.tanks);
  const [open, setOpen] = useState(false);
  const care = tanks.map(needsCare);
  const multi = tanks.length > 1;
  const last = active === tanks.length - 1;
  const canBuy = tanks.length < MAX_TANKS;
  const go = (i: number) => { setOpen(false); onPick(i); };
  const add = () => { setOpen(false); onAdd(); };
  return (
    <nav className="tabs">
      {multi && (
        <button className="iconbtn" disabled={active === 0} onClick={() => go(active - 1)} aria-label="Previous tank">
          <Icon d="M14.5 6l-6 6 6 6" />{careDot(care.slice(0, active).some(Boolean))}
        </button>
      )}
      <button className={`switch${open ? ' open' : ''}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        <b>Tank {active + 1}</b>{careDot(care[active])}<Icon d="M7 10l5 5 5-5" size={18} />
      </button>
      {last && canBuy ? <button className="iconbtn add" onClick={add} aria-label="Buy a tank">+</button> : multi && (
        <button className="iconbtn" disabled={last} onClick={() => go(active + 1)} aria-label="Next tank">
          <Icon d="M9.5 6l6 6-6 6" />{careDot(care.slice(active + 1).some(Boolean))}
        </button>
      )}
      <button className="iconbtn" onClick={onGift} aria-label="Daily gift">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="#ffc4d4" stroke="#e0789a" strokeWidth="1.8" strokeLinejoin="round">
          <rect x="4" y="10" width="16" height="10.5" rx="2" /><rect x="2.5" y="6.5" width="19" height="4.5" rx="1.5" fill="#ffdce6" />
          <path d="M12 6.5v14M12 6.5C9.5 2 5.5 3.5 7.5 6.5M12 6.5c2.5-4.5 6.5-3 4.5 0" fill="none" />
        </svg>
        {gift && <i className="dot" aria-label="gift ready" />}
      </button>
      <button className="iconbtn" onClick={onBook} aria-label="Fish book">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="#d6e9ff" stroke="#6b9fe0" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M12 6.5C9 4.5 6 4.5 3 5.5v13.5c3-1 6-1 9 1 3-2 6-2 9-1V5.5c-3-1-6-1-9 1Z" /><path d="M12 6.5v13.5" fill="none" />
        </svg>
      </button>
      {open && <>
        <button className="listback" onClick={() => setOpen(false)} aria-label="Close list" />
        <div className="tanklist">
          {tanks.map((t, i) => (
            <button key={t.id} className={i === active ? 'on' : ''} aria-current={i === active} onClick={() => go(i)}>
              <span className="swatch" style={{ background: `linear-gradient(${themeById(t.theme).water.join(', ')})` }} />
              <b>Tank {i + 1}</b><small>{t.fish.length}/{t.capacity} fish</small>
              {careDot(care[i])}{i === active && <Icon d="M5 12.5l4.5 4.5L19 7.5" size={20} />}
            </button>
          ))}
          {canBuy && <button className="newtank" onClick={add}>+ Buy new tank</button>}
        </div>
      </>}
    </nav>
  );
}
