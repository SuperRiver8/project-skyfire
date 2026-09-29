import type Phaser from 'phaser';
import { machineGunConfig } from '../../config/weapons/machineGun';
import { BulletPool } from '../bullets/BulletPool';
import type { AudioManager } from '../audio/AudioManager';
import type { EnemyController } from '../enemies/EnemyController';
import type { PlayerAircraft } from '../player/PlayerAircraft';
import type { PlayerStats } from '../player/PlayerStats';
import { MachineGunWeapon } from './weapon-types/MachineGunWeapon';
import { SpreadWeapon } from './weapon-types/SpreadWeapon';
import { LaserWeapon } from './weapon-types/LaserWeapon';
import { MissileWeapon } from './weapon-types/MissileWeapon';
import { LightningWeapon } from './weapon-types/LightningWeapon';
import type { BaseWeapon } from './BaseWeapon';

export type WeaponId =
  'machine_gun' | 'spread_gun' | 'laser' | 'missile' | 'lightning';

export class WeaponManager {
  readonly bullets: BulletPool;
  private readonly weapons = new Map<WeaponId, BaseWeapon>();
  private readonly scene: Phaser.Scene;
  private readonly aircraft: PlayerAircraft;
  private readonly stats: PlayerStats;
  private readonly enemies: EnemyController;

  constructor(
    scene: Phaser.Scene,
    aircraft: PlayerAircraft,
    stats: PlayerStats,
    enemies: EnemyController,
    private readonly audio: AudioManager,
  ) {
    this.scene = scene;
    this.aircraft = aircraft;
    this.stats = stats;
    this.enemies = enemies;
    this.bullets = new BulletPool(scene);
    this.weapons.set(
      'machine_gun',
      new MachineGunWeapon(aircraft, this.bullets, stats, audio),
    );
  }

  get levels(): Record<WeaponId, number> {
    return {
      machine_gun: this.weapons.get('machine_gun')?.level ?? 0,
      spread_gun: this.weapons.get('spread_gun')?.level ?? 0,
      laser: this.weapons.get('laser')?.level ?? 0,
      missile: this.weapons.get('missile')?.level ?? 0,
      lightning: this.weapons.get('lightning')?.level ?? 0,
    };
  }

  hasWeapon(id: WeaponId): boolean {
    return this.weapons.has(id);
  }

  upgradeWeapon(id: WeaponId): void {
    const existing = this.weapons.get(id);
    if (existing) {
      existing.upgrade();
      return;
    }
    switch (id) {
      case 'spread_gun':
        this.weapons.set(
          id,
          new SpreadWeapon(this.aircraft, this.bullets, this.stats, this.audio),
        );
        break;
      case 'laser':
        this.weapons.set(
          id,
          new LaserWeapon(
            this.scene,
            this.aircraft,
            this.enemies,
            this.stats,
            this.audio,
          ),
        );
        break;
      case 'missile':
        this.weapons.set(
          id,
          new MissileWeapon(
            this.scene,
            this.aircraft,
            this.enemies,
            this.stats,
            this.audio,
          ),
        );
        break;
      case 'lightning':
        this.weapons.set(
          id,
          new LightningWeapon(
            this.scene,
            this.aircraft,
            this.enemies,
            this.stats,
            this.audio,
          ),
        );
        break;
      case 'machine_gun':
        break;
    }
  }

  update(deltaMs: number): void {
    const boundedDeltaMs = Math.min(
      Math.max(deltaMs, 0),
      machineGunConfig.maxUpdateDeltaMs,
    );
    for (const weapon of this.weapons.values()) weapon.update(boundedDeltaMs);
    this.bullets.update(boundedDeltaMs);
  }

  destroy(): void {
    for (const weapon of this.weapons.values()) weapon.destroy();
    this.bullets.destroy();
  }
}
