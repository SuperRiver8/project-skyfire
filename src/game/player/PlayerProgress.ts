export function expRequired(level: number): number {
  return Math.floor(40 * Math.pow(level, 1.35));
}

export class PlayerProgress {
  level = 1;
  exp = 0;
  pendingUpgrades = 0;

  gain(exp: number): void {
    this.exp += Math.max(0, exp);
    while (this.exp >= expRequired(this.level)) {
      this.exp -= expRequired(this.level);
      this.level += 1;
      this.pendingUpgrades += 1;
    }
  }

  claimUpgrade(): void {
    this.pendingUpgrades = Math.max(0, this.pendingUpgrades - 1);
  }
}
