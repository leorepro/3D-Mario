export function ActionBar({ coinBalance, onDrop, autoDropping, onToggleAutoDrop, audioEnabled, onToggleAudio }) {
  return (
    <div className="flex justify-center items-center gap-2 px-3 py-3 bg-black/80"
         style={{ width: 390 }}>
      <div className="flex items-center gap-1 text-white min-w-[60px]">
        <span className="text-lg">🪙</span>
        <span className="text-coin-gold font-bold text-sm">{coinBalance}</span>
      </div>
      <button
        onClick={onDrop}
        disabled={coinBalance <= 0}
        className="bg-mario-red text-white px-5 py-2.5 rounded-xl font-bold text-base
                   disabled:opacity-40 disabled:cursor-not-allowed
                   active:scale-95 transition-transform cursor-pointer
                   shadow-lg hover:brightness-110"
      >
        🎯 DROP
      </button>
      <button
        onClick={onToggleAutoDrop}
        disabled={coinBalance <= 0 && !autoDropping}
        className={`px-3 py-2.5 rounded-xl font-bold text-sm
                   disabled:opacity-40 disabled:cursor-not-allowed
                   active:scale-95 transition-all cursor-pointer
                   shadow-lg ${
                     autoDropping
                       ? 'bg-mario-yellow text-black animate-pulse'
                       : 'bg-emerald-600 text-white hover:brightness-110'
                   }`}
      >
        {autoDropping ? '⏸ STOP' : '🔄 AUTO'}
      </button>
      <button
        onClick={onToggleAudio}
        className="px-2.5 py-2.5 rounded-xl text-lg cursor-pointer
                   active:scale-95 transition-transform bg-white/10 hover:bg-white/20"
        title={audioEnabled ? 'Mute' : 'Unmute'}
      >
        {audioEnabled ? '🔊' : '🔇'}
      </button>
    </div>
  );
}
