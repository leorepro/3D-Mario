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
  diamond_coin: '鑽石金幣',
  giant_bob_omb: '巨型炸彈兵',
};

const wheel = new LuckyWheel();

export function LuckyWheelOverlay({ visible, onClose, onPrize }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const hasAutoSpun = useRef(false);
  const claimBtnRef = useRef(null);

  // Reset state and auto-spin when overlay becomes visible
  useEffect(() => {
    if (visible) {
      setSpinning(false);
      setResult(null);
      setRotation(0);
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

  // Auto-click claim button after 2 seconds
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        claimBtnRef.current?.click();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const doSpin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    const prize = wheel.spin();
    const sliceAngle = 360 / prize.totalSlots;
    // +90 offset: pointer is on the right (3 o'clock) instead of top (12 o'clock)
    const targetAngle = 360 * 5 + (450 - prize.slotIndex * sliceAngle - sliceAngle / 2);

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
          {/* Arrow/pointer — right side, pointing left */}
          <div className="absolute right-0 top-1/2 translate-x-1 -translate-y-1/2 z-10"
               style={{ filter: 'drop-shadow(0 0 6px rgba(255,0,0,0.8)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
            <div className="w-0 h-0 border-t-[14px] border-b-[14px] border-r-[28px]
                            border-t-transparent border-b-transparent border-r-mario-red" />
          </div>

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
            {/* Slot labels — radial text from center outward */}
            {slots.map((slot, i) => {
              const sliceAngle = 360 / slots.length;
              // conic-gradient starts at 12 o'clock (top), CSS rotate(0) points right (3 o'clock)
              // offset by -90° to align
              const cssAngle = i * sliceAngle + sliceAngle / 2 - 90;
              const label = PRIZE_LABELS_ZH[slot.id] || slot.label;

              return (
                <div
                  key={i}
                  className="absolute font-bold text-white pointer-events-none"
                  style={{
                    left: '120px',
                    top: '120px',
                    transform: `rotate(${cssAngle}deg)`,
                    transformOrigin: '0 0',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '25px',
                      top: '-6px',
                      fontSize: '11px',
                      textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 5px rgba(0,0,0,0.5)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </div>
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

        {/* Claim button — auto-clicked after 2 seconds */}
        {result && (
          <button
            ref={claimBtnRef}
            onClick={onClose}
            className="bg-mario-green text-white px-6 py-2 rounded-xl font-bold
                       cursor-pointer hover:brightness-110 active:scale-95 transition-transform"
          >
            領取
          </button>
        )}
      </div>
    </div>
  );
}
