import type { LevelConfig } from './types';

export const level04: LevelConfig = {
  id: 4,
  name: '最后防线',
  chapter: 1,
  backgroundId: 'storm_fortress',
  durationMs: 110_000,
  waves: [
    {
      startAtMs: 0,
      groups: [
        { enemyId: 'scout', count: 10, intervalMs: 320, pattern: 'V' },
        {
          enemyId: 'zigzag_fighter',
          count: 5,
          intervalMs: 700,
          pattern: 'LINE',
        },
      ],
    },
    {
      startAtMs: 25_000,
      groups: [
        {
          enemyId: 'heavy_tank',
          count: 1,
          intervalMs: 1,
          pattern: 'CUSTOM',
          startX: 270,
        },
        {
          enemyId: 'shooter',
          count: 5,
          intervalMs: 900,
          pattern: 'LEFT_RIGHT',
        },
      ],
    },
    {
      startAtMs: 50_000,
      groups: [
        { enemyId: 'kamikaze', count: 7, intervalMs: 900, pattern: 'LINE' },
        { enemyId: 'shooter', count: 5, intervalMs: 1100, pattern: 'V' },
      ],
    },
    {
      startAtMs: 82_000,
      groups: [
        {
          enemyId: 'heavy_tank',
          count: 2,
          intervalMs: 3500,
          pattern: 'LEFT_RIGHT',
        },
        { enemyId: 'kamikaze', count: 8, intervalMs: 750, pattern: 'V' },
      ],
    },
  ],
  bossId: 'iron_bastion',
  bossHpMultiplier: 0.8,
  rewards: { coins: 120 },
};
