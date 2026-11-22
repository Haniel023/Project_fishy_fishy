import FishSprite from '../art/FishSprite';
import { SPECIES } from '../data/fish';
import { canBuy } from '../game/sim';
import { useGame } from '../game/store';
import { Coin } from './Hud';

export default function Shop({ onClose }: { onClose: () => void }) {
  const game = useGame();
  const tank = game.tanks[0];
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <h2>Fish Shop</h2>
        <p className="sub">{tank.fish.length}/{tank.capacity} fish</p>
        <div className="grid">
          {SPECIES.map((sp) => {
            const reason = canBuy(game, sp.id);
            const locked = game.level < sp.unlockLevel;
            return (
              <div key={sp.id} className={`card${locked ? ' locked' : ''}`}>
                {locked && <span className="lock">Lv {sp.unlockLevel}</span>}
                <FishSprite look={sp.look} size={90} />
                <b>{sp.name}</b>
                <small>Grows in {sp.growMinutes} min</small>
                <button className="buy" disabled={!!reason} onClick={() => game.buy(sp.id)}>
                  <Coin size={18} />{sp.price}
                </button>
                {reason && <small className="reason">{reason}</small>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
