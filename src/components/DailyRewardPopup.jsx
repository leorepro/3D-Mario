import { useEffect, useState } from 'react';

export function DailyRewardPopup({ reward, onClaim }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reward && reward.claimed) {
      setVisible(true);
    }
  }, [reward]);

  if (!visible || !reward) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className="bg-gray-900 rounded-2xl p-5 w-[280px] text-center"
        style={{ animation: 'levelUp 0.5s ease-out forwards' }}
      >
        <div className="text-4xl mb-2">{'\uD83C\uDF81'}</div>
        <h2 className="text-mario-yellow font-black text-xl mb-1">
          Daily Reward!
        </h2>
        <p className="text-gray-300 text-sm mb-3">
          Welcome back! Here&apos;s your daily bonus.
        </p>
        <div className="bg-black/40 rounded-lg px-4 py-2 mb-4">
          <span className="text-coin-gold font-black text-2xl">
            +{reward.coins} {'\uD83E\uDE99'}
          </span>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            onClaim?.();
          }}
          className="bg-mario-green text-white px-6 py-2.5 rounded-xl font-bold
                     cursor-pointer hover:brightness-110 active:scale-95 transition-transform"
        >
          CLAIM
        </button>
      </div>
    </div>
  );
}
