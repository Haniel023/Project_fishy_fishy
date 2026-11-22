import { Fragment, useState } from 'react';
import FishSprite from '../art/FishSprite';
import { CAPACITY_STEP, MAX_TANKS } from '../data/config';
import { SPECIES } from '../data/fish';
import { UPGRADES } from '../data/upgrades';
import * as sim from '../game/sim';
import { useGame } from '../game/store';
import type { Cost, Rarity, UpgradeId } from '../game/types';
import { Coin, Pearl } from './Hud';

export type ShopTab = 'fish' | 'supplies' | 'tanks';
const TABS: [ShopTab, string][] = [['fish', 'Fish'], ['supplies', 'Supplies'], ['tanks', 'Tanks']];
const RARITIES: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
const BY_UNLOCK = [...SPECIES].sort((a, b) => a.unlockLevel - b.unlockLevel);
const SUPPLIES: [UpgradeId, string, (v: number) => string][] = [
  ['food', 'Food', (v) => `+${v} fullness`],
  ['tool', 'Cleaning tool', (v) => `cleans ${v}%`],
  ['filter', 'Filter', (v) => (v < 1 ? `dirt −${Math.round((1 - v) * 100)}%` : 'normal dirt')],
  ['heater', 'Heater', (v) => (v > 0 ? `growth +${Math.round(v * 100)}%` : 'normal growth')],
];

const Price = ({ cost }: { cost: Cost }) =>
  cost.pearls ? <><Pearl size={18} />{cost.pearls}</> : <><Coin size={18} />{cost.gold}</>;

// Buy button with the reason it is blocked; shows "Max" when there is nothing left to buy.
function Buy({ cost, reason, onBuy }: { cost?: Cost; reason: string | null; onBuy: () => void }) {
  return (
    <>
      <button className="buy" disabled={!!reason} onClick={onBuy}>{cost ? <Price cost={cost} /> : 'Max'}</button>
      {cost && reason && <small className="reason">{reason}</small>}
    </>
  );
}

interface Props { tab: ShopTab; tankIndex: number; onClose: () => void }

export default function Shop({ tab: initial, tankIndex, onClose }: Props) {
  const game = useGame();
  const [tab, setTab] = useState(initial);
  const tank = game.tanks[tankIndex];
  const capCost = sim.capacityCost(game, tank.id);
  const tankCost = sim.tankCost(game);
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <h2>Shop</h2>
        <div className="seg">
          {TABS.map(([id, label]) => (
            <button key={id} className={id === tab ? 'on' : ''} aria-pressed={id === tab} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {tab === 'fish' && <>
          <p className="sub">Tank {tankIndex + 1} · {tank.fish.length}/{tank.capacity} fish</p>
          {RARITIES.map((r) => (
            <Fragment key={r}>
              <h3 className="section">{r}</h3>
              <div className="grid">
                {BY_UNLOCK.filter((sp) => sp.rarity === r).map((sp) => {
                  const locked = game.level < sp.unlockLevel;
                  return (
                    <div key={sp.id} className={`card${locked ? ' locked' : ''}`}>
                      {locked && <span className="lock">Lv {sp.unlockLevel}</span>}
                      <div className={`sprite ${sp.rarity}`}><FishSprite look={sp.look} size={90} /></div>
                      <b>{sp.name}</b>
                      <small>Grows in {sp.growMinutes} min</small>
                      <Buy cost={sim.priceOf(sp)} reason={sim.canBuy(game, tank.id, sp.id)} onBuy={() => game.buy(tank.id, sp.id)} />
                    </div>
                  );
                })}
              </div>
            </Fragment>
          ))}
        </>}

        {tab === 'supplies' && <div className="list">
          {SUPPLIES.map(([id, title, say]) => {
            const cur = UPGRADES[id][game.upgrades[id]];
            const next = UPGRADES[id][game.upgrades[id] + 1];
            return (
              <div key={id} className="card">
                <small>{title}</small>
                <b>{cur.name} · {say(cur.value)}</b>
                {next && <small>Next: {next.name} · {say(next.value)}</small>}
                <Buy cost={next && { gold: next.cost }} reason={sim.canUpgrade(game, id)} onBuy={() => game.upgrade(id)} />
              </div>
            );
          })}
        </div>}

        {tab === 'tanks' && <div className="list">
          <div className="card">
            <small>Tank {tankIndex + 1} size</small>
            <b>{tank.capacity} fish{capCost ? ` → ${tank.capacity + CAPACITY_STEP} fish` : ''}</b>
            <Buy cost={capCost ? { gold: capCost } : undefined} reason={sim.canUpgradeCapacity(game, tank.id)} onBuy={() => game.upgradeCapacity(tank.id)} />
          </div>
          <div className="card">
            <small>New tank</small>
            <b>{game.tanks.length}/{MAX_TANKS} tanks</b>
            <Buy cost={tankCost} reason={sim.canBuyTank(game)} onBuy={game.buyTank} />
          </div>
        </div>}
      </div>
    </div>
  );
}
