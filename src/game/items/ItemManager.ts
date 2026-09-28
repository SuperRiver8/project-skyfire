import type Phaser from 'phaser';
import {
  itemConfigs,
  itemDropConfig,
  type ItemId,
} from '../../config/items/items';
import type { EnemyBulletPool } from '../bullets/EnemyBulletPool';
import type { EnemyController } from '../enemies/EnemyController';
import type { PlayerHealth } from '../player/PlayerHealth';
import type { PlayerStats } from '../player/PlayerStats';
import { ObjectPool } from '../utils/ObjectPool';
import { Random } from '../utils/Random';
import type { PickupPool } from './PickupPool';
import { ItemPickup } from './ItemPickup';

const DROP_CHOICES = (Object.keys(itemConfigs) as ItemId[]).map((value) => ({
  value,
  weight: itemConfigs[value].weight,
}));

export class ItemManager {
  private readonly pool: ObjectPool<ItemPickup>;
  private phoenixReady = false;
  freezeMs = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly health: PlayerHealth,
    private readonly stats: PlayerStats,
    private readonly expOrbs: PickupPool,
    private readonly enemies: EnemyController,
    private readonly enemyBullets: EnemyBulletPool,
    private readonly onItem: (name: string) => void,
    private readonly onExp: (exp: number) => void,
  ) {
    this.pool = new ObjectPool(() => new ItemPickup(scene), 24);
  }

  rollDrop(x: number, y: number, elite = false): void {
    if (
      Random.float() >
      (elite ? itemDropConfig.eliteChance : itemDropConfig.normalChance)
    )
      return;
    this.pool.acquire().activate(x, y, Random.weighted(DROP_CHOICES));
  }

  // 仅由开发环境快捷键调用，便于目视检查十种道具的配色和文字。
  spawnPreview(): void {
    (Object.keys(itemConfigs) as ItemId[]).forEach((id, index) => {
      this.pool
        .acquire()
        .activate(70 + (index % 5) * 100, 280 + Math.floor(index / 5) * 80, id);
    });
  }

  update(deltaMs: number, playerX: number, playerY: number): void {
    this.freezeMs = Math.max(0, this.freezeMs - deltaMs);
    this.stats.update(deltaMs);
    for (const item of this.pool.activeItems()) {
      const result = item.advance(deltaMs, playerX, playerY);
      if (result === 'collect') this.apply(item.itemId);
      if (result) this.pool.release(item);
    }
  }

  apply(id: ItemId): void {
    switch (id) {
      case 'attack_core':
        this.stats.attackCores = Math.min(5, this.stats.attackCores + 1);
        break;
      case 'fire_rate_core':
        this.stats.rapidCores = Math.min(5, this.stats.rapidCores + 1);
        break;
      case 'critical_core':
        this.stats.critCores += 1;
        break;
      case 'shield':
        this.health.shields += 1;
        break;
      case 'heal':
        if (this.health.hp >= 100) this.health.shields += 1;
        else this.health.heal(30);
        break;
      case 'magnet':
        this.expOrbs.collectAll(this.onExp);
        break;
      case 'berserk':
        this.stats.berserkMs = 10_000;
        break;
      case 'time_freeze':
        this.freezeMs = 5_000;
        break;
      case 'emp':
        this.enemyBullets.clear();
        for (const enemy of this.enemies.enemies.activeEnemies())
          this.enemies.damageEnemy(enemy, 100);
        this.enemies.damageBoss(80);
        break;
      case 'phoenix_core':
        this.phoenixReady = true;
        break;
    }
    this.onItem(itemConfigs[id].name);
  }

  tryRevive(): boolean {
    if (!this.phoenixReady) return false;
    this.phoenixReady = false;
    this.health.revive();
    this.enemyBullets.clear();
    for (const enemy of this.enemies.enemies.activeEnemies())
      this.enemies.damageEnemy(enemy, 100);
    return true;
  }

  get enemySpeedFactor(): number {
    return this.freezeMs > 0 ? 0.15 : 1;
  }
  get bulletSpeedFactor(): number {
    return this.freezeMs > 0 ? 0.3 : 1;
  }
  get hasPhoenix(): boolean {
    return this.phoenixReady;
  }

  destroy(): void {
    for (const item of this.pool.allItems()) item.destroy();
  }
}
