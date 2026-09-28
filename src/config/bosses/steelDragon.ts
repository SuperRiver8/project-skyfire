import type { BossConfig } from './types';

/** 第 2 关 Boss：钢铁飞龙，红黑双翼、喷射火焰更快 */
export const steelDragonConfig: BossConfig = {
  id: 'steel_dragon',
  name: '钢铁飞龙',
  maxHp: 12_000,
  phase2Threshold: 0.72,
  phase3Threshold: 0.36,
  enterMs: 1100,
  transitionMs: 500,
  deathMs: 1100,
  displayScale: 1.12,
  attacks: [
    // 龙炎吐息（持续喷火封锁）
    { id: 'flame_breath', intervalMs: [4200, 3600, 3000], unlockPhase: 1 },
    // 熔核火雨
    { id: 'fire_rain', intervalMs: [3400, 2900, 2400], unlockPhase: 1 },
    // 烈焰龙翼斩
    { id: 'wing_slash', intervalMs: [3000, 2600, 2200], unlockPhase: 2 },
    // 钢尾横扫
    { id: 'tail_sweep', intervalMs: [4600, 4000, 3400], unlockPhase: 2 },
  ],
  visual: {
    engineOffsets: [-38, 38],
    engineY: -55,
    engineCoreY: -56,
    wingX: [-74, 74],
    wingY: 2,
    wingColor: 0x5c1f28,
    highlightOffsets: [-68, 68],
    highlightY: 8,
    highlightColor: 0xff9d7a,
    turretOffsets: [],
    turretY: 0,
    turretStrokeColor: 0xffffff,
    coreY: 22,
    coreRadius: 14,
    coreColors: [0xff8c3f, 0xff3f2c],
    phase3Tint: 0xff8f7a,
  },
};
