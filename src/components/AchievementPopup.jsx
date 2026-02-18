import { useEffect, useState } from 'react';

const ACH_NAMES = {
  first_coin: { name: '第一枚金幣', desc: '收集你的第一枚金幣' },
  coin_100: { name: '金幣收藏家', desc: '收集 100 枚金幣' },
  coin_1000: { name: '金幣大亨', desc: '收集 1,000 枚金幣' },
  chain_5: { name: '連擊新手', desc: '達成 5 連擊' },
  chain_20: { name: '連擊傳說', desc: '達成 20 連擊' },
  level_10: { name: '老手', desc: '達到等級 10' },
  level_20: { name: '大師', desc: '達到等級 20' },
  boss_defeated: { name: '庫巴殺手', desc: '擊敗庫巴' },
  all_items: { name: '收集大師', desc: '收集所有道具種類' },
  frenzy: { name: '黃金之手', desc: '觸發黃金狂熱' },
  score_1000: { name: '高分玩家', desc: '單局得分超過 1,000' },
};

export function AchievementPopup({ achievementEvent }) {
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(null);

  useEffect(() => {
    if (!achievementEvent) return;

    const info = ACH_NAMES[achievementEvent.id] || {
      name: achievementEvent.name,
      desc: achievementEvent.desc,
    };
    setDisplay({
      id: achievementEvent.id,
      label: info.name,
      description: info.desc,
    });
    setVisible(true);

    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, [achievementEvent]);

  if (!visible || !display) return null;

  return (
    <div
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
      style={{ animation: 'achievementSlide 0.4s ease-out forwards' }}
    >
      <div className="bg-gradient-to-r from-yellow-900/90 to-yellow-800/90 rounded-xl px-4 py-2.5
                      border border-mario-yellow/50 shadow-lg flex items-center gap-3">
        <div className="text-3xl">🏆</div>
        <div>
          <div className="text-mario-yellow font-black text-sm">成就解鎖！</div>
          <div className="text-white font-bold text-xs">{display.label}</div>
          <div className="text-gray-300 text-[10px]">{display.description}</div>
        </div>
      </div>
    </div>
  );
}
