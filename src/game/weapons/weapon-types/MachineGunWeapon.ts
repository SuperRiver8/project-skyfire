import { machineGunConfig } from '../../../config/weapons/machineGun';
import type { AudioManager } from '../../audio/AudioManager';
import type { BulletPool } from '../../bullets/BulletPool';
import type { PlayerAircraft } from '../../player/PlayerAircraft';
import type { PlayerStats } from '../../player/PlayerStats';
import { BaseWeapon } from '../BaseWeapon';

export class MachineGunWeapon extends BaseWeapon {
  readonly id = machineGunConfig.id;

  constructor(
    private readonly aircraft: PlayerAircraft,
    private readonly bullets: BulletPool,
    private readonly stats: PlayerStats,
    private readonly audio: AudioManager,
  ) {
    super();
  }

  protected get fireIntervalMs(): number {
    return (
      (machineGunConfig.fireIntervalMs * (this.level >= 3 ? 0.85 : 1)) /
      this.stats.fireRateMultiplier
    );
  }

  override canUpgrade(): boolean {
    return this.level < machineGunConfig.maxLevel;
  }

  override upgrade(): void {
    if (this.canUpgrade()) this.level += 1;
  }

  fire(): void {
    this.audio.playSfx('player_shoot');
    const x = this.aircraft.x;
    const y = this.aircraft.y - machineGunConfig.muzzleOffsetY;
    const damage =
      machineGunConfig.damage *
      this.stats.attackMultiplier *
      (this.level >= 5 ? 1.2 : 1);
    const pierce = this.level >= 5 ? 1 : 0;
    if (this.level === 1) {
      this.bullets.fire(x, y, -machineGunConfig.bulletSpeed, damage, 0, pierce);
    } else {
      this.bullets.fire(
        x - machineGunConfig.doubleBarrelOffsetX,
        y,
        -machineGunConfig.bulletSpeed,
        damage,
        this.level >= 4 ? -70 : 0,
        pierce,
      );
      this.bullets.fire(
        x + machineGunConfig.doubleBarrelOffsetX,
        y,
        -machineGunConfig.bulletSpeed,
        damage,
        this.level >= 4 ? 70 : 0,
        pierce,
      );
      if (this.level >= 4)
        this.bullets.fire(
          x,
          y,
          -machineGunConfig.bulletSpeed,
          damage,
          0,
          pierce,
        );
    }
  }
}
