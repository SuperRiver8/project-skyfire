import type { BossConfig } from './types';

/** 第 4 关 Boss：铁壁堡垒，装甲厚重、弹幕量更大 */
export const ironBastionConfig: BossConfig = {
  id: 'iron_bastion',
  name: '铁壁堡垒',
  maxHp: 15_000,
  phase2Threshold: 0.8,
  phase3Threshold: 0.46,
  enterMs: 1300,
  transitionMs: 550,
  deathMs: 1200,
  displayScale: 1.2,
  attacks: [
    // 重炮齐射
    { id: 'cannon_volley', intervalMs: [2800, 2300, 1900], unlockPhase: 1 },
    // 导弹仓弹幕
    { id: 'missile_barrage', intervalMs: [3500, 2900, 2400], unlockPhase: 1 },
    // 护盾矩阵（减伤）
    { id: 'shield_matrix', intervalMs: [6000, 5000, 4100], unlockPhase: 2 },
    // 预警后交错封锁三条通道
    {
      id: 'bastion_lockdown',
      intervalMs: [6500, 5200, 4200],
      unlockPhase: 2,
      firstCastDelayMs: 1000,
    },
    // 三引擎冲锋压制
    { id: 'engine_charge', intervalMs: [7000, 5700, 4600], unlockPhase: 3 },
  ],
  visual: {
    engineOffsets: [-50, 0, 50],
    engineY: -58,
    engineCoreY: -59,
    wingX: [-80, 80],
    wingY: 6,
    wingColor: 0x333d4c,
    highlightOffsets: [-72, 72],
    highlightY: 10,
    highlightColor: 0xffe0a0,
    turretOffsets: [-78, 78],
    turretY: 30,
    turretStrokeColor: 0xffc460,
    coreY: 24,
    coreRadius: 15,
    coreColors: [0xf0c060, 0xff5a2c],
    phase3Tint: 0xffcba0,
  },
};
