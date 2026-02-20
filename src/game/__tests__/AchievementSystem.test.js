import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AchievementSystem, ACHIEVEMENTS } from '../AchievementSystem.js';
import { EventBus } from '../EventBus.js';

function createMockSaveManager(overrides = {}) {
  const data = {
    totalCoinsCollected: 0,
    maxChain: 0,
    level: 1,
    bossDefeated: false,
    uniqueItemsCollected: [],
    frenzyTriggered: false,
    achievements: {},
    ...overrides,
  };
  return {
    getTotalCoinsCollected: () => data.totalCoinsCollected,
    getMaxChain: () => data.maxChain,
    getLevel: () => data.level,
    get: (key) => data[key],
    getUniqueItemsCollected: () => data.uniqueItemsCollected,
    getFrenzyTriggered: () => data.frenzyTriggered,
    getAchievements: () => data.achievements,
    unlockAchievement: vi.fn((id) => {
      data.achievements[id] = { unlocked: true, date: new Date().toISOString() };
    }),
  };
}

describe('AchievementSystem', () => {
  it('should unlock first_coin after 1 coin collected', () => {
    const save = createMockSaveManager({ totalCoinsCollected: 1 });
    const bus = new EventBus();
    const ach = new AchievementSystem(save, bus);

    const unlocked = ach.check();
    expect(unlocked.map(a => a.id)).toContain('first_coin');
  });

  it('should unlock coin_100 after 100 coins', () => {
    const save = createMockSaveManager({ totalCoinsCollected: 100 });
    const bus = new EventBus();
    const ach = new AchievementSystem(save, bus);

    const unlocked = ach.check();
    expect(unlocked.map(a => a.id)).toContain('coin_100');
  });

  it('should unlock chain_5 with max chain >= 5', () => {
    const save = createMockSaveManager({ maxChain: 5 });
    const bus = new EventBus();
    const ach = new AchievementSystem(save, bus);

    const unlocked = ach.check();
    expect(unlocked.map(a => a.id)).toContain('chain_5');
  });

  it('should unlock level_10 at level 10', () => {
    const save = createMockSaveManager({ level: 10 });
    const bus = new EventBus();
    const ach = new AchievementSystem(save, bus);

    const unlocked = ach.check();
    expect(unlocked.map(a => a.id)).toContain('level_10');
  });

  it('should unlock boss_defeated', () => {
    const save = createMockSaveManager({ bossDefeated: true });
    const bus = new EventBus();
    const ach = new AchievementSystem(save, bus);

    const unlocked = ach.check();
    expect(unlocked.map(a => a.id)).toContain('boss_defeated');
  });

  it('should unlock frenzy achievement', () => {
    const save = createMockSaveManager({ frenzyTriggered: true });
    const bus = new EventBus();
    const ach = new AchievementSystem(save, bus);

    const unlocked = ach.check();
    expect(unlocked.map(a => a.id)).toContain('frenzy');
  });

  it('should unlock score_1000 for session score', () => {
    const save = createMockSaveManager();
    const bus = new EventBus();
    const ach = new AchievementSystem(save, bus);
    ach.setSessionScore(1000);

    const unlocked = ach.check();
    expect(unlocked.map(a => a.id)).toContain('score_1000');
  });

  it('should not re-unlock already unlocked achievements', () => {
    const save = createMockSaveManager({
      totalCoinsCollected: 1,
      achievements: { first_coin: { unlocked: true, date: '2024-01-01' } },
    });
    const bus = new EventBus();
    const ach = new AchievementSystem(save, bus);

    const unlocked = ach.check();
    expect(unlocked.map(a => a.id)).not.toContain('first_coin');
  });

  it('should emit achievement:unlock event', () => {
    const save = createMockSaveManager({ totalCoinsCollected: 1 });
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('achievement:unlock', fn);
    const ach = new AchievementSystem(save, bus);

    ach.check();
    expect(fn).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'first_coin' })
    );
  });

  it('getAll returns all achievements with unlock status', () => {
    const save = createMockSaveManager({
      achievements: { first_coin: { unlocked: true, date: '2024-01-01' } },
    });
    const bus = new EventBus();
    const ach = new AchievementSystem(save, bus);

    const all = ach.getAll();
    expect(all.length).toBe(ACHIEVEMENTS.length);
    const firstCoin = all.find(a => a.id === 'first_coin');
    expect(firstCoin.unlocked).toBe(true);
    const coin100 = all.find(a => a.id === 'coin_100');
    expect(coin100.unlocked).toBe(false);
  });

  it('should not unlock anything with zero stats', () => {
    const save = createMockSaveManager();
    const bus = new EventBus();
    const ach = new AchievementSystem(save, bus);

    const unlocked = ach.check();
    expect(unlocked).toHaveLength(0);
  });
});
