import { useState } from 'react';
import { SCENES } from '../game/constants.js';

const SCENE_NAMES = {
  overworld: '地上世界',
  underground: '地下世界',
  castle: '城堡',
  underwater: '水中世界',
};

export function SettingsPanel({ visible, onClose, engineRef, currentScene, unlockedScenes, settings, onSettingsChange }) {
  const [volume, setVolume] = useState(settings?.volume ?? 0.5);
  const [haptic, setHaptic] = useState(settings?.haptic ?? true);

  if (!visible) return null;

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    engineRef?.current?.setVolume(v);
    onSettingsChange?.({ volume: v, haptic });
  };

  const handleHapticToggle = () => {
    const next = !haptic;
    setHaptic(next);
    engineRef?.current?.setHaptic(next);
    onSettingsChange?.({ volume, haptic: next });
  };

  const handleSceneChange = (sceneId) => {
    engineRef?.current?.setScene(sceneId);
    onSettingsChange?.({ volume, haptic, scene: sceneId });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 rounded-2xl p-4 w-[320px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-black text-lg">⚙️ 設定</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Volume */}
        <div className="mb-4">
          <label className="text-gray-300 text-sm font-bold block mb-1">
            音量：{Math.round(volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full accent-mario-yellow"
          />
        </div>

        {/* Haptic */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-gray-300 text-sm font-bold">震動回饋</span>
          <button
            onClick={handleHapticToggle}
            className={`px-3 py-1 rounded-lg font-bold text-sm cursor-pointer transition-colors
                       ${haptic ? 'bg-mario-green text-white' : 'bg-gray-700 text-gray-400'}`}
          >
            {haptic ? '開啟' : '關閉'}
          </button>
        </div>

        {/* Scene Selector */}
        <div className="mb-2">
          <span className="text-gray-300 text-sm font-bold block mb-2">場景選擇</span>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(SCENES).map(scene => {
              const unlocked = unlockedScenes?.includes(scene.id);
              const active = currentScene === scene.id;
              return (
                <button
                  key={scene.id}
                  onClick={() => unlocked && handleSceneChange(scene.id)}
                  disabled={!unlocked}
                  className={`px-2 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all
                             ${active ? 'ring-2 ring-mario-yellow bg-white/20 text-white'
                               : unlocked ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                               : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                >
                  <div
                    className="w-full h-4 rounded mb-1"
                    style={{ backgroundColor: `#${scene.background.toString(16).padStart(6, '0')}` }}
                  />
                  {SCENE_NAMES[scene.id] || scene.label}
                  {!unlocked && <div className="text-[9px] text-gray-500">未解鎖</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
