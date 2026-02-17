import { PhysicsWorld3D } from './PhysicsWorld3D.js';
import { PusherController3D } from './PusherController3D.js';
import { CoinManager3D } from './CoinManager3D.js';
import { Renderer3D } from './Renderer3D.js';
import { AudioManager } from './AudioManager.js';
import { ComboTracker } from './ComboTracker.js';
import * as C from './constants.js';

export class GameEngine {
  constructor(container, callbacks = {}) {
    this.callbacks = callbacks;
    this.container = container;

    // 3D Physics world
    this.physics = new PhysicsWorld3D();

    // Pusher (3D kinematic body)
    this.pusher = new PusherController3D(this.physics);

    // Coin manager
    this.coinManager = new CoinManager3D(this.physics);

    // 3D Renderer (now includes ParticleSystem)
    this.renderer = new Renderer3D(container);

    // Audio
    this.audio = new AudioManager();

    // Combo tracker
    this.combo = new ComboTracker();

    // Game state
    this.isRunning = false;
    this.animFrameId = null;
    this.dropX = 0;
    this.lastDropTime = 0;
    this.lastTime = 0;
  }

  start() {
    this.isRunning = true;
    this.spawnInitialCoins();
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  loop() {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    // Step physics
    this.physics.step(dt);

    // Update pusher
    this.pusher.update();

    // Check coin falls
    this.checkCoinFalls();

    // Update particles
    this.renderer.updateParticles(dt);

    // Render
    this.renderer.render({
      pusherBody: this.pusher.getBody(),
      coins: this.coinManager.getCoins(),
      dropX: this.dropX,
    });

    this.animFrameId = requestAnimationFrame(() => this.loop());
  }

  checkCoinFalls() {
    const coins = [...this.coinManager.getCoins()];
    for (const coin of coins) {
      const pos = coin.body.position;

      if (pos.y < C.COLLECTION_Y) {
        if (pos.z > 0) {
          // ── Coin collected from front edge ──
          const coinPos = { x: pos.x, y: pos.y, z: pos.z };
          this.coinManager.removeCoin(coin);

          // Audio
          this.audio.playCoinCollected();

          // Particles at collection point
          this.renderer.emitParticles(coinPos, { count: 10, color: 0xffc107, speed: 3 });

          // Combo
          const result = this.combo.onCoinCollected();
          const scoreValue = Math.floor(C.COIN_SCORE_VALUE * result.multiplier);

          this.callbacks.onCoinCollected?.(scoreValue, result);

          // Chain tier SFX + particles
          if (result.newTier && result.tier) {
            this.audio.playChainTier(result.tierIndex);
            this.renderer.emitChainBurst(
              { x: 0, y: 2, z: C.TABLE_DEPTH / 2 },
              result.tierIndex
            );
          }
        } else {
          this.coinManager.removeCoin(coin);
          this.audio.playCoinLost();
          this.callbacks.onCoinLost?.();
        }
      } else if (Math.abs(pos.x) > C.TABLE_WIDTH / 2 + 3) {
        this.coinManager.removeCoin(coin);
        this.audio.playCoinLost();
        this.callbacks.onCoinLost?.();
      } else if (pos.z < -C.TABLE_DEPTH / 2 - 3) {
        this.coinManager.removeCoin(coin);
        this.audio.playCoinLost();
        this.callbacks.onCoinLost?.();
      }
    }
  }

  dropCoin(ignoreCooldown = false) {
    const now = Date.now();
    if (!ignoreCooldown && now - this.lastDropTime < C.DROP_COOLDOWN_MS) return false;

    const randomOffset = (Math.random() - 0.5) * 0.8;
    const x = Math.max(
      -C.DROP_X_RANGE,
      Math.min(C.DROP_X_RANGE, this.dropX + randomOffset)
    );

    const coin = this.coinManager.spawnCoin(x, C.DROP_Y, C.DROP_Z);
    if (coin) {
      this.lastDropTime = now;
      this.audio.playCoinDrop();
      return true;
    }
    return false;
  }

  toggleAudio() {
    return this.audio.toggle();
  }

  setDropX(x) {
    this.dropX = Math.max(-C.DROP_X_RANGE, Math.min(C.DROP_X_RANGE, x));
  }

  screenToWorldX(screenX, screenY) {
    return this.renderer.screenToWorldX(screenX, screenY);
  }

  spawnInitialCoins() {
    const pusherFrontZ = C.PUSHER_Z_MAX + C.PUSHER_DEPTH / 2;
    const tableEdgeZ = C.TABLE_DEPTH / 2;
    const xMin = -C.TABLE_WIDTH / 2 + C.COIN_RADIUS * 2;
    const xMax = C.TABLE_WIDTH / 2 - C.COIN_RADIUS * 2;

    const total = C.INITIAL_COINS_ON_TABLE;
    const frontStackCount = Math.floor(total * 0.5); // 50% stacked near front edge
    const midCount = Math.floor(total * 0.3);         // 30% scattered in middle
    const backCount = total - frontStackCount - midCount; // 20% near pusher

    // Front zone: stacked coins near the edge (precarious)
    // Multiple layers, slightly random to look unstable
    for (let i = 0; i < frontStackCount; i++) {
      const x = xMin + Math.random() * (xMax - xMin);
      const layer = Math.floor(i / 12); // ~12 coins per layer
      const y = C.COIN_HEIGHT / 2 + 0.02 + layer * (C.COIN_HEIGHT + 0.01);
      const z = tableEdgeZ - 1.0 - Math.random() * 1.5; // Z = 2.5 to 4.0 (near edge)
      this.coinManager.spawnCoin(x, y, z);
    }

    // Middle zone: loose coins
    for (let i = 0; i < midCount; i++) {
      const x = xMin + Math.random() * (xMax - xMin);
      const y = C.COIN_HEIGHT / 2 + 0.1 + Math.random() * 1.5;
      const z = pusherFrontZ + 0.5 + Math.random() * (tableEdgeZ - pusherFrontZ - 2.5);
      this.coinManager.spawnCoin(x, y, z);
    }

    // Back zone: coins right in front of pusher
    for (let i = 0; i < backCount; i++) {
      const x = xMin + Math.random() * (xMax - xMin);
      const y = C.COIN_HEIGHT / 2 + 0.1 + Math.random() * 0.8;
      const z = pusherFrontZ + C.COIN_RADIUS + Math.random() * 1.5;
      this.coinManager.spawnCoin(x, y, z);
    }
  }

  destroy() {
    this.stop();
    this.audio.destroy();
    this.physics.destroy();
    this.renderer.dispose();
  }
}
