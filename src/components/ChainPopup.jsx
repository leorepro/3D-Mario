import { useEffect, useState } from 'react';

/**
 * ChainPopup — shows animated "Nice!", "Great!", "Amazing!", "SUPER MARIO!"
 * when a chain tier is reached. Auto-fades after display.
 */
export function ChainPopup({ chainEvent }) {
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(null); // { label, color, chain, multiplier }

  useEffect(() => {
    if (!chainEvent?.tier) return;

    setDisplay({
      label: chainEvent.tier.label,
      color: chainEvent.tier.color,
      chain: chainEvent.chain,
      multiplier: chainEvent.multiplier,
    });
    setVisible(true);

    const timer = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, [chainEvent]);

  if (!visible || !display) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
      <div
        className="text-center animate-bounce"
        style={{ animationDuration: '0.5s' }}
      >
        {/* Main label */}
        <div
          className="font-black text-4xl drop-shadow-lg"
          style={{
            color: display.color,
            textShadow: `0 0 20px ${display.color}, 0 2px 4px rgba(0,0,0,0.8)`,
            animation: 'chainPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          }}
        >
          {display.label}
        </div>

        {/* Chain count + multiplier */}
        <div className="mt-1 flex items-center justify-center gap-2">
          <span
            className="font-bold text-lg"
            style={{
              color: display.color,
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            }}
          >
            {display.chain} 連擊
          </span>
          <span
            className="bg-black/60 text-white font-bold px-2 py-0.5 rounded text-sm"
          >
            x{display.multiplier}
          </span>
        </div>
      </div>
    </div>
  );
}
