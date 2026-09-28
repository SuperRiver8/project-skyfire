import type Phaser from 'phaser';
import { pickupBalance } from '../../config/balance/pickupBalance';
import { ObjectPool } from '../utils/ObjectPool';
import { EnergyOrb } from './EnergyOrb';
import { GAME_HEIGHT } from '../viewport';

export class PickupPool {
  private readonly pool: ObjectPool<EnergyOrb>;

  constructor(scene: Phaser.Scene) {
    this.pool = new ObjectPool(
      () => new EnergyOrb(scene),
      pickupBalance.initialPoolSize,
    );
  }

  spawnExp(x: number, y: number, exp: number): void {
    this.pool.acquire().activate(x, y, exp);
  }

  update(
    deltaMs: number,
    x: number,
    y: number,
    radius: number,
    onCollect: (exp: number) => void,
  ): void {
    for (const orb of this.pool.activeItems()) {
      if (orb.advance(deltaMs, x, y, radius)) {
        onCollect(orb.exp);
        this.pool.release(orb);
      } else if (orb.y > GAME_HEIGHT + 20) {
        this.pool.release(orb);
      }
    }
  }

  collectAll(onCollect: (exp: number) => void): void {
    for (const orb of this.pool.activeItems()) {
      onCollect(orb.exp);
      this.pool.release(orb);
    }
  }

  destroy(): void {
    for (const orb of this.pool.allItems()) orb.destroy();
  }
}
