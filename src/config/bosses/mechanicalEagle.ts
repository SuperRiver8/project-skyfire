import type { BossConfig } from './types';

/** 第 1 关 Boss：机械雄鹰 */
export const mechanicalEagleConfig: BossConfig = {
  id: 'mechanical_eagle',
  name: '机械雄鹰',
  maxHp: 10_000,
  phase2Threshold: 0.7,
  phase3Threshold: 0.35,
  enterMs: 1100,
  transitionMs: 500,
  deathMs: 1000,
  displayScale: 1.1,
  attacks: [
    // 猎鹰扇射
    { id: 'fan', intervalMs: [1500, 1300, 1000], unlockPhase: 1 },
    // 双翼追踪导弹
    { id: 'missiles', intervalMs: [3600, 3000, 2400], unlockPhase: 1 },
    // 翼刃激光扫射
    { id: 'laser_sweep', intervalMs: [4300, 4000, 3600], unlockPhase: 2 },
    // 红线俯冲
    { id: 'dash', intervalMs: [5200, 4600, 4000], unlockPhase: 3 },
  ],
  visual: {
    engineOffsets: [-43, 43],
    engineY: -51,
    engineCoreY: -52,
    wingX: [-69, 69],
    wingY: 5,
    wingColor: 0x81354b,
    highlightOffsets: [-64, 64],
    highlightY: 12,
    highlightColor: 0xffd0ad,
    turretOffsets: [-76, 76],
    turretY: 28,
    turretStrokeColor: 0xffaa73,
    coreY: 19,
    coreRadius: 13,
    coreColors: [0xffad69, 0xff5353],
    phase3Tint: 0xffa5a5,
  },
};
