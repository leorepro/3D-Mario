import { useState, useEffect } from 'react';

export function ThwompPopup({ thwompEvent }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (thwompEvent) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [thwompEvent]);

  if (!visible || !thwompEvent) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="bg-black/70 rounded-xl px-4 py-2 text-center animate-bounce">
        {thwompEvent.phase === 'warning' ? (
          <div className="text-yellow-400 font-black text-sm animate-pulse">
            小心上方！⚠️
          </div>
        ) : thwompEvent.phase === 'slam' ? (
          <div className="text-red-500 font-black text-sm">
            咚咚砸下來了！🪨💥
          </div>
        ) : null}
      </div>
    </div>
  );
}
