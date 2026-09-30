import type { BossConfig } from './types';

/** 第 5 关 Boss：天空帝皇，金色凤凰王，全弹幕强化 */
export const skyTyrantConfig: BossConfig = {
  id: 'sky_tyrant',
  name: '天空帝皇',
  maxHp: 16_500,
  phase2Threshold: 0.8,
  phase3Threshold: 0.46,
  enterMs: 1400,
  transitionMs: 550,
  deathMs: 1300,
  displayScale: 1.18,
  protectionShield: { durationMs: 3_000, refreshMs: 5_000 },
  attacks: [
    // 圣羽风暴（金羽刃弹幕）
    { id: 'feather_storm', intervalMs: [1900, 1550, 1250], unlockPhase: 1 },
    // 帝焰审判（贯穿光束）
    { id: 'holy_beam', intervalMs: [4800, 3900, 3200], unlockPhase: 2 },
    // 日冕蓄力后连续追踪扇射
    {
      id: 'solar_pursuit',
      intervalMs: [6500, 5000, 3900],
      unlockPhase: 2,
      firstCastDelayMs: 900,
    },
    // 凤凰再临（能量羽翼残影）
    { id: 'phoenix_reborn', intervalMs: [9000, 7000, 5500], unlockPhase: 2 },
    // 皇权领域（环形压制）
    { id: 'royal_domain', intervalMs: [11000, 8000, 6200], unlockPhase: 3 },
  ],
  visual: {
    engineOffsets: [-36, 36],
    engineY: -54,
    engineCoreY: -55,
    wingX: [-78, 78],
    wingY: 4,
    wingColor: 0x6b4020,
    highlightOffsets: [-70, 70],
    highlightY: 8,
    highlightColor: 0xfff0c0,
    turretOffsets: [-68, 68],
    turretY: 26,
    turretStrokeColor: 0xffe08a,
    coreY: 26,
    coreRadius: 16,
    coreColors: [0xfff0b8, 0xff4a2c],
    phase3Tint: 0xffd8a0,
  },
};
