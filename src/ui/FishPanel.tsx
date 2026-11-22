import { useEffect, useState } from 'react';
import FishSprite from '../art/FishSprite';
import { NAME_MAX, SELL_CONFIRM_MS } from '../data/config';
import { speciesById } from '../data/fish';
import { findFish, isSick, sellValue } from '../game/sim';
import { useGame } from '../game/store';
import { Coin } from './Hud';

function Bar({ label, value, color, tag }: { label: string; value: number; color: string; tag?: string }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span>{label}{tag && <span className="tag">{tag}</span>}</span>
        <span>{Math.floor(value)}%</span>
      </div>
      <div className="track"><div style={{ width: `${value}%`, background: color }} /></div>
    </div>
  );
}

export default function FishPanel({ fishId, onClose }: { fishId: string; onClose: () => void }) {
  const fish = useGame((s) => findFish(s, fishId));
  const { rename, toggleFavorite, sell } = useGame.getState();
  const [draft, setDraft] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), SELL_CONFIRM_MS);
    return () => clearTimeout(t);
  }, [confirm]);

  if (!fish) return null;
  const sp = speciesById(fish.speciesId);
  const sick = isSick(fish);
  const value = sellValue(fish, sp);
  const growth = fish.growth * 100;
  const stage = growth < 33 ? 'Baby' : growth < 100 ? 'Juvenile' : 'Adult';
  const mins = Math.floor((Date.now() - fish.bornAt) / 60000);
  const hrs = Math.floor(mins / 60);
  const age = mins < 60 ? `${mins}m` : hrs < 24 ? `${hrs}h ${mins % 60}m` : `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
  const save = () => {
    if (draft !== null) rename(fish.id, draft);
    setDraft(null);
  };
  const onSell = () => {
    if (!confirm) return setConfirm(true);
    sell(fish.id);
    onClose();
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <div className="head">
          <FishSprite look={sp.look} sick={sick} size={110} />
          <div>
            {draft !== null ? (
              <form onSubmit={(e) => { e.preventDefault(); save(); }}>
                <input autoFocus value={draft} maxLength={NAME_MAX} onChange={(e) => setDraft(e.target.value)} onBlur={save} />
              </form>
            ) : (
              <h2>{fish.name}<button className="icon" onClick={() => setDraft(fish.name)} aria-label="Rename">✎</button></h2>
            )}
            <div className="sub">{sp.name}<span className={`chip ${sp.rarity}`}>{sp.rarity}</span></div>
          </div>
        </div>
        <Bar label={`Growth · ${stage}`} value={growth} color="#9ee6c4" />
        <Bar label="Fullness" value={fish.hunger} color="#ffc98b" />
        <Bar label="Health" value={fish.health} color="#ff9fb5" tag={sick ? 'Sick' : undefined} />
        <div className="facts">
          <span>Age {age}</span>
          <span>Sell value <Coin size={16} />{value}</span>
        </div>
        <div className="row">
          <button className={`btn${fish.favorite ? ' active' : ''}`} aria-pressed={fish.favorite} onClick={() => toggleFavorite(fish.id)}>
            {fish.favorite ? '♥' : '♡'} Favorite
          </button>
          <button className="btn sell" disabled={fish.favorite} onClick={onSell}>
            {confirm ? `Sell for ${value}?` : 'Sell'}
          </button>
        </div>
        {fish.favorite && <p className="note">Favorites can't be sold</p>}
      </div>
    </div>
  );
}
