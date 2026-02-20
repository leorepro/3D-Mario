import { ShareButton } from './ShareButton.jsx';
import { COIN_SIZES } from '../game/constants.js';

export function ActionBar({
  coinBalance, onDrop, autoDropping, onToggleAutoDrop,
  audioMode = 'all', onToggleAudio,
  onOpenSettings, onOpenLeaderboard,
  canBoss, onStartBoss, bossActive,
  canBossRush, onStartBossRush,
  score, level,
  coinSize = 'small', onToggleCoinSize,
}) {
  const dropCost = (COIN_SIZES[coinSize] || COIN_SIZES.small).dropCost;
  const canDrop = coinBalance >= dropCost;

  return (
    <div className="flex justify-center items-center gap-1.5 px-2 py-2.5 bg-black/80"
         style={{ width: 390 }}>

      {/* Coin size toggle button */}
      <button
        onClick={() => onToggleCoinSize?.(coinSize === 'small' ? 'large' : 'small')}
        className={`px-2 py-2 rounded-xl text-base cursor-pointer
                   active:scale-95 transition-all shadow-lg border-2
                   ${coinSize === 'large'
                     ? 'bg-mario-yellow text-black border-yellow-300'
                     : 'bg-white/15 text-white border-white/20 hover:bg-white/25'
                   }`}
        title={coinSize === 'small' ? '切換大金幣（花費5）' : '切換小金幣（花費1）'}
      >
        {coinSize === 'large' ? '\uD83D\uDD36' : '\uD83D\uDD38'}
      </button>

      <button
        onClick={onDrop}
        disabled={!canDrop}
        className="bg-mario-red text-white px-4 py-2 rounded-xl text-xl
                   disabled:opacity-40 disabled:cursor-not-allowed
                   active:scale-95 transition-transform cursor-pointer
                   shadow-lg hover:brightness-110"
        title="投幣"
      >
        {'\u2B07\uFE0F'}
      </button>

      <button
        onClick={onToggleAutoDrop}
        disabled={!canDrop && !autoDropping}
        className={`px-2.5 py-2 rounded-xl text-base
                   disabled:opacity-40 disabled:cursor-not-allowed
                   active:scale-95 transition-all cursor-pointer
                   shadow-lg ${
                     autoDropping
                       ? 'bg-mario-yellow text-black animate-pulse'
                       : 'bg-emerald-600 text-white hover:brightness-110'
                   }`}
        title={autoDropping ? '停止自動' : '自動投幣'}
      >
        {autoDropping ? '\u23F8\uFE0F' : '\u25B6\uFE0F'}
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

      {/* Boss Rush button (L38+) */}
      {canBossRush && !bossActive && (
        <button
          onClick={onStartBossRush}
          className="px-2 py-2 rounded-xl text-sm cursor-pointer
                     active:scale-95 transition-transform bg-purple-800 hover:bg-purple-700
                     text-white font-bold"
          title="魔王連戰！"
        >
          {'\uD83D\uDC22\u00D73'}
        </button>
      )}

      <button
        onClick={onToggleAudio}
        className="px-2 py-2 rounded-xl text-base cursor-pointer
                   active:scale-95 transition-transform bg-white/10 hover:bg-white/20"
        title={audioMode === 'all' ? '全部音效' : audioMode === 'sfx_only' ? '僅特效音效' : '靜音'}
      >
        {audioMode === 'all' ? '\uD83D\uDD0A' : audioMode === 'sfx_only' ? '\uD83C\uDFB5' : '\uD83D\uDD07'}
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
