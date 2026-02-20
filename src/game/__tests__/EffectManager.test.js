import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EffectManager } from '../EffectManager.js';

describe('EffectManager', () => {
  let em;
  let engine;
  let now;

  beforeEach(() => {
    em = new EffectManager();
    engine = { scoreMultiplier: 1 };
    now = 10000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should apply effect immediately', () => {
    const apply = vi.fn();
    em.addEffect({ type: 'test', duration: 5000, apply, remove: vi.fn() }, engine);
    expect(apply).toHaveBeenCalledWith(engine);
  });

  it('should remove effect after duration', () => {
    const remove = vi.fn();
    em.addEffect({ type: 'test', duration: 5000, apply: vi.fn(), remove }, engine);
    expect(em.hasEffect('test')).toBe(true);

    now += 5000;
    em.update(engine);
    expect(remove).toHaveBeenCalledWith(engine);
    expect(em.hasEffect('test')).toBe(false);
  });

  it('should not remove effect before duration expires', () => {
    const remove = vi.fn();
    em.addEffect({ type: 'test', duration: 5000, apply: vi.fn(), remove }, engine);

    now += 4999;
    em.update(engine);
    expect(remove).not.toHaveBeenCalled();
    expect(em.hasEffect('test')).toBe(true);
  });

  it('should replace existing effect of same type', () => {
    const remove1 = vi.fn();
    const apply2 = vi.fn();
    em.addEffect({ type: 'star', duration: 5000, apply: vi.fn(), remove: remove1 }, engine);
    em.addEffect({ type: 'star', duration: 3000, apply: apply2, remove: vi.fn() }, engine);

    expect(remove1).toHaveBeenCalled(); // old one removed
    expect(apply2).toHaveBeenCalled();  // new one applied
    expect(em.effects.length).toBe(1);
  });

  it('getActiveEffects returns remaining time', () => {
    em.addEffect({ type: 'star', duration: 5000, apply: vi.fn(), remove: vi.fn() }, engine);
    now += 2000;
    const active = em.getActiveEffects();
    expect(active).toHaveLength(1);
    expect(active[0].type).toBe('star');
    expect(active[0].remaining).toBe(3000);
  });

  it('clear() removes all effects and calls remove callbacks', () => {
    const remove1 = vi.fn();
    const remove2 = vi.fn();
    em.addEffect({ type: 'a', duration: 5000, apply: vi.fn(), remove: remove1 }, engine);
    em.addEffect({ type: 'b', duration: 5000, apply: vi.fn(), remove: remove2 }, engine);
    em.clear(engine);
    expect(remove1).toHaveBeenCalled();
    expect(remove2).toHaveBeenCalled();
    expect(em.effects).toHaveLength(0);
  });

  it('removeEffectByType removes specific effect', () => {
    const removeA = vi.fn();
    const removeB = vi.fn();
    em.addEffect({ type: 'a', duration: 5000, apply: vi.fn(), remove: removeA }, engine);
    em.addEffect({ type: 'b', duration: 5000, apply: vi.fn(), remove: removeB }, engine);
    em.removeEffectByType('a', engine);
    expect(removeA).toHaveBeenCalled();
    expect(em.hasEffect('a')).toBe(false);
    expect(em.hasEffect('b')).toBe(true);
  });
});
