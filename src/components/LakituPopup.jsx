import { useState, useEffect } from 'react';

export function LakituPopup({ lakituEvent }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lakituEvent) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [lakituEvent]);

  if (!visible || !lakituEvent) return null;

  const { coinsStolen } = lakituEvent;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="bg-black/70 rounded-xl px-4 py-2 text-center animate-bounce">
        {coinsStolen > 0 ? (
          <>
            <div className="text-red-400 font-black text-sm">
              拉奇庫偷走了！
            </div>
            <div className="text-mario-yellow font-black text-lg">
              -{coinsStolen} 金幣
            </div>
          </>
        ) : (
          <div className="text-red-400 font-black text-sm animate-pulse">
            拉奇庫來了！
          </div>
        )}
      </div>
    </div>
  );
}
