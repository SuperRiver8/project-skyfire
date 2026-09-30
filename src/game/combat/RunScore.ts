import { integer } from '../utils/Integer';

// 调整计分或难度后必须升级规则版本，排行榜只比较同一版本。
// 第 3 版调整等级上限、敌机生命、Boss 体型/护罩及关卡时长。
export const SCORE_RULES_VERSION = 3;
export interface ScoreState {
  rulesVersion: number;
  startLevel: number;
  ranked: boolean;
  enemyPoints: number;
  bossPoints: number;
  clearPoints: number;
  completedLevels: number[];
}
export interface RunRecord extends ScoreState {
  score: number;
  victory: boolean;
  levelReached: number;
  elapsedTimeMs: number;
  kills: number;
  damageDealt: number;
  damageTaken: number;
}

export class RunScore {
  private readonly state: ScoreState;
  constructor(startLevel: number, previous?: ScoreState) {
    this.state = previous
      ? { ...previous, completedLevels: [...previous.completedLevels] }
      : {
          rulesVersion: SCORE_RULES_VERSION,
          startLevel,
          ranked: startLevel === 1,
          enemyPoints: 0,
          bossPoints: 0,
          clearPoints: 0,
          completedLevels: [],
        };
  }

  awardEnemy(basePoints: number, level: number): void {
    this.state.enemyPoints += integer(basePoints) * level;
  }

  completeLevel(level: number): void {
    if (this.state.completedLevels.includes(level)) return;
    this.state.completedLevels.push(level);
    // Boss 击破和通关固定加分，不按伤害、道具或时间反复刷分。
    this.state.bossPoints += 2_000 * level;
    this.state.clearPoints += 1_000 * level;
  }

  markPractice(): void {
    this.state.ranked = false;
  }

  get total(): number {
    return (
      this.state.enemyPoints + this.state.bossPoints + this.state.clearPoints
    );
  }

  snapshot(): ScoreState {
    return { ...this.state, completedLevels: [...this.state.completedLevels] };
  }
}

/** 同规则：分数高优先，其次通关多、用时短、实际受伤少。 */
export function isBetterRun(
  candidate: RunRecord,
  current?: RunRecord,
): boolean {
  if (!candidate.ranked || candidate.rulesVersion !== SCORE_RULES_VERSION)
    return false;
  if (
    !current ||
    !current.ranked ||
    current.rulesVersion !== candidate.rulesVersion
  )
    return true;
  if (candidate.score !== current.score) return candidate.score > current.score;
  if (candidate.completedLevels.length !== current.completedLevels.length)
    return candidate.completedLevels.length > current.completedLevels.length;
  if (candidate.elapsedTimeMs !== current.elapsedTimeMs)
    return candidate.elapsedTimeMs < current.elapsedTimeMs;
  return candidate.damageTaken < current.damageTaken;
}
