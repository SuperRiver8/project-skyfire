import { describe, expect, it } from 'vitest';
import { SaveManager } from '../src/game/save/SaveManager';
import { RunScore } from '../src/game/combat/RunScore';

describe('SaveManager', () => {
  it('normalizes old fractional statistics and persists a cumulative run', () => {
    let stored = '';
    const manager = new SaveManager({
      getItem: () => stored,
      setItem: (_key, value) => {
        stored = value;
      },
      removeItem: () => {},
    });
    const save = manager.migrate({
      totalCoins: 40.8,
      highestUnlockedLevel: 2.7,
      stats: { totalKills: 12.2, totalPlayTimeMs: 1000.8, bossesKilled: -1 },
    });
    expect(save.totalCoins).toBe(41);
    expect(save.highestUnlockedLevel).toBe(3);
    expect(save.stats).toEqual({
      totalKills: 12,
      totalPlayTimeMs: 1001,
      bossesKilled: 0,
    });
    const score = new RunScore(1);
    score.awardEnemy(100, 1);
    score.completeLevel(1);
    save.bestRun = {
      ...score.snapshot(),
      score: score.total,
      victory: false,
      levelReached: 2,
      elapsedTimeMs: 60000,
      kills: 1,
      damageDealt: 30,
      damageTaken: 0,
    };
    manager.save(save);
    expect(manager.load().bestRun).toEqual(save.bestRun);
    expect(
      manager.migrate({ bestRun: { ...save.bestRun, rulesVersion: 0 } })
        .bestRun,
    ).toBeUndefined();
  });
  it('migrates older partial data and preserves progress', () => {
    const manager = new SaveManager({
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    });
    const save = manager.migrate({ highestUnlockedLevel: 3, totalCoins: 40 });
    expect(save.highestUnlockedLevel).toBe(3);
    expect(save.settings.damageNumbers).toBe(true);
    expect(save.totalCoins).toBe(40);
  });
});
