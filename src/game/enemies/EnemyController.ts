import type Phaser from 'phaser';
import { ExplosionPool } from '../effects/ExplosionPool';
import { Random } from '../utils/Random';
import type { PlayerStats } from '../player/PlayerStats';
import type { PlayerAircraft } from '../player/PlayerAircraft';
import type { EnemyBulletPool } from '../bullets/EnemyBulletPool';
import type { BossController } from '../bosses/BossController';
import type { Enemy } from './Enemy';
import { EnemyPool } from './EnemyPool';

export class EnemyController {
  readonly enemies: EnemyPool;
  private readonly explosions: ExplosionPool;
  private score = 0;
  private player: PlayerAircraft | undefined;
  private enemyBullets: EnemyBulletPool | undefined;
  private onExplosion:
    | ((x: number, y: number, radius: number, damage: number) => void)
    | undefined;
  boss: BossController | undefined;

  constructor(
    scene: Phaser.Scene,
    private readonly onScoreChanged: (score: number) => void,
    private readonly onKilled: (
      x: number,
      y: number,
      exp: number,
    ) => void = () => {},
    private readonly stats?: PlayerStats,
    private readonly onDamage?: (
      x: number,
      y: number,
      damage: number,
      crit: boolean,
      killed: boolean,
    ) => void,
  ) {
    this.enemies = new EnemyPool(scene);
    this.explosions = new ExplosionPool(scene);
  }

  spawn(id: string, x: number, y: number): void {
    this.enemies.spawn(id, x, y);
  }

  attachCombat(
    player: PlayerAircraft,
    bullets: EnemyBulletPool,
    onExplosion: (x: number, y: number, radius: number, damage: number) => void,
  ): void {
    this.player = player;
    this.enemyBullets = bullets;
    this.onExplosion = onExplosion;
  }

  spawnExplosion(x: number, y: number): void {
    this.explosions.spawn(x, y);
  }

  damageBoss(damage: number): void {
    if (!this.boss?.isActive()) return;
    const crit = Boolean(this.stats && Random.float() < this.stats.critChance);
    if (crit) damage *= this.stats!.critDamageMultiplier;
    this.onDamage?.(
      this.boss.x,
      this.boss.y,
      damage,
      crit,
      this.boss.hp <= damage,
    );
    this.boss.damage(damage);
  }

  damageEnemy(enemy: Enemy, damage: number): void {
    if (!enemy.isActive()) return;
    const crit = Boolean(this.stats && Random.float() < this.stats.critChance);
    if (crit) damage *= this.stats!.critDamageMultiplier;
    const killed = enemy.takeDamage(damage);
    this.onDamage?.(enemy.x, enemy.y, damage, crit, killed);
    if (killed) {
      const { x, y, scoreValue, expValue } = enemy;
      this.enemies.release(enemy);
      this.explosions.spawn(x, y);
      this.score += scoreValue;
      this.onScoreChanged(this.score);
      this.onKilled(x, y, expValue);
    }
  }

  update(deltaMs: number): void {
    this.enemies.update(
      deltaMs,
      this.player?.x,
      this.player?.y,
      (enemy, action) => {
        if (action === 'explode') {
          this.onExplosion?.(
            enemy.x,
            enemy.y,
            enemy.explosionRadius,
            enemy.collisionDamage,
          );
          this.explosions.spawn(enemy.x, enemy.y);
          this.enemies.release(enemy);
        } else if (this.player && this.enemyBullets) {
          const dx = this.player.x - enemy.x,
            dy = this.player.y - enemy.y;
          const speed = enemy.aiType === 'TANK' ? 220 : 260;
          const shots = enemy.aiType === 'TANK' ? [-0.28, 0, 0.28] : [0];
          for (const angle of shots) {
            const base = Math.atan2(dy, dx) + angle;
            this.enemyBullets.fire(
              enemy.x,
              enemy.y,
              Math.cos(base) * speed,
              Math.sin(base) * speed,
              enemy.aiType === 'TANK' ? 12 : 10,
            );
          }
        }
      },
    );
    this.explosions.update(deltaMs);
  }

  destroy(): void {
    this.enemies.destroy();
    this.explosions.destroy();
  }
}
