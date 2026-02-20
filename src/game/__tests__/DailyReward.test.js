import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DailyReward } from '../DailyReward.js';

function createMockSaveManager(lastDate = null) {
  return {
    _lastDailyRewardDate: lastDate,
    getLastDailyRewardDate() { return this._lastDailyRewardDate; },
    setLastDailyRewardDate(v) { this._lastDailyRewardDate = v; },
  };
}

describe('DailyReward', () => {
  it('should claim reward on first ever open', () => {
    const save = createMockSaveManager(null);
    const daily = new DailyReward(save);
    const result = daily.checkAndClaim();
    expect(result.claimed).toBe(true);
    expect(result.coins).toBe(20);
  });

  it('should not claim reward twice on same day', () => {
    const save = createMockSaveManager(null);
    const daily = new DailyReward(save);
    daily.checkAndClaim();
    const result2 = daily.checkAndClaim();
    expect(result2.claimed).toBe(false);
    expect(result2.coins).toBe(0);
  });

  it('should claim reward on new day', () => {
    const save = createMockSaveManager('Mon Jan 01 2024');
    const daily = new DailyReward(save);
    // Current date is different from saved date
    const result = daily.checkAndClaim();
    expect(result.claimed).toBe(true);
    expect(result.coins).toBe(20);
  });

  it('should save today as last daily reward date', () => {
    const save = createMockSaveManager(null);
    const daily = new DailyReward(save);
    daily.checkAndClaim();
    expect(save._lastDailyRewardDate).toBe(new Date().toDateString());
  });
});
