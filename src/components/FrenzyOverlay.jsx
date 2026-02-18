import { useEffect, useState } from 'react';

export function FrenzyOverlay({ frenzyActive, frenzyEndTime }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!frenzyActive) {
      setRemaining(0);
      return;
    }

    const tick = () => {
      const r = Math.max(0, frenzyEndTime - Date.now());
      setRemaining(r);
    };
    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [frenzyActive, frenzyEndTime]);

  if (!frenzyActive) return null;

  const secs = Math.ceil(remaining / 1000);

  return (
    <div className="absolute inset-0 pointer-events-none z-15">
      {/* Pulsing golden border */}
      <div
        className="absolute inset-0 rounded-none"
        style={{
          boxShadow: 'inset 0 0 40px rgba(251, 208, 0, 0.5)',
          animation: 'frenzyPulse 0.5s ease-in-out infinite alternate',
        }}
      />

      <div className="absolute top-16 left-1/2 -translate-x-1/2">
        <div
          className="font-black text-xl text-mario-yellow"
          style={{
            textShadow: '0 0 15px #fbd000, 0 0 30px #fbd000, 0 2px 4px rgba(0,0,0,0.8)',
            animation: 'frenzyText 0.3s ease-in-out infinite alternate',
          }}
        >
          🔥 黃金狂熱！{secs}秒
        </div>
      </div>
    </div>
  );
}
