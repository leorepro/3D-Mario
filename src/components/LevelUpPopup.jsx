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
  bob_omb_spawn: '炸彈兵自然生成',
  magnet_mushroom_spawn: '磁鐵蘑菇自然生成',
  diamond_coin: '鑽石金幣',
  giant_bob_omb: '巨型炸彈兵',
  thwomp_event: '咚咚事件',
  low_gravity_mode: '低重力模式',
  dual_pusher: '雙推板',
  boss_rush: '魔王連戰',
  mega_frenzy: '超級狂熱',
  golden_pusher: '黃金推板',
  starry_night_scene: '星空場景',
  lava_castle_scene: '岩漿城堡場景',
  rainbow_road_scene: '彩虹跑道場景',
  space_scene: '太空場景',
};

export function LevelUpPopup({ levelEvent }) {
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(null);

  useEffect(() => {
    if (!levelEvent) return;

    setDisplay({
      level: levelEvent.newLevel,
      unlocks: (levelEvent.unlockedItems || [])
        .filter(id => !id.startsWith('coin_reward_'))
        .map(id => UNLOCK_NAMES[id] || id),
      coinReward: levelEvent.coinReward || 0,
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
        {display.coinReward > 0 && (
          <div className="mt-2 bg-black/60 rounded-lg px-3 py-1">
            <div className="text-mario-yellow text-sm font-black">
              +{display.coinReward} 金幣
            </div>
          </div>
        )}
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
