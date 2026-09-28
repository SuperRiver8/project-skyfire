import type Phaser from 'phaser';
import { explosionConfig } from '../../config/effects/explosion';
import { ObjectPool } from '../utils/ObjectPool';
import { Explosion } from './Explosion';

export class ExplosionPool {
  private readonly pool: ObjectPool<Explosion>;

  constructor(scene: Phaser.Scene) {
    this.pool = new ObjectPool(
      () => new Explosion(scene),
      explosionConfig.initialPoolSize,
    );
  }

  spawn(x: number, y: number, scale = 1, bright = false): void {
    this.pool.acquire().activate(x, y, scale, bright);
  }

  update(deltaMs: number): void {
    for (const explosion of this.pool.activeItems()) {
      if (explosion.advance(deltaMs)) this.pool.release(explosion);
    }
  }

  destroy(): void {
    for (const explosion of this.pool.allItems()) explosion.destroy();
  }
}
