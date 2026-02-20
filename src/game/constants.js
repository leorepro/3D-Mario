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

// ── Coin Sizes ──
export const COIN_SIZES = {
  small: {
    radius: COIN_RADIUS,
    height: COIN_HEIGHT,
    mass: COIN_MASS,
    dropCost: 1,
    collectValue: 1,
    scoreValue: 1,
  },
  large: {
    radius: COIN_RADIUS * 1.5,  // 0.9
    height: COIN_HEIGHT * 1.5,  // 0.225
    mass: COIN_MASS * 2.25,     // 2.025 (1.5² scaling)
    dropCost: 5,
    collectValue: 5,
    scoreValue: 5,
  },
};

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
  bob_omb: {
    id: 'bob_omb', label: 'Bob-omb', spawnRate: 0, mass: 1.2,
    physics: 'sphere', physicsRadius: 0.3, color: 0x222222, minLevel: 1,
    effect: { type: 'bob_omb' },
  },
  magnet_mushroom: {
    id: 'magnet_mushroom', label: 'Magnet Mushroom', spawnRate: 0, mass: 0.6,
    physics: 'sphere', physicsRadius: 0.3, color: 0x4444ff, minLevel: 1,
    effect: { type: 'magnet', duration: 10000 },
  },
  coin_pipe: {
    id: 'coin_pipe', label: 'Coin Pipe', spawnRate: 0, mass: 2.0,
    physics: 'cylinder', physicsRadius: 0.3, physicsHeight: 0.5, color: 0xffd700, minLevel: 1,
    effect: { type: 'coin_rain', count: 15, duration: 3000 },
  },
  diamond_coin: {
    id: 'diamond_coin', label: 'Diamond Coin', spawnRate: 0, mass: 0.5,
    physics: 'sphere', physicsRadius: 0.35, color: 0x00bfff, minLevel: 25,
    effect: { type: 'diamond_score', scoreValue: 50 },
  },
  giant_bob_omb: {
    id: 'giant_bob_omb', label: 'Giant Bob-omb', spawnRate: 0, mass: 3.0,
    physics: 'sphere', physicsRadius: 0.5, color: 0x111111, minLevel: 28,
    effect: { type: 'giant_bob_omb' },
  },
};

// ── Bob-omb ──
export const BOBOMB_FUSE_MS = 5000;
export const BOBOMB_BLAST_RADIUS = 6.0;
export const BOBOMB_PUSH_FORCE = 8;
export const BOBOMB_SCATTER_FORCE = 6;

// ── Giant Bob-omb ──
export const GIANT_BOBOMB_FUSE_MS = 7000;
export const GIANT_BOBOMB_BLAST_RADIUS = 10.0;
export const GIANT_BOBOMB_PUSH_FORCE = 12;
export const GIANT_BOBOMB_SCATTER_FORCE = 10;

// ══════════════════════════════════════
// ── P3: Level System ──
// ══════════════════════════════════════
export const LEVEL_THRESHOLDS = [
  // L1-L20 (existing)
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
  // L21-L30 (mid-game)
  { level: 21, xp: 4060 },  { level: 22, xp: 4690 },
  { level: 23, xp: 5400 },  { level: 24, xp: 6200 },
  { level: 25, xp: 7100 },  { level: 26, xp: 8100 },
  { level: 27, xp: 9200 },  { level: 28, xp: 10400 },
  { level: 29, xp: 11800 }, { level: 30, xp: 13500 },
  // L31-L40 (late-game)
  { level: 31, xp: 15300 }, { level: 32, xp: 17300 },
  { level: 33, xp: 19500 }, { level: 34, xp: 22000 },
  { level: 35, xp: 24800 }, { level: 36, xp: 27900 },
  { level: 37, xp: 31300 }, { level: 38, xp: 35000 },
  { level: 39, xp: 39000 }, { level: 40, xp: 43500 },
  // L41-L50 (end-game)
  { level: 41, xp: 48500 },  { level: 42, xp: 54000 },
  { level: 43, xp: 60000 },  { level: 44, xp: 66500 },
  { level: 45, xp: 73500 },  { level: 46, xp: 81000 },
  { level: 47, xp: 89000 },  { level: 48, xp: 97500 },
  { level: 49, xp: 106500 }, { level: 50, xp: 116000 },
];

export const LEVEL_UNLOCKS = {
  1:  ['question_block', 'star'],
  2:  ['coin_reward_10'],
  3:  ['mushroom', 'poison_mushroom'],
  4:  ['coin_reward_15'],
  5:  ['coin_tower', 'green_pipe'],
  6:  ['coin_reward_20'],
  7:  ['coin_reward_20'],
  8:  ['fire_flower'],
  9:  ['coin_reward_25'],
  10: ['underground_scene', 'coin_reward_50'],
  11: ['coin_reward_25'],
  12: ['castle_scene'],
  13: ['coin_reward_30'],
  14: ['coin_reward_30'],
  15: ['boss_mode', 'underwater_scene'],
  16: ['coin_reward_35'],
  17: ['coin_reward_35'],
  18: ['coin_reward_40'],
  19: ['coin_reward_40'],
  20: ['custom_pusher', 'starry_night_scene', 'coin_reward_100'],
  21: ['bob_omb_spawn'],
  22: ['coin_reward_50'],
  23: ['magnet_mushroom_spawn'],
  24: ['coin_reward_50'],
  25: ['diamond_coin', 'coin_reward_100'],
  26: ['coin_pipe_spawn'],
  27: ['coin_reward_60'],
  28: ['giant_bob_omb'],
  29: ['coin_reward_75'],
  30: ['lava_castle_scene', 'thwomp_event', 'coin_reward_150'],
  31: ['coin_reward_75'],
  32: ['low_gravity_mode'],
  33: ['coin_reward_80'],
  34: ['coin_reward_80'],
  35: ['dual_pusher', 'coin_reward_150'],
  36: ['coin_reward_100'],
  37: ['coin_reward_100'],
  38: ['boss_rush'],
  39: ['coin_reward_120'],
  40: ['rainbow_road_scene', 'coin_reward_200'],
  41: ['coin_reward_120'],
  42: ['coin_reward_150'],
  43: ['coin_reward_150'],
  44: ['coin_reward_150'],
  45: ['mega_frenzy', 'coin_reward_200'],
  46: ['coin_reward_200'],
  47: ['coin_reward_200'],
  48: ['coin_reward_250'],
  49: ['coin_reward_250'],
  50: ['space_scene', 'golden_pusher', 'coin_reward_500'],
};

// ── Level Coin Rewards ──
export const LEVEL_COIN_REWARDS = {
  2: 10,   4: 15,   6: 20,   7: 20,   9: 25,
  10: 50,  11: 25,  13: 30,  14: 30,  16: 35,
  17: 35,  18: 40,  19: 40,  20: 100,
  22: 50,  24: 50,  25: 100, 27: 60,  29: 75,
  30: 150, 31: 75,  33: 80,  34: 80,  35: 150,
  36: 100, 37: 100, 39: 120, 40: 200,
  41: 120, 42: 150, 43: 150, 44: 150, 45: 200,
  46: 200, 47: 200, 48: 250, 49: 250, 50: 500,
};

// ── Difficulty Scaling (per 5 levels) ──
export const DIFFICULTY_SCALING = {
  scalingInterval: 5,
  pusherSpeedMultiplier: 0.10,
  eventFrequencyMultiplier: 0.15,
  xpMultiplier: 0.05,
  coinMultiplier: 0.08,
};

export function getDifficultyScale(level) {
  const tier = Math.floor((level - 1) / 5);
  return {
    pusherSpeed: 1 + tier * DIFFICULTY_SCALING.pusherSpeedMultiplier,
    eventFreq: Math.max(0.10, 1 - tier * DIFFICULTY_SCALING.eventFrequencyMultiplier),
    xpMult: 1 + tier * DIFFICULTY_SCALING.xpMultiplier,
    coinMult: 1 + tier * DIFFICULTY_SCALING.coinMultiplier,
  };
}

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
  starry_night: {
    id: 'starry_night', label: '星空 Starry Night',
    background: 0x0a0a2e, skyTop: 0x000022, skyBottom: 0x1a1a4e,
    hillColor: 0x1a1a3a, tableColor: 0x1a2a3a, wallColor: 0x2a2a4a,
  },
  lava_castle: {
    id: 'lava_castle', label: '岩漿城堡 Lava Castle',
    background: 0x1a0500, skyTop: 0x440000, skyBottom: 0x220000,
    hillColor: 0x3a1a0a, tableColor: 0x4a2a1a, wallColor: 0x3a2a2a,
  },
  rainbow_road: {
    id: 'rainbow_road', label: '彩虹跑道 Rainbow Road',
    background: 0x1a0a3a, skyTop: 0x4a0088, skyBottom: 0x0044aa,
    hillColor: 0x3a2a5a, tableColor: 0x2a2a4a, wallColor: 0x4a3a6a,
  },
  space: {
    id: 'space', label: '太空 Space',
    background: 0x000005, skyTop: 0x000010, skyBottom: 0x000020,
    hillColor: 0x111122, tableColor: 0x1a1a2a, wallColor: 0x222233,
  },
};

// ── Lakitu Event ──
export const LAKITU_MIN_INTERVAL = 30000;   // 最短 30 秒
export const LAKITU_MAX_INTERVAL = 120000;  // 最長 2 分鐘
export const LAKITU_FLY_IN_MS = 2000;       // 飛入動畫時間
export const LAKITU_FISH_MS = 2000;         // 釣魚動畫時間
export const LAKITU_FLY_OUT_MS = 2000;      // 飛出動畫時間
export const LAKITU_COINS_TO_STEAL = 5;     // 偷走的金幣數量
export const LAKITU_HEIGHT = 5;             // 飛行高度 (y)
export const LAKITU_ENTRY_X = 8;            // 從右側進入 x 位置

// ── Coin Rain ──
export const COIN_RAIN_COUNT = 15;
export const COIN_RAIN_DURATION_MS = 3000;

// ── Bullet Bill Event ──
export const BULLET_BILL_MIN_INTERVAL = 45000;
export const BULLET_BILL_MAX_INTERVAL = 150000;
export const BULLET_BILL_FLY_IN_MS = 800;
export const BULLET_BILL_SWEEP_MS = 1200;
export const BULLET_BILL_FLY_OUT_MS = 600;
export const BULLET_BILL_PUSH_FORCE = 6;
export const BULLET_BILL_HEIGHT = 1.0;
export const BULLET_BILL_ENTRY_X = 10;

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
