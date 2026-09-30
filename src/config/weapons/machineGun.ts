import { playerUpgradeConfig } from '../items/progression';
export const machineGunConfig = {
  id: 'machine_gun',
  damage: 10,
  fireIntervalMs: 180,
  bulletSpeed: 900,
  muzzleOffsetY: 29,
  doubleBarrelOffsetX: 9,
  bulletPoolSize: 32,
  maxUpdateDeltaMs: 50,
  maxLevel: playerUpgradeConfig.maxLevel,
} as const;
