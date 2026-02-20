import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BossSystem } from '../BossSystem.js';
import { EventBus } from '../EventBus.js';

function createMockSaveManager() {
  return {
    _bossLastDefeated: null,
    _bossDefeated: false,
    getBossLastDefeated() { return this._bossLastDefeated; },
    setBossLastDefeated(v) { this._bossLastDefeated = v; this._bossDefeated = true; },
    get(key) {
      if (key === 'bossDefeated') return this._bossDefeated;
      return null;
    },
  };
}

describe('BossSystem', () => {
  let boss, bus, save;

  beforeEach(() => {
    bus = new EventBus();
    save = createMockSaveManager();
    boss = new BossSystem(bus, save);
  });

  it('should not be active initially', () => {
    expect(boss.isActive()).toBe(false);
    expect(boss.getHP()).toBe(0);
  });

  it('canStart returns true on first attempt', () => {
    expect(boss.canStart()).toBe(true);
  });

  it('canStart returns false within 24hr cooldown', () => {
    save._bossLastDefeated = new Date().toISOString();
    expect(boss.canStart()).toBe(false);
  });

  it('canStart returns true after 24hr cooldown', () => {
    const past = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    save._bossLastDefeated = past;
    expect(boss.canStart()).toBe(true);
  });

  it('start() activates boss with full HP', () => {
    const startFn = vi.fn();
    bus.on('boss:start', startFn);

    boss.start();
    expect(boss.isActive()).toBe(true);
    expect(boss.getHP()).toBe(boss.getMaxHP());
    expect(startFn).toHaveBeenCalledWith({ hp: 100, maxHp: 100 });
  });

  it('onObjectLostBack deals damage', () => {
    boss.start();
    const damageFn = vi.fn();
    bus.on('boss:damaged', damageFn);

    boss.onObjectLostBack('coin');
    expect(boss.getHP()).toBe(99);
    expect(damageFn).toHaveBeenCalledWith(
      expect.objectContaining({ damage: 1, hpRemaining: 99 })
    );
  });

  it('star deals 10 damage', () => {
    boss.start();
    boss.onObjectLostBack('star');
    expect(boss.getHP()).toBe(90);
  });

  it('fire_flower deals 20 damage', () => {
    boss.start();
    boss.onObjectLostBack('fire_flower');
    expect(boss.getHP()).toBe(80);
  });

  it('mushroom deals 5 damage', () => {
    boss.start();
    boss.onObjectLostBack('mushroom');
    expect(boss.getHP()).toBe(95);
  });

  it('boss is defeated when HP reaches 0', () => {
    boss.start();
    const defeatFn = vi.fn();
    bus.on('boss:defeated', defeatFn);

    // Deal 100 damage via fire_flower (5 hits)
    for (let i = 0; i < 5; i++) {
      boss.onObjectLostBack('fire_flower');
    }
    expect(boss.isActive()).toBe(false);
    expect(defeatFn).toHaveBeenCalledWith({ reward: 100 });
  });

  it('defeat saves timestamp', () => {
    boss.start();
    for (let i = 0; i < 5; i++) {
      boss.onObjectLostBack('fire_flower');
    }
    expect(save._bossLastDefeated).toBeTruthy();
  });

  it('does not deal damage when inactive', () => {
    boss.onObjectLostBack('coin');
    expect(boss.getHP()).toBe(0); // still 0, not -1
  });

  it('abort() stops the boss', () => {
    boss.start();
    boss.abort();
    expect(boss.isActive()).toBe(false);
    expect(boss.getHP()).toBe(0);
  });

  it('update emits attack at attackInterval', () => {
    boss.start();
    const attackFn = vi.fn();
    bus.on('boss:attack', attackFn);

    // Immediately after start, no attack
    expect(boss.update()).toBe(null);

    // Advance time past attack interval
    boss.lastAttackTime = Date.now() - 6000;
    expect(boss.update()).toBe('attack');
    expect(attackFn).toHaveBeenCalled();
  });

  it('update returns null when inactive', () => {
    expect(boss.update()).toBe(null);
  });
});
