import { describe, it, expect, beforeEach } from 'vitest';
import { AudioManager } from '../AudioManager.js';

describe('AudioManager', () => {
  let audio;

  beforeEach(() => {
    audio = new AudioManager();
  });

  it('should start with mode "all" and enabled', () => {
    expect(audio.mode).toBe('all');
    expect(audio.enabled).toBe(true);
    expect(audio.muteCoins).toBe(false);
  });

  it('toggle: all → sfx_only', () => {
    const mode = audio.toggle();
    expect(mode).toBe('sfx_only');
    expect(audio.enabled).toBe(true);
    expect(audio.muteCoins).toBe(true);
  });

  it('toggle: sfx_only → off', () => {
    audio.toggle(); // all → sfx_only
    const mode = audio.toggle();
    expect(mode).toBe('off');
    expect(audio.enabled).toBe(false);
    expect(audio.muteCoins).toBe(true);
  });

  it('toggle: off → all', () => {
    audio.toggle(); // all → sfx_only
    audio.toggle(); // sfx_only → off
    const mode = audio.toggle();
    expect(mode).toBe('all');
    expect(audio.enabled).toBe(true);
    expect(audio.muteCoins).toBe(false);
  });

  it('full cycle returns to original state', () => {
    audio.toggle();
    audio.toggle();
    audio.toggle();
    expect(audio.mode).toBe('all');
    expect(audio.enabled).toBe(true);
    expect(audio.muteCoins).toBe(false);
  });

  it('coin sounds are silent in sfx_only mode (no crash without AudioContext)', () => {
    audio.toggle(); // sfx_only
    // These should not throw even without AudioContext
    expect(() => audio.playCoinDrop()).not.toThrow();
    expect(() => audio.playCoinCollide()).not.toThrow();
    expect(() => audio.playCoinCollected()).not.toThrow();
    expect(() => audio.playCoinLost()).not.toThrow();
  });

  it('all sounds are silent in off mode (no crash without AudioContext)', () => {
    audio.toggle(); // sfx_only
    audio.toggle(); // off
    expect(() => audio.playCoinDrop()).not.toThrow();
    expect(() => audio.playLevelUp()).not.toThrow();
    expect(() => audio.playBossHit()).not.toThrow();
  });
});
