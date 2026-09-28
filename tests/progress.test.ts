import { describe, expect, it } from 'vitest';
import { expRequired, PlayerProgress } from '../src/game/player/PlayerProgress';

describe('experience', () => {
  it('carries excess exp into the next level', () => {
    const progress = new PlayerProgress();
    progress.gain(45);
    expect(expRequired(1)).toBe(40);
    expect(progress.level).toBe(2);
    expect(progress.exp).toBe(5);
    expect(progress.pendingUpgrades).toBe(1);
  });
});
