import type Phaser from 'phaser';
import { ExplosionPool } from '../effects/ExplosionPool';
import { AircraftMotionTrailPool } from '../aircraft/AircraftMotionTrailPool';
import { Random } from '../utils/Random';
import type { PlayerStats } from '../player/PlayerStats';
import type { PlayerAircraft } from '../player/PlayerAircraft';
import type { EnemyBulletPool } from '../bullets/EnemyBulletPool';
import type { BossController } from '../bosses/BossController';
import type { Enemy } from './Enemy';
import { EnemyPool } from './EnemyPool';
import { EnemyDeathPool } from './EnemyDeathPool';

export class EnemyController {
  readonly enemies: EnemyPool;
  private readonly explosions: ExplosionPool;
  private readonly deaths: EnemyDeathPool;
  private score = 0;
  private player: PlayerAircraft | undefined;
  private enemyBullets: EnemyBulletPool | undefined;
  private onExplosion:
    | ((x: number, y: number, radius: number, damage: number) => void)
    | undefined;
  boss: BossController | undefined;
  frozen = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onScoreChanged: (score: number) => void,
    private readonly onKilled: (
      x: number,
      y: number,
      exp: number,
      elite: boolean,
    ) => void = () => {},
    private readonly stats?: PlayerStats,
    private readonly onDamage?: (
      x: number,
      y: number,
      damage: number,
      crit: boolean,
      killed: boolean,
      enhanced: boolean,
    ) => void,
  ) {
    this.enemies = new EnemyPool(scene);
    this.explosions = new ExplosionPool(scene);
    this.deaths = new EnemyDeathPool(scene);
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

  spawnExplosion(x: number, y: number, scale = 1, bright = false): void {
    this.explosions.spawn(x, y, scale, bright);
  }

  damageBoss(damage: number, proc = true): void {
    this.damageBossDetailed(damage, proc);
  }

  damageBossDetailed(
    damage: number,
    proc = true,
  ): { crit: boolean; applied: number } {
    if (!this.boss?.isDamageable()) return { crit: false, applied: 0 };
    if (proc) this.stats?.recordTargetHit(this.boss);
    const result = proc ? this.stats?.rollCrit(Random.float()) : undefined;
    const crit = result?.crit ?? false;
    if (crit) damage *= this.stats!.critDamageMultiplier;
    this.onDamage?.(
      this.boss.x,
      this.boss.y,
      damage,
      crit,
      this.boss.hp <= damage,
      result?.enhanced ?? false,
    );
    this.boss.damage(damage);
    if (crit && this.stats?.attackOverload)
      this.areaDamage(this.boss.x, this.boss.y, 82, damage * 0.3);
    return { crit, applied: damage };
  }

  damageEnemy(enemy: Enemy, damage: number, proc = true): boolean {
    return this.damageEnemyDetailed(enemy, damage, proc).killed;
  }

  damageEnemyDetailed(
    enemy: Enemy,
    damage: number,
    proc = true,
  ): { killed: boolean; crit: boolean; applied: number } {
    if (!enemy.isActive()) return { killed: false, crit: false, applied: 0 };
    if (proc) this.stats?.recordTargetHit(enemy);
    const result = proc ? this.stats?.rollCrit(Random.float()) : undefined;
    const crit = result?.crit ?? false;
    if (crit) damage *= this.stats!.critDamageMultiplier;
    const applied = Math.min(enemy.currentHp, damage);
    const killed = enemy.takeDamage(damage);
    const { x, y } = enemy;
    this.onDamage?.(x, y, applied, crit, killed, result?.enhanced ?? false);
    if (killed) {
      const { scoreValue, expValue, isElite } = enemy;
      this.stats?.clearTarget(enemy);
      if (this.frozen) this.frozenGhost(enemy);
      this.deaths.spawn(enemy);
      this.enemies.release(enemy);
      this.score += scoreValue;
      this.onScoreChanged(this.score);
      this.onKilled(x, y, expValue, isElite);
    }
    if (crit && this.stats?.attackOverload)
      this.areaDamage(x, y, 82, damage * 0.3, enemy);
    if (crit && killed && this.stats?.destructionCore)
      this.areaDamage(x, y, 110, applied * 0.4, enemy);
    return { killed, crit, applied };
  }

  areaDamage(
    x: number,
    y: number,
    radius: number,
    damage: number,
    exclude?: Enemy,
  ): void {
    const ring = this.scene.add
      .circle(x, y, 14, 0xffaa65, 0)
      .setStrokeStyle(3, 0xffbd79)
      .setDepth(28);
    this.scene.tweens.add({
      targets: ring,
      scale: radius / 14,
      alpha: 0,
      duration: 260,
      onComplete: () => ring.destroy(),
    });
    for (const enemy of this.enemies.activeEnemies()) {
      if (enemy === exclude || Math.hypot(enemy.x - x, enemy.y - y) > radius)
        continue;
      this.damageEnemy(enemy, damage, false);
    }
  }

  private frozenGhost(enemy: Enemy): void {
    AircraftMotionTrailPool.forScene(this.scene).emit(
      enemy.texture.key,
      enemy.x,
      enemy.y,
      enemy.rotation,
      enemy.scaleX,
      enemy.scaleY,
      false,
      5,
      0xb4e9ff,
    );
  }

  update(deltaMs: number, visualDeltaMs = deltaMs): void {
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
          const speed =
            enemy.aiType === 'TANK'
              ? 220
              : enemy.aiType === 'STRAIGHT'
                ? 170
                : 260;
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
    this.deaths.update(visualDeltaMs, (x, y) => this.explosions.spawn(x, y));
    this.explosions.update(visualDeltaMs);
  }

  destroy(): void {
    this.enemies.destroy();
    this.explosions.destroy();
    this.deaths.destroy();
  }
}
