import type { BulletPool } from '../bullets/BulletPool';
import type { EnemyBulletPool } from '../bullets/EnemyBulletPool';
import type { EnemyController } from '../enemies/EnemyController';
import type { PlayerAircraft } from '../player/PlayerAircraft';
import type { PlayerHealth } from '../player/PlayerHealth';
import { playerBalance } from '../../config/balance/playerBalance';
import { SpatialIndex } from './SpatialIndex';
import type { Enemy } from '../enemies/Enemy';

export function overlaps(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return Math.abs(ax - bx) * 2 < aw + bw && Math.abs(ay - by) * 2 < ah + bh;
}

export class CollisionSystem {
  private readonly spatial = new SpatialIndex<Enemy>();
  constructor(
    private readonly bullets: BulletPool,
    private readonly enemies: EnemyController,
    private readonly enemyBullets: EnemyBulletPool,
    private readonly player: PlayerAircraft,
    private readonly health: PlayerHealth,
    private readonly onPlayerHit: (
      hpLost: number,
      shieldConsumed: boolean,
      sourceX?: number,
      sourceY?: number,
    ) => void,
  ) {}

  update(): void {
    this.spatial.rebuild(this.enemies.enemies.activeEnemies());
    for (const bullet of this.bullets.activeBullets()) {
      for (const enemy of this.spatial.query(
        bullet.x,
        bullet.y,
        bullet.displayWidth,
        bullet.displayHeight,
      )) {
        if (
          enemy.isActive() &&
          overlaps(
            bullet.x,
            bullet.y,
            bullet.displayWidth,
            bullet.displayHeight,
            enemy.x,
            enemy.y,
            enemy.hitboxWidth,
            enemy.hitboxHeight,
          ) &&
          bullet.registerHit(enemy)
        ) {
          this.enemies.damageEnemy(enemy, bullet.damage);
          if (bullet.pierce > 0) bullet.pierce -= 1;
          else {
            this.bullets.release(bullet);
            break;
          }
        }
      }
      const boss = this.enemies.boss;
      if (
        bullet.isActive() &&
        boss?.isActive() &&
        overlaps(
          bullet.x,
          bullet.y,
          bullet.displayWidth,
          bullet.displayHeight,
          boss.x,
          boss.y,
          boss.hitboxWidth,
          boss.hitboxHeight,
        ) &&
        bullet.registerHit(boss)
      ) {
        this.enemies.damageBoss(bullet.damage);
        if (bullet.pierce > 0) bullet.pierce -= 1;
        else this.bullets.release(bullet);
      }
    }

    for (const enemy of this.enemies.enemies.activeEnemies()) {
      if (
        overlaps(
          this.player.x,
          this.player.y,
          playerBalance.collisionWidth,
          playerBalance.collisionHeight,
          enemy.x,
          enemy.y,
          enemy.hitboxWidth,
          enemy.hitboxHeight,
        )
      ) {
        const hpBefore = this.health.hp;
        const shieldsBefore = this.health.shields;
        if (this.health.hit(enemy.collisionDamage))
          this.onPlayerHit(
            hpBefore - this.health.hp,
            this.health.shields < shieldsBefore,
            enemy.x,
            enemy.y,
          );
        this.enemies.enemies.release(enemy);
      }
    }

    for (const bullet of this.enemyBullets.activeBullets()) {
      if (
        overlaps(
          this.player.x,
          this.player.y,
          playerBalance.collisionWidth,
          playerBalance.collisionHeight,
          bullet.x,
          bullet.y,
          bullet.displayWidth,
          bullet.displayHeight,
        )
      ) {
        const hpBefore = this.health.hp;
        const shieldsBefore = this.health.shields;
        if (this.health.hit(bullet.damage))
          this.onPlayerHit(
            hpBefore - this.health.hp,
            this.health.shields < shieldsBefore,
            bullet.x,
            bullet.y,
          );
        this.enemyBullets.release(bullet);
      }
    }
  }
}
