import { describe, it, expect } from 'vitest';
import {
  getDifficultyScale,
  LEVEL_THRESHOLDS,
  LEVEL_UNLOCKS,
  LEVEL_COIN_REWARDS,
  CHAIN_TIERS,
  COIN_SIZES,
  MEGA_FRENZY_DURATION_MULT,
  MEGA_FRENZY_SPEED_MULT,
  MEGA_FRENZY_COINS_PER_TICK,
  MEGA_FRENZY_SCORE_MULT,
  GOLDEN_PUSHER_SCORE_MULT,
  BOSS_RUSH_WAVES,
  BOSS_RUSH_WAVE_HP,
  BOSS_RUSH_WAVE_REWARD,
  LAKITU_STEAL_MIN,
  LAKITU_STEAL_MAX,
  LAKITU_STEAL_RATIO,
  FRENZY_CHANCE,
  COIN_RECOVERY_INTERVAL_MS,
} from '../constants.js';

describe('getDifficultyScale', () => {
  it('level 1 should return base values', () => {
    const s = getDifficultyScale(1);
    expect(s.pusherSpeed).toBe(1);
    expect(s.eventFreq).toBe(1);
    expect(s.xpMult).toBe(1);
    expect(s.coinMult).toBe(1);
  });

  it('level 6 should scale up (tier 1)', () => {
    const s = getDifficultyScale(6);
    expect(s.pusherSpeed).toBeGreaterThan(1);
    expect(s.xpMult).toBeGreaterThan(1);
    expect(s.coinMult).toBeGreaterThan(1);
    expect(s.eventFreq).toBeLessThan(1);
  });

  it('higher levels have stronger scaling', () => {
    const s10 = getDifficultyScale(10);
    const s30 = getDifficultyScale(30);
    const s50 = getDifficultyScale(50);
    expect(s30.pusherSpeed).toBeGreaterThan(s10.pusherSpeed);
    expect(s50.pusherSpeed).toBeGreaterThan(s30.pusherSpeed);
  });

  it('eventFreq never goes below 0.10', () => {
    const s = getDifficultyScale(50);
    expect(s.eventFreq).toBeGreaterThanOrEqual(0.10);
  });
});

describe('LEVEL_THRESHOLDS', () => {
  it('should have 50 entries', () => {
    expect(LEVEL_THRESHOLDS.length).toBe(50);
  });

  it('XP values should be strictly increasing', () => {
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
      expect(LEVEL_THRESHOLDS[i].xp).toBeGreaterThan(LEVEL_THRESHOLDS[i - 1].xp);
    }
  });

  it('levels should be 1 through 50', () => {
    expect(LEVEL_THRESHOLDS[0].level).toBe(1);
    expect(LEVEL_THRESHOLDS[49].level).toBe(50);
  });
});

describe('LEVEL_UNLOCKS', () => {
  it('should have key milestones', () => {
    expect(LEVEL_UNLOCKS[1]).toContain('question_block');
    expect(LEVEL_UNLOCKS[15]).toContain('boss_mode');
    expect(LEVEL_UNLOCKS[35]).toContain('dual_pusher');
    expect(LEVEL_UNLOCKS[38]).toContain('boss_rush');
    expect(LEVEL_UNLOCKS[45]).toContain('mega_frenzy');
    expect(LEVEL_UNLOCKS[50]).toContain('golden_pusher');
    expect(LEVEL_UNLOCKS[50]).toContain('space_scene');
  });

  it('scenes should be at correct levels', () => {
    expect(LEVEL_UNLOCKS[10]).toContain('underground_scene');
    expect(LEVEL_UNLOCKS[12]).toContain('castle_scene');
    expect(LEVEL_UNLOCKS[20]).toContain('starry_night_scene');
    expect(LEVEL_UNLOCKS[30]).toContain('lava_castle_scene');
    expect(LEVEL_UNLOCKS[40]).toContain('rainbow_road_scene');
    expect(LEVEL_UNLOCKS[50]).toContain('space_scene');
  });
});

describe('CHAIN_TIERS', () => {
  it('should have 4 tiers', () => {
    expect(CHAIN_TIERS.length).toBe(4);
  });

  it('minChain should be increasing', () => {
    for (let i = 1; i < CHAIN_TIERS.length; i++) {
      expect(CHAIN_TIERS[i].minChain).toBeGreaterThan(CHAIN_TIERS[i - 1].minChain);
    }
  });

  it('multipliers should be increasing', () => {
    for (let i = 1; i < CHAIN_TIERS.length; i++) {
      expect(CHAIN_TIERS[i].multiplier).toBeGreaterThan(CHAIN_TIERS[i - 1].multiplier);
    }
  });
});

describe('COIN_SIZES', () => {
  it('should have small and large sizes', () => {
    expect(COIN_SIZES.small).toBeDefined();
    expect(COIN_SIZES.large).toBeDefined();
  });

  it('large should cost more than small', () => {
    expect(COIN_SIZES.large.dropCost).toBeGreaterThan(COIN_SIZES.small.dropCost);
  });

  it('large should score more than small', () => {
    expect(COIN_SIZES.large.scoreValue).toBeGreaterThan(COIN_SIZES.small.scoreValue);
  });
});

describe('Mega Frenzy constants', () => {
  it('should have correct values', () => {
    expect(MEGA_FRENZY_DURATION_MULT).toBe(3);
    expect(MEGA_FRENZY_SPEED_MULT).toBe(3);
    expect(MEGA_FRENZY_COINS_PER_TICK).toBe(5);
    expect(MEGA_FRENZY_SCORE_MULT).toBe(2);
  });
});

describe('Golden Pusher constants', () => {
  it('should have correct score multiplier', () => {
    expect(GOLDEN_PUSHER_SCORE_MULT).toBe(1.5);
  });
});

describe('Boss Rush constants', () => {
  it('should have 3 waves', () => {
    expect(BOSS_RUSH_WAVES).toBe(3);
  });

  it('wave HP and rewards should have entries for each wave', () => {
    expect(BOSS_RUSH_WAVE_HP.length).toBe(BOSS_RUSH_WAVES);
    expect(BOSS_RUSH_WAVE_REWARD.length).toBe(BOSS_RUSH_WAVES);
  });

  it('wave HP should be increasing', () => {
    for (let i = 1; i < BOSS_RUSH_WAVE_HP.length; i++) {
      expect(BOSS_RUSH_WAVE_HP[i]).toBeGreaterThan(BOSS_RUSH_WAVE_HP[i - 1]);
    }
  });
});

describe('LEVEL_COIN_REWARDS distribution', () => {
  it('every level L2-L50 should have a coin reward (no gaps)', () => {
    for (let lv = 2; lv <= 50; lv++) {
      expect(LEVEL_COIN_REWARDS[lv], `Level ${lv} missing coin reward`).toBeGreaterThan(0);
    }
  });

  it('total coin rewards should be approximately 4000', () => {
    const total = Object.values(LEVEL_COIN_REWARDS).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(3800);
    expect(total).toBeLessThanOrEqual(4200);
  });

  it('milestone levels (×5) should reward more than their neighbors', () => {
    const milestones = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    for (const lv of milestones) {
      const prev = LEVEL_COIN_REWARDS[lv - 1];
      if (prev) {
        expect(LEVEL_COIN_REWARDS[lv], `L${lv} should reward more than L${lv - 1}`)
          .toBeGreaterThan(prev);
      }
    }
  });

  it('LEVEL_COIN_REWARDS keys should match LEVEL_UNLOCKS coin_reward entries', () => {
    for (const [lvStr, reward] of Object.entries(LEVEL_COIN_REWARDS)) {
      const lv = Number(lvStr);
      const unlocks = LEVEL_UNLOCKS[lv];
      expect(unlocks, `Level ${lv} has coin reward but no LEVEL_UNLOCKS entry`).toBeDefined();
      const hasCoinReward = unlocks.some(u => u.startsWith('coin_reward_'));
      expect(hasCoinReward, `Level ${lv} LEVEL_UNLOCKS missing coin_reward_ entry`).toBe(true);
    }
  });
});

describe('Lakitu steal constants', () => {
  it('STEAL_MIN should be less than STEAL_MAX', () => {
    expect(LAKITU_STEAL_MIN).toBeLessThan(LAKITU_STEAL_MAX);
  });

  it('STEAL_MIN should be positive', () => {
    expect(LAKITU_STEAL_MIN).toBeGreaterThan(0);
  });

  it('STEAL_RATIO should be between 0 and 1', () => {
    expect(LAKITU_STEAL_RATIO).toBeGreaterThan(0);
    expect(LAKITU_STEAL_RATIO).toBeLessThan(1);
  });

  it('STEAL_MAX should be reasonable (no more than 30)', () => {
    expect(LAKITU_STEAL_MAX).toBeLessThanOrEqual(30);
  });
});

describe('COIN_SIZES economy', () => {
  it('large coin should have better ROI than small coin', () => {
    const smallROI = COIN_SIZES.small.collectValue / COIN_SIZES.small.dropCost;
    const largeROI = COIN_SIZES.large.collectValue / COIN_SIZES.large.dropCost;
    expect(largeROI).toBeGreaterThan(smallROI);
  });

  it('large coin collectValue should return more than small', () => {
    expect(COIN_SIZES.large.collectValue).toBeGreaterThan(COIN_SIZES.small.collectValue);
  });
});

describe('Frenzy and Recovery tuning', () => {
  it('FRENZY_CHANCE should be at most 2%', () => {
    expect(FRENZY_CHANCE).toBeLessThanOrEqual(0.02);
    expect(FRENZY_CHANCE).toBeGreaterThan(0);
  });

  it('COIN_RECOVERY_INTERVAL_MS should be at most 3 minutes', () => {
    expect(COIN_RECOVERY_INTERVAL_MS).toBeLessThanOrEqual(180000);
    expect(COIN_RECOVERY_INTERVAL_MS).toBeGreaterThan(0);
  });
});
