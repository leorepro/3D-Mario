/**
 * EffectManager — manages timed game effects (star multiplier, mushroom pusher, frenzy).
 * Called each frame from GameEngine.loop().
 */
export class EffectManager {
  constructor() {
    this.effects = []; // { type, duration, startTime, apply, remove, applied }
  }

  /**
   * Add a timed effect.
   * @param {{ type: string, duration: number, apply: (engine)=>void, remove: (engine)=>void }} effect
   */
  addEffect(effect, engine) {
    // Remove existing effect of same type (don't stack)
    this.removeEffectByType(effect.type, engine);

    const entry = {
      ...effect,
      startTime: Date.now(),
      applied: false,
    };

    this.effects.push(entry);

    // Apply immediately
    if (entry.apply) {
      entry.apply(engine);
      entry.applied = true;
    }
  }

  removeEffectByType(type, engine) {
    const idx = this.effects.findIndex(e => e.type === type);
    if (idx >= 0) {
      const e = this.effects[idx];
      if (e.applied && e.remove) e.remove(engine);
      this.effects.splice(idx, 1);
    }
  }

  /** Call each frame to expire old effects */
  update(engine) {
    const now = Date.now();
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      if (now - e.startTime >= e.duration) {
        if (e.applied && e.remove) e.remove(engine);
        this.effects.splice(i, 1);
      }
    }
  }

  /** Get active effects for UI display */
  getActiveEffects() {
    const now = Date.now();
    return this.effects.map(e => ({
      type: e.type,
      remaining: Math.max(0, e.duration - (now - e.startTime)),
      duration: e.duration,
    }));
  }

  hasEffect(type) {
    return this.effects.some(e => e.type === type);
  }

  clear(engine) {
    for (const e of this.effects) {
      if (e.applied && e.remove) e.remove(engine);
    }
    this.effects = [];
  }
}
