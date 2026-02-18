import { useEffect, useState } from 'react';

const ITEM_INFO = {
  question_block: { icon: '❓', name: '? 問號磚塊' },
  star: { icon: '⭐', name: '超級星星' },
  mushroom: { icon: '🍄', name: '超級蘑菇' },
  coin_tower: { icon: '🏰', name: '金幣塔' },
  fire_flower: { icon: '🔥', name: '火焰花' },
  green_pipe: { icon: '🟢', name: '綠色水管' },
  poison_mushroom: { icon: '💀', name: '毒蘑菇' },
};

const EFFECT_DESC = {
  random_reward: '隨機獎勵！',
  score_multiplier: '得分 ×3！',
  wider_pusher: '推板加寬！',
  narrower_pusher: '推板變窄！',
  burst_coins: '金幣噴發！',
  clear_row: '清除前排！',
  teleport_coins: '傳送金幣！',
};

export function ItemPopup({ itemEvent }) {
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(null);

  useEffect(() => {
    if (!itemEvent) return;

    const info = ITEM_INFO[itemEvent.itemType] || { icon: '✨', name: itemEvent.label };
    setDisplay({
      icon: info.icon,
      label: info.name,
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
