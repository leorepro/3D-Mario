import { useRef } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.js';
import { HUD } from './HUD.jsx';
import { ActionBar } from './ActionBar.jsx';
import { DropZoneOverlay } from './DropZoneOverlay.jsx';
import { ChainPopup } from './ChainPopup.jsx';
import { ActiveEffects } from './ActiveEffects.jsx';
import { ItemPopup } from './ItemPopup.jsx';
import { LevelUpPopup } from './LevelUpPopup.jsx';
import { FrenzyOverlay } from './FrenzyOverlay.jsx';
import { BossOverlay } from './BossOverlay.jsx';
import { LuckyWheelOverlay } from './LuckyWheelOverlay.jsx';
import { SettingsPanel } from './SettingsPanel.jsx';
import { DailyRewardPopup } from './DailyRewardPopup.jsx';
import { AchievementPopup } from './AchievementPopup.jsx';
import { LeaderboardPanel } from './LeaderboardPanel.jsx';
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../game/constants.js';

export function GameScreen() {
  const containerRef = useRef(null);
  const {
    score, coinBalance, dropCoin, setDropX, engineRef,
    autoDropping, toggleAutoDrop,
    chainEvent, chain, multiplier,
    audioEnabled, toggleAudio,
    // P2-P4
    level, xpProgress,
    itemEvent, levelEvent, achievementEvent,
    frenzyActive, frenzyEndTime,
    bossActive, bossHP, bossMaxHP, startBoss, abortBoss, canBoss,
    wheelVisible, setWheelVisible, handleWheelPrize,
    dailyReward, setDailyReward,
    settingsVisible, setSettingsVisible,
    leaderboardVisible, setLeaderboardVisible,
    currentScene, unlockedScenes, settings, handleSettingsChange,
    leaderboard,
  } = useGameEngine(containerRef);

  return (
    <div className="relative mx-auto" style={{ width: VIEWPORT_WIDTH, maxWidth: '100vw' }}>
      <HUD
        score={score}
        coinBalance={coinBalance}
        chain={chain}
        multiplier={multiplier}
        level={level}
        xpProgress={xpProgress}
      />

      <div className="relative">
        <div
          ref={containerRef}
          style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}
        />
        <DropZoneOverlay
          engineRef={engineRef}
          onPositionChange={setDropX}
          onDrop={dropCoin}
        />

        {/* In-game overlays */}
        <ChainPopup chainEvent={chainEvent} />
        <ActiveEffects engineRef={engineRef} />
        <ItemPopup itemEvent={itemEvent} />
        <LevelUpPopup levelEvent={levelEvent} />
        <AchievementPopup achievementEvent={achievementEvent} />
        <FrenzyOverlay frenzyActive={frenzyActive} frenzyEndTime={frenzyEndTime} />
        <BossOverlay
          bossActive={bossActive}
          bossHP={bossHP}
          bossMaxHP={bossMaxHP}
          onAbort={abortBoss}
        />
      </div>

      <ActionBar
        coinBalance={coinBalance}
        onDrop={dropCoin}
        autoDropping={autoDropping}
        onToggleAutoDrop={toggleAutoDrop}
        audioEnabled={audioEnabled}
        onToggleAudio={toggleAudio}
        onOpenSettings={() => setSettingsVisible(true)}
        onOpenLeaderboard={() => setLeaderboardVisible(true)}
        canBoss={canBoss}
        onStartBoss={startBoss}
        bossActive={bossActive}
        score={score}
        level={level}
      />

      {/* Modal overlays */}
      <LuckyWheelOverlay
        visible={wheelVisible}
        onClose={() => setWheelVisible(false)}
        onPrize={handleWheelPrize}
      />

      <SettingsPanel
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        engineRef={engineRef}
        currentScene={currentScene}
        unlockedScenes={unlockedScenes}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      <DailyRewardPopup
        reward={dailyReward}
        onClaim={() => setDailyReward(null)}
      />

      <LeaderboardPanel
        visible={leaderboardVisible}
        onClose={() => setLeaderboardVisible(false)}
        leaderboard={leaderboard}
      />
    </div>
  );
}
