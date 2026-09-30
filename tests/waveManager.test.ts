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
import { getLevelDifficulty } from '../src/config/balance/levelDifficulty';

describe('WaveManager', () => {
  it('adds density without delaying bosses or mutating the base waves', () => {
    const totals = [90, 113, 120, 151, 64];
    for (let levelId = 1; levelId <= 5; levelId += 1) {
      const level = getLevelConfig(levelId);
      const original = structuredClone(level);
      let spawned = 0;
      let completed = 0;
      const manager = new WaveManager(
        level,
        () => spawned++,
        () => completed++,
      );
      expect(
        manager.groups.reduce((total, group) => total + group.config.count, 0),
      ).toBe(totals[levelId - 1]);
      for (let time = 0; time < level.durationMs; time += 100)
        manager.update(100, 1);
      expect(spawned).toBe(totals[levelId - 1]);
      expect(completed).toBe(1);
      manager.update(100, 0);
      expect(completed).toBe(1);
      expect(level).toEqual(original);
    }
    const firstGroup = new WaveManager(
      getLevelConfig(2),
      () => {},
      () => {},
    ).groups[0].config;
    expect(firstGroup.count).toBe(20);
    expect(firstGroup.intervalMs).toBe(320);
    const tankGroup = new WaveManager(
      getLevelConfig(4),
      () => {},
      () => {},
    ).groups.find(({ config }) => config.enemyId === 'heavy_tank')!;
    expect(tankGroup.config.intervalMs).toBe(1);
  });

  it('fills cleared gaps faster but respects the next-wave guard', () => {
    for (const levelId of [1, 5]) {
      const level = {
        ...getLevelConfig(levelId),
        waves: [
          {
            startAtMs: 2000,
            groups: [
              {
                enemyId: 'scout',
                count: 1,
                intervalMs: 500,
                pattern: 'LINE' as const,
              },
            ],
          },
        ],
      };
      const spawns: string[] = [];
      const manager = new WaveManager(
        level,
        (id) => spawns.push(id),
        () => {},
      );
      manager.update(100, 0);
      const expectedMs = Math.round(
        950 / getLevelDifficulty(levelId).spawnDensity,
      );
      // 下一波保护内即使清屏够久也不能补机。
      for (let time = 100; time < expectedMs; time += 100)
        manager.update(100, 0);
      expect(spawns).toHaveLength(0);
    }

    const spawns: string[] = [];
    const manager = new WaveManager(
      { ...getLevelConfig(5), waves: [] },
      (id) => spawns.push(id),
      () => {},
    );
    for (let time = 0; time < 400; time += 100) manager.update(100, 0);
    expect(spawns).toHaveLength(0);
    manager.update(100, 0);
    expect(spawns).toEqual(['shooter', 'shooter']);
  });

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
