import { useState, useCallback, useEffect, useRef } from 'react';
import { LuckyWheel, WHEEL_PRIZES } from '../game/LuckyWheel.js';

const SLICE_COLORS = [
  '#e52521', '#fbd000', '#049cd8', '#43b047',
  '#ff6600', '#9b59b6', '#ffc107', '#00bcd4',
];

const PRIZE_LABELS_ZH = {
  bob_omb: '炸彈兵',
  magnet: '磁鐵蘑菇',
  coins_50: '50 金幣',
  star_item: '超級星星',
  mushroom: '蘑菇',
  fire: '火焰花',
  frenzy: '狂熱！',
  coin_pipe: '金幣雨管道',
};

const wheel = new LuckyWheel();

export function LuckyWheelOverlay({ visible, onClose, onPrize }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const hasAutoSpun = useRef(false);

  // Reset state and auto-spin when overlay becomes visible
  useEffect(() => {
    if (visible) {
      setSpinning(false);
      setResult(null);
      setRotation(0);  // Reset wheel to slot-0 position so visual always matches result
      hasAutoSpun.current = false;
    }
  }, [visible]);

  // Auto-spin after a brief delay (let wheel render at reset position first)
  useEffect(() => {
    if (visible && !spinning && !result && !hasAutoSpun.current) {
      const timer = setTimeout(() => {
        if (!hasAutoSpun.current) {
          hasAutoSpun.current = true;
          doSpin();
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [visible, spinning, result]);

  // Auto-close 2 seconds after result appears
  useEffect(() => {
    if (result && visible) {
      const timer = setTimeout(() => onClose?.(), 2000);
      return () => clearTimeout(timer);
    }
  }, [result, visible, onClose]);

  const doSpin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    const prize = wheel.spin();
    const sliceAngle = 360 / prize.totalSlots;
    const targetAngle = 360 * 5 + (360 - prize.slotIndex * sliceAngle - sliceAngle / 2);

    // Use requestAnimationFrame to ensure the reset position renders first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRotation(prev => prev + targetAngle);
      });
    });

    setTimeout(() => {
      setSpinning(false);
      setResult(prize);
      onPrize?.(prize.prize);
    }, 4000);
  }, [spinning, onPrize]);

  if (!visible) return null;

  const slots = WHEEL_PRIZES;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 rounded-2xl p-4 w-[320px] text-center">
        <h2 className="text-mario-yellow font-black text-lg mb-3">
          🎰 幸運轉盤！
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
              transition: spinning ? 'transform 3.8s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              background: `conic-gradient(${slots.map((s, i) =>
                `${SLICE_COLORS[i % SLICE_COLORS.length]} ${(i / slots.length) * 100}% ${((i + 1) / slots.length) * 100}%`
              ).join(', ')})`,
            }}
          >
            {/* Slot labels */}
            {slots.map((slot, i) => {
              const sliceAngle = 360 / slots.length;
              const midAngle = i * sliceAngle + sliceAngle / 2;
              const radius = 70;
              const rad = ((midAngle - 90) * Math.PI) / 180;
              const x = 120 + Math.cos(rad) * radius;
              const y = 120 + Math.sin(rad) * radius;
              const label = PRIZE_LABELS_ZH[slot.id] || slot.label;
              const textRotation = midAngle;

              return (
                <div
                  key={i}
                  className="absolute font-bold text-white pointer-events-none"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    fontSize: '13px',
                    transform: `translate(-50%, -50%) rotate(${textRotation}deg)`,
                    textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 5px rgba(0,0,0,0.5)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Spinning indicator */}
        {spinning && (
          <div className="text-white font-bold text-sm mb-3 animate-pulse">
            轉盤旋轉中...
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-black/50 rounded-lg px-3 py-2 mb-3 animate-bounce">
            <div className="text-white font-bold text-sm">恭喜獲得：</div>
            <div className="text-mario-yellow font-black text-base">
              {PRIZE_LABELS_ZH[result.prize.id] || result.prize.label}
            </div>
          </div>
        )}

        {/* Auto-close countdown hint */}
        {result && (
          <div className="text-gray-400 text-xs mt-1 animate-pulse">自動領取中...</div>
        )}
      </div>
    </div>
  );
}
