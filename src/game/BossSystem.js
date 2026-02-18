/**
 * BossSystem — Bowser boss fight (Lv.15+, 24hr cooldown).
 * Coins falling off back wall deal 1 damage. Items deal bonus. 100 HP.
 */
export class BossSystem {
  constructor(eventBus, saveManager) {
    this.bus = eventBus;
    this.save = saveManager;
    this.active = false;
    this.hp = 0;
    this.maxHp = 100;
    this.lastAttackTime = 0;
    this.attackInterval = 5000; // 5 seconds
  }

  canStart() {
    const last = this.save.getBossLastDefeated();
    if (!last) return true;
    const elapsed = Date.now() - new Date(last).getTime();
    return elapsed >= 24 * 60 * 60 * 1000;
  }

  start() {
    this.active = true;
    this.hp = this.maxHp;
    this.lastAttackTime = Date.now();
    this.bus.emit('boss:start', { hp: this.hp, maxHp: this.maxHp });
  }

  /** Called when a coin or item falls off the back wall (Z < -TABLE_DEPTH/2) */
  onObjectLostBack(type) {
    if (!this.active) return;
    let damage = 1;
    if (type === 'star') damage = 10;
    else if (type === 'fire_flower') damage = 20;
    else if (type === 'mushroom') damage = 5;
    else if (type === 'coin') damage = 1;

    this.hp = Math.max(0, this.hp - damage);
    this.bus.emit('boss:damaged', { damage, hpRemaining: this.hp, maxHp: this.maxHp });

    if (this.hp <= 0) {
      this.defeat();
    }
  }

  /** Check if boss should attack (spawn obstacles). Called each frame. */
  update() {
    if (!this.active) return null;

    const now = Date.now();
    if (now - this.lastAttackTime >= this.attackInterval) {
      this.lastAttackTime = now;
      this.bus.emit('boss:attack');
      return 'attack';
    }
    return null;
  }

  defeat() {
    this.active = false;
    this.save.setBossLastDefeated(new Date().toISOString());
    this.bus.emit('boss:defeated', { reward: 100 });
  }

  isActive() { return this.active; }
  getHP() { return this.hp; }
  getMaxHP() { return this.maxHp; }

  abort() {
    this.active = false;
    this.hp = 0;
  }
}
