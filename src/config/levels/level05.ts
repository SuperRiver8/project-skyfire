import type { LevelConfig } from './types';

export const level05: LevelConfig = {
  id: 5,
  name: '天空帝皇',
  chapter: 1,
  backgroundId: 'city_sky',
  durationMs: 28_000,
  waves: [
    {
      startAtMs: 0,
      groups: [{ enemyId: 'scout', count: 6, intervalMs: 450, pattern: 'V' }],
    },
    {
      startAtMs: 9_000,
      groups: [
        {
          enemyId: 'shooter',
          count: 4,
          intervalMs: 1000,
          pattern: 'LEFT_RIGHT',
        },
      ],
    },
    {
      startAtMs: 18_000,
      groups: [
        {
          enemyId: 'zigzag_fighter',
          count: 6,
          intervalMs: 600,
          pattern: 'LINE',
        },
      ],
    },
  ],
  bossId: 'sky_tyrant',
  bossHpMultiplier: 1,
  rewards: { coins: 180 },
};
