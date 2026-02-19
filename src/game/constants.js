// ── Viewport (React UI sizing) ──
export const VIEWPORT_WIDTH = 390;
export const VIEWPORT_HEIGHT = 600;

// ── 3D World Dimensions ──
export const TABLE_WIDTH = 8;
export const TABLE_DEPTH = 14;
export const TABLE_THICKNESS = 0.5;
export const TABLE_Y = 0;
export const TABLE_TILT_DEG = 0; // flat table (no tilt)
export const TABLE_TILT_RAD = TABLE_TILT_DEG * Math.PI / 180;

// ── Walls ──
export const WALL_HEIGHT = 2;
export const WALL_THICKNESS = 0.3;

// ── Coin (3D cylinder) ──
export const COIN_RADIUS = 0.6;
export const COIN_HEIGHT = 0.15;
export const COIN_MASS = 0.9;
export const COIN_FRICTION = 0.5;
export const COIN_RESTITUTION = 0.1;
export const MAX_COINS = 999;

// ── Pusher (large sliding platform — Mario red) ──
export const PUSHER_WIDTH = TABLE_WIDTH;
export const PUSHER_DEPTH = 7.0;          // large platform covers most of the table
export const PUSHER_HEIGHT = 0.5;         // thick enough to push coins
export const PUSHER_Z_MIN = -3.0;         // back position
export const PUSHER_Z_MAX = 1.5;          // forward position
export const PUSHER_SPEED = 0.03;         // slower for larger platform

// ── Fixed Barrier (stops coins when platform retracts) ──
export const BARRIER_Z = -3.0;            // fixed position above table (further back)
export const BARRIER_HEIGHT = 1.5;        // tall enough to block coins
export const BARRIER_THICKNESS = 0.15;

// ── Drop Zone ── (above the platform surface)
export const DROP_Y = 4;
export const DROP_Z = -1.5;              // always on platform surface
export const DROP_X_RANGE = 3.5;

// ── Collection ──
export const COLLECTION_Y = -3;

// ── Camera ──
export const CAMERA_POSITION = { x: 0, y: 16, z: 16 };
export const CAMERA_LOOK_AT = { x: 0, y: -1, z: 1 };
export const CAMERA_FOV = 50;

// ── Physics ──
export const GRAVITY = { x: 0, y: -9.82, z: 0 };
export const PHYSICS_TIMESTEP = 1 / 60;
export const PHYSICS_MAX_SUBSTEPS = 2;

// ── Scoring ──
export const COIN_SCORE_VALUE = 1;
export const INITIAL_COIN_BALANCE = 1000;
export const INITIAL_COINS_ON_TABLE = 18;

// ── Cooldown ──
export const DROP_COOLDOWN_MS = 500;
export const AUTO_DROP_INTERVAL_MS = 600;

// ── Chain / Combo ──
export const CHAIN_WINDOW_MS = 1500;
export const CHAIN_TIERS = [
  { minChain: 2,  multiplier: 1.5, label: '不錯！',          color: '#43b047' },
  { minChain: 5,  multiplier: 2.0, label: '太棒了！',       color: '#049cd8' },
  { minChain: 10, multiplier: 3.0, label: '超厲害！',       color: '#fbd000' },
  { minChain: 20, multiplier: 5.0, label: '超級瑪利歐！',   color: '#e52521' },
];

// ── Coin Recovery ──
export const COIN_RECOVERY_INTERVAL_MS = 180000;
export const COIN_RECOVERY_MAX = 50;

// ── Audio ──
export const AUDIO_MASTER_VOLUME = 0.5;

// ── Frenzy ──
export const FRENZY_CHANCE = 1 / 50;
export const FRENZY_DURATION_MS = 15000;
export const FRENZY_COIN_INTERVAL_MS = 400;
export const FRENZY_COINS_PER_TICK = 2;

// ══════════════════════════════════════
// ── P2: Special Item Types ──
// ══════════════════════════════════════
export const ITEM_TYPES = {
  question_block: {
    id: 'question_block', label: '? Block', spawnRate: 0.05, mass: 1.0,
    physics: 'box', size: 0.3, color: 0xfbd000, minLevel: 1,
    effect: { type: 'random_reward' },
  },
  star: {
    id: 'star', label: 'Super Star', spawnRate: 0.03, mass: 0.3,
    physics: 'sphere', physicsRadius: 0.3, color: 0xfbd000, minLevel: 1,
    effect: { type: 'score_multiplier', multiplier: 3, duration: 10000 },
  },
  mushroom: {
    id: 'mushroom', label: 'Super Mushroom', spawnRate: 0.04, mass: 0.6,
    physics: 'sphere', physicsRadius: 0.3, color: 0xe52521, minLevel: 3,
    effect: { type: 'wider_pusher', widthMultiplier: 1.5, duration: 12000 },
  },
  coin_tower: {
    id: 'coin_tower', label: 'Coin Tower', spawnRate: 0.02, mass: 1.5,
    physics: 'cylinder', physicsRadius: 0.3, physicsHeight: 0.5, color: 0xffc107, minLevel: 5,
    effect: { type: 'burst_coins', count: 10 },
  },
  fire_flower: {
    id: 'fire_flower', label: 'Fire Flower', spawnRate: 0.01, mass: 0.4,
    physics: 'sphere', physicsRadius: 0.25, color: 0xff4500, minLevel: 8,
    effect: { type: 'clear_row' },
  },
  green_pipe: {
    id: 'green_pipe', label: 'Green Pipe', spawnRate: 0.03, mass: 2.0,
    physics: 'cylinder', physicsRadius: 0.3, physicsHeight: 0.5, color: 0x43b047, minLevel: 5,
    effect: { type: 'teleport_coins', count: 5 },
  },
  poison_mushroom: {
    id: 'poison_mushroom', label: 'Poison Mushroom', spawnRate: 0.02, mass: 0.6,
    physics: 'sphere', physicsRadius: 0.3, color: 0x800080, minLevel: 3,
    effect: { type: 'narrower_pusher', widthMultiplier: 0.6, duration: 8000 },
  },
};

// ══════════════════════════════════════
// ── P3: Level System ──
// ══════════════════════════════════════
export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0 },     { level: 2, xp: 20 },
  { level: 3, xp: 50 },    { level: 4, xp: 100 },
  { level: 5, xp: 150 },   { level: 6, xp: 220 },
  { level: 7, xp: 300 },   { level: 8, xp: 400 },
  { level: 9, xp: 540 },   { level: 10, xp: 700 },
  { level: 11, xp: 880 },  { level: 12, xp: 1080 },
  { level: 13, xp: 1300 }, { level: 14, xp: 1500 },
  { level: 15, xp: 1800 }, { level: 16, xp: 2100 },
  { level: 17, xp: 2400 }, { level: 18, xp: 2700 },
  { level: 19, xp: 3000 }, { level: 20, xp: 3500 },
];

export const LEVEL_UNLOCKS = {
  1:  ['question_block', 'star'],
  3:  ['mushroom', 'poison_mushroom'],
  5:  ['coin_tower', 'green_pipe'],
  8:  ['fire_flower'],
  10: ['underground_scene'],
  12: ['castle_scene'],
  15: ['boss_mode', 'underwater_scene'],
  20: ['custom_pusher'],
};

// ══════════════════════════════════════
// ── P3: Scene Definitions ──
// ══════════════════════════════════════
export const SCENES = {
  overworld: {
    id: 'overworld', label: 'Overworld',
    background: 0x2a1a4e, skyTop: 0x4a90d9, skyBottom: 0x87ceeb,
    hillColor: 0x43b047, tableColor: 0x2d5a27, wallColor: 0x4a3728,
  },
  underground: {
    id: 'underground', label: 'Underground',
    background: 0x0a0a0a, skyTop: 0x1a1a2a, skyBottom: 0x2a2a3a,
    hillColor: 0x333344, tableColor: 0x1a3a1a, wallColor: 0x2a2a3a,
  },
  castle: {
    id: 'castle', label: 'Castle',
    background: 0x1a0a0a, skyTop: 0x331100, skyBottom: 0x1a0500,
    hillColor: 0x2a1a1a, tableColor: 0x3a2a2a, wallColor: 0x4a3a3a,
  },
  underwater: {
    id: 'underwater', label: 'Underwater',
    background: 0x0a2a4a, skyTop: 0x004488, skyBottom: 0x006688,
    hillColor: 0x225533, tableColor: 0x1a4a3a, wallColor: 0x2a3a4a,
  },
};

// ── Material Colors ──
export const MATERIAL_CONFIG = {
  coin: { color: 0xffc107, metalness: 0.8, roughness: 0.2 },
  coinEdge: { color: 0xb8860b, metalness: 0.7, roughness: 0.3 },
  pusher: { color: 0x8b4513, metalness: 0.3, roughness: 0.7 },
  table: { color: 0x2d5a27, metalness: 0.1, roughness: 0.9 },
  wall: { color: 0x4a3728, metalness: 0.2, roughness: 0.8 },
  tray: { color: 0x2a7a4e, metalness: 0.2, roughness: 0.7 },
  background: 0x5cb8ff,
};
