import { useEffect, useState } from 'react';

export function AchievementPopup({ achievementEvent }) {
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(null);

  useEffect(() => {
    if (!achievementEvent) return;

    setDisplay({
      id: achievementEvent.id,
      label: achievementEvent.label,
      description: achievementEvent.description,
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
        <div className="text-3xl">{'\uD83C\uDFC6'}</div>
        <div>
          <div className="text-mario-yellow font-black text-sm">Achievement!</div>
          <div className="text-white font-bold text-xs">{display.label}</div>
          <div className="text-gray-300 text-[10px]">{display.description}</div>
        </div>
      </div>
    </div>
  );
}
