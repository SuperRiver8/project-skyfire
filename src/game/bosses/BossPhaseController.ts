import { getBossConfig } from '../../config/bosses';
import type { BossAttack } from '../../config/bosses/types';

export type BossPhase = 1 | 2 | 3;
export function initialAttackElapsed(
  attack: BossAttack,
  phase: BossPhase,
): number {
  if (attack.firstCastDelayMs === undefined) return 0;
  return Math.max(0, attack.intervalMs[phase - 1] - attack.firstCastDelayMs);
}

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
