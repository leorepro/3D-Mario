# Mario Coin Pusher 3D

# 瑪利歐 3D 推幣機

A Mario-themed 3D coin pusher web game built with Three.js and cannon-es physics. Mobile-first, portrait orientation. Players drop coins onto a table where an oscillating pusher plate pushes them toward the front edge for collection.

以瑪利歐為主題的 3D 推幣機網頁遊戲，使用 Three.js 和 cannon-es 物理引擎打造。行動裝置優先、直向操作。玩家將硬幣投放到桌面上，透過來回擺動的推板將硬幣推向前方邊緣來收集得分。

## Tech Stack / 技術架構

| Layer / 層級 | Technology / 技術 |
| --- | --- |
| Framework / 框架 | Vite + React 19 |
| 3D Rendering / 3D 渲染 | Three.js (WebGL, PBR 材質, 陰影, 粒子效果) |
| Physics / 物理引擎 | cannon-es (3D 剛體動力學) |
| Styling / 樣式 | Tailwind CSS v4 (僅用於 UI 疊層) |
| Audio / 音效 | Web Audio API (程式合成音效，無音訊檔案) |
| Testing / 測試 | Vitest |

## Getting Started / 快速開始

```bash
# Install dependencies / 安裝依賴套件
npm install

# Start dev server (port 3000) / 啟動開發伺服器（連接埠 3000）
npm run dev

# Run tests / 執行測試
npm test

# Production build / 正式環境建置
npm run build

# Preview production build / 預覽正式環境建置
npm run preview
```

## Game Features / 遊戲功能

### Core Mechanics / 核心機制

- **3D Coin Pusher / 3D 推幣機** -- 將硬幣投放到物理驅動的桌面上，配合來回擺動的推板
- **Chain Combos / 連鎖組合** -- 快速收集硬幣可累積連鎖倍率：
  - 2x = Nice!（1.5 倍）
  - 5x = Great!（2 倍）
  - 10x = Amazing!（3 倍）
  - 20x = SUPER MARIO!（5 倍）
- **Dual Coin Sizes / 雙硬幣尺寸** -- 小硬幣（花費 1）和大硬幣（花費 5，分數更高）
- **Auto-Drop / 自動投幣** -- 開啟後每 600 毫秒自動投放一枚硬幣
- **Coin Recovery / 硬幣恢復** -- 免費硬幣會隨時間自動回復（每 3 分鐘 1 枚，上限 50 枚）

### Progression System (50 Levels) / 進度系統（50 個等級）

XP-based leveling with increasing difficulty every 5 levels:

基於經驗值的升級系統，每 5 個等級難度遞增：

- Pusher speed scales up / 推板速度提升
- Events become more frequent / 事件出現更頻繁
- XP and coin multipliers increase / 經驗值和硬幣倍率增加
- Each level grants coin rewards (10~500 coins) / 每次升級獎勵硬幣（10～500 枚）

### Special Items (15 Types) / 特殊道具（15 種）

| Item / 道具 | Level / 等級 | Effect / 效果 |
| --- | --- | --- |
| Question Block / 問號磚塊 | 1 | Random reward / 隨機獎勵 |
| Super Star / 超級星星 | 3 | 3x score multiplier (10s) / 3 倍分數（10 秒） |
| Super Mushroom / 超級蘑菇 | 5 | 1.5x pusher width (12s) / 推板寬度 1.5 倍（12 秒） |
| Poison Mushroom / 毒蘑菇 | 5 | 0.6x pusher width (8s) / 推板寬度 0.6 倍（8 秒） |
| Coin Tower / 金幣塔 | 7 | Burst of 10 coins / 爆發 10 枚硬幣 |
| Fire Flower / 火焰花 | 8 | Clear a row of coins / 清除一排硬幣 |
| Green Pipe / 綠色水管 | 10 | Teleport 5 coins / 傳送 5 枚硬幣 |
| Coin Pipe / 金幣水管 | 12 | Coin rain -- 15 coins over 3s / 金幣雨 -- 3 秒內 15 枚硬幣 |
| Bob-omb / 炸彈乒乓 | 21 | Explosion after 5s fuse (radius 6) / 5 秒後爆炸（半徑 6） |
| Magnet Mushroom / 磁鐵蘑菇 | 23 | Pull coins to center (10s) / 將硬幣吸向中心（10 秒） |
| Diamond Coin / 鑽石硬幣 | 25 | Worth 50 score / 價值 50 分 |
| Giant Bob-omb / 巨型炸彈乒乓 | 28 | Huge explosion (radius 10) / 巨大爆炸（半徑 10） |

### Events / 事件

| Event / 事件 | Level / 等級 | Description / 說明 |
| --- | --- | --- |
| Lakitu / 球蓋姆 | 1+ | Cloud steals 5-50 coins randomly / 雲上角色隨機偷走 5-50 枚硬幣 |
| Bullet Bill / 砲彈刺客 | 1+ | Sweeps coins off the table / 將硬幣掃出桌面 |
| Thwomp / 咚咚 | 30+ | Slams down and scatters coins / 砸下並打散硬幣 |

### Game Modes / 遊戲模式

| Mode / 模式 | Level / 等級 | Description / 說明 |
| --- | --- | --- |
| Golden Frenzy / 黃金狂熱 | 1+ | 1/50 chance per drop -- bonus coins and 1.5x score / 每次投幣 1/50 機率 -- 額外硬幣與 1.5 倍分數 |
| Boss Mode / Boss 模式 | 15+ | Fight Bowser (100 HP), 24hr cooldown / 對戰庫巴（100 HP），24 小時冷卻 |
| Low Gravity / 低重力 | 32+ | 35% normal gravity for 12s / 12 秒內重力降為 35% |
| Dual Pusher / 雙推板 | 35+ | Second pusher platform permanently added / 永久新增第二個推板平台 |
| Boss Rush / Boss 連戰 | 38+ | 3-wave boss fight with increasing difficulty / 3 波 Boss 戰鬥，難度遞增 |
| Mega Frenzy / 超級狂熱 | 45+ | 3x duration, 3x pusher speed, 5 coins/tick, 2x score / 3 倍持續時間、3 倍推板速度、每次 5 枚硬幣、2 倍分數 |
| Golden Pusher / 黃金推板 | 50 | Permanent 1.5x score multiplier with gold visual / 永久 1.5 倍分數倍率，金色外觀 |

### Scene Themes (8 Themes) / 場景主題（8 種）

| Scene / 場景 | Level / 等級 |
| --- | --- |
| Overworld / 地上世界 | Default / 預設 |
| Underground / 地下世界 | 10 |
| Castle / 城堡 | 12 |
| Underwater / 水中世界 | 15 |
| Starry Night / 星空夜晚 | 20 |
| Lava Castle / 熔岩城堡 | 30 |
| Rainbow Road / 彩虹之路 | 40 |
| Space / 太空 | 50 |

### Other Systems / 其他系統

- **Lucky Wheel / 幸運轉盤** -- 每投放 80 枚硬幣可轉一次獎品轉盤（2 秒後自動領取）
- **Daily Reward / 每日獎勵** -- 每日登入獎勵 +20 枚硬幣
- **Achievements / 成就系統** -- 11 個里程碑成就（硬幣數量、連鎖、等級、打敗 Boss 等）
- **Leaderboard / 排行榜** -- 前 10 名最高分紀錄（本地儲存）
- **Haptic Feedback / 觸覺回饋** -- 互動時的手機震動效果
- **Walking Characters / 行走角色** -- 像素風格瑪利歐角色在螢幕上行走動畫（瑪利歐、碧姬公主、奇諾比奧 + 栗寶寶、慢慢龜、乒乓鬼、乖乖怪、碎碎龜）
- **Share Button / 分享按鈕** -- 分享你的分數
- **3-State Audio / 三段式音效** -- 全音效 / 僅音效（無硬幣音效）/ 靜音

## Architecture / 架構

```text
src/
├── game/                        # Imperative game engine (non-React)
│   │                            # 命令式遊戲引擎（非 React）
│   ├── constants.js             # All tunable values / 所有可調參數
│   ├── GameEngine.js            # Main loop orchestrator / 主迴圈協調器
│   ├── PhysicsWorld3D.js        # cannon-es world, walls, table / 物理世界、牆壁、桌面
│   ├── PusherController3D.js    # Kinematic pusher oscillation / 推板運動控制
│   ├── CoinManager3D.js         # Coin spawn/remove lifecycle / 硬幣生成與移除生命週期
│   ├── ItemManager3D.js         # Special item physics & spawn logic / 特殊道具物理與生成邏輯
│   ├── ItemMeshFactory.js       # Procedural Three.js meshes / 程式化 Three.js 網格模型
│   ├── Renderer3D.js            # Three.js scene, camera, lights, shadows / 場景、相機、燈光、陰影
│   ├── ParticleSystem.js        # GPU sparkle particles / GPU 閃爍粒子效果
│   ├── AudioManager.js          # Web Audio API procedural SFX / 程式合成音效
│   ├── ComboTracker.js          # Chain/combo detection & tier multipliers / 連鎖偵測與倍率
│   ├── EffectManager.js         # Timed game effects / 計時遊戲效果
│   ├── LevelSystem.js           # XP progression, unlocks, difficulty scaling / 經驗值進度、解鎖、難度縮放
│   ├── BossSystem.js            # Bowser boss fight & boss rush logic / 庫巴 Boss 戰鬥邏輯
│   ├── LuckyWheel.js            # Weighted random prize wheel / 加權隨機獎品轉盤
│   ├── DailyReward.js           # Daily login bonus / 每日登入獎勵
│   ├── AchievementSystem.js     # Milestone achievements / 里程碑成就
│   ├── SaveManager.js           # localStorage persistence / 本地儲存持久化
│   ├── HapticManager.js         # Mobile vibration feedback / 手機震動回饋
│   ├── QualityManager.js        # Graphics quality settings / 畫質設定
│   ├── EventBus.js              # Pub/Sub event system / 發佈/訂閱事件系統
│   └── __tests__/               # Unit tests (121 tests, 11 files) / 單元測試
│
├── components/                  # React UI overlays / React UI 疊層
│   ├── GameScreen.jsx           # Root game layout / 遊戲根佈局
│   ├── HUD.jsx                  # Score, balance, level, XP bar / 分數、餘額、等級、經驗條
│   ├── ActionBar.jsx            # Drop, auto-drop, boss, audio, settings / 投幣、自動投幣、Boss、音效、設定
│   ├── DropZoneOverlay.jsx      # Touch/mouse input / 觸控與滑鼠輸入
│   ├── ChainPopup.jsx           # Chain combo overlay / 連鎖組合彈出
│   ├── ActiveEffects.jsx        # Current timed effect indicators / 當前計時效果指示器
│   ├── ItemPopup.jsx            # Item collection notification / 道具收集通知
│   ├── LevelUpPopup.jsx         # Level up celebration / 升級慶祝動畫
│   ├── AchievementPopup.jsx     # Achievement unlock notification / 成就解鎖通知
│   ├── FrenzyOverlay.jsx        # Frenzy visual feedback / 狂熱視覺效果
│   ├── BossOverlay.jsx          # Boss HP bar, timer / Boss 血量條、計時器
│   ├── LuckyWheelOverlay.jsx    # Spinning wheel modal / 轉盤彈窗
│   ├── DailyRewardPopup.jsx     # Daily reward notification / 每日獎勵通知
│   ├── LakituPopup.jsx          # Lakitu coin theft animation / 球蓋姆偷幣動畫
│   ├── BulletBillPopup.jsx      # Bullet Bill sweep animation / 砲彈刺客掃蕩動畫
│   ├── ThwompPopup.jsx          # Thwomp slam animation / 咚咚砸擊動畫
│   ├── LowGravityPopup.jsx      # Low gravity indicator / 低重力指示器
│   ├── SettingsPanel.jsx        # Scene, audio, haptic, quality settings / 場景、音效、震動、畫質設定
│   ├── LeaderboardPanel.jsx     # Top 10 high scores / 前 10 名排行榜
│   ├── WalkingCharacters.jsx    # Pixel-art walking characters / 像素風格行走角色
│   └── ShareButton.jsx          # Score sharing / 分數分享
│
├── hooks/
│   └── useGameEngine.js         # Bridge: game engine ↔ React state / 遊戲引擎與 React 狀態橋接
│
├── App.jsx                      # React root / React 根組件
├── main.jsx                     # Vite entry point / Vite 進入點
└── index.css                    # Global styles + Tailwind / 全域樣式 + Tailwind
```

### Design Principles / 設計原則

- **React does NOT re-render at 60fps / React 不會以 60fps 重新渲染** -- 僅在狀態改變時更新（分數、餘額、連鎖、升級）
- **Game engine is imperative / 遊戲引擎為命令式** -- 物理與渲染在 `requestAnimationFrame` 迴圈中獨立於 React 運行
- **All audio is procedural / 所有音效皆為程式合成** -- 使用 Web Audio API 合成音效，零音訊檔案依賴
- **All 3D meshes are procedural / 所有 3D 網格皆為程式化建模** -- 透過 Three.js 程式化建立，無外部 3D 模型或貼圖
- **Mobile-first / 行動裝置優先** -- 390x600px 視窗、觸控操作、響應式縮放

## Scripts / 指令

| Command / 指令 | Description / 說明 |
| --- | --- |
| `npm run dev` | Start dev server / 啟動開發伺服器 |
| `npm run build` | Production build / 正式環境建置 |
| `npm run preview` | Preview production build / 預覽正式環境建置 |
| `npm test` | Run all tests (vitest) / 執行所有測試 |
| `npm run test:watch` | Run tests in watch mode / 監聽模式執行測試 |
| `npm run lint` | ESLint check / ESLint 檢查 |

## License / 授權

Private project. / 私人專案。
