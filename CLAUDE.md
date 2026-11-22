# Pocket Fishies — project rules

Cute, mobile-first web aquarium game. Vite + React 19 + TypeScript (strict) + Zustand (persist to localStorage) + Vitest. No backend.

## Commands
- `npm run dev` — dev server (also on LAN for phone testing)
- `npm test` — game-rule tests (Vitest)
- `npm run build` — type check + production build

## Workflow (mandatory)
1. Before changing anything, list every file you need and read them all in one pass.
2. Make all edits.
3. Run `npm test` once and `npm run build` once. If one fails, fix it and rerun only that check.
4. Visual QA before reporting: phone-sized (390x844) touch screenshots with headless Edge via playwright-core. QA tooling lives OUTSIDE the project (path given in the task). Look at every screenshot yourself. Fix clear bugs only; list subjective ideas instead.
5. Less is more: simple, concise code. No speculative abstractions, no features beyond the spec, stay within the spec's line budget.
6. No new dependencies unless the spec allows it. Do not run git commands (the supervisor commits).

## Architecture
- All game rules are pure functions in `src/game/sim.ts` (never mutate; pass `now` and ids in). Every rule has a test in `src/game/sim.test.ts`.
- `src/game/store.ts` is a thin Zustand wrapper over `sim.ts`.
- Tuning numbers and content live in `src/data/` (config, fish, upgrades, …). New content = new data rows, not new code.
- Art is SVG drawn in code (`src/art/`), data-driven presets. No image files.
- Tank animation: one requestAnimationFrame loop writing `style.transform` via refs. Never React state per frame.
- UI-only state (mode, selection, open sheets, active tank) is React state in components, not persisted.
- Time: use `gameNow()` from `src/game/clock.ts` (server-time corrected) for anything time-based. Never call `Date.now()` directly in game code (only `clock.ts` and `newId()` may).
- Any change to persisted state: bump persist `version`, extend `migrateSave` in `sim.ts`, add a migration test. Never lose a player's save.

## UI rules
- Portrait, fits 390px wide with no overflow or overlap. App max-width 480px.
- Touch targets at least 44px (48px preferred). Use pointer events. `touch-action` set on game surfaces.
- Do not use `crypto.randomUUID` (fails on http LAN URLs). Use `newId()` from `sim.ts`.
- Style: soft pastels, rounded shapes, gentle shadows, Fredoka font. Cute, clean, readable.
