export function RulesPopup({ visible, onClose }) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 rounded-2xl p-4 w-[320px] max-h-[480px] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-white font-black text-lg">{'\u2753'} 遊戲規則</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="text-gray-200 text-sm space-y-3 leading-relaxed">
          <section>
            <h3 className="text-mario-yellow font-bold mb-1">{'\uD83E\uDE99'} 基本玩法</h3>
            <p>點擊畫面投放硬幣到桌面上，推板會來回移動將硬幣推向前方邊緣。硬幣從前方掉落即可回收金幣並獲得分數。</p>
          </section>

          <section>
            <h3 className="text-mario-yellow font-bold mb-1">{'\uD83D\uDCB0'} 硬幣種類</h3>
            <ul className="list-disc list-inside space-y-0.5">
              <li>小硬幣：花費 2，回收 1，得 1 分</li>
              <li>大硬幣：花費 10，回收 5，得 5 分</li>
            </ul>
          </section>

          <section>
            <h3 className="text-mario-yellow font-bold mb-1">{'\uD83D\uDD25'} 連鎖組合</h3>
            <p>快速連續收集硬幣可觸發連鎖倍率：</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>2 連鎖 = Nice!（1.5 倍）</li>
              <li>5 連鎖 = Great!（2 倍）</li>
              <li>10 連鎖 = Amazing!（3 倍）</li>
              <li>20 連鎖 = SUPER MARIO!（5 倍）</li>
            </ul>
          </section>

          <section>
            <h3 className="text-mario-yellow font-bold mb-1">{'\u2B50'} 特殊道具</h3>
            <p>遊戲中會出現各種道具，例如超級星星（3 倍分數）、超級蘑菇（推板變大）、火焰花（清除一排硬幣）、炸彈（爆炸推散硬幣）等。</p>
          </section>

          <section>
            <h3 className="text-mario-yellow font-bold mb-1">{'\u26A0\uFE0F'} 隨機事件</h3>
            <ul className="list-disc list-inside space-y-0.5">
              <li>球蓋姆：偷走桌上的硬幣</li>
              <li>砲彈刺客：將硬幣掃出桌面</li>
              <li>咚咚：砸下並打散硬幣</li>
            </ul>
          </section>

          <section>
            <h3 className="text-mario-yellow font-bold mb-1">{'\uD83C\uDFC6'} 升級與獎勵</h3>
            <p>收集硬幣可獲得經驗值，每次升級會獲得金幣獎勵並解鎖新道具和場景。每投放 80 枚硬幣可轉一次幸運轉盤。</p>
          </section>

          <section>
            <h3 className="text-mario-yellow font-bold mb-1">{'\uD83D\uDCA1'} 小提示</h3>
            <ul className="list-disc list-inside space-y-0.5">
              <li>從後方或側邊掉落的硬幣不計分</li>
              <li>硬幣會每 3 分鐘自動恢復 1 枚（上限 50）</li>
              <li>善用自動投幣功能累積連鎖倍率</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
