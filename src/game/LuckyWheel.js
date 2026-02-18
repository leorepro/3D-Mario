/**
 * LuckyWheel — Triggers every 30 coins invested. Weighted random prizes.
 */
export const WHEEL_PRIZES = [
  { id: 'coins_10',   label: '10 Coins',       weight: 30, reward: { coins: 10 },           color: '#ffc107' },
  { id: 'coins_25',   label: '25 Coins',       weight: 20, reward: { coins: 25 },           color: '#ff9800' },
  { id: 'coins_50',   label: '50 Coins',       weight: 8,  reward: { coins: 50 },           color: '#e52521' },
  { id: 'star_item',  label: 'Super Star',     weight: 12, reward: { spawnItem: 'star' },   color: '#fbd000' },
  { id: 'mushroom',   label: 'Mushroom',       weight: 12, reward: { spawnItem: 'mushroom' },color: '#43b047' },
  { id: 'fire',       label: 'Fire Flower',    weight: 5,  reward: { spawnItem: 'fire_flower' }, color: '#ff4500' },
  { id: 'frenzy',     label: 'FRENZY!',        weight: 3,  reward: { frenzy: true },         color: '#e52521' },
  { id: 'nothing',    label: 'Try Again',      weight: 10, reward: { coins: 1 },             color: '#888888' },
];

export const WHEEL_TRIGGER_INTERVAL = 30; // Every 30 coins dropped

export class LuckyWheel {
  spin() {
    const totalWeight = WHEEL_PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * totalWeight;

    for (let i = 0; i < WHEEL_PRIZES.length; i++) {
      roll -= WHEEL_PRIZES[i].weight;
      if (roll <= 0) {
        return { prize: WHEEL_PRIZES[i], slotIndex: i, totalSlots: WHEEL_PRIZES.length };
      }
    }

    // Fallback
    return { prize: WHEEL_PRIZES[WHEEL_PRIZES.length - 1], slotIndex: WHEEL_PRIZES.length - 1, totalSlots: WHEEL_PRIZES.length };
  }
}
