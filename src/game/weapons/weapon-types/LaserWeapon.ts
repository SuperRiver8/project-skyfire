import Phaser from 'phaser';
import { weaponBalance } from '../../../config/weapons/weaponBalance';
import type { AudioManager } from '../../audio/AudioManager';
import type { EnemyController } from '../../enemies/EnemyController';
import type { PlayerAircraft } from '../../player/PlayerAircraft';
import type { PlayerStats } from '../../player/PlayerStats';
import { BaseWeapon } from '../BaseWeapon';

export class LaserWeapon extends BaseWeapon {
  readonly id = 'laser';
  private readonly beam: Phaser.GameObjects.Graphics;
  private visibleMs = 0;
  constructor(
    scene: Phaser.Scene,
    private readonly aircraft: PlayerAircraft,
    private readonly enemies: EnemyController,
    private readonly stats: PlayerStats,
    private readonly audio: AudioManager,
  ) {
    super();
    this.beam = scene.add.graphics().setDepth(8);
  }
  protected get fireIntervalMs(): number {
    return weaponBalance.laser.intervalMs / this.stats.fireRateMultiplier;
  }
  override canUpgrade(): boolean {
    return this.level < weaponBalance.laser.maxLevel;
  }
  override upgrade(): void {
    if (this.canUpgrade()) this.level += 1;
  }
  override update(deltaMs: number): void {
    super.update(deltaMs);
    this.visibleMs = Math.max(0, this.visibleMs - deltaMs);
    if (this.visibleMs === 0) this.beam.clear();
  }
  fire(): void {
    this.audio.playSfx('laser');
    this.aircraft.muzzleFlash();
    this.beam.clear();
    this.beam.fillStyle(0xb064ff, 0.38);
    const width = weaponBalance.laser.width * (this.level >= 2 ? 1.6 : 1);
    const centers =
      this.level >= 4
        ? [this.aircraft.x - 18, this.aircraft.x + 18]
        : [this.aircraft.x];
    const damage =
      weaponBalance.laser.damage *
      this.stats.attackMultiplier *
      (this.level >= 3 ? 1.3 : 1);
    for (const x of centers) {
      this.beam.fillRect(x - width / 2, 0, width, this.aircraft.y);
      this.beam
        .fillStyle(0xffdefb, 0.95)
        .fillRect(x - 2, 0, 4, this.aircraft.y);
      for (const enemy of this.enemies.enemies.activeEnemies()) {
        if (
          enemy.y < this.aircraft.y &&
          Math.abs(enemy.x - x) < width / 2 + enemy.hitboxWidth / 2
        )
          this.enemies.damageEnemy(enemy, damage);
      }
      const boss = this.enemies.boss;
      if (boss?.isActive() && Math.abs(boss.x - x) < width / 2 + 75)
        this.enemies.damageBoss(damage * 0.6);
    }
    this.visibleMs = weaponBalance.laser.durationMs;
  }
  override destroy(): void {
    this.beam.destroy();
  }
}
