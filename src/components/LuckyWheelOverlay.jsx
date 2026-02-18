import { useState, useCallback } from 'react';
import { LuckyWheel, WHEEL_PRIZES } from '../game/LuckyWheel.js';

const SLICE_COLORS = [
  '#e52521', '#fbd000', '#049cd8', '#43b047',
  '#ff6600', '#9b59b6', '#ffc107', '#00bcd4',
];

const wheel = new LuckyWheel();

export function LuckyWheelOverlay({ visible, onClose, onPrize }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);

  const spin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    const prize = wheel.spin();
    const sliceAngle = 360 / prize.totalSlots;
    const targetAngle = 360 * 5 + (360 - prize.slotIndex * sliceAngle - sliceAngle / 2);

    setRotation(prev => prev + targetAngle);

    setTimeout(() => {
      setSpinning(false);
      setResult(prize);
      onPrize?.(prize.prize);
    }, 3500);
  }, [spinning, onPrize]);

  if (!visible) return null;

  const slots = WHEEL_PRIZES;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 rounded-2xl p-4 w-[320px] text-center">
        <h2 className="text-mario-yellow font-black text-lg mb-3">
          LUCKY WHEEL!
        </h2>

        {/* Wheel */}
        <div className="relative w-[240px] h-[240px] mx-auto mb-3">
          {/* Arrow/pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10
                          w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px]
                          border-l-transparent border-r-transparent border-t-mario-red" />

          {/* Spinning wheel */}
          <div
            className="w-full h-full rounded-full overflow-hidden border-4 border-mario-yellow"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 3.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              background: `conic-gradient(${slots.map((s, i) =>
                `${SLICE_COLORS[i % SLICE_COLORS.length]} ${(i / slots.length) * 100}% ${((i + 1) / slots.length) * 100}%`
              ).join(', ')})`,
            }}
          >
            {/* Slot labels */}
            {slots.map((slot, i) => {
              const angle = (i + 0.5) * (360 / slots.length);
              return (
                <div
                  key={i}
                  className="absolute text-[10px] font-bold text-white"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${angle}deg) translate(0, -80px) rotate(-${angle}deg)`,
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    transformOrigin: '0 0',
                    whiteSpace: 'nowrap',
                    marginLeft: '-20px',
                    marginTop: '-6px',
                  }}
                >
                  {slot.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-black/50 rounded-lg px-3 py-2 mb-3 animate-bounce">
            <div className="text-white font-bold text-sm">You won:</div>
            <div className="text-mario-yellow font-black text-base">{result.prize.label}</div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 justify-center">
          {!spinning && !result && (
            <button
              onClick={spin}
              className="bg-mario-red text-white px-6 py-2 rounded-xl font-bold
                         cursor-pointer hover:brightness-110 active:scale-95 transition-transform"
            >
              SPIN!
            </button>
          )}
          {result && (
            <button
              onClick={onClose}
              className="bg-mario-green text-white px-6 py-2 rounded-xl font-bold
                         cursor-pointer hover:brightness-110 active:scale-95 transition-transform"
            >
              COLLECT
            </button>
          )}
          {!spinning && !result && (
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-xl font-bold text-sm
                         cursor-pointer hover:brightness-110"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
