# CLAUDE.md - Mario Coin Pusher

## Project Overview
A Mario-themed 3D coin pusher web game. Mobile-first, portrait orientation. Players drop coins onto a table where an oscillating pusher plate pushes them toward the front edge for collection.

## Tech Stack
- **Framework**: Vite + React
- **Physics**: cannon-es (3D rigid body physics)
- **Rendering**: Three.js WebGL (3D scene with PBR materials, shadows, particles)
- **Styling**: Tailwind CSS v4 (UI overlays only)
- **Audio**: Web Audio API (procedural synth SFX, no audio files)

## Architecture
- `src/game/` — Imperative game engine (3D physics, 3D rendering, game loop)
  - `constants.js` — All tunable values (3D world units, chain tiers, audio)
  - `GameEngine.js` — Main loop orchestrator, integrates all subsystems
  - `PhysicsWorld3D.js` — cannon-es world, walls, table
  - `PusherController3D.js` — Kinematic pusher oscillation
  - `CoinManager3D.js` — Coin spawn/remove lifecycle
  - `Renderer3D.js` — Three.js scene, camera, lights, meshes, background, particles
  - `AudioManager.js` — Web Audio API procedural SFX (coin drop/collect/chain)
  - `ComboTracker.js` — Chain/combo detection with time window and tier multipliers
  - `ParticleSystem.js` — GPU-based sparkle particle system (Points + additive blending)
- `src/components/` — React UI overlays
  - `GameScreen.jsx` — Root game layout
  - `HUD.jsx` — Score, balance, chain multiplier display
  - `ActionBar.jsx` — DROP, AUTO, audio toggle buttons
  - `ChainPopup.jsx` — Animated "Nice!/Great!/Amazing!/SUPER MARIO!" overlay
  - `DropZoneOverlay.jsx` — Touch/mouse input for coin positioning
- `src/hooks/`
  - `useGameEngine.js` — Bridges engine ↔ React state (score, balance, combo, audio, recovery)
- cannon-es handles physics; Three.js renders the 3D scene
- React does NOT re-render at 60fps — only on state changes (score, balance, chain)

## 3D World Coordinate System
- X axis: left-right (table width)
- Y axis: up-down (height/gravity)
- Z axis: front-back (pusher direction, +Z = front/fall edge)

## Key Constants (src/game/constants.js)
- Viewport: 390×600px, max 300 coins
- Table: 8×10 world units
- Coin: radius 0.4, height 0.12 (cylinder)
- Pusher: full table width (8) × 1.2 × 0.6, kinematic body, Z range -4.3 to +2.5
- Camera: perspective at (0, 12, 10) looking at (0, 0, -1)
- Gravity: { x: 0, y: -9.82, z: 0 }
- Coin cost: small=2, large=10; score: small=1, large=5
- Auto-drop interval: 500ms
- Chain tiers: 2→Nice!(×1.5), 5→Great!(×2), 10→Amazing!(×3), 20→SUPER MARIO!(×5)
- Coin recovery: 1 coin per 3 minutes (max 50 free balance)
- Super Mushroom: 1.5x pusher width+depth (12s); Poison Mushroom: 0.6x (8s)
- Magnet Mushroom: 5s duration; Diamond Coin: 100 score
- Giant Bob-omb blast radius: 15
- Lakitu: steals 5-100 coins, 30-60s interval
- Thwomp: unlocked at level 1

## Development Progress
- **P0 (MVP)**: ✅ Complete — physics, pusher, coins, scoring, HUD, touch input, auto-drop
- **P1 (Core Experience)**: ✅ Complete — audio SFX, chain combos, particles, background, brick pusher
- **P2 (Special Items)**: Planned — question blocks, stars, mushrooms, fire flowers, pipes
- **P3 (Advanced Systems)**: Planned — levels, lucky wheel, scene switching, golden frenzy
- **P4 (Polish)**: Planned — boss mode, daily rewards, achievements, PWA

## Scripts
- `npm run dev` — Start dev server (port 3000)
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npm test` — Run all tests (vitest)

## Workflow

- **Always run `npm test` before and after making changes** to ensure nothing is broken.
- Tests are in `src/game/__tests__/` covering core game logic modules.
- When adding new game logic, add corresponding tests.
