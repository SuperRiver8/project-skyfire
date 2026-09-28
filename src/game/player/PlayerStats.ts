import { playerBalance } from '../../config/balance/playerBalance';

export class PlayerStats {
  attackCores = 0;
  rapidCores = 0;
  critCores = 0;
  berserkMs = 0;
  pickupRadius: number = playerBalance.pickupRadius;

  get attackMultiplier(): number {
    return Math.pow(1.15, this.attackCores) * (this.berserkMs > 0 ? 1.5 : 1);
  }
  get fireRateMultiplier(): number {
    return Math.pow(1.12, this.rapidCores) * (this.berserkMs > 0 ? 1.5 : 1);
  }
  get critChance(): number {
    return Math.min(1, playerBalance.critChance + this.critCores * 0.05);
  }
  get critDamageMultiplier(): number {
    return playerBalance.critDamageMultiplier;
  }
  update(deltaMs: number): void {
    this.berserkMs = Math.max(0, this.berserkMs - deltaMs);
  }
}
