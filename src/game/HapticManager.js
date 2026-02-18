/**
 * HapticManager — Vibration API wrapper for mobile haptic feedback.
 */
export class HapticManager {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.supported = typeof navigator !== 'undefined' && !!navigator.vibrate;
  }

  vibrate(pattern) {
    if (this.enabled && this.supported) {
      try { navigator.vibrate(pattern); } catch { /* ignore */ }
    }
  }

  coinDrop()     { this.vibrate(10); }
  coinCollect()  { this.vibrate(15); }
  itemCollect()  { this.vibrate([20, 40, 20]); }
  chainTier(idx) { this.vibrate(30 + idx * 20); }
  levelUp()      { this.vibrate([50, 100, 50, 100, 50]); }
  frenzy()       { this.vibrate([30, 50, 30, 50, 30, 50, 30]); }
  bossHit()      { this.vibrate([20, 30, 20]); }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setEnabled(v) { this.enabled = v; }
}
