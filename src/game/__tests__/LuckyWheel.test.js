import { describe, it, expect } from 'vitest';
import { LuckyWheel, WHEEL_PRIZES, WHEEL_TRIGGER_INTERVAL } from '../LuckyWheel.js';

describe('LuckyWheel', () => {
  it('should have correct trigger interval', () => {
    expect(WHEEL_TRIGGER_INTERVAL).toBe(30);
  });

  it('should have prizes with required fields', () => {
    for (const p of WHEEL_PRIZES) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('label');
      expect(p).toHaveProperty('weight');
      expect(p).toHaveProperty('reward');
      expect(p.weight).toBeGreaterThan(0);
    }
  });

  it('spin() returns a valid prize object', () => {
    const wheel = new LuckyWheel();
    const result = wheel.spin();
    expect(result).toHaveProperty('prize');
    expect(result).toHaveProperty('slotIndex');
    expect(result).toHaveProperty('totalSlots');
    expect(result.totalSlots).toBe(WHEEL_PRIZES.length);
    expect(result.slotIndex).toBeGreaterThanOrEqual(0);
    expect(result.slotIndex).toBeLessThan(WHEEL_PRIZES.length);
    expect(WHEEL_PRIZES).toContain(result.prize);
  });

  it('spin() returns different results over many spins (not stuck)', () => {
    const wheel = new LuckyWheel();
    const ids = new Set();
    for (let i = 0; i < 200; i++) {
      ids.add(wheel.spin().prize.id);
    }
    // Should hit at least 3 different prizes in 200 spins
    expect(ids.size).toBeGreaterThanOrEqual(3);
  });

  it('every prize has a valid reward type', () => {
    for (const p of WHEEL_PRIZES) {
      const r = p.reward;
      const hasReward = r.coins || r.frenzy || r.spawnItem;
      expect(hasReward).toBeTruthy();
    }
  });
});
