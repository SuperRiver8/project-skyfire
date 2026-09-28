import { getBossConfig } from '../../config/bosses';

export type BossPhase = 1 | 2 | 3;
export function phaseForHp(
  hp: number,
  maxHp: number,
  bossId = 'mechanical_eagle',
): BossPhase {
  const config = getBossConfig(bossId);
  const ratio = hp / maxHp;
  if (ratio <= config.phase3Threshold) return 3;
  if (ratio <= config.phase2Threshold) return 2;
  return 1;
}
