import Phaser from 'phaser';
import { weaponBalance } from '../../../config/weapons/weaponBalance';
import type { AudioManager } from '../../audio/AudioManager';
import type { Enemy } from '../../enemies/Enemy';
import type { BossController } from '../../bosses/BossController';
import type { EnemyController } from '../../enemies/EnemyController';
import type { PlayerAircraft } from '../../player/PlayerAircraft';
import type { PlayerStats } from '../../player/PlayerStats';
import { ObjectPool } from '../../utils/ObjectPool';
import { BaseWeapon } from '../BaseWeapon';

class Missile extends Phaser.GameObjects.Image {
  target: Enemy | BossController | undefined;
  damage = 0;
  radius = 0;
  cluster = false;
  constructor(scene: Phaser.Scene) {
    const key = 'player_missile';
    if (!scene.textures.exists(key)) {
      const g = scene.add.graphics();
      g.fillStyle(0xffac48, 0.25);
      g.fillTriangle(12, 0, 1, 30, 23, 30);
      g.fillStyle(0xff8d38);
      g.fillTriangle(12, 3, 6, 27, 18, 27);
      g.fillStyle(0xffef9d);
      g.fillTriangle(12, 3, 9, 20, 15, 20);
      g.fillStyle(0x3dc8f5);
      g.fillTriangle(12, 24, 8, 31, 16, 31);
      g.generateTexture(key, 24, 32);
      g.destroy();
    }
    super(scene, 0, 0, key);
    this.setActive(false).setVisible(false);
    scene.add.existing(this);
  }
  activate(
    x: number,
    y: number,
    target: Enemy | BossController,
    damage: number,
    radius: number,
    cluster: boolean,
  ): void {
    this.setPosition(x, y);
    this.target = target;
    this.damage = damage;
    this.radius = radius;
    this.cluster = cluster;
    this.setRotation(0);
    this.setActive(true).setVisible(true);
  }
  deactivate(): void {
    this.setActive(false).setVisible(false);
    this.target = undefined;
    this.setRotation(0);
  }
  isActive(): boolean {
    return this.active;
  }
  advance(deltaMs: number): boolean {
    if (!this.target?.isActive()) {
      this.y -= (weaponBalance.missile.speed * deltaMs) / 1000;
      return this.y < -20;
    }
    const dx = this.target.x - this.x,
      dy = this.target.y - this.y,
      distance = Math.hypot(dx, dy);
    if (distance < 17) return true;
    const step = Math.min(
      distance,
      (weaponBalance.missile.speed * deltaMs) / 1000,
    );
    this.x += (dx / distance) * step;
    this.y += (dy / distance) * step;
    this.setRotation(Math.atan2(dy, dx) + Math.PI / 2);
    return distance <= step + 17;
  }
}

export class MissileWeapon extends BaseWeapon {
  readonly id = 'missile';
  private readonly pool: ObjectPool<Missile>;
  private targetIndex = 0;
  constructor(
    scene: Phaser.Scene,
    private readonly aircraft: PlayerAircraft,
    private readonly enemies: EnemyController,
    private readonly stats: PlayerStats,
    private readonly audio: AudioManager,
  ) {
    super();
    this.pool = new ObjectPool(() => new Missile(scene), 12);
  }
  protected get fireIntervalMs(): number {
    return weaponBalance.missile.intervalMs / this.stats.fireRateMultiplier;
  }
  override canUpgrade(): boolean {
    return this.level < weaponBalance.missile.maxLevel;
  }
  override upgrade(): void {
    if (this.canUpgrade()) this.level += 1;
  }
  override update(deltaMs: number): void {
    super.update(deltaMs);
    for (const missile of this.pool.activeItems()) {
      if (missile.advance(deltaMs)) {
        if (missile.target?.isActive()) {
          if (missile.target === this.enemies.boss)
            this.enemies.damageBoss(missile.damage);
          for (const enemy of this.enemies.enemies.activeEnemies()) {
            if (
              Math.hypot(enemy.x - missile.x, enemy.y - missile.y) <=
              missile.radius
            )
              this.enemies.damageEnemy(enemy, missile.damage);
          }
          this.enemies.spawnExplosion(missile.x, missile.y);
          if (missile.cluster) {
            for (const enemy of this.enemies.enemies.activeEnemies()) {
              if (
                Math.hypot(enemy.x - missile.x, enemy.y - missile.y) <=
                missile.radius * 1.5
              )
                this.enemies.damageEnemy(enemy, missile.damage * 0.2);
            }
          }
        }
        this.pool.release(missile);
      }
    }
  }
  fire(): void {
    const targets: (Enemy | BossController)[] = this.enemies.boss?.isActive()
      ? [this.enemies.boss]
      : Array.from(this.enemies.enemies.activeEnemies());
    if (targets.length === 0) return;
    this.audio.playSfx('missile');
    this.aircraft.muzzleFlash();
    const count = this.level >= 4 ? 3 : this.level >= 2 ? 2 : 1;
    for (let i = 0; i < count; i += 1) {
      const target = targets[(this.targetIndex + i) % targets.length];
      this.pool
        .acquire()
        .activate(
          this.aircraft.x + (i - (count - 1) / 2) * 15,
          this.aircraft.y - 20,
          target,
          weaponBalance.missile.damage * this.stats.attackMultiplier,
          weaponBalance.missile.radius * (this.level >= 3 ? 1.25 : 1),
          this.level >= 5,
        );
    }
    this.targetIndex += count;
  }
  override destroy(): void {
    for (const missile of this.pool.allItems()) missile.destroy();
  }
}
