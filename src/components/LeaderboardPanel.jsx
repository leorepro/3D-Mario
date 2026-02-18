export function LeaderboardPanel({ visible, onClose, leaderboard }) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 rounded-2xl p-4 w-[300px]">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-white font-black text-lg">{'\uD83C\uDFC6'} 排行榜</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl cursor-pointer"
          >
            {'\u2715'}
          </button>
        </div>

        {(!leaderboard || leaderboard.length === 0) ? (
          <div className="text-gray-500 text-center py-6 text-sm">
            還沒有分數紀錄，快來玩吧！
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {leaderboard.map((entry, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-2 rounded-lg
                           ${i === 0 ? 'bg-mario-yellow/20' : i === 1 ? 'bg-gray-500/20' : i === 2 ? 'bg-orange-900/20' : 'bg-white/5'}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-black text-sm ${i === 0 ? 'text-mario-yellow' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                    #{i + 1}
                  </span>
                  <span className="text-white text-sm">
                    {entry.date ? new Date(entry.date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <span className="text-mario-yellow font-bold text-sm">{entry.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
