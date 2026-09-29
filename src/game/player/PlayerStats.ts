import { playerBalance } from '../../config/balance/playerBalance';

export class PlayerStats {
  attackCores = 0;
  rapidCores = 0;
  critCores = 0;
  berserkMs = 0;
  magnetMs = 0;
  private combatMs = 0;
  private target: object | undefined;
  private targetStartMs = 0;
  private targetLastMs = 0;
  private critStreak = 0;
  private guaranteedCrit = false;

  get attackMultiplier(): number {
    const synergy = this.attackCores >= 3 && this.rapidCores >= 3 ? 1.05 : 1;
    return (
      (1 + this.attackCores * 0.12) * synergy * (this.berserkMs > 0 ? 1.4 : 1)
    );
  }
  get missileDamageMultiplier(): number {
    const synergy = this.firepowerOverload ? 1.05 : 1;
    return (
      (1 + this.attackCores * 0.12) * synergy * (this.berserkMs > 0 ? 1.3 : 1)
    );
  }
  get missileFlightMultiplier(): number {
    return (1 + this.rapidCores * 0.05) * (this.berserkMs > 0 ? 1.25 : 1);
  }
  get fireRateMultiplier(): number {
    const synergy = this.attackCores >= 3 && this.rapidCores >= 3 ? 1.05 : 1;
    const redline = this.rapidCores >= 5 && this.berserkMs > 0 ? 1.15 : 1;
    const loading =
      this.rapidCores >= 5 &&
      this.target &&
      this.combatMs - this.targetLastMs <= 900 &&
      this.combatMs - this.targetStartMs >= 2_000
        ? 1.15
        : 1;
    return Math.min(
      3,
      (1 + this.rapidCores * 0.1) *
        synergy *
        (this.berserkMs > 0 ? 1.4 : 1) *
        redline *
        loading,
    );
  }
  get critChance(): number {
    return Math.min(1, playerBalance.critChance + this.critCores * 0.05);
  }
  get critDamageMultiplier(): number {
    return playerBalance.critDamageMultiplier;
  }
  get movementMultiplier(): number {
    return this.berserkMs > 0 ? 1.1 : 1;
  }
  get pickupRadius(): number {
    return playerBalance.pickupRadius * (this.magnetMs > 0 ? 2 : 1);
  }
  get firepowerOverload(): boolean {
    return this.attackCores >= 3 && this.rapidCores >= 3;
  }
  get destructionCore(): boolean {
    return this.attackCores >= 5 && this.critCores >= 5;
  }
  get attackOverload(): boolean {
    return this.attackCores >= 5;
  }
  get critChainState(): { streak: number; guaranteed: boolean } {
    return { streak: this.critStreak, guaranteed: this.guaranteedCrit };
  }
  restoreCritChain(streak: number, guaranteed: boolean): void {
    this.critStreak = streak;
    this.guaranteedCrit = guaranteed;
  }
  recordTargetHit(target: object): void {
    if (this.target !== target || this.combatMs - this.targetLastMs > 900) {
      this.target = target;
      this.targetStartMs = this.combatMs;
    }
    this.targetLastMs = this.combatMs;
  }
  clearTarget(target: object): void {
    if (this.target === target) this.target = undefined;
  }
  rollCrit(roll: number): { crit: boolean; enhanced: boolean } {
    if (this.guaranteedCrit) {
      this.guaranteedCrit = false;
      this.critStreak = 0;
      return { crit: true, enhanced: true };
    }
    const crit = roll < this.critChance;
    this.critStreak = crit ? this.critStreak + 1 : 0;
    if (this.critCores >= 5 && this.critStreak >= 3) this.guaranteedCrit = true;
    return { crit, enhanced: false };
  }
  activateBerserk(): void {
    this.berserkMs = this.berserkMs > 0 ? 13_000 : 10_000;
  }
  update(deltaMs: number): void {
    this.combatMs += deltaMs;
    this.berserkMs = Math.max(0, this.berserkMs - deltaMs);
    this.magnetMs = Math.max(0, this.magnetMs - deltaMs);
    if (this.combatMs - this.targetLastMs > 900) this.target = undefined;
  }
}
