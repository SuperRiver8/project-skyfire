import { describe, expect, it } from 'vitest';
import {
  RunScore,
  isBetterRun,
  type RunRecord,
} from '../src/game/combat/RunScore';

describe('campaign scoring', () => {
  it('carries enemy, boss and clear points through all five levels exactly once', () => {
    let score = new RunScore(1);
    for (let level = 1; level <= 5; level += 1) {
      score.awardEnemy(100, level);
      score.awardEnemy(0, level); // 空档补怪没有分数。
      score.completeLevel(level);
      score.completeLevel(level);
      if (level < 5) score = new RunScore(level + 1, score.snapshot());
    }
    expect(score.total).toBe(46500);
    expect(score.snapshot()).toMatchObject({
      enemyPoints: 1500,
      bossPoints: 30000,
      clearPoints: 15000,
      completedLevels: [1, 2, 3, 4, 5],
      ranked: true,
    });
  });

  it('excludes practice runs and applies deterministic tie breakers', () => {
    const score = new RunScore(1);
    score.completeLevel(1);
    const record: RunRecord = {
      ...score.snapshot(),
      score: score.total,
      victory: false,
      levelReached: 2,
      elapsedTimeMs: 60000,
      kills: 1,
      damageDealt: 30,
      damageTaken: 20,
    };
    expect(isBetterRun({ ...record, score: 3100 }, record)).toBe(true);
    expect(isBetterRun({ ...record, elapsedTimeMs: 59000 }, record)).toBe(true);
    expect(isBetterRun({ ...record, damageTaken: 10 }, record)).toBe(true);
    expect(isBetterRun({ ...record, ranked: false })).toBe(false);
    expect(
      isBetterRun(record, { ...record, rulesVersion: 1, score: 999999 }),
    ).toBe(true);
    expect(new RunScore(3).snapshot().ranked).toBe(false);
    score.markPractice();
    expect(score.snapshot().ranked).toBe(false);
  });
});
