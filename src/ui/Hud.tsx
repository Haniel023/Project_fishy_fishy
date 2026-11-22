import { xpNeeded } from '../game/sim';
import { useGame } from '../game/store';

export const Coin = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#ffd45e" stroke="#e9a93a" strokeWidth="2" />
    <circle cx="12" cy="12" r="5.5" fill="none" stroke="#f0b440" strokeWidth="1.6" />
    <circle cx="8.5" cy="8" r="1.6" fill="#fff6cf" />
  </svg>
);

const Pearl = () => (
  <svg width="22" height="22" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9.5" fill="#f6efff" stroke="#cdb9ef" strokeWidth="2" />
    <circle cx="15" cy="15.5" r="3.5" fill="#ead8ff" />
    <circle cx="9" cy="8.5" r="2.8" fill="#fff" />
  </svg>
);

export default function Hud() {
  const gold = useGame((s) => s.gold);
  const pearls = useGame((s) => s.pearls);
  const xp = useGame((s) => s.xp);
  const level = useGame((s) => s.level);
  const need = xpNeeded(level);
  return (
    <header className="hud">
      <div className="pill"><Coin />{gold}</div>
      <div className="pill"><Pearl />{pearls}</div>
      <div className="pill level">
        <span className="badge">Lv {level}</span>
        <div className="track"><div style={{ width: `${(xp / need) * 100}%` }} /></div>
        <small>{xp}/{need}</small>
      </div>
    </header>
  );
}
