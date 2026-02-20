# Mario Coin Pusher 3D

A Mario-themed 3D coin pusher web game built with Three.js and cannon-es physics. Mobile-first, portrait orientation. Players drop coins onto a table where an oscillating pusher plate pushes them toward the front edge for collection.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Vite + React 19 |
| 3D Rendering | Three.js (WebGL, PBR materials, shadows, particles) |
| Physics | cannon-es (3D rigid body dynamics) |
| Styling | Tailwind CSS v4 (UI overlays only) |
| Audio | Web Audio API (procedural synth SFX, no audio files) |
| Testing | Vitest |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev

# Run tests
npm test

# Production build
npm run build

# Preview production build
npm run preview
```

## Game Features

### Core Mechanics

- **3D Coin Pusher** -- Drop coins onto a physics-driven table with an oscillating pusher plate
- **Chain Combos** -- Rapidly collecting coins builds chain multipliers:
  - 2x = Nice! (1.5x)
  - 5x = Great! (2x)
  - 10x = Amazing! (3x)
  - 20x = SUPER MARIO! (5x)
- **Dual Coin Sizes** -- Small coins (cost 1) and large coins (cost 5, higher score)
- **Auto-Drop** -- Toggle automatic coin dropping at 600ms intervals
- **Coin Recovery** -- Free coins regenerate over time (1 coin per 3 min, max 50)

### Progression System (50 Levels)

XP-based leveling with increasing difficulty every 5 levels:

- Pusher speed scales up
- Events become more frequent
- XP and coin multipliers increase
- Each level grants coin rewards (10~500 coins)

### Special Items (15 Types)

| Item | Level | Effect |
| --- | --- | --- |
| Question Block | 1 | Random reward |
| Super Star | 3 | 3x score multiplier (10s) |
| Super Mushroom | 5 | 1.5x pusher width (12s) |
| Poison Mushroom | 5 | 0.6x pusher width (8s) |
| Coin Tower | 7 | Burst of 10 coins |
| Fire Flower | 8 | Clear a row of coins |
| Green Pipe | 10 | Teleport 5 coins |
| Coin Pipe | 12 | Coin rain -- 15 coins over 3s |
| Bob-omb | 21 | Explosion after 5s fuse (radius 6) |
| Magnet Mushroom | 23 | Pull coins to center (10s) |
| Diamond Coin | 25 | Worth 50 score |
| Giant Bob-omb | 28 | Huge explosion (radius 10) |

### Events

| Event | Level | Description |
| --- | --- | --- |
| Lakitu | 1+ | Cloud steals 5-50 coins randomly |
| Bullet Bill | 1+ | Sweeps coins off the table |
| Thwomp | 30+ | Slams down and scatters coins |

### Game Modes

| Mode | Level | Description |
| --- | --- | --- |
| Golden Frenzy | 1+ | 1/50 chance per drop -- bonus coins and 1.5x score |
| Boss Mode | 15+ | Fight Bowser (100 HP), 24hr cooldown |
| Low Gravity | 32+ | 35% normal gravity for 12s |
| Dual Pusher | 35+ | Second pusher platform permanently added |
| Boss Rush | 38+ | 3-wave boss fight with increasing difficulty |
| Mega Frenzy | 45+ | 3x duration, 3x pusher speed, 5 coins/tick, 2x score |
| Golden Pusher | 50 | Permanent 1.5x score multiplier with gold visual |

### Scene Themes (8 Themes)

| Scene | Level |
| --- | --- |
| Overworld | Default |
| Underground | 10 |
| Castle | 12 |
| Underwater | 15 |
| Starry Night | 20 |
| Lava Castle | 30 |
| Rainbow Road | 40 |
| Space | 50 |

### Other Systems

- **Lucky Wheel** -- Spin for prizes every 80 coins dropped (auto-claim after 2s)
- **Daily Reward** -- +20 coins per day login bonus
- **Achievements** -- 11 milestones (coin counts, chains, levels, boss defeats, etc.)
- **Leaderboard** -- Top 10 high scores saved locally
- **Haptic Feedback** -- Mobile vibration on interactions
- **Walking Characters** -- Pixel-art Mario characters animate across the screen (Mario, Peach, Toad + Goomba, Koopa, Boo, Shy Guy, Dry Bones)
- **Share Button** -- Share your score
- **3-State Audio** -- All sounds / SFX only (no coin sounds) / Mute

## Architecture

```text
src/
├── game/                        # Imperative game engine (non-React)
│   ├── constants.js             # All tunable values
│   ├── GameEngine.js            # Main loop orchestrator
│   ├── PhysicsWorld3D.js        # cannon-es world, walls, table
│   ├── PusherController3D.js    # Kinematic pusher oscillation
│   ├── CoinManager3D.js         # Coin spawn/remove lifecycle
│   ├── ItemManager3D.js         # Special item physics & spawn logic
│   ├── ItemMeshFactory.js       # Procedural Three.js meshes (no textures)
│   ├── Renderer3D.js            # Three.js scene, camera, lights, shadows
│   ├── ParticleSystem.js        # GPU sparkle particles (additive blending)
│   ├── AudioManager.js          # Web Audio API procedural SFX
│   ├── ComboTracker.js          # Chain/combo detection & tier multipliers
│   ├── EffectManager.js         # Timed game effects (star, mushroom, frenzy)
│   ├── LevelSystem.js           # XP progression, unlocks, difficulty scaling
│   ├── BossSystem.js            # Bowser boss fight & boss rush logic
│   ├── LuckyWheel.js            # Weighted random prize wheel
│   ├── DailyReward.js           # Daily login bonus
│   ├── AchievementSystem.js     # Milestone achievements
│   ├── SaveManager.js           # localStorage persistence
│   ├── HapticManager.js         # Mobile vibration feedback
│   ├── QualityManager.js        # Graphics quality settings
│   ├── EventBus.js              # Pub/Sub event system
│   └── __tests__/               # Unit tests (121 tests, 11 files)
│
├── components/                  # React UI overlays
│   ├── GameScreen.jsx           # Root game layout & overlay orchestration
│   ├── HUD.jsx                  # Score, balance, level, XP bar
│   ├── ActionBar.jsx            # Drop, auto-drop, boss, audio, settings buttons
│   ├── DropZoneOverlay.jsx      # Touch/mouse input for coin positioning
│   ├── ChainPopup.jsx           # "Nice!/Great!/Amazing!/SUPER MARIO!" overlay
│   ├── ActiveEffects.jsx        # Current timed effect indicators
│   ├── ItemPopup.jsx            # Item collection notification
│   ├── LevelUpPopup.jsx         # Level up celebration & unlock display
│   ├── AchievementPopup.jsx     # Achievement unlock notification
│   ├── FrenzyOverlay.jsx        # Frenzy / Mega Frenzy visual feedback
│   ├── BossOverlay.jsx          # Boss HP bar, timer, wave indicator
│   ├── LuckyWheelOverlay.jsx    # Spinning wheel modal with auto-claim
│   ├── DailyRewardPopup.jsx     # Daily reward notification
│   ├── LakituPopup.jsx          # Lakitu coin theft animation
│   ├── BulletBillPopup.jsx      # Bullet Bill sweep animation
│   ├── ThwompPopup.jsx          # Thwomp slam animation
│   ├── LowGravityPopup.jsx      # Low gravity indicator
│   ├── SettingsPanel.jsx        # Scene, audio, haptic, quality settings
│   ├── LeaderboardPanel.jsx     # Top 10 high scores
│   ├── WalkingCharacters.jsx    # Pixel-art walking characters
│   └── ShareButton.jsx          # Score sharing
│
├── hooks/
│   └── useGameEngine.js         # Bridge: game engine ↔ React state
│
├── App.jsx                      # React root
├── main.jsx                     # Vite entry point
└── index.css                    # Global styles + Tailwind
```

### Design Principles

- **React does NOT re-render at 60fps** -- only on state changes (score, balance, chain, level-up)
- **Game engine is imperative** -- physics and rendering run in a `requestAnimationFrame` loop independent of React
- **All audio is procedural** -- Web Audio API synthesized sounds, zero audio file dependencies
- **All 3D meshes are procedural** -- created programmatically via Three.js, no external 3D models or textures
- **Mobile-first** -- 390x600px viewport, touch controls, responsive scaling

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm test` | Run all tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | ESLint check |

## License

Private project.
