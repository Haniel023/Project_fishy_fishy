import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';
import FishSprite from '../art/FishSprite';
import * as C from '../data/config';
import { speciesById } from '../data/fish';
import { isSick } from '../game/sim';
import { useGame } from '../game/store';
import type { Mode } from '../game/types';

interface Motion { x: number; y: number; vx: number; vy: number; tx: number; ty: number; face: number; phase: number; speed: number }
interface Pellet { x: number; y: number; born: number; el: HTMLDivElement }

const SAND = 44;
const BUBBLES = Array.from({ length: 9 }, (_, i) => ({
  left: `${6 + ((i * 37) % 88)}%`, size: 6 + ((i * 5) % 9), dur: 6 + ((i * 3) % 6), delay: -i * 1.3,
}));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function Tank({ mode, onSelect }: { mode: Mode; onSelect: (id: string) => void }) {
  const tank = useGame((s) => s.tanks[0]);
  const clean = useGame((s) => s.clean);
  const box = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const sponge = useRef<HTMLDivElement>(null);
  const els = useRef(new Map<string, HTMLDivElement>());
  const motions = useRef(new Map<string, Motion>());
  const pellets = useRef<Pellet[]>([]);
  const drag = useRef<{ x: number; y: number; dist: number } | null>(null);

  // One rAF loop moves fish and pellets by writing style.transform directly.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const w = box.current!.clientWidth;
      const floor = box.current!.clientHeight - SAND;
      const spot = (): [number, number] => [rand(50, w - 50), rand(40, floor - 30)];
      const { tanks, feed } = useGame.getState();
      const fish = tanks[0].fish;
      const ms = motions.current;

      pellets.current = pellets.current.filter((p) => {
        const alive = now - p.born < C.PELLET_LIFE_MS;
        if (!alive) p.el.remove();
        p.y = Math.min(floor - 6, p.y + C.PELLET_SINK_PX * dt);
        p.el.style.transform = `translate(${p.x}px,${p.y}px)`;
        return alive;
      });

      // Each pellet attracts the nearest hungry fish that isn't already chasing one.
      const chase = new Map<string, Pellet>();
      for (const p of pellets.current) {
        let best: string | undefined;
        let bestD = Infinity;
        for (const f of fish) {
          const m = ms.get(f.id);
          if (!m || f.hunger >= C.FEED_BELOW || chase.has(f.id)) continue;
          const d = Math.hypot(m.x - p.x, m.y - p.y);
          if (d < bestD) [best, bestD] = [f.id, d];
        }
        if (best) chase.set(best, p);
      }

      for (const f of fish) {
        let m = ms.get(f.id);
        if (!m) {
          const [x, y] = spot();
          m = { x, y, vx: 0, vy: 0, tx: x, ty: y, face: 1, phase: rand(0, 6), speed: rand(25, 45) };
          ms.set(f.id, m);
        }
        const s = 0.5 + 0.5 * f.growth;
        const p = chase.get(f.id);
        if (p) [m.tx, m.ty] = [p.x, p.y];
        const dx = m.tx - m.x;
        const dy = m.ty - m.y;
        const d = Math.hypot(dx, dy) || 1;
        if (p && d < 20 * s + 6) {
          feed(f.id);
          p.el.remove();
          pellets.current = pellets.current.filter((q) => q !== p);
          [m.tx, m.ty] = spot();
        } else if (!p && d < 8) [m.tx, m.ty] = spot();
        const v = p ? m.speed * 2.5 : m.speed * Math.min(1, d / 60); // ease out near target
        const k = Math.min(1, dt * 2); // ease in (velocity smoothing)
        m.vx += ((dx / d) * v - m.vx) * k;
        m.vy += ((dy / d) * v - m.vy) * k;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (Math.abs(m.vx) > 3) m.face += (Math.sign(m.vx) - m.face) * Math.min(1, dt * 6);
        const bob = Math.sin(now / 500 + m.phase) * 3;
        const el = els.current.get(f.id);
        if (el) el.style.transform = `translate(${m.x}px,${m.y + bob}px) scale(${m.face * s},${s})`;
      }
      for (const id of ms.keys()) if (!fish.some((f) => f.id === id)) ms.delete(id);
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const pos = (e: PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const showSponge = (x: number, y: number) => {
    sponge.current!.style.transform = `translate(${x}px,${y}px)`;
    sponge.current!.classList.add('on');
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    const { x, y } = pos(e);
    if (mode === 'feed') {
      const el = document.createElement('div');
      el.className = 'pellet';
      el.style.transform = `translate(${x}px,${y}px)`;
      layer.current!.appendChild(el);
      pellets.current.push({ x, y, born: performance.now(), el });
    } else if (mode === 'clean') {
      drag.current = { x, y, dist: 0 };
      e.currentTarget.setPointerCapture(e.pointerId);
      showSponge(x, y);
    }
  };
  // Select on click, not pointerdown: after a touch tap the click would hit the new sheet's backdrop and close it.
  const onClick = (e: MouseEvent) => {
    const id = mode === 'none' && (e.target as Element).closest('[data-fish]')?.getAttribute('data-fish');
    if (id) onSelect(id);
  };
  const onMove = (e: PointerEvent) => {
    const dr = drag.current;
    if (!dr) return;
    const { x, y } = pos(e);
    dr.dist += Math.hypot(x - dr.x, y - dr.y);
    [dr.x, dr.y] = [x, y];
    showSponge(x, y);
    for (; dr.dist >= C.CLEAN_DRAG_PX; dr.dist -= C.CLEAN_DRAG_PX) clean(tank.id, C.CLEAN_AMOUNT);
  };
  const onUp = () => {
    drag.current = null;
    sponge.current!.classList.remove('on');
  };

  return (
    <div ref={box} className={`tank ${mode}`} onPointerDown={onDown} onClick={onClick} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      {['8%', '42%', '74%'].map((left, i) => <div key={left} className="ray" style={{ left, animationDelay: `${-i * 3}s` }} />)}
      {BUBBLES.map((b, i) => (
        <span key={i} className="bubble"
          style={{ left: b.left, width: b.size, height: b.size, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }} />
      ))}
      <div className="sand" />
      {tank.fish.map((f) => (
        <div key={f.id} data-fish={f.id} className="fish"
          ref={(el) => { if (el) els.current.set(f.id, el); else els.current.delete(f.id); }}>
          <FishSprite look={speciesById(f.speciesId).look} sick={isSick(f)} />
        </div>
      ))}
      <div ref={layer} className="layer" />
      <div className="algae" style={{ opacity: (1 - tank.cleanliness / 100) * 0.8 }} />
      <div ref={sponge} className="sponge" />
    </div>
  );
}
