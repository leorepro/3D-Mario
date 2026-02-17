import * as C from './constants.js';

/**
 * ComboTracker — tracks chain/combo when coins are collected in rapid succession.
 *
 * Usage:
 *   tracker.onCoinCollected()  →  returns { chain, multiplier, tier } or null
 */
export class ComboTracker {
  constructor() {
    this.chain = 0;
    this.lastCollectTime = 0;
    this.currentTier = null;    // current tier object from CHAIN_TIERS
    this.currentTierIndex = -1;
  }

  /**
   * Call when a coin is collected.
   * @returns {{ chain: number, multiplier: number, tier: object|null, newTier: boolean }}
   */
  onCoinCollected() {
    const now = Date.now();

    if (now - this.lastCollectTime <= C.CHAIN_WINDOW_MS) {
      this.chain++;
    } else {
      this.chain = 1; // reset chain
    }

    this.lastCollectTime = now;

    // Determine tier
    let newTier = false;
    let tier = null;
    let tierIndex = -1;

    for (let i = C.CHAIN_TIERS.length - 1; i >= 0; i--) {
      if (this.chain >= C.CHAIN_TIERS[i].minChain) {
        tier = C.CHAIN_TIERS[i];
        tierIndex = i;
        break;
      }
    }

    if (tierIndex > this.currentTierIndex) {
      newTier = true;
    }

    this.currentTier = tier;
    this.currentTierIndex = tierIndex;

    return {
      chain: this.chain,
      multiplier: tier ? tier.multiplier : 1,
      tier,
      tierIndex,
      newTier,
    };
  }

  /** Get the current score multiplier (for display) */
  getMultiplier() {
    const now = Date.now();
    if (now - this.lastCollectTime > C.CHAIN_WINDOW_MS) {
      // Chain expired
      this.chain = 0;
      this.currentTier = null;
      this.currentTierIndex = -1;
      return 1;
    }
    return this.currentTier ? this.currentTier.multiplier : 1;
  }

  getChain() {
    const now = Date.now();
    if (now - this.lastCollectTime > C.CHAIN_WINDOW_MS) {
      this.chain = 0;
      this.currentTier = null;
      this.currentTierIndex = -1;
    }
    return this.chain;
  }

  reset() {
    this.chain = 0;
    this.lastCollectTime = 0;
    this.currentTier = null;
    this.currentTierIndex = -1;
  }
}
