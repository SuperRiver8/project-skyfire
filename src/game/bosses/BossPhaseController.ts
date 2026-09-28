import { mechanicalEagleConfig } from '../../config/bosses/mechanicalEagle';

export type BossPhase = 1 | 2 | 3;
export function phaseForHp(hp: number, maxHp: number): BossPhase {
  const ratio = hp / maxHp;
  if (ratio <= mechanicalEagleConfig.phase3Threshold) return 3;
  if (ratio <= mechanicalEagleConfig.phase2Threshold) return 2;
  return 1;
}
