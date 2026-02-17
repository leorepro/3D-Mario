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
