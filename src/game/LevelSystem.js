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
    // Apply XP multiplier from difficulty scaling
    const scale = this.getDifficultyScale();
    const scaledAmount = Math.max(1, Math.floor(amount * scale.xpMult));
    const newXP = this.save.getXP() + scaledAmount;
    this.save.setXP(newXP);

    // Calculate new level
    let newLevel = 1;
    for (const t of C.LEVEL_THRESHOLDS) {
      if (newXP >= t.xp) newLevel = t.level;
      else break;
    }

    if (newLevel > oldLevel) {
      this.save.setLevel(newLevel);
      // Gather newly unlocked items + coin rewards
      const newUnlocks = [];
      let coinReward = 0;
      for (let lv = oldLevel + 1; lv <= newLevel; lv++) {
        const unlocks = C.LEVEL_UNLOCKS[lv];
        if (unlocks) newUnlocks.push(...unlocks);
        if (C.LEVEL_COIN_REWARDS[lv]) coinReward += C.LEVEL_COIN_REWARDS[lv];
      }
      this.bus.emit('level:up', { newLevel, unlockedItems: newUnlocks, coinReward });
    }

    this.bus.emit('xp:gained', { amount: scaledAmount, totalXp: newXP, level: newLevel });
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

  /** Get difficulty scaling for current level */
  getDifficultyScale() {
    return C.getDifficultyScale(this.save.getLevel());
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

  /** Get item types that can naturally spawn (respects spawnRate:0 needing _spawn unlock) */
  getSpawnableItemTypes() {
    const all = this.getUnlockedItemTypes();
    const spawnable = [];
    for (const [id, def] of Object.entries(C.ITEM_TYPES)) {
      if (!all.includes(id) && def.spawnRate > 0) continue;
      if (def.spawnRate === 0) {
        // Wheel-only items need explicit _spawn unlock to appear naturally
        if (all.includes(`${id}_spawn`)) spawnable.push(id);
      } else if (all.includes(id)) {
        spawnable.push(id);
      }
    }
    return spawnable;
  }

  /** Get all scenes unlocked at current level */
  getUnlockedScenes() {
    const all = this.getUnlockedItemTypes();
    const scenes = ['overworld'];
    if (all.includes('underground_scene')) scenes.push('underground');
    if (all.includes('castle_scene')) scenes.push('castle');
    if (all.includes('underwater_scene')) scenes.push('underwater');
    if (all.includes('starry_night_scene')) scenes.push('starry_night');
    if (all.includes('lava_castle_scene')) scenes.push('lava_castle');
    if (all.includes('rainbow_road_scene')) scenes.push('rainbow_road');
    if (all.includes('space_scene')) scenes.push('space');
    return scenes;
  }

  canBoss() {
    return this.getUnlockedItemTypes().includes('boss_mode');
  }

  canBossRush() {
    return this.getUnlockedItemTypes().includes('boss_rush');
  }
}
