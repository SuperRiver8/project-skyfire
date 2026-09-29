import { describe, expect, it } from 'vitest';
import { spawnX } from '../src/game/level/SpawnManager';

describe('enemy spawn positions', () => {
  it('keeps the entire aircraft on screen even at the ends of a long V formation', () => {
    const group = {
      enemyId: 'scout',
      count: 12,
      intervalMs: 300,
      pattern: 'V' as const,
    };
    for (let index = 0; index < group.count; index += 1) {
      expect(spawnX(group, index)).toBeGreaterThanOrEqual(40);
      expect(spawnX(group, index)).toBeLessThanOrEqual(500);
    }
  });

  it('separates a doubled custom pair', () => {
    const group = {
      enemyId: 'heavy_tank',
      count: 2,
      intervalMs: 1,
      pattern: 'CUSTOM' as const,
      startX: 270,
    };
    expect(spawnX(group, 0)).toBe(230);
    expect(spawnX(group, 1)).toBe(310);
  });
});
