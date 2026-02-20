import { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine.js';
import { DailyReward } from '../game/DailyReward.js';
import {
  INITIAL_COIN_BALANCE,
  AUTO_DROP_INTERVAL_MS,
  COIN_RECOVERY_INTERVAL_MS,
  COIN_RECOVERY_MAX,
  COIN_SIZES,
} from '../game/constants.js';
import * as C from '../game/constants.js';

export function useGameEngine(containerRef) {
  const engineRef = useRef(null);
  const [score, setScore] = useState(0);
  const [coinBalance, setCoinBalance] = useState(INITIAL_COIN_BALANCE);
  const [autoDropping, setAutoDropping] = useState(false);
  const [chainEvent, setChainEvent] = useState(null);
  const [chain, setChain] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const autoDropRef = useRef(null);
  const coinBalanceRef = useRef(coinBalance);

  // P2-P4 state
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [xpProgress, setXpProgress] = useState(0);
  const [itemEvent, setItemEvent] = useState(null);
  const [levelEvent, setLevelEvent] = useState(null);
  const [achievementEvent, setAchievementEvent] = useState(null);
  const [frenzyActive, setFrenzyActive] = useState(false);
  const [frenzyEndTime, setFrenzyEndTime] = useState(0);
  const [bossActive, setBossActive] = useState(false);
  const [bossHP, setBossHP] = useState(0);
  const [bossMaxHP, setBossMaxHP] = useState(100);
  const [wheelVisible, setWheelVisible] = useState(false);
  const [dailyReward, setDailyReward] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [currentScene, setCurrentScene] = useState('overworld');
  const [unlockedScenes, setUnlockedScenes] = useState(['overworld']);
  const [settings, setSettings] = useState({ volume: 0.5, haptic: true });
  const [leaderboard, setLeaderboard] = useState([]);
  const [canBoss, setCanBoss] = useState(false);
  const [lakituEvent, setLakituEvent] = useState(null);
  const [bulletBillEvent, setBulletBillEvent] = useState(null);
  const [thwompEvent, setThwompEvent] = useState(null);
  const [coinSize, setCoinSizeState] = useState('small');
  const coinSizeRef = useRef('small');

  // Keep refs in sync with state for interval callbacks
  useEffect(() => {
    coinBalanceRef.current = coinBalance;
  }, [coinBalance]);

  useEffect(() => {
    coinSizeRef.current = coinSize;
  }, [coinSize]);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, {
      onCoinCollected: (scoreValue, comboResult, size = 'small') => {
        setScore(prev => {
          const next = prev + scoreValue;
          // Update high score and leaderboard
          if (engine.saveManager) {
            engine.saveManager.setHighScore(next);
          }
          return next;
        });
        const collectValue = (COIN_SIZES[size] || COIN_SIZES.small).collectValue;
        setCoinBalance(prev => prev + collectValue);
        setChain(comboResult.chain);
        setMultiplier(comboResult.multiplier);

        if (comboResult.newTier && comboResult.tier) {
          setChainEvent({ ...comboResult, _ts: Date.now() });
        }
      },
      onCoinLost: () => {
        // Coin lost — no score change
      },
      onFrenzyStart: (duration) => {
        setFrenzyActive(true);
        setFrenzyEndTime(Date.now() + duration);
      },
      onFrenzyEnd: () => {
        setFrenzyActive(false);
      },
      onBossStart: ({ hp, maxHp }) => {
        setBossActive(true);
        setBossHP(hp);
        setBossMaxHP(maxHp);
      },
      onBossEnd: () => {
        setBossActive(false);
        setBossHP(0);
      },
      onWheelTrigger: () => {
        setWheelVisible(true);
      },
      onBurstCoins: (count) => {
        // Free coins from burst — add to balance
        setCoinBalance(prev => prev + count);
      },
      onLakituStart: () => {
        setLakituEvent({ active: true, coinsStolen: 0 });
      },
      onLakituSteal: (count) => {
        setLakituEvent(prev => prev ? { ...prev, coinsStolen: count } : { active: true, coinsStolen: count });
      },
      onLakituEnd: () => {
        // Keep showing for 2 seconds so player sees the result
        setTimeout(() => setLakituEvent(null), 2000);
      },
      onBulletBillStart: () => {
        setBulletBillEvent({ active: true });
      },
      onBulletBillSweep: () => {
        setBulletBillEvent(prev => prev ? { ...prev, sweeping: true } : null);
      },
      onBulletBillEnd: () => {
        setTimeout(() => setBulletBillEvent(null), 1500);
      },
      onThwompWarning: () => {
        setThwompEvent({ phase: 'warning' });
      },
      onThwompSlam: () => {
        setThwompEvent({ phase: 'slam' });
      },
      onThwompEnd: () => {
        setTimeout(() => setThwompEvent(null), 1500);
      },
    });

    engineRef.current = engine;

    // Subscribe to EventBus events
    const bus = engine.eventBus;

    bus.on('item:collected', (data) => {
      setItemEvent({ ...data, _ts: Date.now() });
    });

    bus.on('level:up', (data) => {
      setLevel(data.newLevel);
      setLevelEvent({ ...data, _ts: Date.now() });
      engine.audio.playLevelUp();
      engine.haptic.levelUp();
      // Award coin reward for leveling up
      if (data.coinReward) {
        setCoinBalance(prev => prev + data.coinReward);
      }
      // Update pusher speed for new difficulty level
      const scale = engine.levelSystem.getDifficultyScale();
      engine.pusher.setSpeed(C.PUSHER_SPEED * scale.pusherSpeed);
      // Update unlocked scenes
      setUnlockedScenes(engine.levelSystem.getUnlockedScenes());
      setCanBoss(engine.levelSystem.canBoss());
    });

    bus.on('xp:gained', (data) => {
      setXp(data.totalXp);
      setLevel(data.level);
      setXpProgress(engine.levelSystem.getXPProgress());
    });

    bus.on('achievement:unlock', (data) => {
      setAchievementEvent({ ...data, _ts: Date.now() });
      engine.audio.playAchievement();
    });

    bus.on('boss:damaged', (data) => {
      setBossHP(data.hpRemaining);
    });

    bus.on('boss:defeated', (data) => {
      setBossActive(false);
      setBossHP(0);
      engine.renderer.hideBoss();
      engine.audio.playBossDefeated();
      setCoinBalance(prev => prev + data.reward);
      setCanBoss(false);
    });

    // Initialize state from save
    setLevel(engine.levelSystem.getLevel());
    setXp(engine.levelSystem.getXP());
    setXpProgress(engine.levelSystem.getXPProgress());
    setUnlockedScenes(engine.levelSystem.getUnlockedScenes());
    setCanBoss(engine.levelSystem.canBoss());
    setCurrentScene(engine.saveManager.getCurrentScene());
    setSettings(engine.saveManager.getSettings());
    setLeaderboard(engine.saveManager.getLeaderboard());

    // Check daily reward
    const daily = new DailyReward(engine.saveManager);
    const reward = daily.checkAndClaim();
    if (reward.claimed) {
      setDailyReward(reward);
      setCoinBalance(prev => prev + reward.coins);
    }

    engine.start();

    return () => {
      // Save score to leaderboard on unmount
      if (engine.saveManager) {
        const finalScore = coinBalanceRef.current; // approximate
        engine.saveManager.addLeaderboardEntry({
          score: finalScore,
          date: new Date().toISOString(),
        });
      }
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Coin recovery timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCoinBalance(prev => {
        if (prev < COIN_RECOVERY_MAX) return prev + 1;
        return prev;
      });
    }, COIN_RECOVERY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // Auto-drop interval
  useEffect(() => {
    if (autoDropping) {
      autoDropRef.current = setInterval(() => {
        const cost = (COIN_SIZES[coinSizeRef.current] || COIN_SIZES.small).dropCost;
        if (coinBalanceRef.current < cost) {
          setAutoDropping(false);
          return;
        }
        if (engineRef.current?.dropCoin(true)) {
          setCoinBalance(prev => prev - cost);
        }
      }, AUTO_DROP_INTERVAL_MS);
    } else {
      if (autoDropRef.current) {
        clearInterval(autoDropRef.current);
        autoDropRef.current = null;
      }
    }
    return () => {
      if (autoDropRef.current) {
        clearInterval(autoDropRef.current);
        autoDropRef.current = null;
      }
    };
  }, [autoDropping]);

  // Reset chain display after timeout
  useEffect(() => {
    if (chain > 0) {
      const timer = setTimeout(() => {
        setChain(0);
        setMultiplier(1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [chain]);

  const dropCoin = useCallback(() => {
    const cost = (COIN_SIZES[coinSize] || COIN_SIZES.small).dropCost;
    if (coinBalance < cost) return false;
    if (engineRef.current?.dropCoin()) {
      setCoinBalance(prev => prev - cost);
      return true;
    }
    return false;
  }, [coinBalance, coinSize]);

  const setDropX = useCallback((x) => {
    engineRef.current?.setDropX(x);
  }, []);

  const setCoinSize = useCallback((size) => {
    setCoinSizeState(size);
    engineRef.current?.setCoinSize(size);
  }, []);

  const toggleAutoDrop = useCallback(() => {
    setAutoDropping(prev => !prev);
  }, []);

  const toggleAudio = useCallback(() => {
    const enabled = engineRef.current?.toggleAudio();
    setAudioEnabled(enabled ?? true);
  }, []);

  const startBoss = useCallback(() => {
    engineRef.current?.startBoss();
  }, []);

  const abortBoss = useCallback(() => {
    engineRef.current?.abortBoss();
    setBossActive(false);
    setBossHP(0);
  }, []);

  const handleWheelPrize = useCallback((prize) => {
    if (!prize || !prize.reward) return;
    const reward = prize.reward;
    if (reward.coins) {
      setCoinBalance(prev => prev + reward.coins);
    }
    if (reward.frenzy) {
      engineRef.current?.startFrenzy();
    }
    if (reward.spawnItem) {
      engineRef.current?.spawnWheelItem(reward.spawnItem);
    }
  }, []);

  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    if (newSettings.scene) {
      setCurrentScene(newSettings.scene);
    }
  }, []);

  return {
    // Core
    score,
    coinBalance,
    dropCoin,
    setDropX,
    engineRef,
    autoDropping,
    toggleAutoDrop,
    chainEvent,
    chain,
    multiplier,
    audioEnabled,
    toggleAudio,
    // P2-P4
    level,
    xp,
    xpProgress,
    itemEvent,
    levelEvent,
    achievementEvent,
    frenzyActive,
    frenzyEndTime,
    bossActive,
    bossHP,
    bossMaxHP,
    startBoss,
    abortBoss,
    canBoss,
    lakituEvent,
    bulletBillEvent,
    thwompEvent,
    wheelVisible,
    setWheelVisible,
    handleWheelPrize,
    dailyReward,
    setDailyReward,
    settingsVisible,
    setSettingsVisible,
    leaderboardVisible,
    setLeaderboardVisible,
    currentScene,
    unlockedScenes,
    settings,
    handleSettingsChange,
    leaderboard,
    coinSize,
    setCoinSize,
  };
}
