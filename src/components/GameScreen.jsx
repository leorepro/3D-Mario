import { useRef, useState, useEffect, useCallback } from 'react';
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
import { WalkingCharacters } from './WalkingCharacters.jsx';
import { LakituPopup } from './LakituPopup.jsx';
import { BulletBillPopup } from './BulletBillPopup.jsx';
import { ThwompPopup } from './ThwompPopup.jsx';
import { LowGravityPopup } from './LowGravityPopup.jsx';

/** Calculate scale factor to fit the game within the device screen */
function useResponsiveScale() {
  const [scale, setScale] = useState(1);

  const calcScale = useCallback(() => {
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    // Estimate total game height: HUD (~60) + canvas (VIEWPORT_HEIGHT) + ActionBar (~52)
    const totalH = VIEWPORT_HEIGHT + 112;
    const sx = sw / VIEWPORT_WIDTH;
    const sy = sh / totalH;
    setScale(Math.min(sx, sy, 1)); // never scale up beyond 1
  }, []);

  useEffect(() => {
    calcScale();
    window.addEventListener('resize', calcScale);
    return () => window.removeEventListener('resize', calcScale);
  }, [calcScale]);

  return scale;
}

export function GameScreen() {
  const containerRef = useRef(null);
  const scale = useResponsiveScale();
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
    lakituEvent, bulletBillEvent, thwompEvent, lowGravityActive,
    bossRushWave, canBossRush, startBossRush,
    wheelVisible, setWheelVisible, handleWheelPrize,
    dailyReward, setDailyReward,
    settingsVisible, setSettingsVisible,
    leaderboardVisible, setLeaderboardVisible,
    currentScene, unlockedScenes, settings, handleSettingsChange,
    leaderboard,
    coinSize, setCoinSize,
  } = useGameEngine(containerRef);

  // Total game height for the outer wrapper
  const totalH = VIEWPORT_HEIGHT + 112;

  return (
    <div
      className="relative mx-auto"
      style={{
        width: VIEWPORT_WIDTH * scale,
        height: totalH * scale,
      }}
    >
      <div
        style={{
          width: VIEWPORT_WIDTH,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}
      >
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

          {/* Walking characters in drop zone */}
          <WalkingCharacters />

          {/* In-game overlays */}
          <ChainPopup chainEvent={chainEvent} />
          <ActiveEffects engineRef={engineRef} />
          <ItemPopup itemEvent={itemEvent} />
          <LevelUpPopup levelEvent={levelEvent} />
          <AchievementPopup achievementEvent={achievementEvent} />
          <LakituPopup lakituEvent={lakituEvent} />
          <BulletBillPopup bulletBillEvent={bulletBillEvent} />
          <ThwompPopup thwompEvent={thwompEvent} />
          <LowGravityPopup active={lowGravityActive} />
          <FrenzyOverlay frenzyActive={frenzyActive} frenzyEndTime={frenzyEndTime} />
          <BossOverlay
            bossActive={bossActive}
            bossHP={bossHP}
            bossMaxHP={bossMaxHP}
            onAbort={abortBoss}
            bossRushWave={bossRushWave}
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
          canBossRush={canBossRush}
          onStartBossRush={startBossRush}
          score={score}
          level={level}
          coinSize={coinSize}
          onToggleCoinSize={setCoinSize}
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
    </div>
  );
}
