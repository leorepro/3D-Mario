import { useEffect, useState } from 'react';

const UNLOCK_NAMES = {
  question_block: '? 問號磚塊',
  star: '超級星星',
  mushroom: '超級蘑菇',
  poison_mushroom: '毒蘑菇',
  coin_tower: '金幣塔',
  fire_flower: '火焰花',
  green_pipe: '綠色水管',
  underground_scene: '地下場景',
  castle_scene: '城堡場景',
  boss_mode: '魔王模式',
  underwater_scene: '水中場景',
  custom_pusher: '自訂推板',
};

export function LevelUpPopup({ levelEvent }) {
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(null);

  useEffect(() => {
    if (!levelEvent) return;

    setDisplay({
      level: levelEvent.newLevel,
      unlocks: (levelEvent.unlockedItems || []).map(id => UNLOCK_NAMES[id] || id),
    });
    setVisible(true);

    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [levelEvent]);

  if (!visible || !display) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
      <div
        className="text-center"
        style={{ animation: 'levelUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
      >
        <div className="text-5xl mb-1">⭐</div>
        <div
          className="font-black text-3xl text-mario-yellow"
          style={{ textShadow: '0 0 20px #fbd000, 0 2px 4px rgba(0,0,0,0.8)' }}
        >
          升級了！
        </div>
        <div
          className="font-bold text-xl text-white mt-1"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
          等級 {display.level}
        </div>
        {display.unlocks.length > 0 && (
          <div className="mt-2 bg-black/60 rounded-lg px-3 py-1">
            <div className="text-mario-green text-xs font-bold">解鎖：</div>
            <div className="text-white text-xs">
              {display.unlocks.join('、')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
