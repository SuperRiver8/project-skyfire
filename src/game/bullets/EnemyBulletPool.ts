import type Phaser from 'phaser';
import { enemyBulletBalance } from '../../config/balance/enemyBulletBalance';
import { ObjectPool } from '../utils/ObjectPool';
import { EnemyBullet } from './EnemyBullet';

export class EnemyBulletPool {
  private readonly pool: ObjectPool<EnemyBullet>;

  constructor(scene: Phaser.Scene) {
    this.pool = new ObjectPool(
      () => new EnemyBullet(scene),
      enemyBulletBalance.initialPoolSize,
    );
  }

  fire(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    target?: { x: number; y: number },
  ): void {
    this.pool.acquire().activate(x, y, vx, vy, damage, target);
  }

  update(deltaMs: number): void {
    for (const bullet of this.pool.activeItems()) {
      bullet.advance(deltaMs);
      if (bullet.isOffscreen()) this.pool.release(bullet);
    }
  }

  activeBullets(): Iterable<EnemyBullet> {
    return this.pool.activeItems();
  }

  release(bullet: EnemyBullet): void {
    this.pool.release(bullet);
  }

  clear(): void {
    for (const bullet of this.pool.activeItems()) this.pool.release(bullet);
  }

  clearWithin(x: number, y: number, radius: number): number {
    let cleared = 0;
    for (const bullet of this.pool.activeItems()) {
      if (Math.hypot(bullet.x - x, bullet.y - y) > radius || bullet.isHoming)
        continue;
      this.pool.release(bullet);
      cleared += 1;
    }
    return cleared;
  }

  clearOrdinary(): number {
    let cleared = 0;
    for (const bullet of this.pool.activeItems()) {
      if (bullet.isHoming) continue;
      this.pool.release(bullet);
      cleared += 1;
    }
    return cleared;
  }

  get activeCount(): number {
    return this.pool.activeCount;
  }

  get createdCount(): number {
    return this.pool.createdCount;
  }

  destroy(): void {
    for (const bullet of this.pool.allItems()) bullet.destroy();
  }
}
