import { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine.js';
import {
  INITIAL_COIN_BALANCE,
  AUTO_DROP_INTERVAL_MS,
  COIN_RECOVERY_INTERVAL_MS,
  COIN_RECOVERY_MAX,
} from '../game/constants.js';

export function useGameEngine(containerRef) {
  const engineRef = useRef(null);
  const [score, setScore] = useState(0);
  const [coinBalance, setCoinBalance] = useState(INITIAL_COIN_BALANCE);
  const [autoDropping, setAutoDropping] = useState(false);
  const [chainEvent, setChainEvent] = useState(null); // latest chain event for ChainPopup
  const [chain, setChain] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const autoDropRef = useRef(null);
  const coinBalanceRef = useRef(coinBalance);

  // Keep ref in sync with state for interval callback
  useEffect(() => {
    coinBalanceRef.current = coinBalance;
  }, [coinBalance]);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, {
      onCoinCollected: (scoreValue, comboResult) => {
        setScore(prev => prev + scoreValue);
        setCoinBalance(prev => prev + 1);
        setChain(comboResult.chain);
        setMultiplier(comboResult.multiplier);

        // Trigger ChainPopup if new tier reached
        if (comboResult.newTier && comboResult.tier) {
          setChainEvent({ ...comboResult, _ts: Date.now() }); // _ts forces re-render
        }
      },
      onCoinLost: () => {
        // Coin lost — no score change
      },
    });

    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Coin recovery timer — every 3 minutes, +1 coin (up to max)
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
        if (coinBalanceRef.current <= 0) {
          setAutoDropping(false);
          return;
        }
        if (engineRef.current?.dropCoin(true)) {
          setCoinBalance(prev => prev - 1);
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
    if (coinBalance <= 0) return false;
    if (engineRef.current?.dropCoin()) {
      setCoinBalance(prev => prev - 1);
      return true;
    }
    return false;
  }, [coinBalance]);

  const setDropX = useCallback((x) => {
    engineRef.current?.setDropX(x);
  }, []);

  const toggleAutoDrop = useCallback(() => {
    setAutoDropping(prev => !prev);
  }, []);

  const toggleAudio = useCallback(() => {
    const enabled = engineRef.current?.toggleAudio();
    setAudioEnabled(enabled ?? true);
  }, []);

  return {
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
  };
}
