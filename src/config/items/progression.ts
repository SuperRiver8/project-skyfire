// 所有可叠加道具及武器共用等级上限，改此处即可调整整套升级规则。
export const playerUpgradeConfig = {
  maxLevel: 4,
  missileOverdriveMax: 3,
} as const;

export function capUpgradeLevel(value: number): number {
  return Number.isFinite(value)
    ? Math.max(0, Math.min(playerUpgradeConfig.maxLevel, Math.round(value)))
    : 0;
}
