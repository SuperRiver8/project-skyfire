import type Phaser from 'phaser';
import { machineGunConfig } from '../../config/weapons/machineGun';
import { ObjectPool } from '../utils/ObjectPool';
import { Bullet, type BulletStyle } from './Bullet';

export class BulletPool {
  private readonly pool: ObjectPool<Bullet>;

  constructor(scene: Phaser.Scene) {
    this.pool = new ObjectPool(
      () => new Bullet(scene),
      machineGunConfig.bulletPoolSize,
    );
  }

  fire(
    x: number,
    y: number,
    velocityY: number,
    damage: number,
    velocityX = 0,
    pierce = 0,
    style: BulletStyle = 'machine',
  ): void {
    this.pool
      .acquire()
      .activate(x, y, velocityY, damage, velocityX, pierce, style);
  }

  update(deltaMs: number): void {
    for (const bullet of this.pool.activeItems()) {
      bullet.advance(deltaMs);
      if (bullet.isAboveScreen()) this.pool.release(bullet);
    }
  }

  activeBullets(): Iterable<Bullet> {
    return this.pool.activeItems();
  }

  release(bullet: Bullet): void {
    this.pool.release(bullet);
  }

  clear(): void {
    for (const bullet of this.pool.activeItems()) this.pool.release(bullet);
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
