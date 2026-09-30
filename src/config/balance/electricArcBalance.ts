import { playerUpgradeConfig } from '../items/progression';
export const electricArcBalance = {
  maxStacks: playerUpgradeConfig.maxLevel,
  attackIntervalMs: 220,
  baseRange: 260,
  rangePerStack: 40,
  baseDamage: 7,
  damagePerStack: 4,
} as const;
