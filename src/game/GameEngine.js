import { PhysicsWorld3D } from './PhysicsWorld3D.js';
import { PusherController3D } from './PusherController3D.js';
import { CoinManager3D } from './CoinManager3D.js';
import { Renderer3D } from './Renderer3D.js';
import { AudioManager } from './AudioManager.js';
import { ComboTracker } from './ComboTracker.js';
import { EventBus } from './EventBus.js';
import { EffectManager } from './EffectManager.js';
import { ItemManager3D } from './ItemManager3D.js';
import { HapticManager } from './HapticManager.js';
import { BossSystem } from './BossSystem.js';
import { SaveManager } from './SaveManager.js';
import { LevelSystem } from './LevelSystem.js';
import { AchievementSystem } from './AchievementSystem.js';
import { QualityManager } from './QualityManager.js';
import { WHEEL_TRIGGER_INTERVAL } from './LuckyWheel.js';
import * as C from './constants.js';

export class GameEngine {
  constructor(container, callbacks = {}) {
    this.callbacks = callbacks;
    this.container = container;

    // Quality detection
    this.quality = new QualityManager();

    // Core systems
    this.eventBus = new EventBus();
    this.saveManager = new SaveManager();

    // 3D Physics world
    this.physics = new PhysicsWorld3D(this.quality);

    // Single pusher system
    this.pusher = new PusherController3D(this.physics, {
      width: C.PUSHER_WIDTH,
      height: C.PUSHER_HEIGHT,
      depth: C.PUSHER_DEPTH,
      zMin: C.PUSHER_Z_MIN,
      zMax: C.PUSHER_Z_MAX,
      speed: C.PUSHER_SPEED,
      startDirection: 1,
    });

    // Coin manager
    this.coinManager = new CoinManager3D(this.physics, this.quality);

    // Item manager
    this.itemManager = new ItemManager3D(this.physics);

    // 3D Renderer
    this.renderer = new Renderer3D(container, this.quality);

    // Audio
    this.audio = new AudioManager();

    // Combo tracker
    this.combo = new ComboTracker();

    // Effect manager
    this.effectManager = new EffectManager();

    // Haptics
    this.haptic = new HapticManager();

    // Level system
    this.levelSystem = new LevelSystem(this.saveManager, this.eventBus);

    // Boss system
    this.bossSystem = new BossSystem(this.eventBus, this.saveManager);

    // Achievement system
    this.achievementSystem = new AchievementSystem(this.saveManager, this.eventBus);

    // Game state
    this.isRunning = false;
    this.animFrameId = null;
    this.dropX = 0;
    this.coinSize = 'small';
    this.lastDropTime = 0;
    this.lastTime = 0;
    this.scoreMultiplier = 1;
    this.coinsDroppedSinceWheel = 0;

    // Frenzy state
    this.frenzyActive = false;
    this.frenzyEndTime = 0;
    this.frenzyLastCoinTime = 0;

    // Lakitu state
    this.lakituState = 'idle';  // idle | flying_in | fishing | flying_out
    this.lakituNextTime = Date.now() + this._randomLakituDelay();
    this.lakituPhaseStart = 0;

    // Bob-omb tracking
    this.activeBobOmbs = []; // { itemId, spawnTime }
    this.activeGiantBobOmbs = []; // { itemId, spawnTime }

    // Magnet effect
    this.magnetActive = false;

    // Bullet Bill state
    this.bulletBillState = 'idle';
    this.bulletBillNextTime = Date.now() + this._randomBulletBillDelay();
    this.bulletBillPhaseStart = 0;

    // Thwomp state
    this.thwompState = 'idle'; // idle | warning | slamming | stunned | rising
    this.thwompNextTime = Date.now() + this._randomThwompDelay();
    this.thwompPhaseStart = 0;

    // Low gravity state (L32)
    this.lowGravityNextTime = Date.now() + this._randomLowGravityDelay();

    // Dual pusher state (L35)
    this.secondPusher = null;

    // Boss Rush state (L38)
    this.bossRushActive = false;
    this.bossRushWave = 0;

    // Golden Pusher state (L50)
    this.goldenPusherActive = false;

    // Listen for boss:defeated to handle boss rush wave progression
    this.eventBus.on('boss:defeated', () => {
      if (this.bossRushActive) {
        this._onBossRushWaveDefeated();
      }
    });

    // Restore scene from save
    const savedScene = this.saveManager.getCurrentScene();
    if (savedScene && savedScene !== 'overworld') {
      this.renderer.setScene(savedScene);
    }

    // Apply saved settings
    const settings = this.saveManager.getSettings();
    if (settings.volume !== undefined) {
      this.audio.setVolume(settings.volume);
    }
    if (settings.haptic === false) {
      this.haptic.enabled = false;
    }
  }

  start() {
    this.isRunning = true;
    this.spawnInitialCoins();
    this.lastTime = performance.now();

    // Apply difficulty scaling for current level
    const scale = this.levelSystem.getDifficultyScale();
    this.pusher.setSpeed(C.PUSHER_SPEED * scale.pusherSpeed);

    // Create second pusher if dual_pusher unlocked (L35+)
    if (this.levelSystem.getUnlockedItemTypes().includes('dual_pusher') && !this.secondPusher) {
      this._createSecondPusher();
    }

    // Apply golden pusher if unlocked (L50+)
    if (this.levelSystem.getUnlockedItemTypes().includes('golden_pusher') && !this.goldenPusherActive) {
      this._activateGoldenPusher();
    }

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

    // Stabilize coins: prevent flipping by damping X/Z angular velocity
    for (const coin of this.coinManager.getCoins()) {
      if (coin.body.sleepState === 2) continue; // SLEEPING = 2, skip settled coins
      const av = coin.body.angularVelocity;
      av.x *= 0.1;
      av.z *= 0.1;
    }

    // Update pushers
    this.pusher.update();
    if (this.secondPusher) this.secondPusher.update();

    // Update effects (auto-expire)
    this.effectManager.update(this);

    // Check coin & item falls
    this.checkObjectFalls();

    // Update frenzy
    this.updateFrenzy();

    // Update Lakitu event
    this.updateLakitu();

    // Update Bob-ombs
    this.updateBobOmbs();

    // Update Giant Bob-ombs
    this.updateGiantBobOmbs();

    // Update magnet effect
    this.updateMagnet();

    // Update Bullet Bill event
    this.updateBulletBill();

    // Update Thwomp event
    this.updateThwomp();

    // Update low gravity event
    this.updateLowGravity();

    // Update boss
    if (this.bossSystem.isActive()) {
      this.bossSystem.update();
    }

    // Update particles
    this.renderer.updateParticles(dt);

    // Render
    this.renderer.render({
      pusherBody: this.pusher.getBody(),
      secondPusherBody: this.secondPusher?.getBody() ?? null,
      coins: this.coinManager.getCoins(),
      items: this.itemManager.getItems(),
      dropX: this.dropX,
      magnetActive: this.magnetActive,
      dt,
    });

    this.animFrameId = requestAnimationFrame(() => this.loop());
  }

  checkObjectFalls() {
    // Check coins
    const coins = [...this.coinManager.getCoins()];
    for (const coin of coins) {
      const pos = coin.body.position;

      if (pos.y < C.COLLECTION_Y) {
        if (pos.z > 0) {
          // ── Coin collected from front edge ──
          const coinPos = { x: pos.x, y: pos.y, z: pos.z };
          this.coinManager.removeCoin(coin);

          this.audio.playCoinCollected();
          this.haptic.coinCollect();
          // Big golden burst + white sparkles
          this.renderer.emitParticles(coinPos, { count: 15, color: 0xffc107, speed: 4 });
          this.renderer.emitParticles(coinPos, { count: 8, color: 0xffffff, speed: 5 });
          this.renderer.emitParticles(
            { x: coinPos.x, y: coinPos.y + 0.5, z: coinPos.z },
            { count: 5, color: 0xfbd000, speed: 2 }
          );

          const result = this.combo.onCoinCollected();
          const coinSizeConfig = C.COIN_SIZES[coin.size] || C.COIN_SIZES.small;
          const scale = this.levelSystem.getDifficultyScale();
          const scoreValue = Math.floor(coinSizeConfig.scoreValue * result.multiplier * this.scoreMultiplier * scale.coinMult);

          // XP gain
          this.levelSystem.addXP(1);
          this.saveManager.addCoinsCollected(1);
          this.saveManager.setMaxChain(result.chain);

          this.callbacks.onCoinCollected?.(scoreValue, result, coin.size || 'small');
          this.eventBus.emit('coin:collected', { scoreValue, combo: result });

          if (result.newTier && result.tier) {
            this.audio.playChainTier(result.tierIndex);
            this.haptic.chainTier(result.tierIndex);
            this.renderer.emitChainBurst(
              { x: 0, y: 2, z: C.TABLE_DEPTH / 2 },
              result.tierIndex
            );
          }

          // Boss damage on front edge collection too
          if (this.bossSystem.isActive()) {
            this.bossSystem.onObjectLostBack('coin');
            this.audio.playBossHit();
            this.renderer.flashBossDamage();
          }
        } else {
          // Coin fell off back/side — silently remove, no score
          this.coinManager.removeCoin(coin);
          if (this.bossSystem.isActive()) {
            this.bossSystem.onObjectLostBack('coin');
            this.audio.playBossHit();
            this.renderer.flashBossDamage();
          }
        }
      } else if (Math.abs(pos.x) > C.TABLE_WIDTH / 2 + 3) {
        // Coin flew off the side — silently remove
        this.coinManager.removeCoin(coin);
      } else if (pos.z < C.BARRIER_Z - 0.5) {
        // Coin is behind the barrier — remove immediately so it doesn't pile up
        this.coinManager.removeCoin(coin);
        if (this.bossSystem.isActive()) {
          this.bossSystem.onObjectLostBack('coin');
          this.audio.playBossHit();
          this.renderer.flashBossDamage();
        }
      }
    }

    // Check items
    const items = [...this.itemManager.getItems()];
    for (const item of items) {
      const pos = item.body.position;

      if (pos.y < C.COLLECTION_Y) {
        if (pos.z > 0) {
          // Item collected from front edge!
          this.itemManager.removeItem(item);
          this.activateItemEffect(item);
          // Boss damage on front edge item collection too
          if (this.bossSystem.isActive()) {
            this.bossSystem.onObjectLostBack(item.type);
            this.audio.playBossHit();
            this.renderer.flashBossDamage();
          }
        } else if (pos.z < -C.TABLE_DEPTH / 2 + 1) {
          // Item fell off back
          this.itemManager.removeItem(item);
          if (this.bossSystem.isActive()) {
            this.bossSystem.onObjectLostBack(item.type);
            this.audio.playBossHit();
            this.renderer.flashBossDamage();
          }
        } else {
          this.itemManager.removeItem(item);
        }
      } else if (Math.abs(pos.x) > C.TABLE_WIDTH / 2 + 3 || pos.z < -C.TABLE_DEPTH / 2 - 3) {
        this.itemManager.removeItem(item);
        if (pos.z < -C.TABLE_DEPTH / 2 - 3 && this.bossSystem.isActive()) {
          this.bossSystem.onObjectLostBack(item.type);
          this.audio.playBossHit();
          this.renderer.flashBossDamage();
        }
      }
    }
  }

  activateItemEffect(item) {
    const def = item.itemDef;
    if (!def || !def.effect) return;

    this.audio.playItemCollected(item.type);
    this.haptic.itemCollect();
    this.saveManager.addUniqueItem(item.type);

    const pos = item.body.position;
    this.renderer.emitParticles(
      { x: pos.x, y: pos.y, z: pos.z },
      { count: 20, color: def.color, speed: 4 }
    );

    this.eventBus.emit('item:collected', { itemType: item.type, label: def.label, effect: def.effect });

    switch (def.effect.type) {
      case 'random_reward': {
        // Question block — random reward: coins, XP, or frenzy
        const roll = Math.random();
        if (roll < 0.4) {
          // Coin burst
          this.callbacks.onCoinCollected?.(10, { chain: 0, multiplier: 1, newTier: false });
        } else if (roll < 0.7) {
          // XP bonus
          this.levelSystem.addXP(5);
        } else if (roll < 0.9) {
          // Score boost
          this.callbacks.onCoinCollected?.(25, { chain: 0, multiplier: 1, newTier: false });
        } else {
          // Mini frenzy
          this.startFrenzy(5000);
        }
        break;
      }

      case 'score_multiplier': {
        // Star — 3x score multiplier for duration
        const mult = def.effect.multiplier || 3;
        const dur = def.effect.duration || 10000;
        this.effectManager.addEffect({
          type: 'score_multiplier',
          duration: dur,
          apply: (engine) => { engine.scoreMultiplier = mult; },
          remove: (engine) => { engine.scoreMultiplier = 1; },
        }, this);
        break;
      }

      case 'wider_pusher': {
        // Mushroom — wider pusher
        const widthMult = def.effect.widthMultiplier || 1.5;
        const dur = def.effect.duration || 12000;
        const newWidth = C.PUSHER_WIDTH * widthMult;
        this.effectManager.addEffect({
          type: 'wider_pusher',
          duration: dur,
          apply: (engine) => {
            engine.pusher.setWidth(newWidth);
            engine.renderer.setPusherWidth(newWidth);
          },
          remove: (engine) => {
            engine.pusher.resetWidth();
            engine.renderer.setPusherWidth(C.PUSHER_WIDTH);
          },
        }, this);
        break;
      }

      case 'narrower_pusher': {
        // Poison Mushroom — narrower pusher
        const widthMult = def.effect.widthMultiplier || 0.6;
        const dur = def.effect.duration || 8000;
        const newWidth = C.PUSHER_WIDTH * widthMult;
        this.effectManager.addEffect({
          type: 'wider_pusher', // same type so they don't stack
          duration: dur,
          apply: (engine) => {
            engine.pusher.setWidth(newWidth);
            engine.renderer.setPusherWidth(newWidth);
          },
          remove: (engine) => {
            engine.pusher.resetWidth();
            engine.renderer.setPusherWidth(C.PUSHER_WIDTH);
          },
        }, this);
        break;
      }

      case 'burst_coins': {
        // Coin Tower — burst coins onto table
        const count = def.effect.count || 10;
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            const x = (Math.random() - 0.5) * (C.TABLE_WIDTH - 1);
            this.coinManager.spawnCoin(x, C.DROP_Y, C.DROP_Z + Math.random());
          }, i * 100);
        }
        this.callbacks.onBurstCoins?.(count);
        break;
      }

      case 'clear_row': {
        // Fire Flower — push front row of coins off
        const coins = this.coinManager.getCoins();
        let cleared = 0;
        for (const coin of coins) {
          if (coin.body.position.z > C.TABLE_DEPTH / 2 - 2 && cleared < 15) {
            coin.body.velocity.set(0, 0, 8);
            coin.body.wakeUp();
            cleared++;
          }
        }
        break;
      }

      case 'teleport_coins': {
        // Green Pipe — teleport coins to front edge
        const count = def.effect.count || 5;
        const coins = this.coinManager.getCoins();
        let teleported = 0;
        for (const coin of coins) {
          if (teleported >= count) break;
          if (coin.body.position.z < C.TABLE_DEPTH / 2 - 2) {
            coin.body.position.z = C.TABLE_DEPTH / 2 - 0.5;
            coin.body.position.y = 1;
            coin.body.velocity.set(0, 0, 2);
            coin.body.wakeUp();
            teleported++;
          }
        }
        break;
      }

      case 'bob_omb': {
        // Bob-omb collected from front edge — reward explosion!
        const bPos = item.body.position;
        this._bobOmbExplode(bPos, true);
        // Remove from tracking
        this.activeBobOmbs = this.activeBobOmbs.filter(b => b.itemId !== item.id);
        break;
      }

      case 'coin_rain': {
        // Coin Pipe — rain coins from above
        const count = def.effect.count || 15;
        const duration = def.effect.duration || 3000;
        const interval = duration / count;
        this.audio.playCoinRainStart();
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            const x = (Math.random() - 0.5) * (C.TABLE_WIDTH - 1);
            const z = C.DROP_Z + Math.random() * 2;
            this.coinManager.spawnCoin(x, C.DROP_Y + 2, z);
            this.audio.playCoinDrop();
            this.renderer.emitParticles(
              { x, y: C.DROP_Y + 2, z },
              { count: 3, color: 0xffc107, speed: 2 }
            );
          }, i * interval);
        }
        break;
      }

      case 'magnet': {
        // Magnet Mushroom — attract coins for 10 seconds
        const dur = def.effect.duration || 10000;
        this.audio.playMagnetActivate();
        this.effectManager.addEffect({
          type: 'magnet',
          duration: dur,
          apply: (engine) => { engine.magnetActive = true; },
          remove: (engine) => { engine.magnetActive = false; },
        }, this);
        break;
      }

      case 'diamond_score': {
        // Diamond Coin — high-value instant score + cyan burst
        const value = def.effect.scoreValue || 50;
        const scale = this.levelSystem.getDifficultyScale();
        const finalScore = Math.floor(value * this.scoreMultiplier * scale.coinMult);
        this.callbacks.onCoinCollected?.(finalScore, { chain: 0, multiplier: 1, newTier: false });
        this.levelSystem.addXP(10);
        this.audio.playDiamondCoinCollect();
        // Cyan + white sparkle burst
        this.renderer.emitParticles(
          { x: pos.x, y: pos.y, z: pos.z },
          { count: 30, color: 0x00bfff, speed: 6 }
        );
        this.renderer.emitParticles(
          { x: pos.x, y: pos.y + 0.5, z: pos.z },
          { count: 15, color: 0xffffff, speed: 4 }
        );
        break;
      }

      case 'giant_bob_omb': {
        // Giant Bob-omb collected from front edge — massive reward explosion!
        const bPos = item.body.position;
        this._giantBobOmbExplode(bPos, true);
        this.activeGiantBobOmbs = (this.activeGiantBobOmbs || []).filter(b => b.itemId !== item.id);
        break;
      }
    }

    // Check achievements after item collection
    this.achievementSystem.check();
  }

  // ─── Frenzy ───
  startFrenzy(duration) {
    // Check if Mega Frenzy is unlocked (L45+)
    const isMega = this.levelSystem.getUnlockedItemTypes().includes('mega_frenzy');
    const baseDur = duration || C.FRENZY_DURATION_MS;
    const dur = isMega ? baseDur * C.MEGA_FRENZY_DURATION_MULT : baseDur;
    const speedMult = isMega ? C.MEGA_FRENZY_SPEED_MULT : 2;

    this.frenzyActive = true;
    this.frenzyMega = isMega;
    this.frenzyEndTime = Date.now() + dur;
    this.frenzyLastCoinTime = 0;

    this.audio.playFrenzyStart();
    this.haptic.frenzy();
    this.saveManager.setFrenzyTriggered();

    // Speed up pusher during frenzy
    const frenzyScale = this.levelSystem.getDifficultyScale();
    this.effectManager.addEffect({
      type: 'frenzy_speed',
      duration: dur,
      apply: (engine) => {
        engine.pusher.setSpeed(C.PUSHER_SPEED * frenzyScale.pusherSpeed * speedMult);
      },
      remove: (engine) => {
        const curScale = engine.levelSystem.getDifficultyScale();
        engine.pusher.setSpeed(C.PUSHER_SPEED * curScale.pusherSpeed);
      },
    }, this);

    // Mega Frenzy: also apply score multiplier
    if (isMega) {
      this.effectManager.addEffect({
        type: 'mega_frenzy_score',
        duration: dur,
        apply: (engine) => { engine.scoreMultiplier *= C.MEGA_FRENZY_SCORE_MULT; },
        remove: (engine) => { engine.scoreMultiplier = Math.max(1, engine.scoreMultiplier / C.MEGA_FRENZY_SCORE_MULT); },
      }, this);
    }

    this.eventBus.emit('frenzy:start', { duration: dur, mega: isMega });
    this.callbacks.onFrenzyStart?.(dur, isMega);
  }

  updateFrenzy() {
    if (!this.frenzyActive) return;

    const now = Date.now();
    if (now >= this.frenzyEndTime) {
      this.frenzyActive = false;
      this.frenzyMega = false;
      this.eventBus.emit('frenzy:end');
      this.callbacks.onFrenzyEnd?.();
      return;
    }

    // Rain coins during frenzy (more during Mega Frenzy)
    if (now - this.frenzyLastCoinTime >= C.FRENZY_COIN_INTERVAL_MS) {
      this.frenzyLastCoinTime = now;
      const coinsPerTick = this.frenzyMega ? C.MEGA_FRENZY_COINS_PER_TICK : C.FRENZY_COINS_PER_TICK;
      for (let i = 0; i < coinsPerTick; i++) {
        const x = (Math.random() - 0.5) * (C.TABLE_WIDTH - 1);
        this.coinManager.spawnCoin(x, C.DROP_Y + Math.random() * 2, C.DROP_Z + Math.random());
      }
    }
  }

  // ─── Lakitu event ───
  updateLakitu() {
    const now = Date.now();

    switch (this.lakituState) {
      case 'idle':
        if (now >= this.lakituNextTime && this.coinManager.getCoinCount() >= 5) {
          this.lakituState = 'flying_in';
          this.lakituPhaseStart = now;
          this.renderer.showLakitu();
          this.audio.playLakituAppear();
          this.callbacks.onLakituStart?.();
        }
        break;

      case 'flying_in': {
        const elapsed = now - this.lakituPhaseStart;
        const progress = elapsed / C.LAKITU_FLY_IN_MS;
        this.renderer.updateLakituAnimation('fly_in', progress);
        if (progress >= 1) {
          this.lakituState = 'fishing';
          this.lakituPhaseStart = now;
        }
        break;
      }

      case 'fishing': {
        const elapsed = now - this.lakituPhaseStart;
        const progress = elapsed / C.LAKITU_FISH_MS;
        this.renderer.updateLakituAnimation('fishing', progress);
        if (progress >= 1) {
          this._lakituStealCoins();
          this.lakituState = 'flying_out';
          this.lakituPhaseStart = now;
        }
        break;
      }

      case 'flying_out': {
        const elapsed = now - this.lakituPhaseStart;
        const progress = elapsed / C.LAKITU_FLY_OUT_MS;
        this.renderer.updateLakituAnimation('fly_out', progress);
        if (progress >= 1) {
          this.lakituState = 'idle';
          this.renderer.hideLakitu();
          this.callbacks.onLakituEnd?.();
          this.lakituNextTime = now + this._randomLakituDelay();
        }
        break;
      }
    }
  }

  _lakituStealCoins() {
    const coins = this.coinManager.getCoins();
    // Random steal count: 5-50 coins
    const stealTarget = 5 + Math.floor(Math.random() * 46);
    const count = Math.min(stealTarget, coins.length);
    if (count <= 0) return;

    // Pick random coins to steal and remove from table
    const toSteal = [...coins].sort(() => Math.random() - 0.5).slice(0, count);
    for (const coin of toSteal) {
      const pos = coin.body.position;
      // Red particles — stolen!
      this.renderer.emitParticles(
        { x: pos.x, y: pos.y, z: pos.z },
        { count: 8, color: 0xff0000, speed: 3 }
      );
      this.coinManager.removeCoin(coin);
    }

    this.audio.playLakituSteal();
    this.callbacks.onLakituSteal?.(count);
  }

  _randomLakituDelay() {
    const base = C.LAKITU_MIN_INTERVAL + Math.random() * (C.LAKITU_MAX_INTERVAL - C.LAKITU_MIN_INTERVAL);
    const scale = this.levelSystem.getDifficultyScale();
    return base / scale.eventFreq;
  }

  // ─── Bullet Bill event ───
  updateBulletBill() {
    const now = Date.now();

    switch (this.bulletBillState) {
      case 'idle':
        if (now >= this.bulletBillNextTime && this.coinManager.getCoinCount() >= 5) {
          this.bulletBillState = 'flying_in';
          this.bulletBillPhaseStart = now;
          this.renderer.showBulletBill();
          this.audio.playBulletBillAppear();
          this.callbacks.onBulletBillStart?.();
        }
        break;

      case 'flying_in': {
        const elapsed = now - this.bulletBillPhaseStart;
        const progress = Math.min(1, elapsed / C.BULLET_BILL_FLY_IN_MS);
        this.renderer.updateBulletBillAnimation('fly_in', progress);
        if (progress >= 1) {
          this.bulletBillState = 'sweeping';
          this.bulletBillPhaseStart = now;
          this.audio.playBulletBillSweep();
          this.callbacks.onBulletBillSweep?.();
        }
        break;
      }

      case 'sweeping': {
        const elapsed = now - this.bulletBillPhaseStart;
        const progress = Math.min(1, elapsed / C.BULLET_BILL_SWEEP_MS);
        this.renderer.updateBulletBillAnimation('sweep', progress);

        // Push coins near Bullet Bill's current x position
        const halfW = C.TABLE_WIDTH / 2;
        const currentX = halfW - (halfW * 2) * progress;
        const coins = this.coinManager.getCoins();
        for (const coin of coins) {
          const dx = Math.abs(coin.body.position.x - currentX);
          if (dx < 1.5) {
            coin.body.wakeUp();
            coin.body.velocity.z += C.BULLET_BILL_PUSH_FORCE * 0.15;
            coin.body.velocity.y += 1;
          }
        }

        if (progress >= 1) {
          this.bulletBillState = 'flying_out';
          this.bulletBillPhaseStart = now;
        }
        break;
      }

      case 'flying_out': {
        const elapsed = now - this.bulletBillPhaseStart;
        const progress = Math.min(1, elapsed / C.BULLET_BILL_FLY_OUT_MS);
        this.renderer.updateBulletBillAnimation('fly_out', progress);
        if (progress >= 1) {
          this.bulletBillState = 'idle';
          this.renderer.hideBulletBill();
          this.bulletBillNextTime = now + this._randomBulletBillDelay();
          this.callbacks.onBulletBillEnd?.();
        }
        break;
      }
    }
  }

  _randomBulletBillDelay() {
    const base = C.BULLET_BILL_MIN_INTERVAL + Math.random() * (C.BULLET_BILL_MAX_INTERVAL - C.BULLET_BILL_MIN_INTERVAL);
    const scale = this.levelSystem.getDifficultyScale();
    return base / scale.eventFreq;
  }

  // ─── Thwomp event ───
  updateThwomp() {
    const now = Date.now();

    switch (this.thwompState) {
      case 'idle':
        // Only trigger if thwomp_event is unlocked
        if (now >= this.thwompNextTime &&
            this.levelSystem.getUnlockedItemTypes().includes('thwomp_event') &&
            this.coinManager.getCoinCount() >= 3) {
          this.thwompState = 'warning';
          this.thwompPhaseStart = now;
          this.renderer.showThwomp();
          this.audio.playThwompWarning();
          this.callbacks.onThwompWarning?.();
        }
        break;

      case 'warning': {
        const elapsed = now - this.thwompPhaseStart;
        const progress = elapsed / C.THWOMP_WARNING_MS;
        this.renderer.updateThwompAnimation('warning', progress);
        if (progress >= 1) {
          this.thwompState = 'slamming';
          this.thwompPhaseStart = now;
          this.audio.playThwompSlam();
        }
        break;
      }

      case 'slamming': {
        const elapsed = now - this.thwompPhaseStart;
        const progress = elapsed / C.THWOMP_SLAM_MS;
        this.renderer.updateThwompAnimation('slam', progress);
        if (progress >= 1) {
          this._thwompImpact();
          this.thwompState = 'stunned';
          this.thwompPhaseStart = now;
          this.callbacks.onThwompSlam?.();
        }
        break;
      }

      case 'stunned': {
        const elapsed = now - this.thwompPhaseStart;
        const progress = elapsed / C.THWOMP_STUNNED_MS;
        this.renderer.updateThwompAnimation('stunned', progress);
        if (progress >= 1) {
          this.thwompState = 'rising';
          this.thwompPhaseStart = now;
          this.audio.playThwompRise();
        }
        break;
      }

      case 'rising': {
        const elapsed = now - this.thwompPhaseStart;
        const progress = elapsed / C.THWOMP_RISE_MS;
        this.renderer.updateThwompAnimation('rise', progress);
        if (progress >= 1) {
          this.thwompState = 'idle';
          this.renderer.hideThwomp();
          this.thwompNextTime = now + this._randomThwompDelay();
          this.callbacks.onThwompEnd?.();
        }
        break;
      }
    }
  }

  _thwompImpact() {
    // Scatter coins outward from center of table
    const coins = this.coinManager.getCoins();
    for (const coin of coins) {
      const cp = coin.body.position;
      const dx = cp.x;
      const dz = cp.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < C.THWOMP_SLAM_RADIUS) {
        coin.body.wakeUp();
        const force = C.THWOMP_SLAM_FORCE * (1 - dist / C.THWOMP_SLAM_RADIUS);
        const nx = dist > 0.01 ? dx / dist : (Math.random() - 0.5);
        const nz = dist > 0.01 ? dz / dist : (Math.random() - 0.5);
        coin.body.velocity.set(nx * force, force * 0.5, nz * force);
      }
    }

    // Impact particles
    this.renderer.emitParticles(
      { x: 0, y: C.THWOMP_LAND_Y, z: 0 },
      { count: 40, color: 0x888888, speed: 6 }
    );
    this.renderer.emitParticles(
      { x: 0, y: C.THWOMP_LAND_Y + 0.5, z: 0 },
      { count: 20, color: 0xffffff, speed: 4 }
    );

    this.haptic.chainTier(2); // strong haptic
  }

  _randomThwompDelay() {
    const base = C.THWOMP_MIN_INTERVAL + Math.random() * (C.THWOMP_MAX_INTERVAL - C.THWOMP_MIN_INTERVAL);
    const scale = this.levelSystem.getDifficultyScale();
    return base / scale.eventFreq;
  }

  // ─── Low Gravity Mode (L32) ───
  updateLowGravity() {
    if (!this.levelSystem.getUnlockedItemTypes().includes('low_gravity_mode')) return;
    if (this.effectManager.hasEffect('low_gravity')) return;

    const now = Date.now();
    if (now < this.lowGravityNextTime) return;

    // Trigger low gravity event
    this.effectManager.addEffect({
      type: 'low_gravity',
      duration: C.LOW_GRAVITY_DURATION,
      apply: (engine) => {
        engine.physics.setGravity(C.GRAVITY.y * C.LOW_GRAVITY_FACTOR);
        // Wake all coins so they float
        for (const coin of engine.coinManager.getCoins()) {
          coin.body.wakeUp();
        }
        engine.audio.playLowGravityStart();
        engine.callbacks.onLowGravityStart?.();
      },
      remove: (engine) => {
        engine.physics.resetGravity();
        engine.callbacks.onLowGravityEnd?.();
      },
    }, this);

    this.lowGravityNextTime = now + this._randomLowGravityDelay();
  }

  _randomLowGravityDelay() {
    const base = C.LOW_GRAVITY_MIN_INTERVAL + Math.random() * (C.LOW_GRAVITY_MAX_INTERVAL - C.LOW_GRAVITY_MIN_INTERVAL);
    const scale = this.levelSystem.getDifficultyScale();
    return base / scale.eventFreq;
  }

  // ─── Dual Pusher (L35) ───
  _createSecondPusher() {
    if (this.secondPusher) return;
    const scale = this.levelSystem.getDifficultyScale();
    this.secondPusher = new PusherController3D(this.physics, {
      width: C.PUSHER_WIDTH * 0.7,
      height: C.PUSHER_HEIGHT,
      depth: C.PUSHER_DEPTH * 0.8,
      zMin: C.DUAL_PUSHER_Z_MIN,
      zMax: C.DUAL_PUSHER_Z_MAX,
      speed: C.PUSHER_SPEED * C.DUAL_PUSHER_SPEED_MULT * scale.pusherSpeed,
      startDirection: -1,  // opposite direction
    });
    this.renderer.createSecondPusherMesh(
      C.PUSHER_WIDTH * 0.7, C.PUSHER_HEIGHT, C.PUSHER_DEPTH * 0.8
    );
  }

  // ─── Golden Pusher (L50) ───
  _activateGoldenPusher() {
    if (this.goldenPusherActive) return;
    this.goldenPusherActive = true;
    this.scoreMultiplier *= C.GOLDEN_PUSHER_SCORE_MULT;
    this.renderer.setGoldenPusher();
  }

  // ─── Boss Rush (L38) ───
  startBossRush() {
    if (!this.levelSystem.canBossRush()) return false;
    if (this.bossRushActive) return false;
    this.bossRushActive = true;
    this.bossRushWave = 0;
    this._startBossRushWave(0);
    return true;
  }

  _startBossRushWave(waveIndex) {
    if (waveIndex >= C.BOSS_RUSH_WAVES) {
      // All waves defeated
      this.bossRushActive = false;
      this.callbacks.onBossRushComplete?.({
        totalReward: C.BOSS_RUSH_WAVE_REWARD.reduce((a, b) => a + b, 0),
      });
      return;
    }
    this.bossRushWave = waveIndex;
    this.bossSystem.maxHp = C.BOSS_RUSH_WAVE_HP[waveIndex];
    this.bossSystem.attackInterval = C.BOSS_RUSH_WAVE_ATTACK_INTERVAL[waveIndex];
    this.bossSystem.start();
    this.renderer.showBoss();
    this.audio.playBossRushWave();
    this.callbacks.onBossStart?.({
      hp: this.bossSystem.getHP(),
      maxHp: this.bossSystem.getMaxHP(),
      wave: waveIndex + 1,
      totalWaves: C.BOSS_RUSH_WAVES,
    });
  }

  _onBossRushWaveDefeated() {
    const wave = this.bossRushWave;
    const reward = C.BOSS_RUSH_WAVE_REWARD[wave] || 100;
    this.callbacks.onBurstCoins?.(reward);
    this.renderer.hideBoss();

    const nextWave = wave + 1;
    if (nextWave < C.BOSS_RUSH_WAVES) {
      // Pause before next wave
      setTimeout(() => {
        if (this.bossRushActive) {
          this._startBossRushWave(nextWave);
        }
      }, C.BOSS_RUSH_BREAK_MS);
    } else {
      this.bossRushActive = false;
      this.callbacks.onBossRushComplete?.({
        totalReward: C.BOSS_RUSH_WAVE_REWARD.reduce((a, b) => a + b, 0),
      });
    }
  }

  // ─── Bob-omb countdown ───
  updateBobOmbs() {
    if (this.activeBobOmbs.length === 0) return;
    const now = Date.now();

    for (let i = this.activeBobOmbs.length - 1; i >= 0; i--) {
      const entry = this.activeBobOmbs[i];
      const elapsed = now - entry.spawnTime;

      // Check if item still exists on the table
      const item = this.itemManager.getItems().find(it => it.id === entry.itemId);
      if (!item) {
        // Already collected or removed
        this.activeBobOmbs.splice(i, 1);
        continue;
      }

      if (elapsed >= C.BOBOMB_FUSE_MS) {
        // Timer expired — penalty explosion!
        const pos = item.body.position;
        this._bobOmbExplode(pos, false);
        this.itemManager.removeItem(item);
        this.activeBobOmbs.splice(i, 1);
      }
    }
  }

  _bobOmbExplode(pos, isReward) {
    const force = isReward ? C.BOBOMB_PUSH_FORCE : C.BOBOMB_SCATTER_FORCE;
    const particleColor = isReward ? 0xffc107 : 0xff4500;

    // Explosion particles (large burst)
    this.renderer.emitParticles(
      { x: pos.x, y: pos.y, z: pos.z },
      { count: 50, color: particleColor, speed: 8 }
    );
    this.renderer.emitParticles(
      { x: pos.x, y: pos.y + 0.5, z: pos.z },
      { count: 30, color: 0xff0000, speed: 6 }
    );
    this.renderer.emitParticles(
      { x: pos.x, y: pos.y + 1, z: pos.z },
      { count: 20, color: 0xff6600, speed: 7 }
    );

    this.audio.playBobOmbExplode();

    // Affect nearby coins
    const coins = this.coinManager.getCoins();
    for (const coin of coins) {
      const cp = coin.body.position;
      const dx = cp.x - pos.x;
      const dy = cp.y - pos.y;
      const dz = cp.z - pos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < C.BOBOMB_BLAST_RADIUS && dist > 0.01) {
        coin.body.wakeUp();
        if (isReward) {
          // Push coins forward (toward front edge)
          coin.body.velocity.set(dx * 0.5, 2, force);
        } else {
          // Scatter coins away from explosion center
          const scale = force / dist;
          coin.body.velocity.set(dx * scale, 3, dz * scale);
        }
      }
    }
  }

  // ─── Giant Bob-omb countdown ───
  updateGiantBobOmbs() {
    if (!this.activeGiantBobOmbs || this.activeGiantBobOmbs.length === 0) return;
    const now = Date.now();

    for (let i = this.activeGiantBobOmbs.length - 1; i >= 0; i--) {
      const entry = this.activeGiantBobOmbs[i];
      const elapsed = now - entry.spawnTime;

      const item = this.itemManager.getItems().find(it => it.id === entry.itemId);
      if (!item) {
        this.activeGiantBobOmbs.splice(i, 1);
        continue;
      }

      if (elapsed >= C.GIANT_BOBOMB_FUSE_MS) {
        const pos = item.body.position;
        this._giantBobOmbExplode(pos, false);
        this.itemManager.removeItem(item);
        this.activeGiantBobOmbs.splice(i, 1);
      }
    }
  }

  _giantBobOmbExplode(pos, isReward) {
    const force = isReward ? C.GIANT_BOBOMB_PUSH_FORCE : C.GIANT_BOBOMB_SCATTER_FORCE;
    const particleColor = isReward ? 0xffc107 : 0xff0000;

    // Massive explosion particles (4 layers)
    this.renderer.emitParticles(
      { x: pos.x, y: pos.y, z: pos.z },
      { count: 80, color: particleColor, speed: 10 }
    );
    this.renderer.emitParticles(
      { x: pos.x, y: pos.y + 0.5, z: pos.z },
      { count: 50, color: 0xff0000, speed: 8 }
    );
    this.renderer.emitParticles(
      { x: pos.x, y: pos.y + 1, z: pos.z },
      { count: 40, color: 0xff6600, speed: 9 }
    );
    this.renderer.emitParticles(
      { x: pos.x, y: pos.y + 1.5, z: pos.z },
      { count: 30, color: 0xffff00, speed: 6 }
    );

    this.audio.playGiantBobOmbExplode();

    // Affect ALL coins in huge blast radius
    const coins = this.coinManager.getCoins();
    for (const coin of coins) {
      const cp = coin.body.position;
      const dx = cp.x - pos.x;
      const dy = cp.y - pos.y;
      const dz = cp.z - pos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < C.GIANT_BOBOMB_BLAST_RADIUS && dist > 0.01) {
        coin.body.wakeUp();
        if (isReward) {
          coin.body.velocity.set(dx * 0.8, 3, force);
        } else {
          const scale = force / dist;
          coin.body.velocity.set(dx * scale, 4, dz * scale);
        }
      }
    }

    // Also push items
    const items = this.itemManager.getItems();
    for (const it of items) {
      const ip = it.body.position;
      const dx = ip.x - pos.x;
      const dz = ip.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < C.GIANT_BOBOMB_BLAST_RADIUS && dist > 0.01) {
        it.body.wakeUp();
        it.body.velocity.set(dx * 2, 3, dz * 2);
      }
    }
  }

  // ─── Magnet effect ───
  updateMagnet() {
    if (!this.magnetActive) return;

    const coins = this.coinManager.getCoins();
    for (const coin of coins) {
      coin.body.wakeUp();
      // Strong pull toward front edge
      coin.body.velocity.z += 1.5;
      // Gently pull toward center x
      coin.body.velocity.x -= coin.body.position.x * 0.1;
    }

    // Visual feedback: emit blue particles at random coin positions
    this._magnetParticleTimer = (this._magnetParticleTimer || 0) + 1;
    if (this._magnetParticleTimer % 10 === 0 && coins.length > 0) {
      const rc = coins[Math.floor(Math.random() * coins.length)];
      this.renderer.emitParticles(
        { x: rc.body.position.x, y: rc.body.position.y + 0.3, z: rc.body.position.z },
        { count: 4, color: 0x4444ff, speed: 1.5 }
      );
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

    const coin = this.coinManager.spawnCoin(x, C.DROP_Y, C.DROP_Z, this.coinSize);
    if (coin) {
      this.lastDropTime = now;
      this.audio.playCoinDrop();
      this.haptic.coinDrop();
      this.saveManager.addCoinsDropped(1);

      // Try to spawn a special item (respects spawnRate:0 needing _spawn unlock)
      const unlockedItems = this.levelSystem.getSpawnableItemTypes();
      const totalObjects = this.coinManager.getCoinCount() + this.itemManager.getItemCount();
      const spawned = this.itemManager.trySpawnItem(unlockedItems, totalObjects);
      if (spawned) {
        this.eventBus.emit('item:spawned', { itemType: spawned.type });
        // Track bob-ombs for countdown
        if (spawned.type === 'bob_omb') {
          this.activeBobOmbs.push({ itemId: spawned.id, spawnTime: Date.now() });
        }
        if (spawned.type === 'giant_bob_omb') {
          this.activeGiantBobOmbs.push({ itemId: spawned.id, spawnTime: Date.now() });
        }
      }

      // Random frenzy chance
      if (!this.frenzyActive && Math.random() < C.FRENZY_CHANCE) {
        this.startFrenzy();
      }

      // Lucky wheel tracking
      this.coinsDroppedSinceWheel++;
      if (this.coinsDroppedSinceWheel >= WHEEL_TRIGGER_INTERVAL) {
        this.coinsDroppedSinceWheel = 0;
        this.callbacks.onWheelTrigger?.();
      }

      // Check achievements
      this.achievementSystem.check();

      return true;
    }
    return false;
  }

  setCoinSize(size) {
    this.coinSize = size;
    this.renderer.setDropIndicatorSize(size);
  }

  spawnWheelItem(itemTypeId) {
    const itemDef = C.ITEM_TYPES[itemTypeId];
    if (!itemDef) return false;
    const x = (Math.random() - 0.5) * (C.TABLE_WIDTH - 1);
    const y = C.DROP_Y;
    const z = C.DROP_Z;
    const item = this.itemManager.spawnItem(itemDef, x, y, z);
    // Track bob-ombs for countdown
    if (itemTypeId === 'bob_omb' && item) {
      this.activeBobOmbs.push({ itemId: item.id, spawnTime: Date.now() });
    }
    if (itemTypeId === 'giant_bob_omb' && item) {
      this.activeGiantBobOmbs.push({ itemId: item.id, spawnTime: Date.now() });
    }
    return true;
  }

  // ─── Boss mode ───
  startBoss() {
    if (!this.bossSystem.canStart()) return false;
    this.bossSystem.start();
    this.renderer.showBoss();
    this.callbacks.onBossStart?.({
      hp: this.bossSystem.getHP(),
      maxHp: this.bossSystem.getMaxHP(),
    });
    return true;
  }

  abortBoss() {
    this.bossSystem.abort();
    this.renderer.hideBoss();
    this.callbacks.onBossEnd?.();
  }

  // ─── Scene switching ───
  setScene(sceneId) {
    this.renderer.setScene(sceneId);
    this.saveManager.setCurrentScene(sceneId);
  }

  // ─── Settings ───
  setVolume(v) {
    this.audio.setVolume(v);
    this.saveManager.update(d => { d.settings.volume = v; });
  }

  setHaptic(enabled) {
    this.haptic.enabled = enabled;
    this.saveManager.update(d => { d.settings.haptic = enabled; });
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

  /** Get active effects for UI */
  getActiveEffects() {
    return this.effectManager.getActiveEffects();
  }

  /** Get current score multiplier */
  getScoreMultiplier() {
    return this.scoreMultiplier;
  }

  spawnInitialCoins() {
    const tableEdgeZ = C.TABLE_DEPTH / 2;
    const xMin = -C.TABLE_WIDTH / 2 + C.COIN_RADIUS * 2;
    const xMax = C.TABLE_WIDTH / 2 - C.COIN_RADIUS * 2;

    const total = C.INITIAL_COINS_ON_TABLE;
    const pusherFrontZ = C.PUSHER_Z_MAX + C.PUSHER_DEPTH / 2;
    const mainCount = Math.floor(total * 0.6);
    const edgeCount = total - mainCount;

    // Main zone: coins between pusher max and table edge
    for (let i = 0; i < mainCount; i++) {
      const x = xMin + Math.random() * (xMax - xMin);
      const y = C.COIN_HEIGHT / 2 + 0.1 + Math.random() * 0.5;
      const z = pusherFrontZ + 0.3 + Math.random() * (tableEdgeZ - pusherFrontZ - 1.5);
      this.coinManager.spawnCoin(x, y, z);
    }

    // Near front edge: coins close to falling off
    for (let i = 0; i < edgeCount; i++) {
      const x = xMin + Math.random() * (xMax - xMin);
      const layer = Math.floor(i / 8);
      const y = C.COIN_HEIGHT / 2 + 0.02 + layer * (C.COIN_HEIGHT + 0.01);
      const z = tableEdgeZ - 0.8 - Math.random() * 1.2;
      this.coinManager.spawnCoin(x, y, z);
    }
  }

  destroy() {
    this.stop();
    this.saveManager.flush();
    this.eventBus.destroy();
    this.audio.destroy();
    this.physics.destroy();
    this.renderer.dispose();
  }
}
