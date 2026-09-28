export type SpawnPattern =
  'LINE' | 'V' | 'LEFT_RIGHT' | 'RANDOM' | 'CIRCLE' | 'CUSTOM';

export interface SpawnGroupConfig {
  enemyId: string;
  count: number;
  intervalMs: number;
  pattern: SpawnPattern;
  startX?: number;
}

export interface WaveConfig {
  startAtMs: number;
  groups: SpawnGroupConfig[];
}

export interface LevelConfig {
  id: number;
  name: string;
  chapter: number;
  backgroundId: string;
  durationMs: number;
  waves: WaveConfig[];
  bossId?: string;
  bossHpMultiplier?: number;
  rewards: { coins: number };
}
