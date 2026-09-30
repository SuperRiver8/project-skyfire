import type { BossConfig } from '../bosses/types';
import type { EnemyConfig } from '../enemies/types';

export interface LevelDifficulty {
  readonly target: number;
  readonly enemyCount: number;
  readonly spawnDensity: number;
  readonly enemySpeed: number;
  readonly bulletSpeed: number;
  readonly enemyHp: number;
  readonly fireRate: number;
  readonly damage: number;
  readonly bossHp: number;
  readonly bossFireRate: number;
  readonly itemDropCount: number;
  readonly itemDropDensity: number;
}

function createDifficulty(target: number, itemDropCount = 1): LevelDifficulty {
  const increase = target - 1;
  // 沿用已有分配标准：数量/耐久取增幅的 50%，速度/射频取 25%，弹速取 40%，伤害取 15%。
  return {
    target,
    enemyCount: 1 + increase * 0.5,
    spawnDensity: 1 + increase * 0.5,
    enemySpeed: 1 + increase * 0.25,
    bulletSpeed: 1 + increase * 0.4,
    enemyHp: 1 + increase * 0.5,
    fireRate: 1 + increase * 0.25,
    damage: 1 + increase * 0.15,
    bossHp: 1 + increase * 0.5,
    bossFireRate: 1 + increase * 0.25,
    itemDropCount,
    itemDropDensity: target,
  };
}

// 替换目标值后从原有基准重新推导各项，不与上一版参数重复叠加。
export const levelDifficulties: Readonly<Record<number, LevelDifficulty>> = {
  1: createDifficulty(1),
  2: createDifficulty(2),
  3: createDifficulty(3),
  4: createDifficulty(4),
  // 仅第五关双份掉落；掉落频率仍由各关目标难度决定。
  5: createDifficulty(5, 2),
};

export function getLevelDifficulty(levelId: number): LevelDifficulty {
  const difficulty = levelDifficulties[levelId];
  if (!difficulty) throw new Error(`Unknown level difficulty: ${levelId}`);
  return difficulty;
}

export function allocateEnemyCounts(
  baseCounts: number[],
  multiplier: number,
): number[] {
  const desired = baseCounts.map((count) => count * multiplier);
  const counts = desired.map(Math.floor);
  const remaining =
    Math.round(desired.reduce((total, count) => total + count, 0)) -
    counts.reduce((total, count) => total + count, 0);
  // 按小数余量分配额外敌机，全关只取整一次，避免每个小组都向上取整。
  const order = desired
    .map((count, index) => ({ index, fraction: count - counts[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const { index } of order.slice(0, remaining)) counts[index] += 1;
  return counts;
}

export function scaleEnemyConfig(
  config: EnemyConfig,
  difficulty: LevelDifficulty,
): EnemyConfig {
  return {
    ...config,
    maxHp: Math.round(config.maxHp * difficulty.enemyHp),
    speed: config.speed * difficulty.enemySpeed,
    collisionDamage: Math.round(config.collisionDamage * difficulty.damage),
    exp: config.exp / difficulty.enemyCount,
    fireIntervalMs:
      config.fireIntervalMs === undefined
        ? undefined
        : Math.round(config.fireIntervalMs / difficulty.fireRate),
    zigzagFrequency:
      config.zigzagFrequency === undefined
        ? undefined
        : config.zigzagFrequency * difficulty.enemySpeed,
    // 冲锋增速仅取普通飞行增幅的一半，保留蓄力和自爆预警。
    chargeSpeed:
      config.chargeSpeed === undefined
        ? undefined
        : config.chargeSpeed * (1 + (difficulty.enemySpeed - 1) / 2),
  };
}

export function scaleBossConfig(
  config: BossConfig,
  hpMultiplier: number,
  difficulty: LevelDifficulty,
): BossConfig {
  return {
    ...config,
    maxHp: Math.round(config.maxHp * hpMultiplier * difficulty.bossHp),
    attacks: config.attacks.map((attack) => ({
      ...attack,
      // 护盾保持原覆盖率；只加快攻击技能，首次等待和技能内预警不缩短。
      intervalMs: attack.intervalMs.map((interval) =>
        attack.id === 'shield_matrix'
          ? interval
          : Math.round(interval / difficulty.bossFireRate),
      ) as [number, number, number],
    })),
  };
}
