import { describe, expect, it } from 'vitest';
import { level01 } from '../src/config/levels/level01';
import { WaveManager } from '../src/game/level/WaveManager';

describe('WaveManager', () => {
  it('spawns the configured first group and waits for surviving enemies before completion', () => {
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
    expect(complete).toBe(false);
    manager.update(0, 0);
    expect(complete).toBe(true);
  });
});
