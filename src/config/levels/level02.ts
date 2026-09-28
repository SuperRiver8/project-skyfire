import type { LevelConfig } from './types';

export const level02: LevelConfig = {
  id: 2,
  name: '交叉火力',
  chapter: 1,
  backgroundId: 'city_sky',
  durationMs: 90_000,
  waves: [
    {
      startAtMs: 0,
      groups: [{ enemyId: 'scout', count: 8, intervalMs: 400, pattern: 'V' }],
    },
    {
      startAtMs: 14_000,
      groups: [
        {
          enemyId: 'zigzag_fighter',
          count: 6,
          intervalMs: 650,
          pattern: 'LINE',
        },
      ],
    },
    {
      startAtMs: 28_000,
      groups: [
        {
          enemyId: 'shooter',
          count: 5,
          intervalMs: 950,
          pattern: 'LEFT_RIGHT',
        },
      ],
    },
    {
      startAtMs: 44_000,
      groups: [
        { enemyId: 'scout', count: 9, intervalMs: 320, pattern: 'V' },
        { enemyId: 'shooter', count: 4, intervalMs: 1100, pattern: 'LINE' },
      ],
    },
    {
      startAtMs: 66_000,
      groups: [
        {
          enemyId: 'zigzag_fighter',
          count: 8,
          intervalMs: 550,
          pattern: 'LEFT_RIGHT',
        },
        { enemyId: 'shooter', count: 5, intervalMs: 900, pattern: 'V' },
      ],
    },
  ],
  bossId: 'steel_dragon',
  bossHpMultiplier: 0.5,
  rewards: { coins: 70 },
};
