import { describe, expect, it } from 'vitest';
import { level01 } from '../src/config/levels/level01';
import { WaveManager } from '../src/game/level/WaveManager';
import { getLevelConfig } from '../src/game/level/LevelManager';

describe('WaveManager', () => {
  it('configures a distinct boss for every playable level', () => {
    const bossIds = new Set(
      Array.from({ length: 5 }, (_, index) => index + 1).map((level) => {
        const bossId = getLevelConfig(level).bossId;
        expect(bossId).toBeTruthy();
        return bossId;
      }),
    );
    expect(bossIds.size).toBe(5);
  });
  it('spawns the configured first group and starts the boss after the level duration', () => {
    let count = 0;
    let complete = false;
    const manager = new WaveManager(
      level01,
      () => {
        count += 1;
      },
      () => {
        complete = true;
      },
    );
    for (let i = 0; i < 21; i += 1) manager.update(100, 1);
    expect(count).toBe(5);
    for (let i = 0; i < 750; i += 1) manager.update(100, 1);
    expect(complete).toBe(true);
  });
});
