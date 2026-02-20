import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LevelSystem } from '../LevelSystem.js';
import { EventBus } from '../EventBus.js';
import { LEVEL_THRESHOLDS, LEVEL_UNLOCKS, LEVEL_COIN_REWARDS } from '../constants.js';

function createMockSaveManager(level = 1, xp = 0) {
  return {
    _level: level,
    _xp: xp,
    getLevel() { return this._level; },
    setLevel(v) { this._level = v; },
    getXP() { return this._xp; },
    setXP(v) { this._xp = v; },
  };
}

describe('LevelSystem', () => {
  let save, bus, ls;

  beforeEach(() => {
    save = createMockSaveManager();
    bus = new EventBus();
    ls = new LevelSystem(save, bus);
  });

  it('should start at level 1 with 0 XP', () => {
    expect(ls.getLevel()).toBe(1);
    expect(ls.getXP()).toBe(0);
  });

  it('addXP should increase XP', () => {
    ls.addXP(10);
    expect(ls.getXP()).toBe(10);
  });

  it('addXP should level up when reaching threshold', () => {
    const levelUpFn = vi.fn();
    bus.on('level:up', levelUpFn);

    // L2 requires 20 XP
    ls.addXP(20);
    expect(ls.getLevel()).toBe(2);
    expect(levelUpFn).toHaveBeenCalledWith(
      expect.objectContaining({ newLevel: 2 })
    );
  });

  it('should skip multiple levels if XP is enough', () => {
    const levelUpFn = vi.fn();
    bus.on('level:up', levelUpFn);

    // L5 requires 150 XP
    ls.addXP(150);
    expect(ls.getLevel()).toBe(5);
    expect(levelUpFn).toHaveBeenCalledTimes(1);
    expect(levelUpFn).toHaveBeenCalledWith(
      expect.objectContaining({ newLevel: 5 })
    );
  });

  it('level:up should include coin rewards', () => {
    const levelUpFn = vi.fn();
    bus.on('level:up', levelUpFn);

    // L2 has coin reward of 10
    ls.addXP(20);
    expect(levelUpFn).toHaveBeenCalledWith(
      expect.objectContaining({ coinReward: LEVEL_COIN_REWARDS[2] || 0 })
    );
  });

  it('level:up should include accumulated coin rewards for multi-level skip', () => {
    const levelUpFn = vi.fn();
    bus.on('level:up', levelUpFn);

    // Jump from L1 to L5 (150 XP)
    // Coin rewards: L2=15, L3=20, L4=25, L5=40
    ls.addXP(150);
    const data = levelUpFn.mock.calls[0][0];
    const expectedReward = (LEVEL_COIN_REWARDS[2] || 0) +
                           (LEVEL_COIN_REWARDS[3] || 0) +
                           (LEVEL_COIN_REWARDS[4] || 0) +
                           (LEVEL_COIN_REWARDS[5] || 0);
    expect(data.coinReward).toBe(expectedReward);
  });

  it('level:up should include unlocked items', () => {
    const levelUpFn = vi.fn();
    bus.on('level:up', levelUpFn);

    ls.addXP(20); // L2
    const data = levelUpFn.mock.calls[0][0];
    expect(data.unlockedItems).toEqual(LEVEL_UNLOCKS[2] || []);
  });

  it('emits xp:gained on every addXP', () => {
    const xpFn = vi.fn();
    bus.on('xp:gained', xpFn);

    ls.addXP(5);
    expect(xpFn).toHaveBeenCalledWith(
      expect.objectContaining({ totalXp: 5, level: 1 })
    );
  });

  it('getXPProgress returns 0-1 range', () => {
    const p = ls.getXPProgress();
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  it('getXPProgress returns fraction between levels', () => {
    ls.addXP(10); // Between L1 (0 XP) and L2 (20 XP)
    const progress = ls.getXPProgress();
    expect(progress).toBeCloseTo(0.5, 1);
  });

  it('getUnlockedItemTypes returns items for current level', () => {
    save._level = 10;
    const items = ls.getUnlockedItemTypes();
    // Should include L1 items (question_block, star) and L10 items
    expect(items).toContain('question_block');
    expect(items).toContain('star');
    expect(items).toContain('underground_scene');
  });

  it('getUnlockedScenes returns correct scenes', () => {
    save._level = 1;
    expect(ls.getUnlockedScenes()).toEqual(['overworld']);

    save._level = 10;
    expect(ls.getUnlockedScenes()).toContain('underground');

    save._level = 50;
    const scenes = ls.getUnlockedScenes();
    expect(scenes).toContain('overworld');
    expect(scenes).toContain('space');
    expect(scenes).toContain('rainbow_road');
    expect(scenes).toContain('lava_castle');
    expect(scenes).toContain('starry_night');
  });

  it('canBoss returns false below L15', () => {
    save._level = 14;
    expect(ls.canBoss()).toBe(false);
  });

  it('canBoss returns true at L15+', () => {
    save._level = 15;
    expect(ls.canBoss()).toBe(true);
  });

  it('canBossRush returns false below L38', () => {
    save._level = 37;
    expect(ls.canBossRush()).toBe(false);
  });

  it('canBossRush returns true at L38+', () => {
    save._level = 38;
    expect(ls.canBossRush()).toBe(true);
  });

  it('getDifficultyScale returns scaling object', () => {
    const scale = ls.getDifficultyScale();
    expect(scale).toHaveProperty('pusherSpeed');
    expect(scale).toHaveProperty('eventFreq');
    expect(scale).toHaveProperty('xpMult');
    expect(scale).toHaveProperty('coinMult');
    expect(scale.pusherSpeed).toBeGreaterThanOrEqual(1);
  });

  it('LEVEL_THRESHOLDS should go up to level 50', () => {
    const maxLevel = Math.max(...LEVEL_THRESHOLDS.map(t => t.level));
    expect(maxLevel).toBe(50);
  });

  it('LEVEL_THRESHOLDS XP should be strictly increasing', () => {
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
      expect(LEVEL_THRESHOLDS[i].xp).toBeGreaterThan(LEVEL_THRESHOLDS[i - 1].xp);
    }
  });

  it('XP multiplier scales with level', () => {
    save._level = 1;
    const scale1 = ls.getDifficultyScale();
    save._level = 30;
    const scale30 = ls.getDifficultyScale();
    expect(scale30.xpMult).toBeGreaterThan(scale1.xpMult);
  });
});
