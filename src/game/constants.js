// ── Viewport (React UI sizing) ──
export const VIEWPORT_WIDTH = 390;
export const VIEWPORT_HEIGHT = 600;

// ── 3D World Dimensions ──
export const TABLE_WIDTH = 8;
export const TABLE_DEPTH = 10;
export const TABLE_THICKNESS = 0.5;
export const TABLE_Y = 0;

// ── Walls ──
export const WALL_HEIGHT = 2;
export const WALL_THICKNESS = 0.3;

// ── Coin (3D cylinder) ──
export const COIN_RADIUS = 0.4;
export const COIN_HEIGHT = 0.12;
export const COIN_MASS = 0.5;
export const COIN_FRICTION = 0.4;
export const COIN_RESTITUTION = 0.15;
export const MAX_COINS = 300;

// ── Pusher ──
export const PUSHER_WIDTH = TABLE_WIDTH;    // full table width — no gaps on sides
export const PUSHER_DEPTH = 1.2;
export const PUSHER_HEIGHT = 0.6;
export const PUSHER_Z_MIN = -TABLE_DEPTH / 2 + PUSHER_DEPTH / 2 + 0.1; // flush with back wall
export const PUSHER_Z_MAX = 2.5;            // extended (pushes coins toward front edge at Z=5)
export const PUSHER_SPEED = 0.06;           // world units per frame

// ── Drop Zone ──
export const DROP_Y = 5;
export const DROP_Z = -1;                   // drop in front of retracted pusher
export const DROP_X_RANGE = 3.5;

// ── Collection ──
export const COLLECTION_Y = -3;

// ── Camera ──
export const CAMERA_POSITION = { x: 0, y: 12, z: 10 };
export const CAMERA_LOOK_AT = { x: 0, y: 0, z: -1 };
export const CAMERA_FOV = 45;

// ── Physics ──
export const GRAVITY = { x: 0, y: -9.82, z: 0 };
export const PHYSICS_TIMESTEP = 1 / 60;
export const PHYSICS_MAX_SUBSTEPS = 3;

// ── Scoring ──
export const COIN_SCORE_VALUE = 1;
export const INITIAL_COIN_BALANCE = 1000;
export const INITIAL_COINS_ON_TABLE = 50;

// ── Cooldown ──
export const DROP_COOLDOWN_MS = 500;
export const AUTO_DROP_INTERVAL_MS = 300;   // faster interval for auto-drop mode

// ── Chain / Combo ──
export const CHAIN_WINDOW_MS = 1500;        // 1.5s window to continue chain
export const CHAIN_TIERS = [
  { minChain: 2,  multiplier: 1.5, label: 'Nice!',         color: '#43b047' },
  { minChain: 5,  multiplier: 2.0, label: 'Great!',        color: '#049cd8' },
  { minChain: 10, multiplier: 3.0, label: 'Amazing!',      color: '#fbd000' },
  { minChain: 20, multiplier: 5.0, label: 'SUPER MARIO!',  color: '#e52521' },
];

// ── Coin Recovery ──
export const COIN_RECOVERY_INTERVAL_MS = 180000; // 3 minutes per coin
export const COIN_RECOVERY_MAX = 50;              // max free recovery balance

// ── Audio ──
export const AUDIO_MASTER_VOLUME = 0.5;

// ── Material Colors ──
export const MATERIAL_CONFIG = {
  coin: { color: 0xffc107, metalness: 0.8, roughness: 0.2 },
  coinEdge: { color: 0xb8860b, metalness: 0.7, roughness: 0.3 },
  pusher: { color: 0x8b4513, metalness: 0.3, roughness: 0.7 },
  table: { color: 0x2d5a27, metalness: 0.1, roughness: 0.9 },
  wall: { color: 0x4a3728, metalness: 0.2, roughness: 0.8 },
  tray: { color: 0x1a0a2e, metalness: 0.1, roughness: 0.9 },
  background: 0x2a1a4e,
};
