import { Fragment } from 'react';
import FishSprite from '../art/FishSprite';
import { SET_BONUS } from '../data/config';
import { RARITIES, SPECIES } from '../data/fish';
import { rarityDone } from '../game/sim';
import { useGame } from '../game/store';
import { Pearl } from './Hud';

export default function Book({ onClose }: { onClose: () => void }) {
  const found = useGame((s) => s.found);
  const shiny = useGame((s) => s.shinyFound);
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <h2>Fish book</h2>
        <p className="sub">Found {found.length}/{SPECIES.length} · Shiny {shiny.length}/{SPECIES.length}</p>
        {RARITIES.map((r) => {
          const all = SPECIES.filter((sp) => sp.rarity === r);
          const done = rarityDone(found, r);
          return (
            <Fragment key={r}>
              <h3 className="section bookhead">
                {r} {all.filter((sp) => found.includes(sp.id)).length}/{all.length}
                <span className={done ? 'got' : ''}>Set bonus <Pearl size={16} />{SET_BONUS[r]}{done && ' ✓'}</span>
              </h3>
              <div className="grid book">
                {all.map((sp) => {
                  const has = found.includes(sp.id);
                  return (
                    <div key={sp.id} className={`card${has ? '' : ' unfound'}`}>
                      {shiny.includes(sp.id) && <span className="star" title="Shiny found">✦</span>}
                      <div className={`sprite ${has ? sp.rarity : ''}`}><FishSprite look={sp.look} size={78} /></div>
                      <small>{has ? sp.name : '???'}</small>
                    </div>
                  );
                })}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
