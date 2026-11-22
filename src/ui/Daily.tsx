import { useState } from 'react';
import { gameNow, syncClock, tzOffset } from '../game/clock';
import { canClaimDaily, dailyReward } from '../game/sim';
import { useGame } from '../game/store';
import { Price } from './Hud';

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export default function Daily({ onClose }: { onClose: () => void }) {
  const s = useGame();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const can = canClaimDaily(s, gameNow(), tzOffset());
  const done = can ? s.daily.streak % 7 : ((s.daily.streak - 1) % 7) + 1; // days ticked this week
  const today = can ? done + 1 : done;

  // Claims always use fresh server time, never the device clock.
  const claim = async () => {
    setBusy(true);
    setMsg('');
    const serverNow = await syncClock();
    setBusy(false);
    if (serverNow === null) return setMsg('Connect to the internet to claim your gift');
    s.claimDaily(serverNow, tzOffset());
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <h2>Daily gift</h2>
        <p className="sub">A gift every day · day 7 gives pearls</p>
        <div className="days">
          {DAYS.map((d) => (
            <div key={d} className={`day${d === today ? ' today' : ''}${d <= done ? ' done' : ''}`}>
              <small>Day {d}</small>
              <Price cost={dailyReward(s, d)} size={22} />
            </div>
          ))}
        </div>
        {can
          ? <button className="btn claim" disabled={busy} onClick={claim}>{busy ? 'Checking…' : 'Claim'}</button>
          : <p className="later">Come back tomorrow</p>}
        {msg && <p className="note warn">{msg}</p>}
      </div>
    </div>
  );
}
