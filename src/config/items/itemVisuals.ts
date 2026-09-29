import type { ItemId } from './items';

export const itemVisuals: Record<ItemId, { color: number; glyph: string }> = {
  attack_core: { color: 0xff6c69, glyph: '攻' },
  fire_rate_core: { color: 0xffca57, glyph: '速' },
  critical_core: { color: 0xff944d, glyph: '暴' },
  shield: { color: 0x59a9ff, glyph: '盾' },
  spread_gun: { color: 0xffd36d, glyph: '散' },
  electric_arc: { color: 0x80eaff, glyph: '电' },
  homing_missile: { color: 0xffb56b, glyph: '导' },
  heal: { color: 0x53df9a, glyph: '疗' },
  magnet: { color: 0x5de5dd, glyph: '磁' },
  berserk: { color: 0xc47aff, glyph: '狂' },
  time_freeze: { color: 0x7de5ff, glyph: '冻' },
  phoenix_core: { color: 0xff7fc4, glyph: '凤' },
};
