import { useState, useEffect } from 'react';

export function BulletBillPopup({ bulletBillEvent }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (bulletBillEvent) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [bulletBillEvent]);

  if (!visible || !bulletBillEvent) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="bg-black/70 rounded-xl px-4 py-2 text-center animate-bounce">
        {bulletBillEvent.sweeping ? (
          <div className="text-orange-400 font-black text-sm">
            衝撞波！💨
          </div>
        ) : (
          <div className="text-red-400 font-black text-sm animate-pulse">
            子彈比爾來了！🚀
          </div>
        )}
      </div>
    </div>
  );
}
