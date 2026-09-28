import { playerBalance } from '../../config/balance/playerBalance';

export class PlayerHealth {
  hp: number = playerBalance.maxHp;
  invulnerableMs = 0;
  shields = 0;
  godMode = false;

  update(deltaMs: number): void {
    this.invulnerableMs = Math.max(0, this.invulnerableMs - deltaMs);
  }

  hit(damage: number): boolean {
    if (this.hp <= 0 || this.invulnerableMs > 0 || this.godMode) return false;
    if (this.shields > 0) this.shields -= 1;
    else this.hp = Math.max(0, this.hp - Math.max(0, damage));
    this.invulnerableMs = playerBalance.invulnerabilityAfterHitMs;
    return true;
  }

  heal(amount: number): number {
    const value = Math.max(0, amount);
    const restored = Math.min(playerBalance.maxHp - this.hp, value);
    this.hp += restored;
    return value - restored;
  }
  addShield(): void {
    this.shields = Math.min(5, this.shields + 1);
  }
  revive(): void {
    this.hp = playerBalance.maxHp / 2;
    this.invulnerableMs = 2_000;
  }

  get isDead(): boolean {
    return this.hp <= 0;
  }
}
