import { ShareButton } from './ShareButton.jsx';
import { COIN_SIZES } from '../game/constants.js';

export function ActionBar({
  coinBalance, onDrop, autoDropping, onToggleAutoDrop,
  audioEnabled, onToggleAudio,
  onOpenSettings, onOpenLeaderboard,
  canBoss, onStartBoss, bossActive,
  score, level,
  coinSize = 'small', onToggleCoinSize,
}) {
  const dropCost = (COIN_SIZES[coinSize] || COIN_SIZES.small).dropCost;
  const canDrop = coinBalance >= dropCost;

  return (
    <div className="flex justify-center items-center gap-1.5 px-2 py-2.5 bg-black/80"
         style={{ width: 390 }}>

      {/* Coin size toggle — replaces old coin balance display */}
      <button
        onClick={() => onToggleCoinSize?.(coinSize === 'small' ? 'large' : 'small')}
        className={`px-2.5 py-2 rounded-xl font-bold text-xs
                   active:scale-95 transition-all cursor-pointer shadow-lg
                   ${coinSize === 'large'
                     ? 'bg-mario-yellow text-black ring-2 ring-white/50'
                     : 'bg-white/10 text-white hover:bg-white/20'
                   }`}
        title={coinSize === 'small' ? '切換大金幣（花費5）' : '切換小金幣（花費1）'}
      >
        {coinSize === 'large' ? '\uD83E\uDE99\xD75' : '\uD83E\uDE99\xD71'}
      </button>

      <button
        onClick={onDrop}
        disabled={!canDrop}
        className="bg-mario-red text-white px-4 py-2 rounded-xl font-bold text-sm
                   disabled:opacity-40 disabled:cursor-not-allowed
                   active:scale-95 transition-transform cursor-pointer
                   shadow-lg hover:brightness-110"
      >
        {'\uD83C\uDFAF'} 投幣
      </button>

      <button
        onClick={onToggleAutoDrop}
        disabled={!canDrop && !autoDropping}
        className={`px-2.5 py-2 rounded-xl font-bold text-xs
                   disabled:opacity-40 disabled:cursor-not-allowed
                   active:scale-95 transition-all cursor-pointer
                   shadow-lg ${
                     autoDropping
                       ? 'bg-mario-yellow text-black animate-pulse'
                       : 'bg-emerald-600 text-white hover:brightness-110'
                   }`}
      >
        {autoDropping ? '\u23F8 停止' : '\uD83D\uDD04 自動'}
      </button>

      {/* Boss button (when unlocked & available) */}
      {canBoss && !bossActive && (
        <button
          onClick={onStartBoss}
          className="px-2 py-2 rounded-xl text-sm cursor-pointer
                     active:scale-95 transition-transform bg-red-800 hover:bg-red-700
                     text-white font-bold"
          title="挑戰庫巴！"
        >
          {'\uD83D\uDC22'}
        </button>
      )}

      <button
        onClick={onToggleAudio}
        className="px-2 py-2 rounded-xl text-base cursor-pointer
                   active:scale-95 transition-transform bg-white/10 hover:bg-white/20"
        title={audioEnabled ? '靜音' : '開啟聲音'}
      >
        {audioEnabled ? '\uD83D\uDD0A' : '\uD83D\uDD07'}
      </button>

      <button
        onClick={onOpenSettings}
        className="px-2 py-2 rounded-xl text-base cursor-pointer
                   active:scale-95 transition-transform bg-white/10 hover:bg-white/20"
        title="設定"
      >
        {'\u2699\uFE0F'}
      </button>

      <button
        onClick={onOpenLeaderboard}
        className="px-2 py-2 rounded-xl text-base cursor-pointer
                   active:scale-95 transition-transform bg-white/10 hover:bg-white/20"
        title="排行榜"
      >
        {'\uD83C\uDFC6'}
      </button>

      <ShareButton score={score} level={level} />
    </div>
  );
}
