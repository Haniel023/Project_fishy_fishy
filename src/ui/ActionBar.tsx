import type { Mode } from '../game/types';

const ICONS = {
  feed: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#d39563">
      <circle cx="7" cy="7" r="3" /><circle cx="16" cy="10" r="3" /><circle cx="10" cy="17" r="3" />
    </svg>
  ),
  clean: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#e6f7ff" stroke="#6bb8e8" strokeWidth="2">
      <circle cx="9" cy="14" r="6" /><circle cx="17" cy="7" r="4" />
    </svg>
  ),
  decorate: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#ffd66b" stroke="#e9a93a" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
    </svg>
  ),
  shop: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#ffc4d4" stroke="#e0789a" strokeWidth="2" strokeLinejoin="round">
      <path d="M5 8h14l-1 12H6z" /><path d="M9 8a3 3 0 0 1 6 0" fill="none" />
    </svg>
  ),
};
const HINTS = { feed: 'Tap the water to drop food', clean: 'Swipe to clean the glass' }; // decorate hint lives in Decor (top of tank)
const MODES = [['feed', 'Feed'], ['clean', 'Clean'], ['decorate', 'Decorate']] as const;

interface Props { mode: Mode; setMode: (m: Mode) => void; onShop: () => void }

export default function ActionBar({ mode, setMode, onShop }: Props) {
  return (
    <footer className="actions">
      {mode !== 'none' && mode !== 'decorate' && <div className="hint">{HINTS[mode]}</div>}
      {MODES.map(([m, label]) => (
        <button key={m} className={`btn${mode === m ? ' active' : ''}`} aria-pressed={mode === m}
          onClick={() => setMode(mode === m ? 'none' : m)}>
          {ICONS[m]}{label}
        </button>
      ))}
      <button className="btn" onClick={onShop}>{ICONS.shop}Shop</button>
    </footer>
  );
}
