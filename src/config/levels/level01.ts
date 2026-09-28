import type { LevelConfig } from './types';

export const level01: LevelConfig = {
  id: 1,
  name: '初次升空',
  chapter: 1,
  backgroundId: 'city_sky',
  durationMs: 75_000,
  waves: [
    {
      startAtMs: 0,
      groups: [{ enemyId: 'scout', count: 5, intervalMs: 500, pattern: 'V' }],
    },
    {
      startAtMs: 10_000,
      groups: [
        { enemyId: 'scout', count: 8, intervalMs: 400, pattern: 'LEFT_RIGHT' },
      ],
    },
    {
      startAtMs: 22_000,
      groups: [
        {
          enemyId: 'zigzag_fighter',
          count: 4,
          intervalMs: 900,
          pattern: 'LINE',
        },
      ],
    },
    {
      startAtMs: 35_000,
      groups: [{ enemyId: 'scout', count: 10, intervalMs: 350, pattern: 'V' }],
    },
    {
      startAtMs: 48_000,
      groups: [
        {
          enemyId: 'zigzag_fighter',
          count: 6,
          intervalMs: 700,
          pattern: 'LEFT_RIGHT',
        },
      ],
    },
    {
      startAtMs: 60_000,
      groups: [
        { enemyId: 'scout', count: 12, intervalMs: 300, pattern: 'LINE' },
      ],
    },
  ],
  bossId: 'mechanical_eagle',
  bossHpMultiplier: 0.35,
  rewards: { coins: 50 },
};
