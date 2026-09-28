import type Phaser from 'phaser';
import { enemyBulletBalance } from '../../config/balance/enemyBulletBalance';
import { ObjectPool } from '../utils/ObjectPool';
import { EnemyBullet } from './EnemyBullet';

export class EnemyBulletPool {
  private readonly pool: ObjectPool<EnemyBullet>;
  private readonly trails: Phaser.GameObjects.Graphics;
  private hasTrails = false;

  constructor(scene: Phaser.Scene) {
    this.pool = new ObjectPool(
      () => new EnemyBullet(scene),
      enemyBulletBalance.initialPoolSize,
    );
    this.trails = scene.add.graphics().setDepth(7);
  }

  fire(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    target?: { x: number; y: number },
    tint?: number,
  ): EnemyBullet {
    const bullet = this.pool.acquire();
    bullet.activate(x, y, vx, vy, damage, target, tint);
    return bullet;
  }

  update(deltaMs: number): void {
    if (this.hasTrails) this.trails.clear();
    this.hasTrails = false;
    for (const bullet of this.pool.activeItems()) {
      bullet.advance(deltaMs);
      if (bullet.isHoming) {
        this.drawTrail(bullet);
        this.hasTrails = true;
      }
      if (bullet.isOffscreen()) this.pool.release(bullet);
    }
  }

  /** 追踪弹尾迹：外焰半透明 + 亮焰心，两段叠加出光晕感 */
  private drawTrail(bullet: EnemyBullet): void {
    const tail = bullet.trailTail;
    this.trails.lineStyle(4, 0xff9a52, 0.35);
    this.trails.lineBetween(bullet.x, bullet.y, tail.x, tail.y);
    this.trails.lineStyle(1.6, 0xfff0c0, 0.75);
    this.trails.lineBetween(bullet.x, bullet.y, tail.x, tail.y);
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
    this.trails.destroy();
  }
}
