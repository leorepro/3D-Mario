export function HUD({ score, coinBalance, chain, multiplier }) {
  return (
    <div className="flex justify-between items-center px-4 py-2 bg-black/70 text-white"
         style={{ width: 390 }}>
      <div className="flex items-center gap-2">
        <span className="text-xl">🪙</span>
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
  );
}
