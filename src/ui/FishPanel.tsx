import { useEffect, useState } from 'react';
import FishSprite, { EggSprite } from '../art/FishSprite';
import { BREED_LEVEL, NAME_MAX, SELL_CONFIRM_MS, SHINY_BREED } from '../data/config';
import { speciesById } from '../data/fish';
import { gameNow } from '../game/clock';
import { canBreed, findFish, isSick, sellValue } from '../game/sim';
import { useGame } from '../game/store';
import { Coin } from './Hud';

// Minutes as "42m", "5h 12m" or "2d 3h".
const dur = (mins: number) => {
  const h = Math.floor(mins / 60);
  return mins < 60 ? `${mins}m` : h < 24 ? `${h}h ${mins % 60}m` : `${Math.floor(h / 24)}d ${h % 24}h`;
};

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

interface Props { fishId: string; onClose: () => void; onToast: (text: string) => void }

export default function FishPanel({ fishId, onClose, onToast }: Props) {
  const fish = useGame((s) => findFish(s, fishId));
  const tank = useGame((s) => s.tanks.find((t) => t.fish.some((f) => f.id === fishId)));
  const level = useGame((s) => s.level);
  const { rename, toggleFavorite, sell, breed } = useGame.getState();
  const [draft, setDraft] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), SELL_CONFIRM_MS);
    return () => clearTimeout(t);
  }, [confirm]);

  if (!fish || !tank) return null;
  const sp = speciesById(fish.speciesId);
  const sick = isSick(fish);
  const value = sellValue(fish, sp);
  const growth = fish.growth * 100;
  const stage = growth < 33 ? 'Baby' : growth < 100 ? 'Juvenile' : 'Adult';
  const age = dur(Math.max(0, Math.floor((gameNow() - fish.bornAt) / 60000)));
  const adult = fish.growth >= 1 && !fish.egg;
  // Partners: other adults of this species in the tank; when none can breed, say why.
  const mates = tank.fish.filter((m) => m.id !== fish.id && m.speciesId === fish.speciesId && m.growth >= 1 && !m.egg);
  const ok = mates.filter((m) => !canBreed(useGame.getState(), fish.id, m.id));
  const why = mates.length ? canBreed(useGame.getState(), fish.id, mates[0].id) : `Needs another adult ${sp.name} in this tank`;
  const reason = why === 'Resting' ? `Resting ${dur(fish.rest || Math.min(...mates.map((m) => m.rest || Infinity)))}` : why;
  const save = () => {
    if (draft !== null) rename(fish.id, draft);
    setDraft(null);
  };
  const onSell = () => {
    if (!confirm) return setConfirm(true);
    sell(fish.id);
    onClose();
  };
  const onBreed = (mateId: string) => {
    const roll = Math.random();
    breed(fish.id, mateId, roll);
    onToast(roll < SHINY_BREED ? 'A shiny egg! ✦' : 'An egg was laid!');
    onClose();
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <div className="head">
          {fish.egg ? <EggSprite look={sp.look} shiny={fish.shiny} size={64} /> : <FishSprite look={sp.look} sick={sick} shiny={fish.shiny} size={110} />}
          <div>
            {draft !== null ? (
              <form onSubmit={(e) => { e.preventDefault(); save(); }}>
                <input autoFocus value={draft} maxLength={NAME_MAX} onChange={(e) => setDraft(e.target.value)} onBlur={save} />
              </form>
            ) : (
              <h2>{fish.name}<button className="icon" onClick={() => setDraft(fish.name)} aria-label="Rename">✎</button></h2>
            )}
            <div className="sub">
              {sp.name}<span className={`chip ${sp.rarity}`}>{sp.rarity}</span>{fish.shiny && <span className="chip shiny">Shiny ✦</span>}
            </div>
          </div>
        </div>
        {fish.egg ? <p className="eggline">Egg · hatches in {dur(fish.egg)}</p> : <>
          <Bar label={`Growth · ${stage}`} value={growth} color="#9ee6c4" />
          <Bar label="Fullness" value={fish.hunger} color="#ffc98b" />
          <Bar label="Health" value={fish.health} color="#ff9fb5" tag={sick ? 'Sick' : undefined} />
          <div className="facts">
            <span>Age {age}</span>
            {!!fish.rest && <span>Resting {dur(fish.rest)}</span>}
            <span>Sell value <Coin size={16} />{value}</span>
          </div>
        </>}
        <div className="row">
          <button className={`btn${fish.favorite ? ' active' : ''}`} aria-pressed={fish.favorite} onClick={() => toggleFavorite(fish.id)}>
            {fish.favorite ? '♥' : '♡'} Favorite
          </button>
          {!fish.egg && (
            <button className="btn sell" disabled={fish.favorite} onClick={onSell}>
              {confirm ? `Sell for ${value}?` : 'Sell'}
            </button>
          )}
        </div>
        {fish.favorite && !fish.egg && <p className="note">Favorites can't be sold</p>}
        {adult && level >= BREED_LEVEL && (
          <button className={`btn breed${picking ? ' active' : ''}`} aria-pressed={picking} onClick={() => setPicking(!picking)}>
            <EggSprite look={sp.look} size={20} />Breed
          </button>
        )}
        {picking && (ok.length ? <>
          <p className="note">Pick a partner</p>
          <div className="mates">
            {ok.map((m) => (
              <button key={m.id} onClick={() => onBreed(m.id)}>
                <FishSprite look={sp.look} shiny={m.shiny} size={60} /><span>{m.name}</span>
              </button>
            ))}
          </div>
        </> : <p className="note warn">{reason}</p>)}
      </div>
    </div>
  );
}
