import { useEffect, useRef, useState } from 'react';
import { LEVEL_GOLD, LEVEL_PEARLS, TICK_MS, TOAST_MS } from './data/config';
import { useGame } from './game/store';
import type { Mode } from './game/types';
import ActionBar from './ui/ActionBar';
import FishPanel from './ui/FishPanel';
import Hud from './ui/Hud';
import Shop from './ui/Shop';
import Tank from './ui/Tank';

export default function App() {
  const level = useGame((s) => s.level);
  const [mode, setMode] = useState<Mode>('none');
  const [selected, setSelected] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const prevLevel = useRef(level);

  // Offline/background progress: on load (store is already rehydrated), every 10 s, and when visible again.
  useEffect(() => {
    const run = () => useGame.getState().catchUp(Date.now());
    const onVis = () => !document.hidden && run();
    run();
    const iv = setInterval(run, TICK_MS);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    const prev = prevLevel.current;
    prevLevel.current = level;
    if (level <= prev) return;
    let gold = 0;
    for (let l = prev + 1; l <= level; l++) gold += LEVEL_GOLD * l;
    const pearls = (level - prev) * LEVEL_PEARLS;
    setToast(`Level ${level}! +${gold} gold, +${pearls} pearl${pearls > 1 ? 's' : ''}`);
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [level]);

  return (
    <div className="app">
      <Hud />
      <Tank mode={mode} onSelect={setSelected} />
      <ActionBar mode={mode} setMode={setMode} onShop={() => { setMode('none'); setShopOpen(true); }} />
      {selected && <FishPanel fishId={selected} onClose={() => setSelected(null)} />}
      {shopOpen && <Shop onClose={() => setShopOpen(false)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
