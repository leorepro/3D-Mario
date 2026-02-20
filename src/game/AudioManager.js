import * as C from './constants.js';

/**
 * AudioManager — Web Audio API synth-based sound effects.
 * No external audio files needed; all sounds are generated procedurally.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;       // AudioContext (lazy init on first user gesture)
    this.masterGain = null;
    this.enabled = true;
  }

  /** Lazily initialise AudioContext (must be after user gesture) */
  _ensureContext() {
    if (this.ctx) return true;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = C.AUDIO_MASTER_VOLUME;
      this.masterGain.connect(this.ctx.destination);
      return true;
    } catch {
      this.enabled = false;
      return false;
    }
  }

  _resumeIfNeeded() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ─── Helper: play a tone ───
  _playTone(freq, duration, type = 'sine', volume = 0.3, detune = 0) {
    if (!this.enabled || !this._ensureContext()) return;
    this._resumeIfNeeded();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  // ─── Helper: play noise burst ───
  _playNoise(duration, volume = 0.1) {
    if (!this.enabled || !this._ensureContext()) return;
    this._resumeIfNeeded();

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // High-pass filter for metallic feel
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
  }

  // ═══════════ PUBLIC SFX METHODS ═══════════

  /** Coin drop — bright "ding" */
  playCoinDrop() {
    this._playTone(1200, 0.15, 'sine', 0.25);
    this._playTone(1800, 0.1, 'sine', 0.1);
  }

  /** Coin-to-coin collision — soft metallic tap */
  playCoinCollide() {
    this._playNoise(0.05, 0.06);
    this._playTone(800 + Math.random() * 400, 0.06, 'triangle', 0.08);
  }

  /** Coin collected (fell off front edge) — happy ascending chime */
  playCoinCollected() {
    this._playTone(880, 0.12, 'sine', 0.3);
    setTimeout(() => this._playTone(1100, 0.12, 'sine', 0.25), 60);
    setTimeout(() => this._playTone(1320, 0.18, 'sine', 0.2), 120);
  }

  /** Coin lost (fell off side/back) — low thud */
  playCoinLost() {
    this._playTone(200, 0.15, 'triangle', 0.12);
  }

  /** Chain tier reached — escalating fanfare based on tier index */
  playChainTier(tierIndex) {
    const baseFreqs = [
      [660, 880],                        // Nice!
      [660, 880, 1100],                  // Great!
      [660, 880, 1100, 1320],            // Amazing!
      [660, 880, 1100, 1320, 1760],      // SUPER MARIO!
    ];

    const freqs = baseFreqs[Math.min(tierIndex, baseFreqs.length - 1)];
    freqs.forEach((f, i) => {
      setTimeout(() => {
        this._playTone(f, 0.2, 'square', 0.2);
        this._playTone(f * 1.5, 0.15, 'sine', 0.1);
      }, i * 80);
    });
  }

  /** Pusher movement — very faint low hum (call sparingly) */
  playPusherMove() {
    this._playTone(80, 0.05, 'sawtooth', 0.02);
  }

  // ═══════════ ITEM SFX ═══════════

  /** Play SFX for item collection based on item type */
  playItemCollected(itemType) {
    switch (itemType) {
      case 'question_block':
        // Mystery jingle — ascending three-note
        this._playTone(660, 0.12, 'square', 0.25);
        setTimeout(() => this._playTone(880, 0.12, 'square', 0.22), 80);
        setTimeout(() => this._playTone(1320, 0.2, 'square', 0.2), 160);
        break;

      case 'star':
        // Star power — fast arpeggio sparkle
        [880, 1100, 1320, 1760, 2200].forEach((f, i) => {
          setTimeout(() => this._playTone(f, 0.15, 'sine', 0.2), i * 50);
        });
        break;

      case 'mushroom':
        // Power-up — bwop ascending
        this._playTone(330, 0.15, 'sine', 0.3);
        setTimeout(() => this._playTone(440, 0.15, 'sine', 0.28), 80);
        setTimeout(() => this._playTone(660, 0.2, 'sine', 0.25), 160);
        break;

      case 'coin_tower':
        // Coin cascade — rapid ascending pings
        for (let i = 0; i < 6; i++) {
          setTimeout(() => this._playTone(1000 + i * 200, 0.1, 'sine', 0.18), i * 40);
        }
        break;

      case 'fire_flower':
        // Fire whoosh — noise + high tone
        this._playNoise(0.2, 0.12);
        this._playTone(1500, 0.2, 'sawtooth', 0.15);
        setTimeout(() => this._playTone(2000, 0.15, 'sine', 0.1), 100);
        break;

      case 'green_pipe':
        // Pipe warp — descending whoosh
        this._playTone(800, 0.15, 'sine', 0.25);
        setTimeout(() => this._playTone(500, 0.15, 'sine', 0.22), 80);
        setTimeout(() => this._playTone(300, 0.2, 'triangle', 0.18), 160);
        break;

      case 'poison_mushroom':
        // Danger — descending minor tone
        this._playTone(440, 0.12, 'sawtooth', 0.2);
        setTimeout(() => this._playTone(330, 0.12, 'sawtooth', 0.18), 80);
        setTimeout(() => this._playTone(220, 0.2, 'sawtooth', 0.15), 160);
        break;

      case 'diamond_coin':
        this.playDiamondCoinCollect();
        break;

      case 'giant_bob_omb':
        this.playGiantBobOmbExplode();
        break;

      default:
        this.playCoinCollected();
    }
  }

  /** Level up — triumphant fanfare */
  playLevelUp() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => {
        this._playTone(f, 0.25, 'square', 0.22);
        this._playTone(f * 1.5, 0.2, 'sine', 0.1);
      }, i * 100);
    });
  }

  /** Frenzy start — exciting rising sweep */
  playFrenzyStart() {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => this._playTone(400 + i * 150, 0.12, 'square', 0.2), i * 40);
    }
  }

  /** Boss hit — heavy impact */
  playBossHit() {
    this._playTone(150, 0.2, 'sawtooth', 0.3);
    this._playNoise(0.15, 0.15);
  }

  /** Boss defeated — victory fanfare */
  playBossDefeated() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      setTimeout(() => {
        this._playTone(f, 0.3, 'square', 0.25);
        this._playTone(f * 1.5, 0.2, 'sine', 0.12);
      }, i * 120);
    });
  }

  /** Wheel spin tick */
  playWheelTick() {
    this._playTone(1200, 0.05, 'sine', 0.15);
  }

  /** Wheel prize won */
  playWheelPrize() {
    this._playTone(880, 0.15, 'sine', 0.3);
    setTimeout(() => this._playTone(1100, 0.15, 'sine', 0.25), 100);
    setTimeout(() => this._playTone(1320, 0.25, 'sine', 0.2), 200);
  }

  /** Bob-omb explosion — heavy boom */
  playBobOmbExplode() {
    this._playTone(100, 0.3, 'sawtooth', 0.3);
    this._playNoise(0.4, 0.2);
    setTimeout(() => this._playTone(60, 0.25, 'sine', 0.25), 50);
    [500, 400, 300, 200].forEach((f, i) => {
      setTimeout(() => this._playTone(f, 0.08, 'triangle', 0.1), 100 + i * 40);
    });
  }

  /** Magnet mushroom activated — electromagnetic hum */
  playMagnetActivate() {
    this._playTone(220, 0.2, 'sine', 0.15);
    setTimeout(() => this._playTone(440, 0.3, 'sine', 0.12), 100);
    setTimeout(() => this._playTone(330, 0.25, 'triangle', 0.1), 200);
  }

  /** Coin Pipe rain start — ascending sparkle */
  playCoinRainStart() {
    [660, 880, 1100, 1320, 1760].forEach((f, i) => {
      setTimeout(() => this._playTone(f, 0.12, 'sine', 0.2), i * 60);
    });
  }

  /** Diamond coin collected — crystalline sparkle */
  playDiamondCoinCollect() {
    [1320, 1760, 2200, 2640].forEach((f, i) => {
      setTimeout(() => this._playTone(f, 0.15, 'sine', 0.2), i * 50);
    });
    this._playNoise(0.1, 0.05);
  }

  /** Giant Bob-omb explosion — earth-shaking boom */
  playGiantBobOmbExplode() {
    this._playTone(60, 0.5, 'sawtooth', 0.35);
    this._playNoise(0.6, 0.25);
    setTimeout(() => this._playTone(40, 0.4, 'sine', 0.3), 50);
    setTimeout(() => this._playTone(80, 0.3, 'sawtooth', 0.25), 100);
    [600, 500, 400, 300, 200, 100].forEach((f, i) => {
      setTimeout(() => this._playTone(f, 0.1, 'triangle', 0.12), 150 + i * 40);
    });
  }

  /** Bullet Bill appears — rumbling approach */
  playBulletBillAppear() {
    this._playTone(80, 0.4, 'sawtooth', 0.3);
    this._playNoise(0.3, 0.15);
    setTimeout(() => this._playTone(120, 0.3, 'sawtooth', 0.25), 100);
    setTimeout(() => this._playTone(200, 0.2, 'sawtooth', 0.2), 250);
  }

  /** Bullet Bill sweep — wind rush */
  playBulletBillSweep() {
    this._playNoise(0.5, 0.2);
    this._playTone(150, 0.5, 'sawtooth', 0.15);
    setTimeout(() => this._playTone(100, 0.4, 'triangle', 0.12), 200);
  }

  /** Lakitu appears — warning siren descending */
  playLakituAppear() {
    // Descending warning tones
    [1200, 1000, 800, 600].forEach((f, i) => {
      setTimeout(() => this._playTone(f, 0.15, 'square', 0.2), i * 100);
    });
    // Wind whoosh
    setTimeout(() => this._playNoise(0.3, 0.08), 50);
  }

  /** Lakitu steals coins — sneaky ascending jingle */
  playLakituSteal() {
    // Fast ascending steal sequence
    [400, 500, 600, 700, 800, 1000].forEach((f, i) => {
      setTimeout(() => this._playTone(f, 0.08, 'triangle', 0.18), i * 50);
    });
    // Coin jingle at end
    setTimeout(() => {
      this._playTone(1200, 0.12, 'sine', 0.2);
      this._playTone(1500, 0.1, 'sine', 0.15);
    }, 350);
  }

  /** Achievement unlocked */
  playAchievement() {
    this._playTone(880, 0.1, 'square', 0.2);
    setTimeout(() => this._playTone(1100, 0.1, 'square', 0.18), 60);
    setTimeout(() => this._playTone(1320, 0.15, 'square', 0.15), 120);
    setTimeout(() => this._playTone(1760, 0.2, 'sine', 0.12), 180);
  }

  setVolume(v) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, v));
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  destroy() {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
