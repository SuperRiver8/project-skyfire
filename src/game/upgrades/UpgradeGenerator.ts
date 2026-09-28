import { Random } from '../utils/Random';

import { weaponBalance } from '../../config/weapons/weaponBalance';
import { machineGunConfig } from '../../config/weapons/machineGun';
import type { WeaponId } from '../weapons/WeaponManager';

export type UpgradeId = WeaponId | 'attack' | 'rapid' | 'heal';
export interface UpgradeOption {
  id: UpgradeId;
  title: string;
  description: string;
}

const options: Record<UpgradeId, UpgradeOption> = {
  machine_gun: {
    id: 'machine_gun',
    title: '双管机炮',
    description: '机炮升至 2 级，双弹齐射',
  },
  spread_gun: {
    id: 'spread_gun',
    title: '散射机炮',
    description: '解锁三方向射击',
  },
  laser: {
    id: 'laser',
    title: '脉冲激光',
    description: '解锁穿透光束',
  },
  missile: {
    id: 'missile',
    title: '追踪导弹',
    description: '解锁自动追踪与范围爆炸',
  },
  lightning: {
    id: 'lightning',
    title: '连锁闪电',
    description: '解锁跳跃电弧',
  },
  attack: {
    id: 'attack',
    title: '攻击核心',
    description: '所有武器伤害提高 15%',
  },
  rapid: { id: 'rapid', title: '急速核心', description: '射速提高 12%' },
  heal: { id: 'heal', title: '紧急维修', description: '恢复 30 点生命' },
};

export function generateUpgrades(
  levels: Record<WeaponId, number>,
  firstLevelUp: boolean,
): UpgradeOption[] {
  if (firstLevelUp)
    return [options.machine_gun, options.spread_gun, options.attack];
  const owned = Object.values(levels).filter((level) => level > 0).length;
  const available = Object.values(options).filter((option) => {
    if (!(option.id in levels)) return true;
    const id = option.id as WeaponId;
    const level = levels[id];
    const maxLevel =
      id === 'machine_gun'
        ? machineGunConfig.maxLevel
        : weaponBalance[id === 'spread_gun' ? 'spread' : id].maxLevel;
    return level > 0 ? level < maxLevel : owned < weaponBalance.maxSlots;
  });
  const picked: UpgradeOption[] = [];
  while (picked.length < 3 && available.length > 0) {
    const index = Random.int(0, available.length - 1);
    const chosen = available.splice(index, 1)[0];
    picked.push(
      chosen.id in levels && levels[chosen.id as WeaponId] > 0
        ? {
            ...chosen,
            title: `${chosen.title} ${levels[chosen.id as WeaponId] + 1} 级`,
            description: '提升武器威力',
          }
        : chosen,
    );
  }
  return picked;
}
