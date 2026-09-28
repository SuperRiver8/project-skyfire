import type { LevelConfig } from './types';

export const level03: LevelConfig = {
  id: 3,
  name: '红色警戒',
  chapter: 1,
  backgroundId: 'city_sky',
  durationMs: 95_000,
  waves: [
    {
      startAtMs: 0,
      groups: [
        { enemyId: 'scout', count: 8, intervalMs: 350, pattern: 'LINE' },
      ],
    },
    {
      startAtMs: 16_000,
      groups: [
        {
          enemyId: 'charger',
          count: 4,
          intervalMs: 1500,
          pattern: 'LEFT_RIGHT',
        },
      ],
    },
    {
      startAtMs: 34_000,
      groups: [{ enemyId: 'shooter', count: 6, intervalMs: 850, pattern: 'V' }],
    },
    {
      startAtMs: 52_000,
      groups: [
        {
          enemyId: 'zigzag_fighter',
          count: 7,
          intervalMs: 600,
          pattern: 'LINE',
        },
        { enemyId: 'charger', count: 4, intervalMs: 1700, pattern: 'V' },
      ],
    },
    {
      startAtMs: 74_000,
      groups: [
        {
          enemyId: 'shooter',
          count: 6,
          intervalMs: 700,
          pattern: 'LEFT_RIGHT',
        },
        { enemyId: 'charger', count: 5, intervalMs: 1100, pattern: 'LINE' },
      ],
    },
  ],
  rewards: { coins: 90 },
};
