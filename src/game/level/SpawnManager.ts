import type { SpawnGroupConfig } from '../../config/levels/types';
import { GAME_WIDTH } from '../viewport';

export function spawnX(group: SpawnGroupConfig, index: number): number {
  const count = Math.max(1, group.count);
  let x: number;
  switch (group.pattern) {
    case 'V':
      x =
        GAME_WIDTH *
        (0.5 + (index % 2 === 0 ? 1 : -1) * Math.ceil(index / 2) * 0.1);
      break;
    case 'LEFT_RIGHT':
      x = GAME_WIDTH * (index % 2 === 0 ? 0.25 : 0.75);
      break;
    case 'LINE':
      x =
        GAME_WIDTH *
        (0.18 +
          (index % Math.min(count, 5)) *
            (0.64 / Math.max(1, Math.min(count, 5) - 1)));
      break;
    case 'CIRCLE':
      x = GAME_WIDTH * (0.5 + 0.3 * Math.sin((index / count) * Math.PI * 2));
      break;
    case 'RANDOM':
      x = GAME_WIDTH * (0.15 + ((index * 0.61803398875) % 1) * 0.7);
      break;
    case 'CUSTOM':
      x = group.startX ?? GAME_WIDTH / 2;
      break;
  }
  const margin =
    group.enemyId === 'zigzag_fighter'
      ? 88
      : group.enemyId === 'heavy_tank'
        ? 64
        : 40;
  return Math.max(margin, Math.min(GAME_WIDTH - margin, x));
}
