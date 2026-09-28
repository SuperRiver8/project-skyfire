import type Phaser from 'phaser';
import { pickupBalance } from '../../config/balance/pickupBalance';
import { ObjectPool } from '../utils/ObjectPool';
import { EnergyOrb } from './EnergyOrb';
import { GAME_HEIGHT } from '../viewport';

export class PickupPool {
  private readonly pool: ObjectPool<EnergyOrb>;
  private magnetMs = 0;

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
    const magnetActive = this.magnetMs > 0;
    for (const orb of this.pool.activeItems()) {
      if (
        orb.advance(
          deltaMs,
          x,
          y,
          magnetActive ? Infinity : radius,
          magnetActive ? 1_900 : pickupBalance.magnetSpeed,
        )
      ) {
        onCollect(orb.exp);
        this.pool.release(orb);
      } else if (orb.y > GAME_HEIGHT + 20) {
        this.pool.release(orb);
      }
    }
    this.magnetMs = Math.max(0, this.magnetMs - deltaMs);
  }

  startMagnet(): void {
    this.magnetMs = 600;
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
