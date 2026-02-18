/**
 * AchievementSystem — Milestone-based achievements.
 */
export const ACHIEVEMENTS = [
  { id: 'first_coin',    name: 'First Coin',     desc: 'Collect your first coin',    icon: '🪙' },
  { id: 'coin_100',      name: 'Coin Collector',  desc: 'Collect 100 coins',          icon: '💰' },
  { id: 'coin_1000',     name: 'Coin Hoarder',    desc: 'Collect 1,000 coins',        icon: '🏦' },
  { id: 'chain_5',       name: 'Combo Starter',   desc: 'Get a 5x chain',             icon: '🔥' },
  { id: 'chain_20',      name: 'Chain Legend',     desc: 'Get a 20x chain',            icon: '⚡' },
  { id: 'level_10',      name: 'Veteran',          desc: 'Reach level 10',             icon: '🎖️' },
  { id: 'level_20',      name: 'Grandmaster',      desc: 'Reach level 20',             icon: '👑' },
  { id: 'boss_defeated', name: 'Bowser Slayer',   desc: 'Defeat Bowser',              icon: '🐉' },
  { id: 'all_items',     name: 'Item Collector',  desc: 'Collect every item type',    icon: '🎁' },
  { id: 'frenzy',        name: 'Golden Touch',    desc: 'Trigger a Golden Frenzy',    icon: '🌟' },
  { id: 'score_1000',    name: 'High Roller',     desc: 'Score 1,000+ in one session',icon: '🏆' },
];

export class AchievementSystem {
  constructor(saveManager, eventBus) {
    this.save = saveManager;
    this.bus = eventBus;
    this._sessionScore = 0;
  }

  setSessionScore(score) {
    this._sessionScore = score;
  }

  /** Check all achievements against current stats. Call after relevant events. */
  check() {
    const stats = {
      totalCollected: this.save.getTotalCoinsCollected(),
      maxChain: this.save.getMaxChain(),
      level: this.save.getLevel(),
      bossDefeated: !!this.save.get('bossDefeated'),
      uniqueItemsCollected: (this.save.getUniqueItemsCollected() || []).length,
      frenzyTriggered: this.save.getFrenzyTriggered(),
      sessionScore: this._sessionScore,
    };

    const unlocked = this.save.getAchievements();
    const newlyUnlocked = [];

    for (const ach of ACHIEVEMENTS) {
      if (unlocked[ach.id]) continue; // already unlocked

      let earned = false;
      switch (ach.id) {
        case 'first_coin':    earned = stats.totalCollected >= 1; break;
        case 'coin_100':      earned = stats.totalCollected >= 100; break;
        case 'coin_1000':     earned = stats.totalCollected >= 1000; break;
        case 'chain_5':       earned = stats.maxChain >= 5; break;
        case 'chain_20':      earned = stats.maxChain >= 20; break;
        case 'level_10':      earned = stats.level >= 10; break;
        case 'level_20':      earned = stats.level >= 20; break;
        case 'boss_defeated': earned = stats.bossDefeated; break;
        case 'all_items':     earned = stats.uniqueItemsCollected >= 7; break;
        case 'frenzy':        earned = stats.frenzyTriggered; break;
        case 'score_1000':    earned = stats.sessionScore >= 1000; break;
      }

      if (earned) {
        this.save.unlockAchievement(ach.id);
        newlyUnlocked.push(ach);
        this.bus.emit('achievement:unlock', ach);
      }
    }

    return newlyUnlocked;
  }

  getAll() {
    const unlocked = this.save.getAchievements();
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: !!unlocked[a.id],
      date: unlocked[a.id]?.date || null,
    }));
  }
}
