import { useEffect, useState } from 'react';

const ITEM_ICONS = {
  question_block: '\u2753',
  star: '\u2B50',
  mushroom: '\uD83C\uDF44',
  coin_tower: '\uD83C\uDFF0',
  fire_flower: '\uD83D\uDD25',
  green_pipe: '\uD83D\uDFE2',
  poison_mushroom: '\uD83D\uDC80',
};

const EFFECT_DESC = {
  random_reward: 'Random Reward!',
  score_multiplier: 'Score x3!',
  wider_pusher: 'Wide Pusher!',
  narrower_pusher: 'Narrow Pusher!',
  burst_coins: 'Coin Burst!',
  clear_row: 'Clear Row!',
  teleport_coins: 'Teleport!',
};

export function ItemPopup({ itemEvent }) {
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(null);

  useEffect(() => {
    if (!itemEvent) return;

    setDisplay({
      icon: ITEM_ICONS[itemEvent.itemType] || '\u2728',
      label: itemEvent.label,
      desc: EFFECT_DESC[itemEvent.effect?.type] || '',
    });
    setVisible(true);

    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [itemEvent]);

  if (!visible || !display) return null;

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div
        className="bg-black/80 rounded-xl px-4 py-2 text-center"
        style={{
          animation: 'itemPopIn 0.3s ease-out forwards',
        }}
      >
        <div className="text-2xl">{display.icon}</div>
        <div className="text-white font-bold text-sm">{display.label}</div>
        <div className="text-mario-yellow text-xs font-bold">{display.desc}</div>
      </div>
    </div>
  );
}
