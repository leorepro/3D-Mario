import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComboTracker } from '../ComboTracker.js';
import { CHAIN_WINDOW_MS, CHAIN_TIERS } from '../constants.js';

describe('ComboTracker', () => {
  let tracker;
  let now;

  beforeEach(() => {
    tracker = new ComboTracker();
    now = 10000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start chain at 1 on first collect', () => {
    const r = tracker.onCoinCollected();
    expect(r.chain).toBe(1);
    expect(r.multiplier).toBe(1);
    expect(r.newTier).toBe(false);
  });

  it('should increment chain within time window', () => {
    tracker.onCoinCollected();
    now += CHAIN_WINDOW_MS - 1; // still within window
    const r = tracker.onCoinCollected();
    expect(r.chain).toBe(2);
  });

  it('should reset chain when time window expires', () => {
    tracker.onCoinCollected();
    now += CHAIN_WINDOW_MS + 1; // outside window
    const r = tracker.onCoinCollected();
    expect(r.chain).toBe(1);
  });

  it('should reach tier 1 (Nice!) at chain 2', () => {
    tracker.onCoinCollected();
    now += 100;
    const r = tracker.onCoinCollected();
    expect(r.chain).toBe(2);
    expect(r.multiplier).toBe(CHAIN_TIERS[0].multiplier);
    expect(r.newTier).toBe(true);
    expect(r.tier.label).toBe(CHAIN_TIERS[0].label);
  });

  it('should reach tier 2 (Great!) at chain 5', () => {
    for (let i = 0; i < 5; i++) {
      now += 100;
      tracker.onCoinCollected();
    }
    const r = tracker.onCoinCollected();
    // chain is now 6 after the 6th call, but we need exactly 5
    // Let's redo: start fresh
    tracker.reset();
    for (let i = 0; i < 5; i++) {
      now += 100;
      tracker.onCoinCollected();
    }
    expect(tracker.chain).toBe(5);
    expect(tracker.currentTier.multiplier).toBe(CHAIN_TIERS[1].multiplier);
  });

  it('should reach tier 3 (Amazing!) at chain 10', () => {
    for (let i = 0; i < 10; i++) {
      now += 100;
      tracker.onCoinCollected();
    }
    expect(tracker.chain).toBe(10);
    expect(tracker.currentTier.multiplier).toBe(CHAIN_TIERS[2].multiplier);
  });

  it('should reach tier 4 (SUPER MARIO!) at chain 20', () => {
    for (let i = 0; i < 20; i++) {
      now += 100;
      tracker.onCoinCollected();
    }
    expect(tracker.chain).toBe(20);
    expect(tracker.currentTier.multiplier).toBe(CHAIN_TIERS[3].multiplier);
  });

  it('newTier should only be true on first crossing', () => {
    tracker.onCoinCollected();
    now += 100;
    const r2 = tracker.onCoinCollected(); // chain=2, first tier
    expect(r2.newTier).toBe(true);

    now += 100;
    const r3 = tracker.onCoinCollected(); // chain=3, same tier
    expect(r3.newTier).toBe(false);
  });

  it('getMultiplier returns 1 after chain expires', () => {
    for (let i = 0; i < 5; i++) {
      now += 100;
      tracker.onCoinCollected();
    }
    expect(tracker.getMultiplier()).toBe(CHAIN_TIERS[1].multiplier);

    now += CHAIN_WINDOW_MS + 1;
    expect(tracker.getMultiplier()).toBe(1);
  });

  it('getChain returns 0 after chain expires', () => {
    now += 100;
    tracker.onCoinCollected();
    now += CHAIN_WINDOW_MS + 1;
    expect(tracker.getChain()).toBe(0);
  });

  it('reset() clears all state', () => {
    for (let i = 0; i < 5; i++) {
      now += 100;
      tracker.onCoinCollected();
    }
    tracker.reset();
    expect(tracker.chain).toBe(0);
    expect(tracker.currentTier).toBe(null);
    expect(tracker.currentTierIndex).toBe(-1);
  });
});
