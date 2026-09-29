import { describe, expect, it } from 'vitest';
import { level01 } from '../src/config/levels/level01';
import { WaveManager } from '../src/game/level/WaveManager';
import { getLevelConfig } from '../src/game/level/LevelManager';
import { scoutConfig } from '../src/config/enemies/scout';
import { zigzagFighterConfig } from '../src/config/enemies/zigzagFighter';
import {
  chargerConfig,
  heavyTankConfig,
  kamikazeConfig,
  shooterConfig,
} from '../src/config/enemies/advanced';

describe('WaveManager', () => {
  it('uses a different background for each level', () => {
    const backgrounds = Array.from(
      { length: 5 },
      (_, index) => getLevelConfig(index + 1).backgroundId,
    );
    expect(new Set(backgrounds).size).toBe(5);
  });

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
    for (let i = 0; i < 50; i += 1) manager.update(100, 1);
    expect(count).toBe(10);
    for (let i = 0; i < 750; i += 1) manager.update(100, 1);
    expect(complete).toBe(true);
  });

  it('fills a long cleared gap before the next scheduled wave', () => {
    const spawned: string[] = [];
    const manager = new WaveManager(
      level01,
      (id) => spawned.push(id),
      () => {},
    );
    for (let i = 0; i < 50; i += 1) manager.update(100, 1);
    expect(spawned).toHaveLength(10);
    for (let i = 0; i < 10; i += 1) manager.update(100, 0);
    expect(spawned).toHaveLength(12);
    expect(spawned.slice(-2)).toEqual(['scout', 'scout']);
  });

  it('lets every enemy type fire, with slow opening scouts', () => {
    const configs = [
      scoutConfig,
      zigzagFighterConfig,
      shooterConfig,
      chargerConfig,
      kamikazeConfig,
      heavyTankConfig,
    ];
    expect(configs.every((config) => (config.fireIntervalMs ?? 0) > 0)).toBe(
      true,
    );
    expect(scoutConfig.fireIntervalMs ?? 0).toBeGreaterThan(
      shooterConfig.fireIntervalMs ?? 0,
    );
  });
});
