export const itemConfigs = {
  attack_core: { name: '攻击核心', rarity: 'Common', weight: 20 },
  fire_rate_core: { name: '急速核心', rarity: 'Common', weight: 19 },
  critical_core: { name: '暴击核心', rarity: 'Rare', weight: 9 },
  shield: { name: '能量护盾', rarity: 'Rare', weight: 9 },
  electric_arc: { name: '电击能量', rarity: 'Epic', weight: 3 },
  homing_missile: { name: '追踪导弹系统', rarity: 'Epic', weight: 3 },
  heal: { name: '维修装置', rarity: 'Common', weight: 19 },
  magnet: { name: '吸附磁铁', rarity: 'Rare', weight: 9 },
  berserk: { name: '狂暴模式', rarity: 'Epic', weight: 3 },
  time_freeze: { name: '时间冻结', rarity: 'Epic', weight: 3 },
  emp: { name: '电磁脉冲', rarity: 'Legendary', weight: 2 },
  phoenix_core: { name: '凤凰核心', rarity: 'Legendary', weight: 1 },
} as const;

export type ItemId = keyof typeof itemConfigs;
export const itemDropConfig = {
  firstDropMs: 4_000,
  intervalMinMs: 5_000,
  intervalRandomMs: 3_000,
  fallSpeed: 95,
  pickupRadius: 25,
} as const;
