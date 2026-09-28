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
  backgroundId: BackgroundId;
  durationMs: number;
  waves: WaveConfig[];
  bossId?: string;
  bossHpMultiplier?: number;
  rewards: { coins: number };
}

export type BackgroundId =
  'starfield' | 'neon_city' | 'red_alert' | 'storm_fortress' | 'imperial_sky';
