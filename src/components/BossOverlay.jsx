import { useEffect, useState } from 'react';

export function BossOverlay({ bossActive, bossHP, bossMaxHP, onAbort }) {
  const [flash, setFlash] = useState(false);
  const [prevHP, setPrevHP] = useState(bossHP);

  useEffect(() => {
    if (bossHP < prevHP) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 200);
      setPrevHP(bossHP);
      return () => clearTimeout(timer);
    }
    setPrevHP(bossHP);
  }, [bossHP]);

  if (!bossActive) return null;

  const hpPct = Math.max(0, (bossHP / bossMaxHP) * 100);
  const hpColor = hpPct > 50 ? '#43b047' : hpPct > 25 ? '#fbd000' : '#e52521';

  return (
    <div className="absolute top-1 left-0 right-0 z-20 pointer-events-none">
      <div className="mx-2 bg-black/80 rounded-lg px-3 py-1.5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <span className="text-base">🐢</span>
            <span className="text-white font-bold text-xs">庫巴 BOSS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-mono">
              {bossHP}/{bossMaxHP} HP
            </span>
            <button
              onClick={onAbort}
              className="pointer-events-auto text-red-400 text-[10px] font-bold px-1.5 py-0.5
                         bg-red-900/40 rounded hover:bg-red-900/60 cursor-pointer"
            >
              逃跑
            </button>
          </div>
        </div>
        <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${hpPct}%`,
              backgroundColor: hpColor,
              boxShadow: flash ? '0 0 10px rgba(255,0,0,0.8)' : 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}
