import { useEffect, useState } from 'react';

const EFFECT_ICONS = {
  score_multiplier: { icon: '⭐', label: '星星加成', color: '#fbd000' },
  wider_pusher: { icon: '🍄', label: '推板加寬', color: '#43b047' },
  frenzy_speed: { icon: '🔥', label: '狂熱加速', color: '#ff4500' },
  magnet: { icon: '🧲', label: '磁鐵吸引', color: '#4444ff' },
};

export function ActiveEffects({ engineRef }) {
  const [effects, setEffects] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (engineRef?.current) {
        const active = engineRef.current.getActiveEffects();
        setEffects(active);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [engineRef]);

  if (effects.length === 0) return null;

  return (
    <div className="absolute top-12 left-2 z-10 flex flex-col gap-1">
      {effects.map((e, i) => {
        const info = EFFECT_ICONS[e.type] || { icon: '✨', label: e.type, color: '#fff' };
        const pct = Math.max(0, e.remaining / e.duration);
        const secs = Math.ceil(e.remaining / 1000);
        return (
          <div
            key={e.type + i}
            className="flex items-center gap-1.5 bg-black/70 rounded-lg px-2 py-1"
          >
            <span className="text-base">{info.icon}</span>
            <div className="flex-1 min-w-[60px]">
              <div className="text-[10px] font-bold" style={{ color: info.color }}>
                {info.label}
              </div>
              <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct * 100}%`,
                    backgroundColor: info.color,
                  }}
                />
              </div>
            </div>
            <span className="text-white text-xs font-mono">{secs}秒</span>
          </div>
        );
      })}
    </div>
  );
}
