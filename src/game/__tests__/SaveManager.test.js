import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaveManager } from '../SaveManager.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('SaveManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  it('should initialize with defaults', () => {
    const sm = new SaveManager();
    expect(sm.getLevel()).toBe(1);
    expect(sm.getXP()).toBe(0);
    expect(sm.getCurrentScene()).toBe('overworld');
    expect(sm.getHighScore()).toBe(0);
  });

  it('setLevel / getLevel', () => {
    const sm = new SaveManager();
    sm.setLevel(5);
    expect(sm.getLevel()).toBe(5);
  });

  it('setXP / getXP', () => {
    const sm = new SaveManager();
    sm.setXP(1000);
    expect(sm.getXP()).toBe(1000);
  });

  it('addCoinsCollected increments total', () => {
    const sm = new SaveManager();
    sm.addCoinsCollected(5);
    sm.addCoinsCollected(3);
    expect(sm.getTotalCoinsCollected()).toBe(8);
  });

  it('setMaxChain only sets if higher', () => {
    const sm = new SaveManager();
    sm.setMaxChain(5);
    expect(sm.getMaxChain()).toBe(5);
    sm.setMaxChain(3);
    expect(sm.getMaxChain()).toBe(5); // unchanged
    sm.setMaxChain(10);
    expect(sm.getMaxChain()).toBe(10);
  });

  it('setHighScore only sets if higher', () => {
    const sm = new SaveManager();
    sm.setHighScore(500);
    expect(sm.getHighScore()).toBe(500);
    sm.setHighScore(300);
    expect(sm.getHighScore()).toBe(500);
    sm.setHighScore(1000);
    expect(sm.getHighScore()).toBe(1000);
  });

  it('unlockAchievement stores achievement', () => {
    const sm = new SaveManager();
    sm.unlockAchievement('first_coin');
    const achs = sm.getAchievements();
    expect(achs.first_coin).toBeDefined();
    expect(achs.first_coin.unlocked).toBe(true);
  });

  it('addLeaderboardEntry sorts by score descending', () => {
    const sm = new SaveManager();
    sm.addLeaderboardEntry({ score: 100, date: '2024-01-01' });
    sm.addLeaderboardEntry({ score: 500, date: '2024-01-02' });
    sm.addLeaderboardEntry({ score: 200, date: '2024-01-03' });
    const lb = sm.getLeaderboard();
    expect(lb[0].score).toBe(500);
    expect(lb[1].score).toBe(200);
    expect(lb[2].score).toBe(100);
  });

  it('leaderboard is capped at 10 entries', () => {
    const sm = new SaveManager();
    for (let i = 0; i < 15; i++) {
      sm.addLeaderboardEntry({ score: i * 10, date: `2024-01-${i + 1}` });
    }
    expect(sm.getLeaderboard().length).toBe(10);
  });

  it('addUniqueItem does not add duplicates', () => {
    const sm = new SaveManager();
    sm.addUniqueItem('star');
    sm.addUniqueItem('star');
    sm.addUniqueItem('mushroom');
    expect(sm.getUniqueItemsCollected()).toEqual(['star', 'mushroom']);
  });

  it('flush writes to localStorage immediately', () => {
    const sm = new SaveManager();
    sm.setLevel(10);
    sm.flush();
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('reset restores defaults', () => {
    const sm = new SaveManager();
    sm.setLevel(20);
    sm.setXP(5000);
    sm.reset();
    expect(sm.getLevel()).toBe(1);
    expect(sm.getXP()).toBe(0);
  });

  it('scheduled save fires after 1 second', () => {
    const sm = new SaveManager();
    localStorageMock.setItem.mockClear();
    sm.setLevel(5);
    // setItem should not have been called yet (deferred save)
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('getSettings / setSettings', () => {
    const sm = new SaveManager();
    expect(sm.getSettings()).toEqual({ volume: 0.5, haptic: true });
    sm.setSettings({ volume: 0.8, haptic: false });
    expect(sm.getSettings()).toEqual({ volume: 0.8, haptic: false });
  });
});
