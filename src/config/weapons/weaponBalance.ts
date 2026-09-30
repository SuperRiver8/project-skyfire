import { playerUpgradeConfig } from '../items/progression';
export const weaponBalance = {
  spread: {
    intervalMs: 650,
    damage: 7,
    speed: 700,
    maxLevel: playerUpgradeConfig.maxLevel,
  },
  laser: {
    intervalMs: 900,
    damage: 24,
    durationMs: 110,
    width: 15,
    maxLevel: playerUpgradeConfig.maxLevel,
  },
  missile: {
    intervalMs: 1400,
    damage: 32,
    speed: 340,
    radius: 52,
    maxLevel: playerUpgradeConfig.maxLevel,
  },
  lightning: {
    intervalMs: 1100,
    damage: 22,
    chainRadius: 240,
    durationMs: 240,
    maxLevel: playerUpgradeConfig.maxLevel,
  },
} as const;
