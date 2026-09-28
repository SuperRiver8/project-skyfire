import type { BossConfig } from './types';

/** 第 3 关 Boss：双头蛇，环形弹更密 */
export const twinSerpentConfig: BossConfig = {
  id: 'twin_serpent',
  name: '双头蛇',
  maxHp: 13_500,
  phase2Threshold: 0.72,
  phase3Threshold: 0.38,
  enterMs: 1200,
  transitionMs: 520,
  deathMs: 1150,
  displayScale: 1.12,
  attacks: [
    // 毒首扩散（毒雾弹）
    { id: 'poison_spray', intervalMs: [2400, 2100, 1800], unlockPhase: 1 },
    // 雷首锁链
    { id: 'lightning_chain', intervalMs: [2900, 2500, 2100], unlockPhase: 1 },
    // 双首夹击
    { id: 'pincer', intervalMs: [3500, 3000, 2500], unlockPhase: 2 },
    // 灾厄共鸣
    { id: 'resonance', intervalMs: [5200, 4500, 3800], unlockPhase: 3 },
  ],
  visual: {
    engineOffsets: [-34, 34],
    engineY: -52,
    engineCoreY: -53,
    wingX: [-66, 66],
    wingY: 10,
    wingColor: 0x174235,
    highlightOffsets: [-60, 60],
    highlightY: 15,
    highlightColor: 0x9fffd0,
    turretOffsets: [],
    turretY: 0,
    turretStrokeColor: 0xffffff,
    coreY: 30,
    coreRadius: 11,
    coreColors: [0x51e8a0, 0xff4f9c],
    phase3Tint: 0xb0ffd8,
  },
};
