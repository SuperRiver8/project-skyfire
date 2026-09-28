export const itemConfigs = {
  attack_core: { name: '攻击核心', weight: 16 },
  fire_rate_core: { name: '急速核心', weight: 16 },
  critical_core: { name: '暴击核心', weight: 12 },
  shield: { name: '能量护盾', weight: 14 },
  heal: { name: '维修装置', weight: 14 },
  magnet: { name: '吸附磁铁', weight: 10 },
  berserk: { name: '狂暴模式', weight: 7 },
  time_freeze: { name: '时间冻结', weight: 5 },
  emp: { name: '电磁脉冲', weight: 4 },
  phoenix_core: { name: '凤凰核心', weight: 2 },
} as const;

export type ItemId = keyof typeof itemConfigs;
export const itemDropConfig = {
  normalChance: 0.12,
  eliteChance: 0.6,
  fallSpeed: 95,
  pickupRadius: 25,
} as const;
