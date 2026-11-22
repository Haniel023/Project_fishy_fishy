import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import DecorSprite, { ART, DECOR_SCALE } from '../art/DecorSprite';
import { DECOR_DRAG_PX, SELL_CONFIRM_MS } from '../data/config';
import { decorById } from '../data/decor';
import { decorRefund, decorX } from '../game/sim';
import { useGame } from '../game/store';
import type { Tank } from '../game/types';
import { Price } from './Hud';
import type { ShopTab } from './Shop';

const base = (front: boolean) => (front ? 6 : 16); // px above the tank bottom; matches .decor / .decor.front
const stop = (e: PointerEvent) => e.stopPropagation(); // keeps the tank from deselecting

interface Props { tank: Tank; editing: boolean; sel: string | null; setSel: (id: string | null) => void; onShop: (tab: ShopTab) => void }

// Decor on the sand. In decorate mode: tap to select, drag to move, toolbar to flip / layer / remove.
export default function Decor({ tank, editing, sel, setSel, onShop }: Props) {
  const { editDecor, removeDecor } = useGame.getState();
  const tools = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; x0: number; cx: number; w: number; x: number; moved: boolean } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null); // placed id awaiting a second Remove tap

  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(null), SELL_CONFIRM_MS);
    return () => clearTimeout(t);
  }, [confirm]);

  const onDown = (e: PointerEvent<HTMLDivElement>, id: string, x: number) => {
    stop(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    setSel(id);
    drag.current = { id, x0: x, cx: e.clientX, w: e.currentTarget.parentElement!.clientWidth, x, moved: false };
  };
  // Moves the element directly; the store is written once on pointer up.
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || (!d.moved && Math.abs(e.clientX - d.cx) < DECOR_DRAG_PX)) return;
    d.moved = true;
    d.x = decorX(d.x0 + (e.clientX - d.cx) / d.w);
    e.currentTarget.style.left = `${d.x * 100}%`;
    tools.current?.style.setProperty('--x', `${d.x * 100}%`);
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved) editDecor(tank.id, d.id, { x: d.x });
  };

  const picked = editing ? tank.decor.find((d) => d.id === sel) : undefined;
  const pickedItem = picked && decorById(picked.itemId);
  const onRemove = () => {
    if (!picked) return;
    if (confirm !== picked.id) return setConfirm(picked.id);
    removeDecor(tank.id, picked.id);
    setSel(null);
  };

  return (
    <>
      {tank.decor.map((d) => {
        const item = decorById(d.itemId);
        return (
          <div key={d.id} className={`decor ${item.fx ?? ''}${d.front ? ' front' : ''}${d.flip ? ' flip' : ''}${d === picked ? ' sel' : ''}`}
            style={{ left: `${d.x * 100}%`, '--c': item.color } as CSSProperties}
            onPointerDown={(e) => onDown(e, d.id, d.x)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <DecorSprite item={item} />
            {item.fx === 'bubbles' && <><i /><i /><i /></>}
          </div>
        );
      })}
      {editing && <>
        <div className="dtop" onPointerDown={stop}>
          <button onClick={() => onShop('decor')}>+ Decor</button>
          <button onClick={() => onShop('themes')}>Theme</button>
        </div>
        <p className="hint dhint">Drag to move · tap to edit</p>
      </>}
      {picked && pickedItem && (
        <div ref={tools} className="dtools" onPointerDown={stop}
          style={{ '--x': `${picked.x * 100}%`, bottom: base(picked.front) + ART[pickedItem.art][1] * DECOR_SCALE + 10 } as CSSProperties}>
          <button onClick={() => editDecor(tank.id, picked.id, { flip: !picked.flip })}>Flip</button>
          <button onClick={() => editDecor(tank.id, picked.id, { front: !picked.front })}>{picked.front ? 'To back' : 'To front'}</button>
          <button className="rm" onClick={onRemove}>
            Remove{confirm === picked.id && <> +<Price cost={decorRefund(pickedItem)} size={16} />?</>}
          </button>
        </div>
      )}
    </>
  );
}
