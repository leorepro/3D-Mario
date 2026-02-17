import { useRef } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.js';
import { HUD } from './HUD.jsx';
import { ActionBar } from './ActionBar.jsx';
import { DropZoneOverlay } from './DropZoneOverlay.jsx';
import { ChainPopup } from './ChainPopup.jsx';
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../game/constants.js';

export function GameScreen() {
  const containerRef = useRef(null);
  const {
    score, coinBalance, dropCoin, setDropX, engineRef,
    autoDropping, toggleAutoDrop,
    chainEvent, chain, multiplier,
    audioEnabled, toggleAudio,
  } = useGameEngine(containerRef);

  return (
    <div className="relative mx-auto" style={{ width: VIEWPORT_WIDTH, maxWidth: '100vw' }}>
      <HUD score={score} coinBalance={coinBalance} chain={chain} multiplier={multiplier} />

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
        <ChainPopup chainEvent={chainEvent} />
      </div>

      <ActionBar
        coinBalance={coinBalance}
        onDrop={dropCoin}
        autoDropping={autoDropping}
        onToggleAutoDrop={toggleAutoDrop}
        audioEnabled={audioEnabled}
        onToggleAudio={toggleAudio}
      />
    </div>
  );
}
