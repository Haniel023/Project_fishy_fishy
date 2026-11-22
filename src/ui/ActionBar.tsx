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
  shop: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#ffc4d4" stroke="#e0789a" strokeWidth="2" strokeLinejoin="round">
      <path d="M5 8h14l-1 12H6z" /><path d="M9 8a3 3 0 0 1 6 0" fill="none" />
    </svg>
  ),
};
const HINTS = { feed: 'Tap the water to drop food', clean: 'Swipe to clean the glass' };

interface Props { mode: Mode; setMode: (m: Mode) => void; onShop: () => void }

export default function ActionBar({ mode, setMode, onShop }: Props) {
  return (
    <footer className="actions">
      {mode !== 'none' && <div className="hint">{HINTS[mode]}</div>}
      {(['feed', 'clean'] as const).map((m) => (
        <button key={m} className={`btn${mode === m ? ' active' : ''}`} aria-pressed={mode === m}
          onClick={() => setMode(mode === m ? 'none' : m)}>
          {ICONS[m]}{m === 'feed' ? 'Feed' : 'Clean'}
        </button>
      ))}
      <button className="btn" onClick={onShop}>{ICONS.shop}Shop</button>
    </footer>
  );
}
