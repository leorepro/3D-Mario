import { useState, useEffect } from 'react';

export function LowGravityPopup({ active }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
    } else {
      // Keep showing briefly after deactivation
      const timer = setTimeout(() => setVisible(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!visible) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="bg-black/70 rounded-xl px-4 py-2 text-center">
        {active ? (
          <div className="text-cyan-300 font-black text-sm animate-pulse">
            低重力模式！🌙✨
          </div>
        ) : (
          <div className="text-gray-400 font-bold text-xs">
            重力恢復正常
          </div>
        )}
      </div>
    </div>
  );
}
