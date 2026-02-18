/**
 * DailyReward — +20 coins on first daily open.
 */
export class DailyReward {
  constructor(saveManager) {
    this.save = saveManager;
  }

  checkAndClaim() {
    const last = this.save.getLastDailyRewardDate();
    const today = new Date().toDateString();
    if (last !== today) {
      this.save.setLastDailyRewardDate(today);
      return { claimed: true, coins: 20 };
    }
    return { claimed: false, coins: 0 };
  }
}
