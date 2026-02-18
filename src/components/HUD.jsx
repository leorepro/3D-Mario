export function HUD({ score, coinBalance, chain, multiplier, level, xpProgress }) {
  return (
    <div className="bg-black/70 text-white" style={{ width: 390 }}>
      {/* Main HUD row */}
      <div className="flex justify-between items-center px-4 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">{'\uD83E\uDE99'}</span>
          <span className="text-coin-gold font-bold text-lg">{coinBalance}</span>
        </div>

        {/* Chain / Multiplier indicator */}
        {chain > 1 && (
          <div className="flex items-center gap-1 animate-pulse">
            <span className="text-mario-green font-bold text-sm">{chain}x</span>
            <span className="bg-mario-yellow/20 text-mario-yellow font-bold px-1.5 py-0.5 rounded text-xs">
              x{multiplier}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">SCORE</span>
          <span className="text-mario-yellow font-bold text-lg">{score}</span>
        </div>
      </div>

      {/* Level + XP bar */}
      <div className="flex items-center gap-2 px-4 pb-1.5">
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-mario-yellow text-[10px] font-black">Lv.{level || 1}</span>
        </div>
        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-mario-blue rounded-full transition-all duration-500"
            style={{ width: `${(xpProgress || 0) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
