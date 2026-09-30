import { capUpgradeLevel } from '../../config/items/progression';
import { playerBalance } from '../../config/balance/playerBalance';
import { integer } from '../utils/Integer';

export class PlayerHealth {
  private currentHp: number = playerBalance.maxHp;
  invulnerableMs = 0;
  private currentShields = 0;
  godMode = false;

  get hp(): number {
    return this.currentHp;
  }
  set hp(value: number) {
    this.currentHp = Math.min(playerBalance.maxHp, integer(value));
  }
  get shields(): number {
    return this.currentShields;
  }
  set shields(value: number) {
    this.currentShields = capUpgradeLevel(value);
  }

  update(deltaMs: number): void {
    this.invulnerableMs = Math.max(0, this.invulnerableMs - deltaMs);
  }

  hit(damage: number): boolean {
    damage = integer(damage);
    if (damage === 0) return false;
    if (this.hp <= 0 || this.invulnerableMs > 0 || this.godMode) return false;
    if (this.shields > 0) this.shields -= 1;
    else this.hp = Math.max(0, this.hp - Math.max(0, damage));
    this.invulnerableMs = playerBalance.invulnerabilityAfterHitMs;
    return true;
  }

  heal(amount: number): number {
    const value = integer(amount);
    const restored = Math.min(playerBalance.maxHp - this.hp, value);
    this.hp += restored;
    return value - restored;
  }
  addShield(): void {
    this.shields = capUpgradeLevel(this.shields + 1);
  }
  revive(): void {
    this.hp = playerBalance.maxHp / 2;
    this.invulnerableMs = 2_000;
  }

  get isDead(): boolean {
    return this.hp <= 0;
  }
}
