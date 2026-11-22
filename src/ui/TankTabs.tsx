import { MAX_TANKS } from '../data/config';
import { needsCare } from '../game/sim';
import { useGame } from '../game/store';

interface Props { active: number; onPick: (i: number) => void; onAdd: () => void; gift: boolean; onGift: () => void; onBook: () => void }

// Tank tabs (inactive ones show just the number so 5 fit) plus fixed Gift and Book buttons.
export default function TankTabs({ active, onPick, onAdd, gift, onGift, onBook }: Props) {
  const tanks = useGame((s) => s.tanks);
  return (
    <nav className="tabs">
      <div className="tabscroll">
        {tanks.map((t, i) => (
          <button key={t.id} className={`tab${i === active ? ' on' : ''}`} aria-pressed={i === active} aria-label={`Tank ${i + 1}`} onClick={() => onPick(i)}>
            {i === active ? `Tank ${i + 1}` : i + 1}{needsCare(t) && <i className="dot" aria-label="needs care" />}
          </button>
        ))}
        {tanks.length < MAX_TANKS && <button className="tab add" onClick={onAdd} aria-label="Buy a tank">+</button>}
      </div>
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
    </nav>
  );
}
