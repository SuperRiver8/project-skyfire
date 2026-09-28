import { weaponBalance } from '../../../config/weapons/weaponBalance';
import type { AudioManager } from '../../audio/AudioManager';
import type { BulletPool } from '../../bullets/BulletPool';
import type { PlayerAircraft } from '../../player/PlayerAircraft';
import type { PlayerStats } from '../../player/PlayerStats';
import { BaseWeapon } from '../BaseWeapon';

export class SpreadWeapon extends BaseWeapon {
  readonly id = 'spread_gun';
  constructor(
    private readonly aircraft: PlayerAircraft,
    private readonly bullets: BulletPool,
    private readonly stats: PlayerStats,
    private readonly audio: AudioManager,
  ) {
    super();
  }
  protected get fireIntervalMs(): number {
    return weaponBalance.spread.intervalMs / this.stats.fireRateMultiplier;
  }
  override canUpgrade(): boolean {
    return this.level < weaponBalance.spread.maxLevel;
  }
  override upgrade(): void {
    if (this.canUpgrade()) this.level += 1;
  }
  fire(): void {
    this.audio.playSfx('player_shoot');
    this.aircraft.muzzleFlash();
    const count = this.level >= 4 ? 7 : this.level >= 2 ? 5 : 3;
    const damage =
      weaponBalance.spread.damage *
      this.stats.attackMultiplier *
      (this.level >= 3 ? 1.2 : 1);
    for (let i = 0; i < count; i += 1) {
      const angle = (i - (count - 1) / 2) * 0.18;
      this.bullets.fire(
        this.aircraft.x,
        this.aircraft.y - 29,
        -Math.cos(angle) * weaponBalance.spread.speed,
        damage,
        Math.sin(angle) * weaponBalance.spread.speed,
        0,
        'spread',
      );
    }
  }
}
