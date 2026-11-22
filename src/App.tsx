import { useEffect, useRef, useState } from 'react';
import { LEVEL_GOLD, LEVEL_PEARLS, SET_BONUS, TICK_MS, TOAST_MS } from './data/config';
import { RARITIES } from './data/fish';
import { gameNow, syncClock, tzOffset } from './game/clock';
import { canClaimDaily, rarityDone } from './game/sim';
import { useGame } from './game/store';
import type { Mode } from './game/types';
import ActionBar from './ui/ActionBar';
import Book from './ui/Book';
import Daily from './ui/Daily';
import FishPanel from './ui/FishPanel';
import Hud from './ui/Hud';
import Shop, { type ShopTab } from './ui/Shop';
import Tank from './ui/Tank';
import TankTabs from './ui/TankTabs';

export default function App() {
  const level = useGame((s) => s.level);
  const found = useGame((s) => s.found);
  const shinyFound = useGame((s) => s.shinyFound);
  const [mode, setMode] = useState<Mode>('none');
  const [selected, setSelected] = useState<string | null>(null);
  const [shop, setShop] = useState<ShopTab | null>(null);
  const [sheet, setSheet] = useState<'daily' | 'book' | null>(null);
  const [active, setActive] = useState(0); // shown tank index (not persisted)
  const [now, setNow] = useState(gameNow); // refreshed every tick, for the gift dot
  const gift = useGame((s) => canClaimDaily(s, now, tzOffset()));
  const count = useGame((s) => s.tanks.length);
  const [seen, setSeen] = useState(count);
  if (count !== seen) { // a tank was just bought: show it
    setSeen(count);
    if (count > seen) setActive(count - 1);
  }
  const tankId = useGame((s) => s.tanks[active].id);
  const openShop = (tab: ShopTab) => { setMode('none'); setShop(tab); };
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const say = (text: string) => {
    const id = Math.random();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), TOAST_MS);
  };
  const prev = useRef({ level, found, shinyFound });

  // Sync the clock with the host first, then offline/background progress: on load, every 10 s, and when visible again.
  useEffect(() => {
    let alive = true;
    let iv: ReturnType<typeof setInterval> | undefined;
    const run = () => {
      useGame.getState().catchUp(gameNow());
      setNow(gameNow());
    };
    const onVis = () => { if (!document.hidden) syncClock().then(run); };
    syncClock().then((serverNow) => {
      if (!alive) return;
      run();
      iv = setInterval(run, TICK_MS);
      document.addEventListener('visibilitychange', onVis);
      if (serverNow !== null && canClaimDaily(useGame.getState(), serverNow, tzOffset())) setSheet('daily'); // once per session
    });
    return () => {
      alive = false;
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Toasts for level-ups and new collection book entries.
  useEffect(() => {
    const p = prev.current;
    prev.current = { level, found, shinyFound };
    if (level > p.level) {
      let gold = 0;
      for (let l = p.level + 1; l <= level; l++) gold += LEVEL_GOLD * l;
      const pearls = (level - p.level) * LEVEL_PEARLS;
      say(`Level ${level}! +${gold} gold, +${pearls} pearl${pearls > 1 ? 's' : ''}`);
    }
    if (found.length > p.found.length) {
      const bonus = RARITIES.reduce((n, r) => n + (rarityDone(found, r) && !rarityDone(p.found, r) ? SET_BONUS[r] : 0), 0);
      say(`New fish! +1 pearl${bonus ? ` · Set bonus +${bonus} pearls` : ''}`);
    }
    if (shinyFound.length > p.shinyFound.length) say('New shiny! +1 pearl');
  }, [level, found, shinyFound]);

  return (
    <div className="app">
      <Hud />
      <TankTabs active={active} onPick={setActive} onAdd={() => openShop('tanks')}
        gift={gift} onGift={() => setSheet('daily')} onBook={() => setSheet('book')} />
      <Tank key={tankId} tankId={tankId} mode={mode} onSelect={setSelected} onShop={setShop} />
      <ActionBar mode={mode} setMode={setMode} onShop={() => openShop('fish')} />
      {selected && <FishPanel fishId={selected} onClose={() => setSelected(null)} onToast={say} />}
      {shop && <Shop tab={shop} tankIndex={active} onClose={() => setShop(null)} />}
      {sheet === 'daily' && <Daily onClose={() => setSheet(null)} />}
      {sheet === 'book' && <Book onClose={() => setSheet(null)} />}
      {toasts.length > 0 && <div className="toasts">{toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}</div>}
    </div>
  );
}
