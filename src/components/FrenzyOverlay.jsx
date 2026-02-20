import { useEffect, useState } from 'react';

export function FrenzyOverlay({ frenzyActive, frenzyEndTime, isMega }) {
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

  // Mega frenzy: rainbow/fire theme
  const borderShadow = isMega
    ? 'inset 0 0 60px rgba(255, 50, 50, 0.6), inset 0 0 120px rgba(255, 150, 0, 0.3)'
    : 'inset 0 0 40px rgba(251, 208, 0, 0.5)';
  const textShadow = isMega
    ? '0 0 20px #ff4500, 0 0 40px #ff6600, 0 0 60px #ff0000, 0 2px 4px rgba(0,0,0,0.8)'
    : '0 0 15px #fbd000, 0 0 30px #fbd000, 0 2px 4px rgba(0,0,0,0.8)';
  const label = isMega ? '\u{1F31F} \u8D85\u7D1A\u72C2\u71B1\uFF01' : '\u{1F525} \u9EC3\u91D1\u72C2\u71B1\uFF01';
  const textColor = isMega ? 'text-red-400' : 'text-mario-yellow';

  return (
    <div className="absolute inset-0 pointer-events-none z-15">
      {/* Pulsing border */}
      <div
        className="absolute inset-0 rounded-none"
        style={{
          boxShadow: borderShadow,
          animation: 'frenzyPulse 0.5s ease-in-out infinite alternate',
        }}
      />

      <div className="absolute top-16 left-1/2 -translate-x-1/2">
        <div
          className={`font-black ${isMega ? 'text-2xl' : 'text-xl'} ${textColor}`}
          style={{
            textShadow,
            animation: 'frenzyText 0.3s ease-in-out infinite alternate',
          }}
        >
          {label}{secs}秒
        </div>
      </div>
    </div>
  );
}
