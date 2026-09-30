import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import {
  allocateEnemyCounts,
  getLevelDifficulty,
  scaleBossConfig,
  scaleEnemyConfig,
} from '../src/config/balance/levelDifficulty';
import { getBossConfig } from '../src/config/bosses';
import {
  chargerConfig,
  heavyTankConfig,
  shooterConfig,
} from '../src/config/enemies/advanced';
import { zigzagFighterConfig } from '../src/config/enemies/zigzagFighter';
import { getLevelConfig } from '../src/game/level/LevelManager';
import {
  initialAttackElapsed,
  phaseForHp,
} from '../src/game/bosses/BossPhaseController';
import { EnemyFactory } from '../src/game/enemies/EnemyFactory';
import { WaveManager } from '../src/game/level/WaveManager';

vi.mock('phaser', () => ({ default: { GameObjects: { Image: class {} } } }));

describe('level difficulty', () => {
  it('keeps level one unchanged and scales enemies from independent base configs', () => {
    expect([1, 2, 3, 4, 5].map((id) => getLevelDifficulty(id).target)).toEqual([
      1, 1.5, 2, 2.5, 3,
    ]);
    expect(scaleEnemyConfig(shooterConfig, getLevelDifficulty(1))).toEqual(
      shooterConfig,
    );
    const original = structuredClone(chargerConfig);
    const scaled = scaleEnemyConfig(chargerConfig, getLevelDifficulty(5));
    expect(scaled).toMatchObject({
      maxHp: 140,
      speed: 108,
      chargeSpeed: 600,
      chargeDelayMs: 650,
      fireIntervalMs: 1600,
    });
    expect(scaled.collisionDamage).toBeCloseTo(28.6);
    expect(scaleEnemyConfig(chargerConfig, getLevelDifficulty(5))).toEqual(
      scaled,
    );
    expect(chargerConfig).toEqual(original);
    expect(
      scaleEnemyConfig(zigzagFighterConfig, getLevelDifficulty(5)),
    ).toMatchObject({ zigzagFrequency: 0.006, zigzagAmplitude: 48 });
  });

  it('allocates extra aircraft once for the whole level instead of rounding every group up', () => {
    const counts = [2, 2, 2, 2, 2];
    expect(allocateEnemyCounts(counts, 1.1)).toEqual([3, 2, 2, 2, 2]);
    expect(counts).toEqual([2, 2, 2, 2, 2]);
  });

  it('distributes integer experience without multiplying stats again on repeated spawns', () => {
    const scene = {} as Phaser.Scene;
    const factory = new EnemyFactory(scene, getLevelDifficulty(5));
    const configs = Array.from({ length: 20 }, () =>
      factory.getConfig('heavy_tank'),
    );
    expect(
      configs.every(({ maxHp, exp }) => maxHp === 520 && Number.isInteger(exp)),
    ).toBe(true);
    expect(configs.reduce((total, config) => total + config.exp, 0)).toBe(
      10 * heavyTankConfig.exp,
    );
    expect(new EnemyFactory(scene).getConfig('heavy_tank')).toEqual(
      heavyTankConfig,
    );
    expect(heavyTankConfig.maxHp).toBe(260);
  });

  it('keeps scheduled-wave experience close to the previous level budget', () => {
    for (let levelId = 1; levelId <= 5; levelId += 1) {
      const level = getLevelConfig(levelId);
      const scene = {} as Phaser.Scene;
      const baseFactory = new EnemyFactory(scene);
      const factory = new EnemyFactory(scene, getLevelDifficulty(levelId));
      const baseExp = level.waves
        .flatMap((wave) => wave.groups)
        .reduce(
          (total, group) =>
            total + group.count * 2 * baseFactory.getConfig(group.enemyId).exp,
          0,
        );
      const manager = new WaveManager(
        level,
        () => {},
        () => {},
      );
      let exp = 0;
      for (const { config } of manager.groups)
        for (let index = 0; index < config.count; index += 1)
          exp += factory.getConfig(config.enemyId).exp;
      expect(Math.abs(exp - baseExp) / baseExp).toBeLessThan(0.02);
    }
  });

  it('scales final boss health and attack intervals while preserving warnings and the shield', () => {
    const expectedHp = [3500, 7500, 21263, 34125, 52800];
    for (let levelId = 1; levelId <= 5; levelId += 1) {
      const level = getLevelConfig(levelId);
      const base = getBossConfig(level.bossId!);
      const original = structuredClone(base);
      const scaled = scaleBossConfig(
        base,
        level.bossHpMultiplier!,
        getLevelDifficulty(levelId),
      );
      expect(scaled.maxHp).toBe(expectedHp[levelId - 1]);
      expect(
        phaseForHp(scaled.maxHp * base.phase2Threshold, scaled.maxHp, base.id),
      ).toBe(2);
      expect(scaled.enterMs).toBe(base.enterMs);
      expect(scaled.transitionMs).toBe(base.transitionMs);
      for (const attack of scaled.attacks) {
        const previous = base.attacks.find(({ id }) => id === attack.id)!;
        expect(attack.firstCastDelayMs).toBe(previous.firstCastDelayMs);
        if (attack.firstCastDelayMs !== undefined)
          expect(attack.intervalMs[1] - initialAttackElapsed(attack, 2)).toBe(
            attack.firstCastDelayMs,
          );
        if (attack.id === 'shield_matrix' || levelId === 1)
          expect(attack.intervalMs).toEqual(previous.intervalMs);
        else expect(attack.intervalMs[2]).toBeLessThan(previous.intervalMs[2]);
      }
      expect(base).toEqual(original);
    }
  });
});
