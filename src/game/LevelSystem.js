/**
 * LevelSystem — XP / Level progression with item unlocks.
 */
import * as C from './constants.js';

export class LevelSystem {
  constructor(saveManager, eventBus) {
    this.save = saveManager;
    this.bus = eventBus;
  }

  addXP(amount) {
    const oldLevel = this.save.getLevel();
    const newXP = this.save.getXP() + amount;
    this.save.setXP(newXP);

    // Calculate new level
    let newLevel = 1;
    for (const t of C.LEVEL_THRESHOLDS) {
      if (newXP >= t.xp) newLevel = t.level;
      else break;
    }

    if (newLevel > oldLevel) {
      this.save.setLevel(newLevel);
      // Gather newly unlocked items
      const newUnlocks = [];
      for (let lv = oldLevel + 1; lv <= newLevel; lv++) {
        const unlocks = C.LEVEL_UNLOCKS[lv];
        if (unlocks) newUnlocks.push(...unlocks);
      }
      this.bus.emit('level:up', { newLevel, unlockedItems: newUnlocks });
    }

    this.bus.emit('xp:gained', { amount, totalXp: newXP, level: newLevel });
  }

  getLevel() { return this.save.getLevel(); }
  getXP() { return this.save.getXP(); }

  getXPForCurrentLevel() {
    const lv = this.save.getLevel();
    const t = C.LEVEL_THRESHOLDS.find(t => t.level === lv);
    return t ? t.xp : 0;
  }

  getXPForNextLevel() {
    const lv = this.save.getLevel();
    const next = C.LEVEL_THRESHOLDS.find(t => t.level === lv + 1);
    return next ? next.xp : Infinity;
  }

  getXPProgress() {
    const xp = this.save.getXP();
    const cur = this.getXPForCurrentLevel();
    const next = this.getXPForNextLevel();
    if (next === Infinity) return 1;
    return Math.min(1, (xp - cur) / (next - cur));
  }

  /** Get all items unlocked at current level */
  getUnlockedItemTypes() {
    const lv = this.save.getLevel();
    const unlocked = [];
    for (const [level, items] of Object.entries(C.LEVEL_UNLOCKS)) {
      if (Number(level) <= lv) unlocked.push(...items);
    }
    return unlocked;
  }

  /** Get all scenes unlocked at current level */
  getUnlockedScenes() {
    const all = this.getUnlockedItemTypes();
    const scenes = ['overworld']; // always available
    if (all.includes('underground_scene')) scenes.push('underground');
    if (all.includes('castle_scene')) scenes.push('castle');
    if (all.includes('underwater_scene')) scenes.push('underwater');
    return scenes;
  }

  canBoss() {
    return this.getUnlockedItemTypes().includes('boss_mode');
  }
}
