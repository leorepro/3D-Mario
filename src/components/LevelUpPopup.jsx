import { useEffect, useState } from 'react';

export function LevelUpPopup({ levelEvent }) {
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(null);

  useEffect(() => {
    if (!levelEvent) return;

    setDisplay({
      level: levelEvent.newLevel,
      unlocks: levelEvent.unlockedItems || [],
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
        <div className="text-5xl mb-1">\u2B50</div>
        <div
          className="font-black text-3xl text-mario-yellow"
          style={{ textShadow: '0 0 20px #fbd000, 0 2px 4px rgba(0,0,0,0.8)' }}
        >
          LEVEL UP!
        </div>
        <div
          className="font-bold text-xl text-white mt-1"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
          Level {display.level}
        </div>
        {display.unlocks.length > 0 && (
          <div className="mt-2 bg-black/60 rounded-lg px-3 py-1">
            <div className="text-mario-green text-xs font-bold">Unlocked:</div>
            <div className="text-white text-xs">
              {display.unlocks.join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
