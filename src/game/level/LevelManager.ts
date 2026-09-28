import { level01 } from '../../config/levels/level01';
import { level02 } from '../../config/levels/level02';
import { level03 } from '../../config/levels/level03';
import { level04 } from '../../config/levels/level04';
import { level05 } from '../../config/levels/level05';
import type { LevelConfig } from '../../config/levels/types';

const levels: Record<number, LevelConfig> = {
  1: level01,
  2: level02,
  3: level03,
  4: level04,
  5: level05,
};

export function getLevelConfig(levelId: number): LevelConfig {
  const config = levels[levelId];
  if (!config) throw new Error(`Unknown level: ${levelId}`);
  return config;
}
