import Phaser from 'phaser';
import { weaponBalance } from '../../../config/weapons/weaponBalance';
import type { AudioManager } from '../../audio/AudioManager';
import type { Enemy } from '../../enemies/Enemy';
import type { EnemyController } from '../../enemies/EnemyController';
import type { PlayerAircraft } from '../../player/PlayerAircraft';
import type { PlayerStats } from '../../player/PlayerStats';
import { BaseWeapon } from '../BaseWeapon';

export class LightningWeapon extends BaseWeapon {
  readonly id = 'lightning';
  private readonly lines: Phaser.GameObjects.Graphics;
  private visibleMs = 0;
  constructor(
    scene: Phaser.Scene,
    private readonly aircraft: PlayerAircraft,
    private readonly enemies: EnemyController,
    private readonly stats: PlayerStats,
    private readonly audio: AudioManager,
  ) {
    super();
    this.lines = scene.add.graphics().setDepth(9);
  }
  protected get fireIntervalMs(): number {
    return weaponBalance.lightning.intervalMs / this.stats.fireRateMultiplier;
  }
  override canUpgrade(): boolean {
    return this.level < weaponBalance.lightning.maxLevel;
  }
  override upgrade(): void {
    if (this.canUpgrade()) this.level += 1;
  }
  override update(deltaMs: number): void {
    super.update(deltaMs);
    this.visibleMs -= deltaMs;
    if (this.visibleMs <= 0) this.lines.clear();
  }
  fire(): void {
    this.audio.playSfx('lightning');
    const chainCount =
      this.level >= 5 ? 8 : this.level >= 4 ? 5 : this.level >= 2 ? 3 : 1;
    const used = new Set<Enemy>();
    let x = this.aircraft.x,
      y = this.aircraft.y;
    this.lines.clear().lineStyle(5, 0xffe37d, 0.95);
    const boss = this.enemies.boss;
    if (boss?.isActive()) {
      this.lines.lineBetween(x, y, boss.x, boss.y);
      this.enemies.damageBoss(
        weaponBalance.lightning.damage * this.stats.attackMultiplier,
      );
      x = boss.x;
      y = boss.y;
    }
    for (let step = 0; step < chainCount; step += 1) {
      let target: Enemy | undefined,
        best = step === 0 ? Infinity : weaponBalance.lightning.chainRadius;
      for (const enemy of this.enemies.enemies.activeEnemies()) {
        if (used.has(enemy)) continue;
        const distance = Math.hypot(enemy.x - x, enemy.y - y);
        if (distance < best) {
          best = distance;
          target = enemy;
        }
      }
      if (!target) break;
      used.add(target);
      this.lines.lineBetween(x, y, target.x, target.y);
      x = target.x;
      y = target.y;
      this.enemies.damageEnemy(
        target,
        weaponBalance.lightning.damage *
          this.stats.attackMultiplier *
          (this.level >= 3 ? 1.25 : 1),
      );
    }
    this.visibleMs = weaponBalance.lightning.durationMs;
  }
  override destroy(): void {
    this.lines.destroy();
  }
}
