import { useState } from 'react';

export function ShareButton({ score, level }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = `我在瑪利歐推幣機達到了等級 ${level}，拿到了 ${score} 分！你能超越我嗎？`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: '瑪利歐推幣機', text, url });
        return;
      } catch { /* user cancelled or not supported */ }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <button
      onClick={handleShare}
      className="px-2.5 py-2.5 rounded-xl text-lg cursor-pointer
                 active:scale-95 transition-transform bg-white/10 hover:bg-white/20"
      title="分享"
    >
      {copied ? '\u2705' : '\uD83D\uDCE4'}
    </button>
  );
}
