import type Phaser from 'phaser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLevelDifficulty } from '../src/config/balance/levelDifficulty';
import type { ItemId } from '../src/config/items/items';
import { ItemManager } from '../src/game/items/ItemManager';
import { Random } from '../src/game/utils/Random';
import { PlayerHealth } from '../src/game/player/PlayerHealth';
import { PlayerStats } from '../src/game/player/PlayerStats';
import type { PlayerAircraft } from '../src/game/player/PlayerAircraft';
import type { PickupPool } from '../src/game/items/PickupPool';
import type { EnemyController } from '../src/game/enemies/EnemyController';
import type { WeaponManager } from '../src/game/weapons/WeaponManager';
import type { EnemyBulletPool } from '../src/game/bullets/EnemyBulletPool';

const { drops } = vi.hoisted(() => ({
  drops: [] as { x: number; y: number; id: ItemId }[],
}));

// 替代绘图和武器效果，实际运行道具计时、抽取与对象池。
vi.mock('../src/game/items/ItemPickup', () => ({
  ItemPickup: class {
    private active = false;
    activate(x: number, y: number, id: ItemId) {
      this.active = true;
      drops.push({ x, y, id });
    }
    isActive() {
      return this.active;
    }
    deactivate() {
      this.active = false;
    }
    advance() {
      return null;
    }
    destroy() {}
  },
}));
vi.mock('../src/game/items/ElectricArc', () => ({
  ElectricArc: class {
    stacks = 0;
    update() {}
    destroy() {}
  },
}));
vi.mock('../src/game/items/HomingMissileSystem', () => ({
  HomingMissileSystem: class {
    level = 0;
    overdrive = 0;
    update() {}
    destroy() {}
  },
}));
vi.mock('../src/game/items/ItemEffects', () => ({
  ItemEffects: class {
    update() {}
    destroy() {}
  },
}));

function itemManager(levelId: number) {
  return new ItemManager(
    {} as Phaser.Scene,
    { x: 270, y: 800 } as PlayerAircraft,
    new PlayerHealth(),
    new PlayerStats(),
    {} as PickupPool,
    {} as EnemyController,
    { levels: { spread_gun: 0 } } as WeaponManager,
    {} as EnemyBulletPool,
    () => {},
    () => {},
    getLevelDifficulty(levelId),
  );
}

afterEach(() => {
  drops.length = 0;
  vi.restoreAllMocks();
});

describe('difficulty item drops', () => {
  it('drops single items through level four and doubles only in level five at difficulty-scaled intervals', () => {
    vi.spyOn(Random, 'float').mockReturnValue(0);
    const firstDrops = [4000, 2667, 2000, 1600, 1333];
    const intervals = [5000, 3333, 2500, 2000, 1667];
    for (let levelId = 1; levelId <= 5; levelId += 1) {
      drops.length = 0;
      const manager = itemManager(levelId);
      const count = levelId === 5 ? 2 : 1;
      manager.update(firstDrops[levelId - 1] - 1, 270, 800);
      expect(drops).toHaveLength(0);
      manager.update(1, 270, 800);
      expect(drops).toHaveLength(count);
      manager.update(intervals[levelId - 1] - 1, 270, 800);
      expect(drops).toHaveLength(count);
      manager.update(1, 270, 800);
      expect(drops).toHaveLength(count * 2);
      if (count === 2)
        expect(drops[1].x - drops[0].x).toBeGreaterThanOrEqual(64);
      manager.destroy();
    }
  });

  it('scales the random upper interval and rolls both items independently', () => {
    vi.spyOn(Random, 'float').mockReturnValue(1);
    const roll = vi
      .spyOn(Random, 'weighted')
      .mockReturnValueOnce('heal')
      .mockReturnValueOnce('magnet');
    const manager = itemManager(5);
    manager.update(1333, 270, 800);
    expect(drops.map(({ id }) => id)).toEqual(['heal', 'magnet']);
    expect(roll).toHaveBeenCalledTimes(2);
    const secondWeights = roll.mock.calls[1][0] as {
      value: ItemId;
      weight: number;
    }[];
    expect(
      secondWeights.find(({ value }) => value === 'heal')!.weight,
    ).toBeCloseTo(19 * 0.35);
    manager.update(2666, 270, 800);
    expect(drops).toHaveLength(2);
    manager.update(1, 270, 800);
    expect(drops).toHaveLength(4);
    manager.destroy();
  });

  it('doubles successful elite drops within screen bounds and keeps their probability', () => {
    const random = vi.spyOn(Random, 'float').mockReturnValue(0.64);
    const manager = itemManager(5);
    manager.rollEliteDrop(0, 200);
    expect(drops.map(({ x, y }) => [x, y])).toEqual([
      [40, 200],
      [104, 200],
    ]);
    random.mockReturnValue(0.65);
    manager.rollEliteDrop(270, 200);
    expect(drops).toHaveLength(2);
    random.mockReturnValue(0);
    for (let levelId = 1; levelId <= 4; levelId += 1) {
      const earlyLevel = itemManager(levelId);
      earlyLevel.rollEliteDrop(270, 200);
      expect(drops).toHaveLength(2 + levelId);
      earlyLevel.destroy();
    }
    manager.destroy();
  });
});
