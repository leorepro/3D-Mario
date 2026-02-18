/**
 * SaveManager — localStorage persistence for game state.
 */
const STORAGE_KEY = 'mario-coin-pusher-save';

const DEFAULT_SAVE = {
  version: 1,
  xp: 0,
  level: 1,
  totalCoinsCollected: 0,
  totalCoinsDropped: 0,
  maxChain: 0,
  lastDailyRewardDate: null,
  currentScene: 'overworld',
  achievements: {},
  settings: { volume: 0.5, haptic: true },
  leaderboard: [],
  bossLastDefeated: null,
  bossDefeated: false,
  uniqueItemsCollected: [],
  frenzyTriggered: false,
  highScore: 0,
};

export class SaveManager {
  constructor() {
    this._data = this._load();
    this._saveTimer = null;
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_SAVE, ...parsed };
      }
    } catch { /* ignore */ }
    return { ...DEFAULT_SAVE };
  }

  _scheduleSave() {
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
      } catch { /* storage full — ignore */ }
    }, 1000);
  }

  get(key) { return this._data[key]; }

  set(key, value) {
    this._data[key] = value;
    this._scheduleSave();
  }

  update(fn) {
    fn(this._data);
    this._scheduleSave();
  }

  // ── Convenience getters/setters ──

  getLevel() { return this._data.level; }
  setLevel(v) { this.set('level', v); }

  getXP() { return this._data.xp; }
  setXP(v) { this.set('xp', v); }

  getTotalCoinsCollected() { return this._data.totalCoinsCollected; }
  addCoinsCollected(n = 1) { this.set('totalCoinsCollected', this._data.totalCoinsCollected + n); }

  getTotalCoinsDropped() { return this._data.totalCoinsDropped; }
  addCoinsDropped(n = 1) { this.set('totalCoinsDropped', this._data.totalCoinsDropped + n); }

  getMaxChain() { return this._data.maxChain; }
  setMaxChain(v) { if (v > this._data.maxChain) this.set('maxChain', v); }

  getLastDailyRewardDate() { return this._data.lastDailyRewardDate; }
  setLastDailyRewardDate(v) { this.set('lastDailyRewardDate', v); }

  getCurrentScene() { return this._data.currentScene; }
  setCurrentScene(v) { this.set('currentScene', v); }

  getSettings() { return this._data.settings; }
  setSettings(v) { this.set('settings', v); }

  getAchievements() { return this._data.achievements; }
  unlockAchievement(id) {
    this._data.achievements[id] = { unlocked: true, date: new Date().toISOString() };
    this._scheduleSave();
  }

  getLeaderboard() { return this._data.leaderboard || []; }
  addLeaderboardEntry(entry) {
    this._data.leaderboard.push(entry);
    this._data.leaderboard.sort((a, b) => b.score - a.score);
    this._data.leaderboard = this._data.leaderboard.slice(0, 10);
    this._scheduleSave();
  }

  getHighScore() { return this._data.highScore || 0; }
  setHighScore(v) { if (v > (this._data.highScore || 0)) this.set('highScore', v); }

  getBossLastDefeated() { return this._data.bossLastDefeated; }
  setBossLastDefeated(v) { this.set('bossLastDefeated', v); this.set('bossDefeated', true); }

  getUniqueItemsCollected() { return this._data.uniqueItemsCollected || []; }
  addUniqueItem(itemType) {
    if (!this._data.uniqueItemsCollected.includes(itemType)) {
      this._data.uniqueItemsCollected.push(itemType);
      this._scheduleSave();
    }
  }

  setFrenzyTriggered() { this.set('frenzyTriggered', true); }
  getFrenzyTriggered() { return this._data.frenzyTriggered; }

  reset() {
    this._data = { ...DEFAULT_SAVE };
    this._scheduleSave();
  }

  flush() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
    } catch { /* ignore */ }
  }
}
